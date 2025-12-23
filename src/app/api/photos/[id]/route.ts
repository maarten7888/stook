import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseClient();
    const adminSupabase = createAdminClient();

    // Get photo record to check ownership and get path
    const { data: photo, error: photoError } = await adminSupabase
      .from('photos')
      .select('id, path, user_id, recipe_id, cook_session_id')
      .eq('id', id)
      .single();

    if (photoError || !photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Check ownership - user must own the photo
    if (photo.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from Storage first
    if (photo.path) {
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue with database delete even if storage delete fails
        // (file might already be deleted)
      }
    }

    // Delete from database
    const { error: deleteError } = await adminSupabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json({ 
        error: "Delete failed", 
        details: deleteError.message 
      }, { status: 500 });
    }

    // Revalidate relevant pages
    if (photo.recipe_id) {
      revalidatePath(`/recipes/${photo.recipe_id}`);
      revalidatePath(`/recipes/${photo.recipe_id}/edit`);
      revalidatePath("/recipes");
      revalidatePath("/");
    }
    if (photo.cook_session_id) {
      revalidatePath(`/sessions/${photo.cook_session_id}`);
      revalidatePath("/sessions");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recipeId } = await params;

    // Verify recipe exists
    const adminSupabase = createAdminClient();
    const { data: recipe, error: recipeError } = await adminSupabase
      .from('recipes')
      .select('id, visibility, user_id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      console.error("POST /api/recipes/[id]/favorite - Error fetching recipe:", {
        error: recipeError,
        code: recipeError?.code,
        message: recipeError?.message,
        recipeId
      });
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Check if user can access this recipe (own recipe or public)
    if (recipe.visibility !== 'public' && recipe.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if favorite already exists
    const { data: existingFavorite, error: checkError } = await adminSupabase
      .from('recipe_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("POST /api/recipes/[id]/favorite - Error checking existing favorite:", {
        error: checkError,
        code: checkError?.code,
        message: checkError?.message
      });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (existingFavorite) {
      return NextResponse.json({ error: "Recipe already favorited" }, { status: 400 });
    }

    // Insert favorite
    const { data: favorite, error: insertError } = await adminSupabase
      .from('recipe_favorites')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("POST /api/recipes/[id]/favorite - Error inserting favorite:", {
        error: insertError,
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint
      });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Revalidate homepage to show updated favorites
    revalidatePath("/");

    return NextResponse.json(favorite);
  } catch (error) {
    console.error("POST /api/recipes/[id]/favorite - Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recipeId } = await params;

    const adminSupabase = createAdminClient();

    // Delete favorite
    const { error: deleteError } = await adminSupabase
      .from('recipe_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);

    if (deleteError) {
      console.error("DELETE /api/recipes/[id]/favorite - Error deleting favorite:", {
        error: deleteError,
        code: deleteError?.code,
        message: deleteError?.message,
        details: deleteError?.details,
        hint: deleteError?.hint
      });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Revalidate homepage to show updated favorites
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/recipes/[id]/favorite - Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


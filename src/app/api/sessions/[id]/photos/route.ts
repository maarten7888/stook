import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get session photos
    const { data: sessionPhotos, error: photosError } = await adminSupabase
      .from('photos')
      .select('*')
      .eq('cook_session_id', id);

    if (photosError) {
      console.error("Error fetching photos:", photosError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Generate signed URLs for each photo
    const photosWithUrls = await Promise.all(
      (sessionPhotos || []).map(async (photo) => {
        const { data: signedUrl } = await supabase.storage
          .from("photos")
          .createSignedUrl(photo.path, 3600); // 1 hour expiry

        return {
          id: photo.id,
          cookSessionId: photo.cook_session_id,
          recipeId: photo.recipe_id,
          userId: photo.user_id,
          path: photo.path,
          type: photo.type,
          createdAt: photo.created_at,
          signedUrl: signedUrl?.signedUrl || null,
        };
      })
    );

    return NextResponse.json(photosWithUrls);
  } catch (error) {
    console.error("Error fetching session photos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

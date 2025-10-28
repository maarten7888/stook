import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getSession } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Fetch recipe to check visibility
    const { data: recipe, error: recipeError } = await adminSupabase
      .from('recipes')
      .select('user_id, visibility')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Check access: recipe must be public or user must be owner
    if (recipe.visibility !== 'public' && recipe.user_id !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch photos for this recipe
    const { data: photos, error: photosError } = await adminSupabase
      .from('photos')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (photosError) {
      console.error("Error fetching photos:", photosError);
      return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
    }

    // Generate signed URLs for each photo
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        const { data: signedUrlData } = await adminSupabase.storage
          .from('photos')
          .createSignedUrl(photo.path, 3600); // 1 hour expiry

        return {
          id: photo.id,
          path: photo.path,
          type: photo.type,
          createdAt: photo.created_at,
          url: signedUrlData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ photos: photosWithUrls });
  } catch (error) {
    console.error("Error in GET /api/recipes/[id]/photos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


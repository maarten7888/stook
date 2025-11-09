import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get favorites with recipe details
    const { data: favorites, error: favoritesError } = await adminSupabase
      .from('recipe_favorites')
      .select(`
        id,
        created_at,
        recipe_id,
        recipes (
          id,
          title,
          description,
          visibility,
          user_id,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (favoritesError) {
      console.error("GET /api/recipes/favorites - Error fetching favorites:", {
        error: favoritesError,
        code: favoritesError?.code,
        message: favoritesError?.message,
        details: favoritesError?.details,
        hint: favoritesError?.hint
      });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Transform data to flatten recipe details
    const recipes = (favorites || []).map((fav: any) => ({
      id: fav.recipe_id,
      title: fav.recipes?.title || '',
      description: fav.recipes?.description || null,
      visibility: fav.recipes?.visibility || 'private',
      userId: fav.recipes?.user_id || null,
      createdAt: fav.recipes?.created_at || null,
      favoritedAt: fav.created_at,
    })).filter((recipe: any) => recipe.title); // Filter out any invalid recipes

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("GET /api/recipes/favorites - Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
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
    // Note: Supabase returns arrays for joined relations, even for one-to-one
    type FavoriteWithRecipe = {
      id: string;
      created_at: string;
      recipe_id: string;
      recipes: {
        id: string;
        title: string;
        description: string | null;
        visibility: string;
        user_id: string;
        created_at: string;
      }[] | null;
    };

    type RecipeListItem = {
      id: string;
      title: string;
      description: string | null;
      visibility: string;
      userId: string | null;
      createdAt: string | null;
      favoritedAt: string;
    };

    const recipes: RecipeListItem[] = (favorites || []).map((fav: FavoriteWithRecipe) => {
      const recipe = fav.recipes?.[0]; // Get first (and only) recipe from array
      return {
        id: fav.recipe_id,
        title: recipe?.title || '',
        description: recipe?.description || null,
        visibility: recipe?.visibility || 'private',
        userId: recipe?.user_id || null,
        createdAt: recipe?.created_at || null,
        favoritedAt: fav.created_at,
      };
    }).filter((recipe: RecipeListItem) => recipe.title); // Filter out any invalid recipes

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("GET /api/recipes/favorites - Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


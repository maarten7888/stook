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

    // Get favorites (without JOIN to avoid RLS issues)
    const { data: favorites, error: favoritesError } = await adminSupabase
      .from('recipe_favorites')
      .select('id, created_at, recipe_id')
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

    console.log("Raw favorites data:", JSON.stringify(favorites, null, 2));

    // Get recipe details separately for each favorite
    const recipeIds = (favorites || []).map((fav: { recipe_id: string }) => fav.recipe_id);
    
    if (recipeIds.length === 0) {
      return NextResponse.json({ recipes: [] });
    }

    // Fetch all recipes at once
    const { data: recipesData, error: recipesError } = await adminSupabase
      .from('recipes')
      .select('id, title, description, visibility, user_id, created_at')
      .in('id', recipeIds);

    if (recipesError) {
      console.error("GET /api/recipes/favorites - Error fetching recipes:", {
        error: recipesError,
        code: recipesError?.code,
        message: recipesError?.message
      });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    console.log("Recipes data:", JSON.stringify(recipesData, null, 2));

    // Create a map of recipe_id -> recipe for quick lookup
    const recipesMap = new Map(
      (recipesData || []).map((recipe: { id: string; title: string; description: string | null; visibility: string; user_id: string; created_at: string }) => [recipe.id, recipe])
    );

    // Transform data to combine favorites with recipe details
    type Favorite = {
      id: string;
      created_at: string;
      recipe_id: string;
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

    const recipes: RecipeListItem[] = (favorites || []).map((fav: Favorite) => {
      const recipe = recipesMap.get(fav.recipe_id);
      
      // Log for debugging
      console.log("Processing favorite:", {
        favorite_id: fav.id,
        recipe_id: fav.recipe_id,
        recipe_found: !!recipe,
        recipe: recipe
      });
      
      if (!recipe) {
        console.warn("Recipe not found for favorite:", fav.recipe_id);
        return null;
      }
      
      return {
        id: fav.recipe_id,
        title: recipe.title || '',
        description: recipe.description || null,
        visibility: recipe.visibility || 'private',
        userId: recipe.user_id || null,
        createdAt: recipe.created_at || null,
        favoritedAt: fav.created_at,
      };
    }).filter((recipe: RecipeListItem | null): recipe is RecipeListItem => {
      if (!recipe) {
        return false;
      }
      // Don't filter out recipes without title - just log them
      if (!recipe.title) {
        console.warn("Recipe without title filtered out:", recipe);
      }
      return !!recipe.title;
    }); // Filter out any invalid recipes

    console.log("Returning recipes:", recipes.map(r => ({ id: r.id, title: r.title })));

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("GET /api/recipes/favorites - Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


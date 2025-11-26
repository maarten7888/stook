import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/users/me/favorites - Get current user's favorite recipes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const adminSupabase = createAdminClient();

    // Get favorite recipes with recipe data
    const { data: favorites, error: favoritesError } = await adminSupabase
      .from('recipe_favorites')
      .select(`
        id,
        created_at,
        recipes(
          id,
          title,
          description,
          serves,
          prep_minutes,
          cook_minutes,
          target_internal_temp,
          visibility,
          created_at,
          updated_at,
          user_id,
          profiles(display_name)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (favoritesError) {
      console.error("Error fetching favorites:", favoritesError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Transform data
    const recipes = (favorites || [])
      .map((fav) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipe = fav.recipes as any;
        if (!recipe) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profile = recipe.profiles as any;
        
        return {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          serves: recipe.serves,
          prepMinutes: recipe.prep_minutes,
          cookMinutes: recipe.cook_minutes,
          targetInternalTemp: recipe.target_internal_temp,
          visibility: recipe.visibility,
          createdAt: recipe.created_at,
          updatedAt: recipe.updated_at,
          userId: recipe.user_id,
          authorName: profile?.display_name || null,
          favoritedAt: fav.created_at,
        };
      })
      .filter((r) => r !== null);

    return NextResponse.json(recipes);
  } catch (error) {
    console.error("Error in GET /api/users/me/favorites:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


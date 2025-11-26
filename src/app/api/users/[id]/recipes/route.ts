import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const adminSupabase = createAdminClient();

    // Fetch public recipes for this user
    const { data: recipes, error: recipesError } = await adminSupabase
      .from('recipes')
      .select('id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility, created_at, updated_at')
      .eq('user_id', id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (recipesError) {
      console.error("Error fetching recipes:", recipesError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Get tags for each recipe
    const recipeIds = recipes?.map(r => r.id) || [];
    let recipesWithTags = recipes || [];

    if (recipeIds.length > 0) {
      const { data: recipeTags, error: tagsError } = await adminSupabase
        .from('recipe_tags')
        .select('recipe_id, tags(id, name)')
        .in('recipe_id', recipeIds);

      if (!tagsError && recipeTags) {
        // Group tags by recipe_id
        const tagsByRecipe = recipeTags.reduce((acc, rt) => {
          const recipeId = rt.recipe_id;
          if (!acc[recipeId]) {
            acc[recipeId] = [];
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tag = rt.tags as any;
          if (tag && tag.id && tag.name) {
            acc[recipeId].push({ id: tag.id, name: tag.name });
          }
          return acc;
        }, {} as Record<string, Array<{ id: string; name: string }>>);

        // Add tags to recipes
        recipesWithTags = recipes.map(recipe => ({
          ...recipe,
          tags: tagsByRecipe[recipe.id] || [],
        }));
      }
    }

    return NextResponse.json(recipesWithTags);
  } catch (error) {
    console.error("Error in GET /api/users/[id]/recipes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


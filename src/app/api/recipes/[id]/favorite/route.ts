import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// POST /api/recipes/[id]/favorite - Add recipe to favorites
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recipeId = id;

    const adminSupabase = createAdminClient();

    // Check if recipe exists and is accessible
    const { data: recipe, error: recipeError } = await adminSupabase
      .from('recipes')
      .select('id, visibility, user_id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Check if recipe is accessible (public or own)
    if (recipe.visibility !== 'public' && recipe.user_id !== user.id) {
      return NextResponse.json({ error: "Recipe not accessible" }, { status: 403 });
    }

    // Check if already favorited
    const { data: existingFavorite } = await adminSupabase
      .from('recipe_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .single();

    if (existingFavorite) {
      return NextResponse.json({ error: "Already favorited" }, { status: 400 });
    }

    // Create favorite
    const { data: favorite, error: favoriteError } = await adminSupabase
      .from('recipe_favorites')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
      })
      .select()
      .single();

    if (favoriteError) {
      console.error("Error creating favorite:", favoriteError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(favorite);
  } catch (error) {
    console.error("Error in POST /api/recipes/[id]/favorite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/recipes/[id]/favorite - Remove recipe from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recipeId = id;

    const adminSupabase = createAdminClient();

    // Delete favorite
    const { error: deleteError } = await adminSupabase
      .from('recipe_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);

    if (deleteError) {
      console.error("Error deleting favorite:", deleteError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/recipes/[id]/favorite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


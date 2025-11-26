import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/recipes/[id]/favorite-status - Check if current user has favorited this recipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // If not authenticated, return not favorited
    if (authError || !user) {
      return NextResponse.json({ isFavorited: false });
    }

    const { id } = await params;
    const recipeId = id;

    const adminSupabase = createAdminClient();

    // Check if favorited
    const { data: favorite, error: favoriteError } = await adminSupabase
      .from('recipe_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .single();

    if (favoriteError && favoriteError.code !== 'PGRST116') {
      console.error("Error checking favorite status:", favoriteError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ 
      isFavorited: !!favorite,
    });
  } catch (error) {
    console.error("Error in GET /api/recipes/[id]/favorite-status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


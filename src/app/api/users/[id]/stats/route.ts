import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Get recipe count (all recipes for own stats, public only for others)
    // For now, we'll get all recipes - can be filtered client-side if needed
    const { count: recipeCount, error: recipeError } = await adminSupabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (recipeError) {
      console.error("Error fetching recipe count:", recipeError);
    }

    // Get session count (public recipes only)
    const { count: sessionCount, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (sessionError) {
      console.error("Error fetching session count:", sessionError);
    }

    // Get follower count
    const { count: followerCount, error: followerError } = await adminSupabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id);

    if (followerError) {
      console.error("Error fetching follower count:", followerError);
    }

    // Get following count
    const { count: followingCount, error: followingError } = await adminSupabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id);

    if (followingError) {
      console.error("Error fetching following count:", followingError);
    }

    // Get average rating from reviews on user's public recipes
    // First get public recipe IDs
    const { data: publicRecipes, error: recipesError } = await adminSupabase
      .from('recipes')
      .select('id')
      .eq('user_id', id)
      .eq('visibility', 'public');

    let avgRating = null;
    if (!recipesError && publicRecipes && publicRecipes.length > 0) {
      const recipeIds = publicRecipes.map(r => r.id);
      const { data: reviews, error: reviewsError } = await adminSupabase
        .from('reviews')
        .select('rating')
        .in('recipe_id', recipeIds);

      if (!reviewsError && reviews && reviews.length > 0) {
        const ratings = reviews.map(r => r.rating).filter(r => r !== null && r !== undefined);
        if (ratings.length > 0) {
          avgRating = (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
        }
      }
    }

    return NextResponse.json({
      recipes: recipeCount || 0,
      sessions: sessionCount || 0,
      followers: followerCount || 0,
      following: followingCount || 0,
      avgRating: avgRating ? parseFloat(avgRating) : null,
    });
  } catch (error) {
    console.error("Error in GET /api/users/[id]/stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/feed?filter=following|all|own&limit=20&offset=0
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'following' | 'own'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const adminSupabase = createAdminClient();

    let recipes;

    if (filter === 'own') {
      // Only own recipes
      const { data, error } = await adminSupabase
        .from('recipes')
        .select(`
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
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching own recipes:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      recipes = data || [];
    } else if (filter === 'following') {
      // Get users that current user is following
      const { data: follows, error: followsError } = await adminSupabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) {
        console.error("Error fetching follows:", followsError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      const followingIds = (follows || []).map(f => f.following_id);

      if (followingIds.length === 0) {
        // No follows, return empty
        return NextResponse.json({ items: [], hasMore: false });
      }

      // Get public recipes from followed users
      const { data, error } = await adminSupabase
        .from('recipes')
        .select(`
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
        `)
        .in('user_id', followingIds)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching following recipes:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      recipes = data || [];
    } else {
      // 'all' - own recipes + public recipes
      const { data, error } = await adminSupabase
        .from('recipes')
        .select(`
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
        `)
        .or(`user_id.eq.${user.id},visibility.eq.public`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching all recipes:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      recipes = data || [];
    }

    // Check which users are followed (for "Gevolgd" badge)
    const recipeUserIds = [...new Set(recipes.map(r => r.user_id))];
    let followedUserIds: string[] = [];

    if (recipeUserIds.length > 0) {
      const { data: follows } = await adminSupabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', recipeUserIds);

      followedUserIds = (follows || []).map(f => f.following_id);
    }

    // Transform data
    const items = recipes.map((recipe) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = recipe.profiles as any;
      const isFollowed = followedUserIds.includes(recipe.user_id);

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
        authorId: recipe.user_id,
        isFollowed,
      };
    });

    return NextResponse.json({
      items,
      hasMore: items.length === limit,
    });
  } catch (error) {
    console.error("Error in GET /api/feed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


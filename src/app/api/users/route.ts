import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/users?limit=20&offset=0&search=...
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Optioneel: alleen voor ingelogde gebruikers
    // if (authError || !user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    const adminSupabase = createAdminClient();

    // Build query for profiles
    let profilesQuery = adminSupabase
      .from('profiles')
      .select('id, display_name, bio, avatar_url, location, bbq_style, experience_level, created_at')
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      profilesQuery = profilesQuery.or(`display_name.ilike.%${search}%,bio.ilike.%${search}%,location.ilike.%${search}%`);
    }

    // Apply pagination
    profilesQuery = profilesQuery.range(offset, offset + limit - 1);

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json([]);
    }

    const userIds = profiles.map(p => p.id);

    // Get stats for all users in parallel
    const [recipesData, sessionsData, favoritesData, followersData] = await Promise.all([
      // Recipe counts (public only)
      adminSupabase
        .from('recipes')
        .select('user_id')
        .in('user_id', userIds)
        .eq('visibility', 'public'),
      // Session counts
      adminSupabase
        .from('cook_sessions')
        .select('user_id')
        .in('user_id', userIds),
      // Favorite counts (how many recipes this user has favorited)
      adminSupabase
        .from('recipe_favorites')
        .select('user_id')
        .in('user_id', userIds),
      // Follower counts
      adminSupabase
        .from('user_follows')
        .select('following_id')
        .in('following_id', userIds),
    ]);

    // Count stats per user
    const recipeCounts: Record<string, number> = {};
    const sessionCounts: Record<string, number> = {};
    const favoriteCounts: Record<string, number> = {};
    const followerCounts: Record<string, number> = {};

    (recipesData.data || []).forEach(recipe => {
      recipeCounts[recipe.user_id] = (recipeCounts[recipe.user_id] || 0) + 1;
    });

    (sessionsData.data || []).forEach(session => {
      sessionCounts[session.user_id] = (sessionCounts[session.user_id] || 0) + 1;
    });

    (favoritesData.data || []).forEach(fav => {
      favoriteCounts[fav.user_id] = (favoriteCounts[fav.user_id] || 0) + 1;
    });

    (followersData.data || []).forEach(follow => {
      followerCounts[follow.following_id] = (followerCounts[follow.following_id] || 0) + 1;
    });

    // Combine profiles with stats
    const usersWithStats = profiles.map(profile => ({
      id: profile.id,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      location: profile.location,
      bbqStyle: profile.bbq_style,
      experienceLevel: profile.experience_level,
      createdAt: profile.created_at,
      stats: {
        recipes: recipeCounts[profile.id] || 0,
        sessions: sessionCounts[profile.id] || 0,
        favorites: favoriteCounts[profile.id] || 0,
        followers: followerCounts[profile.id] || 0,
      },
    }));

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


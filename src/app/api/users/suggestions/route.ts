import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/users/suggestions?limit=5
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const adminSupabase = createAdminClient();

    // Get users that current user is already following
    const { data: follows } = await adminSupabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = (follows || []).map(f => f.following_id);
    followingIds.push(user.id); // Exclude self

    // Get users with most public recipes (who are not already followed)
    // Build filter for users to exclude
    let userFilter = adminSupabase
      .from('recipes')
      .select('user_id, profiles!inner(id, display_name, bio, avatar_url, location, bbq_style, experience_level)')
      .eq('visibility', 'public');
    
    if (followingIds.length > 0) {
      userFilter = userFilter.not('user_id', 'in', `(${followingIds.join(',')})`);
    }
    
    const { data: popularUsers, error: popularError } = await userFilter.limit(100);

    if (popularError) {
      console.error("Error fetching popular users:", popularError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Count recipes per user
    type ProfileData = {
      id: string;
      display_name: string | null;
      bio: string | null;
      avatar_url: string | null;
      location: string | null;
      bbq_style: string | null;
      experience_level: string | null;
    };

    const userRecipeCounts = (popularUsers || []).reduce((acc, recipe) => {
      const userId = recipe.user_id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileData = recipe.profiles as any;
      const profile: ProfileData | null = Array.isArray(profileData) 
        ? (profileData[0] as ProfileData) || null
        : (profileData as ProfileData) || null;
      
      if (!acc[userId]) {
        acc[userId] = {
          count: 0,
          profile,
        };
      }
      acc[userId].count++;
      return acc;
    }, {} as Record<string, { count: number; profile: ProfileData | null }>);

    // Sort by recipe count and take top N
    const suggestions = Object.entries(userRecipeCounts)
      .map(([userId, data]) => ({
        id: userId,
        displayName: data.profile?.display_name || null,
        bio: data.profile?.bio || null,
        avatarUrl: data.profile?.avatar_url || null,
        location: data.profile?.location || null,
        bbqStyle: data.profile?.bbq_style || null,
        experienceLevel: data.profile?.experience_level || null,
        recipeCount: data.count,
      }))
      .sort((a, b) => b.recipeCount - a.recipeCount)
      .slice(0, limit);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error in GET /api/users/suggestions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


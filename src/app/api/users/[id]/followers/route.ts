import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/users/[id]/followers - Get list of followers
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

    // Get followers with profile info
    const { data: follows, error: followsError } = await adminSupabase
      .from('user_follows')
      .select(`
        id,
        follower_id,
        created_at,
        profiles!user_follows_follower_id_fkey(
          id,
          display_name,
          bio,
          avatar_url,
          location,
          bbq_style,
          experience_level
        )
      `)
      .eq('following_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (followsError) {
      console.error("Error fetching followers:", followsError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Transform data
    const followers = (follows || []).map((follow) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = follow.profiles as any;
      return {
        id: follow.follower_id,
        displayName: profile?.display_name || null,
        bio: profile?.bio || null,
        avatarUrl: profile?.avatar_url || null,
        location: profile?.location || null,
        bbqStyle: profile?.bbq_style || null,
        experienceLevel: profile?.experience_level || null,
        followedAt: follow.created_at,
      };
    });

    return NextResponse.json(followers);
  } catch (error) {
    console.error("Error in GET /api/users/[id]/followers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


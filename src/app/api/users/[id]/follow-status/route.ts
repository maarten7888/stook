import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/users/[id]/follow-status - Check if current user is following this user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // If not authenticated, return not following
    if (authError || !user) {
      return NextResponse.json({ isFollowing: false });
    }

    const { id } = await params;
    const followingId = id;

    // Can't follow yourself
    if (user.id === followingId) {
      return NextResponse.json({ isFollowing: false, isOwnProfile: true });
    }

    const adminSupabase = createAdminClient();

    // Check if following
    const { data: follow, error: followError } = await adminSupabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single();

    if (followError && followError.code !== 'PGRST116') {
      console.error("Error checking follow status:", followError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ 
      isFollowing: !!follow,
      isOwnProfile: false,
    });
  } catch (error) {
    console.error("Error in GET /api/users/[id]/follow-status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


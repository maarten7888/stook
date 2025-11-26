import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/friends - Get own friends list
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get all friendships where user is involved
    const { data: friendships, error } = await adminSupabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        friend:profiles!friendships_friend_id_fkey(
          id,
          display_name,
          bio,
          avatar_url,
          location,
          bbq_style,
          experience_level
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching friends:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Transform data
    const friends = (friendships || []).map((f) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const friendProfile = f.friend as any;
      return {
        id: f.friend_id,
        displayName: friendProfile?.display_name || null,
        bio: friendProfile?.bio || null,
        avatarUrl: friendProfile?.avatar_url || null,
        location: friendProfile?.location || null,
        bbqStyle: friendProfile?.bbq_style || null,
        experienceLevel: friendProfile?.experience_level || null,
        friendshipCreatedAt: f.created_at,
      };
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error("Error in GET /api/friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/friends/[id] - Remove friendship
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json({ error: "friendId is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Delete both directions of the friendship
    const { error: deleteError } = await adminSupabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (deleteError) {
      console.error("Error removing friendship:", deleteError);
      return NextResponse.json({ error: "Failed to remove friendship" }, { status: 500 });
    }

    return NextResponse.json({ message: "Friendship removed" });
  } catch (error) {
    console.error("Error in DELETE /api/friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


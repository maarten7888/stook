import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// POST /api/friends/requests/[id]/accept
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
    const adminSupabase = createAdminClient();

    // Get the friend request
    const { data: friendRequest, error: fetchError } = await adminSupabase
      .from('friend_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !friendRequest) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    // Check if user is the receiver
    if (friendRequest.receiver_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if request is pending
    if (friendRequest.status !== 'pending') {
      return NextResponse.json({ error: "Friend request is not pending" }, { status: 400 });
    }

    // Check if already friends
    const { data: existingFriendship } = await adminSupabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${friendRequest.requester_id},friend_id.eq.${friendRequest.receiver_id}),and(user_id.eq.${friendRequest.receiver_id},friend_id.eq.${friendRequest.requester_id})`)
      .limit(1);

    if (existingFriendship && existingFriendship.length > 0) {
      // Already friends, just update request status
      await adminSupabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', id);

      return NextResponse.json({ message: "Already friends" });
    }

    // Create bidirectional friendship
    const { error: friendshipError } = await adminSupabase
      .from('friendships')
      .insert([
        {
          user_id: friendRequest.requester_id,
          friend_id: friendRequest.receiver_id,
        },
        {
          user_id: friendRequest.receiver_id,
          friend_id: friendRequest.requester_id,
        },
      ]);

    if (friendshipError) {
      console.error("Error creating friendship:", friendshipError);
      return NextResponse.json({ error: "Failed to create friendship" }, { status: 500 });
    }

    // Update request status
    const { error: updateError } = await adminSupabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error("Error updating friend request:", updateError);
      // Friendship was created, so we continue
    }

    return NextResponse.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error in POST /api/friends/requests/[id]/accept:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/friends/status/[id] - Check friendship status with another user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: otherUserId } = await params;
    const adminSupabase = createAdminClient();

    // Check if friends
    const { data: friendship } = await adminSupabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${user.id})`)
      .limit(1)
      .single();

    if (friendship) {
      return NextResponse.json({ status: 'friends' });
    }

    // Check for pending requests
    const { data: sentRequest } = await adminSupabase
      .from('friend_requests')
      .select('id')
      .eq('requester_id', user.id)
      .eq('receiver_id', otherUserId)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (sentRequest) {
      return NextResponse.json({ status: 'request_sent' });
    }

    const { data: receivedRequest } = await adminSupabase
      .from('friend_requests')
      .select('id')
      .eq('requester_id', otherUserId)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (receivedRequest) {
      return NextResponse.json({ status: 'request_received' });
    }

    return NextResponse.json({ status: 'none' });
  } catch (error) {
    console.error("Error in GET /api/friends/status/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


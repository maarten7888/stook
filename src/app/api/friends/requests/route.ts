import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// POST /api/friends/requests - Send friend request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId } = body;

    if (!receiverId || typeof receiverId !== 'string') {
      return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
    }

    if (receiverId === user.id) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Check if already friends
    const { data: existingFriendship } = await adminSupabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${user.id})`)
      .limit(1);

    if (existingFriendship && existingFriendship.length > 0) {
      return NextResponse.json({ error: "Already friends" }, { status: 400 });
    }

    // Check if pending request already exists
    const { data: existingRequest } = await adminSupabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      .eq('status', 'pending')
      .limit(1);

    if (existingRequest && existingRequest.length > 0) {
      const req = existingRequest[0];
      // Check if it's the reverse request (receiver sent one to requester)
      const { data: reverseCheck } = await adminSupabase
        .from('friend_requests')
        .select('requester_id')
        .eq('id', req.id)
        .single();

      if (reverseCheck && reverseCheck.requester_id === receiverId) {
        // Auto-accept if reverse request exists
        return NextResponse.json({ 
          message: "Auto-accepted existing request",
          requestId: req.id 
        });
      }
      return NextResponse.json({ error: "Friend request already pending" }, { status: 400 });
    }

    // Create friend request
    const { data: friendRequest, error: insertError } = await adminSupabase
      .from('friend_requests')
      .insert({
        requester_id: user.id,
        receiver_id: receiverId,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating friend request:", insertError);
      return NextResponse.json({ error: "Failed to create friend request" }, { status: 500 });
    }

    return NextResponse.json(friendRequest, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/friends/requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/friends/requests?type=received|sent|all
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'received' | 'sent' | 'all'

    const adminSupabase = createAdminClient();

    let query = adminSupabase
      .from('friend_requests')
      .select(`
        id,
        requester_id,
        receiver_id,
        status,
        created_at,
        updated_at,
        requester:profiles!friend_requests_requester_id_fkey(id, display_name, avatar_url),
        receiver:profiles!friend_requests_receiver_id_fkey(id, display_name, avatar_url)
      `);

    if (type === 'received') {
      query = query.eq('receiver_id', user.id);
    } else if (type === 'sent') {
      query = query.eq('requester_id', user.id);
    } else {
      // 'all' - both sent and received
      query = query.or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
    }

    // Only show pending requests
    query = query.eq('status', 'pending');

    const { data: requests, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching friend requests:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(requests || []);
  } catch (error) {
    console.error("Error in GET /api/friends/requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


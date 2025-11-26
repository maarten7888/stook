import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// POST /api/friends/requests/[id]/decline
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

    // Update request status
    const { error: updateError } = await adminSupabase
      .from('friend_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error("Error declining friend request:", updateError);
      return NextResponse.json({ error: "Failed to decline friend request" }, { status: 500 });
    }

    return NextResponse.json({ message: "Friend request declined" });
  } catch (error) {
    console.error("Error in POST /api/friends/requests/[id]/decline:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


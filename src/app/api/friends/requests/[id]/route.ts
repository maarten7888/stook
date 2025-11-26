import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// DELETE /api/friends/requests/[id] - Cancel friend request
export async function DELETE(
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

    // Check if user is the requester
    if (friendRequest.requester_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if request is pending
    if (friendRequest.status !== 'pending') {
      return NextResponse.json({ error: "Can only cancel pending requests" }, { status: 400 });
    }

    // Update status to cancelled (soft delete)
    const { error: updateError } = await adminSupabase
      .from('friend_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error("Error cancelling friend request:", updateError);
      return NextResponse.json({ error: "Failed to cancel friend request" }, { status: 500 });
    }

    return NextResponse.json({ message: "Friend request cancelled" });
  } catch (error) {
    console.error("Error in DELETE /api/friends/requests/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


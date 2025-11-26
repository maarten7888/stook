import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// POST /api/users/[id]/follow - Follow a user
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
    const followingId = id;

    // Can't follow yourself
    if (user.id === followingId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Check if user exists
    const { data: targetUser, error: userError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', followingId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const { data: existingFollow } = await adminSupabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single();

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 });
    }

    // Create follow relationship
    const { data: follow, error: followError } = await adminSupabase
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: followingId,
      })
      .select()
      .single();

    if (followError) {
      console.error("Error creating follow:", followError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(follow);
  } catch (error) {
    console.error("Error in POST /api/users/[id]/follow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/[id]/follow - Unfollow a user
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
    const followingId = id;

    const adminSupabase = createAdminClient();

    // Delete follow relationship
    const { error: deleteError } = await adminSupabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);

    if (deleteError) {
      console.error("Error deleting follow:", deleteError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/users/[id]/follow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


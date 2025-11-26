import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/users/[id]/friends/count - Get public friend count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Count friendships for this user
    const { count, error } = await adminSupabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (error) {
      console.error("Error counting friends:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("Error in GET /api/users/[id]/friends/count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


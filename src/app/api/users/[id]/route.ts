import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Fetch public profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, display_name, bio, location, avatar_url, bbq_style, experience_level, favorite_meat, favorite_wood, created_at')
      .eq('id', id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      console.error("Error fetching profile:", profileError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


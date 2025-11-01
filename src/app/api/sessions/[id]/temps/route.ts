import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const addTempSchema = z.object({
  grateTemp: z.number().int().min(0).max(500).optional(),
  meatTemp: z.number().int().min(0).max(200).optional(),
  probeName: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access: user owns session
    if (session.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get temperature readings
    const { data: temps, error: tempsError } = await adminSupabase
      .from('session_temps')
      .select('*')
      .eq('cook_session_id', id)
      .order('recorded_at', { ascending: false });

    if (tempsError) {
      console.error("Error fetching temps:", tempsError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Transform to match expected format
    const transformedTemps = temps?.map(temp => ({
      id: temp.id,
      cookSessionId: temp.cook_session_id,
      recordedAt: temp.recorded_at,
      grateTemp: temp.grate_temp,
      meatTemp: temp.meat_temp,
      probeName: temp.probe_name,
    })) || [];

    return NextResponse.json(transformedTemps);
  } catch (error) {
    console.error("Error fetching session temps:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { grateTemp, meatTemp, probeName } = addTempSchema.parse(body);
    const adminSupabase = createAdminClient();

    // Verify session exists and user owns it
    const { data: session, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Add temperature reading
    const { data: newTemp, error: insertError } = await adminSupabase
      .from('session_temps')
      .insert({
        cook_session_id: id,
        grate_temp: grateTemp || null,
        meat_temp: meatTemp || null,
        probe_name: probeName || null,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error adding temperature:", insertError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Transform to match expected format
    return NextResponse.json({
      id: newTemp.id,
      cookSessionId: newTemp.cook_session_id,
      recordedAt: newTemp.recorded_at,
      grateTemp: newTemp.grate_temp,
      meatTemp: newTemp.meat_temp,
      probeName: newTemp.probe_name,
    });
  } catch (error) {
    console.error("Error adding temperature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

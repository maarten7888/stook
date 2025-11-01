import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const finishSessionSchema = z.object({
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  conclusion: z.string().optional(),
  adjustments: z.any().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { notes, rating, conclusion, adjustments } = finishSessionSchema.parse(body);
    const adminSupabase = createAdminClient();

    // Verify session exists and user owns it
    const { data: existingSession, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('id, user_id, ended_at, notes, rating, conclusion, adjustments')
      .eq('id', id)
      .single();

    if (sessionError || !existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existingSession.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (existingSession.ended_at) {
      return NextResponse.json({ error: "Session already finished" }, { status: 400 });
    }

    // Finish session
    const { data: finishedSession, error: updateError } = await adminSupabase
      .from('cook_sessions')
      .update({
        ended_at: new Date().toISOString(),
        notes: notes || existingSession.notes || null,
        rating: rating || existingSession.rating || null,
        conclusion: conclusion || existingSession.conclusion || null,
        adjustments: adjustments || existingSession.adjustments || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("Error finishing session:", updateError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(finishedSession);
  } catch (error) {
    console.error("Error finishing session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

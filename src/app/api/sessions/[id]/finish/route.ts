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
      console.error("POST /api/sessions/[id]/finish - Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    console.log("POST /api/sessions/[id]/finish - Request:", { sessionId: id, userId: user.id, body });
    
    const { notes, rating, conclusion, adjustments } = finishSessionSchema.parse(body);
    const adminSupabase = createAdminClient();

    // Verify session exists and user owns it
    const { data: existingSession, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('id, user_id, ended_at, notes, rating, conclusion, adjustments')
      .eq('id', id)
      .single();

    if (sessionError || !existingSession) {
      console.error("POST /api/sessions/[id]/finish - Session not found:", {
        error: sessionError,
        code: sessionError?.code,
        message: sessionError?.message,
        sessionId: id
      });
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existingSession.user_id !== user.id) {
      console.error("POST /api/sessions/[id]/finish - Access denied:", {
        sessionUserId: existingSession.user_id,
        requestUserId: user.id
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (existingSession.ended_at) {
      console.log("POST /api/sessions/[id]/finish - Session already finished");
      return NextResponse.json({ error: "Session already finished" }, { status: 400 });
    }

    // Prepare update data - only include fields that are provided
    const updateData: {
      ended_at: string;
      notes?: string | null;
      rating?: number | null;
      conclusion?: string | null;
      adjustments?: unknown | null;
    } = {
      ended_at: new Date().toISOString(),
    };

    // Only update fields that are explicitly provided or merge with existing
    if (notes !== undefined) {
      updateData.notes = notes || null;
    } else if (existingSession.notes !== null) {
      updateData.notes = existingSession.notes;
    }

    if (rating !== undefined) {
      updateData.rating = rating || null;
    } else if (existingSession.rating !== null) {
      updateData.rating = existingSession.rating;
    }

    if (conclusion !== undefined) {
      updateData.conclusion = conclusion || null;
    } else if (existingSession.conclusion !== null) {
      updateData.conclusion = existingSession.conclusion;
    }

    if (adjustments !== undefined) {
      updateData.adjustments = adjustments || null;
    } else if (existingSession.adjustments !== null) {
      updateData.adjustments = existingSession.adjustments;
    }

    console.log("POST /api/sessions/[id]/finish - Update data:", updateData);

    // Finish session
    const { data: finishedSession, error: updateError } = await adminSupabase
      .from('cook_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("POST /api/sessions/[id]/finish - Error updating session:", {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        updateData
      });
      return NextResponse.json({ 
        error: "Internal server error",
        details: updateError.message 
      }, { status: 500 });
    }

    console.log("POST /api/sessions/[id]/finish - Session finished successfully");
    return NextResponse.json(finishedSession);
  } catch (error) {
    console.error("POST /api/sessions/[id]/finish - Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

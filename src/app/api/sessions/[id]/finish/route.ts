import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cookSessions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
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

    // Verify session exists and user owns it
    const existingSession = await db
      .select()
      .from(cookSessions)
      .where(eq(cookSessions.id, id))
      .limit(1);

    if (existingSession.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existingSession[0].userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (existingSession[0].endedAt) {
      return NextResponse.json({ error: "Session already finished" }, { status: 400 });
    }

    // Finish session
    const [finishedSession] = await db
      .update(cookSessions)
      .set({
        endedAt: new Date(),
        notes: notes || existingSession[0].notes,
        rating: rating || existingSession[0].rating,
        conclusion: conclusion || existingSession[0].conclusion,
        adjustments: adjustments || existingSession[0].adjustments,
      })
      .where(eq(cookSessions.id, id))
      .returning();

    return NextResponse.json(finishedSession);
  } catch (error) {
    console.error("Error finishing session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

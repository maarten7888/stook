import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sessionTemps, cookSessions } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
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

    // Verify session exists and user has access
    const session = await db
      .select()
      .from(cookSessions)
      .where(eq(cookSessions.id, id))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access: user owns session or recipe is public
    if (session[0].userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get temperature readings
    const temps = await db
      .select()
      .from(sessionTemps)
      .where(eq(sessionTemps.cookSessionId, id))
      .orderBy(desc(sessionTemps.recordedAt));

    return NextResponse.json(temps);
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

    // Verify session exists and user owns it
    const session = await db
      .select()
      .from(cookSessions)
      .where(eq(cookSessions.id, id))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session[0].userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Add temperature reading
    const [newTemp] = await db
      .insert(sessionTemps)
      .values({
        cookSessionId: id,
        grateTemp,
        meatTemp,
        probeName,
        recordedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newTemp);
  } catch (error) {
    console.error("Error adding temperature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

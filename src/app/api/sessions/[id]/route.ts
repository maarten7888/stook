import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cookSessions, recipes, profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get session with recipe and user info
    const session = await db
      .select({
        id: cookSessions.id,
        recipeId: cookSessions.recipeId,
        userId: cookSessions.userId,
        startedAt: cookSessions.startedAt,
        endedAt: cookSessions.endedAt,
        notes: cookSessions.notes,
        rating: cookSessions.rating,
        conclusion: cookSessions.conclusion,
        adjustments: cookSessions.adjustments,
        recipeSnapshot: cookSessions.recipeSnapshot,
        recipe: {
          id: recipes.id,
          title: recipes.title,
          description: recipes.description,
          visibility: recipes.visibility,
        },
        user: {
          id: profiles.id,
          displayName: profiles.displayName,
        },
      })
      .from(cookSessions)
      .innerJoin(recipes, eq(cookSessions.recipeId, recipes.id))
      .innerJoin(profiles, eq(cookSessions.userId, profiles.id))
      .where(eq(cookSessions.id, id))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access: user owns session or recipe is public
    if (session[0].userId !== user.id && session[0].recipe.visibility !== "public") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(session[0]);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

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

    // Update session
    const [updatedSession] = await db
      .update(cookSessions)
      .set({
        notes: body.notes,
        rating: body.rating,
        conclusion: body.conclusion,
        adjustments: body.adjustments,
        endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
      })
      .where(eq(cookSessions.id, id))
      .returning();

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

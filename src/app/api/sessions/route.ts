import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cookSessions, recipes, photos, sessionTemps } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Debug - User ID from auth:", user.id);
    console.log("Debug - User email:", user.email);

    // Get all sessions for the user with additional data
    const sessions = await db
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
        tempCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${sessionTemps} 
          WHERE ${sessionTemps.cookSessionId} = ${cookSessions.id}
        )`,
        photoCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${photos} 
          WHERE ${photos.cookSessionId} = ${cookSessions.id}
        )`,
      })
      .from(cookSessions)
      .innerJoin(recipes, eq(cookSessions.recipeId, recipes.id))
      .where(eq(cookSessions.userId, user.id))
      .orderBy(desc(cookSessions.startedAt));

    console.log("Debug - Found sessions:", sessions.length);
    console.log("Debug - Sessions:", sessions);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

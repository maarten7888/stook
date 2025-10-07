import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cookSessions, recipes, profiles } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const startSessionSchema = z.object({
  recipeId: z.string().uuid(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId } = startSessionSchema.parse(body);

    // Verify recipe exists and user has access
    const recipe = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (recipe.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Check if user owns recipe or recipe is public
    if (recipe[0].userId !== user.id && recipe[0].visibility !== "public") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create new cook session
    const [newSession] = await db
      .insert(cookSessions)
      .values({
        recipeId,
        userId: user.id,
        startedAt: new Date(),
        recipeSnapshot: {
          title: recipe[0].title,
          description: recipe[0].description,
          serves: recipe[0].serves,
          prepMinutes: recipe[0].prepMinutes,
          cookMinutes: recipe[0].cookMinutes,
          targetInternalTemp: recipe[0].targetInternalTemp,
        },
      })
      .returning();

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

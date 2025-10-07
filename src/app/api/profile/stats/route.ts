import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { recipes, cookSessions, reviews } from "@/drizzle/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recipe count
    const [recipeCount] = await db
      .select({ count: count() })
      .from(recipes)
      .where(eq(recipes.userId, user.id));

    // Get session count
    const [sessionCount] = await db
      .select({ count: count() })
      .from(cookSessions)
      .where(eq(cookSessions.userId, user.id));

    // Get review count
    const [reviewCount] = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.userId, user.id));

    return NextResponse.json({
      recipes: recipeCount.count,
      sessions: sessionCount.count,
      reviews: reviewCount.count,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

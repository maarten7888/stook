import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { reviews, recipes, profiles } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify recipe exists and is public
    const recipe = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);

    if (recipe.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (recipe[0].visibility !== "public") {
      return NextResponse.json({ error: "Recipe is private" }, { status: 403 });
    }

    // Get reviews with user info
    const recipeReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        user: {
          id: profiles.id,
          displayName: profiles.displayName,
        },
      })
      .from(reviews)
      .innerJoin(profiles, eq(reviews.userId, profiles.id))
      .where(eq(reviews.recipeId, id))
      .orderBy(desc(reviews.createdAt));

    return NextResponse.json(recipeReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
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
    const { rating, comment } = createReviewSchema.parse(body);

    // Verify recipe exists and is public
    const recipe = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);

    if (recipe.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (recipe[0].visibility !== "public") {
      return NextResponse.json({ error: "Recipe is private" }, { status: 403 });
    }

    // Check if user owns the recipe (can't review own recipe)
    if (recipe[0].userId === user.id) {
      return NextResponse.json({ error: "Cannot review your own recipe" }, { status: 400 });
    }

    // Check if user already reviewed this recipe
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.recipeId, id), eq(reviews.userId, user.id)))
      .limit(1);

    if (existingReview.length > 0) {
      return NextResponse.json({ error: "You have already reviewed this recipe" }, { status: 400 });
    }

    // Create review
    const [newReview] = await db
      .insert(reviews)
      .values({
        recipeId: id,
        userId: user.id,
        rating,
        comment,
      })
      .returning();

    return NextResponse.json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

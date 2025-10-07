import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recipes, steps, recipeIngredients, ingredients, photos, reviews, recipeTags, tags } from "@/../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  const userId = session?.user.id ?? null;

  try {
    const [rec] = await db.select().from(recipes).where(eq(recipes.id, id));
    if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Visibility check: public or owner
    if (!(rec.visibility === "public" || (userId && rec.userId === userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [stepsRows, ingRows, photoRows, reviewRows, tagRows] = await Promise.all([
      db.select().from(steps).where(eq(steps.recipeId, id)).orderBy(steps.orderNo),
      db
        .select({
          id: recipeIngredients.id,
          amount: recipeIngredients.amount,
          unit: recipeIngredients.unit,
          ingredientId: ingredients.id,
          ingredientName: ingredients.name,
        })
        .from(recipeIngredients)
        .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
        .where(eq(recipeIngredients.recipeId, id)),
      db.select().from(photos).where(and(eq(photos.recipeId, id))),
      db.select().from(reviews).where(eq(reviews.recipeId, id)),
      db
        .select({ tagId: tags.id, tagName: tags.name })
        .from(recipeTags)
        .innerJoin(tags, eq(recipeTags.tagId, tags.id))
        .where(eq(recipeTags.recipeId, id)),
    ]);

    return NextResponse.json({
      ...rec,
      steps: stepsRows,
      ingredients: ingRows,
      photos: photoRows,
      reviews: reviewRows,
      tags: tagRows,
    });
  } catch (err) {
    console.error("GET /api/recipes/[id] failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  serves: z.number().int().min(1).max(50).nullable().optional(),
  prepMinutes: z.number().int().min(0).max(24 * 60).nullable().optional(),
  cookMinutes: z.number().int().min(0).max(48 * 60).nullable().optional(),
  targetInternalTemp: z.number().int().min(0).max(200).nullable().optional(),
  visibility: z.enum(["private", "public"]).optional(),
});

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(payload ?? {});
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const [rec] = await db.select().from(recipes).where(eq(recipes.id, id));
  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rec.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await db
      .update(recipes)
      .set({
        title: parsed.data.title ?? rec.title,
        description: parsed.data.description ?? rec.description,
        serves: parsed.data.serves ?? rec.serves,
        prepMinutes: parsed.data.prepMinutes ?? rec.prepMinutes,
        cookMinutes: parsed.data.cookMinutes ?? rec.cookMinutes,
        targetInternalTemp: parsed.data.targetInternalTemp ?? rec.targetInternalTemp,
        visibility: parsed.data.visibility ?? rec.visibility,
      })
      .where(eq(recipes.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/recipes/[id] failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rec] = await db.select().from(recipes).where(eq(recipes.id, id));
  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rec.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await db.delete(recipes).where(eq(recipes.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/recipes/[id] failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}



import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const runtime = "nodejs";

// Types for Supabase responses
type TagResponse = {
  tags: { id: string; name: string }[] | null;
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  const userId = session?.user.id ?? null;

  try {
    // First, try to get the recipe via Supabase for better compatibility
    const supabase = createAdminClient();

    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (recipeError || !recipeData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Visibility check: public or owner
    if (!(recipeData.visibility === "public" || (userId && recipeData.user_id === userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get related data via Supabase
    const [stepsResult, ingredientsResult, photosResult, reviewsResult, tagsResult] = await Promise.all([
      supabase
        .from('steps')
        .select('*')
        .eq('recipe_id', id)
        .order('order_no'),
      supabase
        .from('recipe_ingredients')
        .select(`
          id,
          amount,
          unit,
          ingredients(id, name)
        `)
        .eq('recipe_id', id),
      supabase
        .from('photos')
        .select('*')
        .eq('recipe_id', id),
      supabase
        .from('reviews')
        .select('*')
        .eq('recipe_id', id),
      supabase
        .from('recipe_tags')
        .select(`
          tags(id, name)
        `)
        .eq('recipe_id', id)
    ]);

    // Transform the data to match expected format
    const steps = (stepsResult.data || []).map((step: Record<string, unknown>) => ({
      id: step.id as string,
      orderNo: step.order_no as number,
      instruction: step.instruction as string,
      timerMinutes: step.timer_minutes as number | null,
      targetTemp: step.target_temp as number | null,
    }));
    
    // Debug: log the data structures
    console.log('Steps result:', JSON.stringify(stepsResult.data, null, 2));
    console.log('Ingredients result:', JSON.stringify(ingredientsResult.data, null, 2));
    
    const ingredients = (ingredientsResult.data || []).map((ri: Record<string, unknown>) => {
      // Handle different possible structures from Supabase
      let ingredientName = 'Onbekend ingrediënt';
      let ingredientId = null;
      
      if (ri.ingredients) {
        const ingredients = ri.ingredients as Record<string, unknown>;
        if (Array.isArray(ingredients) && ingredients.length > 0) {
          const firstIngredient = ingredients[0] as Record<string, unknown>;
          ingredientName = (firstIngredient.name as string) || 'Onbekend ingrediënt';
          ingredientId = firstIngredient.id as string;
        } else if (ingredients.name) {
          ingredientName = (ingredients.name as string) || 'Onbekend ingrediënt';
          ingredientId = ingredients.id as string;
        }
      }
      
      return {
        id: ri.id as string,
        amount: ri.amount as number | null,
        unit: ri.unit as string | null,
        ingredientId: ingredientId,
        ingredientName: ingredientName
      };
    });
    const photos = photosResult.data || [];
    const reviews = reviewsResult.data || [];
    const tags = (tagsResult.data || []).map((rt: TagResponse) => ({
      tagId: rt.tags?.[0]?.id,
      tagName: rt.tags?.[0]?.name
    }));

    return NextResponse.json({
      id: recipeData.id,
      userId: recipeData.user_id,
      title: recipeData.title,
      description: recipeData.description,
      serves: recipeData.serves,
      prepMinutes: recipeData.prep_minutes,
      cookMinutes: recipeData.cook_minutes,
      targetInternalTemp: recipeData.target_internal_temp,
      visibility: recipeData.visibility,
      createdAt: recipeData.created_at,
      updatedAt: recipeData.updated_at,
      steps,
      ingredients,
      photos,
      reviews,
      tags,
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

  try {
    const supabase = createAdminClient();

    // Check if user owns the recipe
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (recipeError || !recipeData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (recipeData.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the recipe
    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.serves !== undefined) updateData.serves = parsed.data.serves;
    if (parsed.data.prepMinutes !== undefined) updateData.prep_minutes = parsed.data.prepMinutes;
    if (parsed.data.cookMinutes !== undefined) updateData.cook_minutes = parsed.data.cookMinutes;
    if (parsed.data.targetInternalTemp !== undefined) updateData.target_internal_temp = parsed.data.targetInternalTemp;
    if (parsed.data.visibility !== undefined) updateData.visibility = parsed.data.visibility;

    const { error: updateError } = await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

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

  try {
    const supabase = createAdminClient();

    // Check if user owns the recipe
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (recipeError || !recipeData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (recipeData.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the recipe (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/recipes/[id] failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
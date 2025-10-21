import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSession, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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
      timerMinutes: step.timer_minutes ? step.timer_minutes.toString() : "",
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
        name: ingredientName,
        amount: ri.amount ? ri.amount.toString() : "",
        unit: ri.unit as string | null,
        ingredientId: ingredientId,
        ingredientName: ingredientName
      };
    });
    const photos = photosResult.data || [];
    const reviews = reviewsResult.data || [];
    const tags = (tagsResult.data || []).map((rt: TagResponse) => rt.tags?.[0]?.name).filter(Boolean);

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
  ingredients: z.array(z.object({
    name: z.string().min(1),
    amount: z.string().optional(),
    unit: z.string().optional(),
  })).optional(),
  steps: z.array(z.object({
    instruction: z.string().min(1),
    timerMinutes: z.string().optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
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

    // Update ingredients if provided
    if (parsed.data.ingredients !== undefined) {
      // Delete existing ingredients
      await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      // Insert new ingredients
      if (parsed.data.ingredients.length > 0) {
        const ingredientInserts = [];
        
        for (const ingredient of parsed.data.ingredients) {
          // First, ensure ingredient exists in ingredients table
          const { data: existingIngredient } = await supabase
            .from('ingredients')
            .select('id')
            .eq('name', ingredient.name)
            .single();

          let ingredientId;
          if (existingIngredient) {
            ingredientId = existingIngredient.id;
          } else {
            const { data: newIngredient, error: ingredientError } = await supabase
              .from('ingredients')
              .insert({ name: ingredient.name, default_unit: ingredient.unit || 'stuks' })
              .select('id')
              .single();
            
            if (ingredientError) {
              console.error("Ingredient insert error:", ingredientError);
              continue;
            }
            ingredientId = newIngredient.id;
          }

          // Insert recipe_ingredient
          ingredientInserts.push({
            recipe_id: id,
            ingredient_id: ingredientId,
            amount: ingredient.amount ? parseFloat(ingredient.amount) : null,
            unit: ingredient.unit || null,
          });
        }

        if (ingredientInserts.length > 0) {
          const { error: recipeIngredientError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientInserts);

          if (recipeIngredientError) {
            console.error("Recipe ingredient insert error:", recipeIngredientError);
          }
        }
      }
    }

    // Update steps if provided
    if (parsed.data.steps !== undefined) {
      // Delete existing steps
      await supabase
        .from('steps')
        .delete()
        .eq('recipe_id', id);

      // Insert new steps
      if (parsed.data.steps.length > 0) {
        const stepInserts = parsed.data.steps.map((step, index) => ({
          recipe_id: id,
          order_no: index + 1,
          instruction: step.instruction,
          timer_minutes: step.timerMinutes ? parseInt(step.timerMinutes) : null,
          target_temp: null,
        }));

        const { error: stepError } = await supabase
          .from('steps')
          .insert(stepInserts);

        if (stepError) {
          console.error("Step insert error:", stepError);
        }
      }
    }

    // Update tags if provided
    if (parsed.data.tags !== undefined) {
      // Delete existing tags
      await supabase
        .from('recipe_tags')
        .delete()
        .eq('recipe_id', id);

      // Insert new tags
      if (parsed.data.tags.length > 0) {
        const tagInserts = [];
        
        for (const tagName of parsed.data.tags) {
          // First, ensure tag exists in tags table
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .single();

          let tagId;
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert({ name: tagName })
              .select('id')
              .single();
            
            if (tagError) {
              console.error("Tag insert error:", tagError);
              continue;
            }
            tagId = newTag.id;
          }

          tagInserts.push({
            recipe_id: id,
            tag_id: tagId,
          });
        }

        if (tagInserts.length > 0) {
          const { error: recipeTagError } = await supabase
            .from('recipe_tags')
            .insert(tagInserts);

          if (recipeTagError) {
            console.error("Recipe tag insert error:", recipeTagError);
          }
        }
      }
    }

    // Revalidate the recipes pages
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);
    revalidatePath("/");

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

    // Revalidate the recipes pages
    revalidatePath("/recipes");
    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/recipes/[id] failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
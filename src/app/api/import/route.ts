import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { recipes, ingredients, recipeIngredients, steps } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const importSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = importSchema.parse(body);

    // Get preview data (in production, you'd parse the actual URL)
    const previewResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/import/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!previewResponse.ok) {
      return NextResponse.json({ error: "Failed to preview recipe" }, { status: 400 });
    }

    const preview = await previewResponse.json();

    // Create recipe
    const [newRecipe] = await db
      .insert(recipes)
      .values({
        userId: user.id,
        title: preview.title,
        description: preview.description,
        serves: preview.serves,
        prepMinutes: preview.prepMinutes,
        cookMinutes: preview.cookMinutes,
        targetInternalTemp: preview.targetInternalTemp,
        visibility: "private", // Imported recipes start as private
      })
      .returning();

    // Create ingredients and link them to recipe
    const ingredientIds: string[] = [];
    for (const ingredient of preview.ingredients) {
      // Check if ingredient already exists
      const existingIngredient = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.name, ingredient.name))
        .limit(1);

      let ingredientId: string;
      if (existingIngredient.length > 0) {
        ingredientId = existingIngredient[0].id;
      } else {
        const [newIngredient] = await db
          .insert(ingredients)
          .values({
            name: ingredient.name,
            defaultUnit: ingredient.unit,
          })
          .returning();
        ingredientId = newIngredient.id;
      }

      ingredientIds.push(ingredientId);

      // Link ingredient to recipe
      await db
        .insert(recipeIngredients)
        .values({
          recipeId: newRecipe.id,
          ingredientId,
          amount: ingredient.amount,
          unit: ingredient.unit,
        });
    }

    // Create steps
    for (let i = 0; i < preview.steps.length; i++) {
      const step = preview.steps[i];
      await db
        .insert(steps)
        .values({
          recipeId: newRecipe.id,
          orderNo: i + 1,
          instruction: step.instruction,
          timerMinutes: step.timerMinutes,
          targetTemp: step.targetTemp,
        });
    }

    return NextResponse.json(newRecipe);
  } catch (error) {
    console.error("Error importing recipe:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

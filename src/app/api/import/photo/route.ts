import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const importSchema = z.object({
  path: z.string().min(1),
  title: z.string().min(1, "Titel is vereist"),
  description: z.string().nullable().optional(),
  serves: z.number().nullable().optional(),
  prepMinutes: z.number().nullable().optional(),
  cookMinutes: z.number().nullable().optional(),
  targetInternalTemp: z.number().nullable().optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    amount: z.number().nullable().optional(),
    unit: z.string().nullable().optional(),
  })),
  steps: z.array(z.object({
    instruction: z.string().min(1),
    timerMinutes: z.number().nullable().optional(),
    targetTemp: z.number().nullable().optional(),
  })),
});

/**
 * POST /api/import/photo
 * 
 * Importeer een recept vanuit OCR preview.
 * Maakt het recept aan en koppelt de originele foto.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om recepten te importeren" },
        { status: 401 }
      );
    }

    // Parse en valideer input
    const body = await request.json();
    const result = importSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // Security check: pad moet onder imports/{user_id}/ vallen
    if (!data.path.includes(`/imports/${user.id}/`)) {
      return NextResponse.json(
        { error: "Geen toegang tot dit bestand" },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();

    // Start database transactie
    // 1. Maak recept aan
    const { data: recipe, error: recipeError } = await adminClient
      .from("recipes")
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        serves: data.serves || null,
        prep_minutes: data.prepMinutes || null,
        cook_minutes: data.cookMinutes || null,
        target_internal_temp: data.targetInternalTemp || null,
        visibility: "private",
      })
      .select()
      .single();

    if (recipeError || !recipe) {
      console.error("Error creating recipe:", recipeError);
      return NextResponse.json(
        { error: "Kon recept niet aanmaken" },
        { status: 500 }
      );
    }

    // 2. Maak ingrediënten aan
    for (const ing of data.ingredients) {
      // Check of ingredient al bestaat
      const { data: existingIng } = await adminClient
        .from("ingredients")
        .select("id")
        .eq("name", ing.name)
        .single();

      let ingredientId: string;

      if (existingIng) {
        ingredientId = existingIng.id;
      } else {
        // Maak nieuw ingredient aan
        const { data: newIng, error: ingError } = await adminClient
          .from("ingredients")
          .insert({
            name: ing.name,
            default_unit: ing.unit || null,
          })
          .select()
          .single();

        if (ingError || !newIng) {
          console.error("Error creating ingredient:", ingError);
          continue; // Skip dit ingredient maar ga door
        }
        ingredientId = newIng.id;
      }

      // Link ingredient aan recept
      await adminClient
        .from("recipe_ingredients")
        .insert({
          recipe_id: recipe.id,
          ingredient_id: ingredientId,
          amount: ing.amount || null,
          unit: ing.unit || null,
        });
    }

    // 3. Maak stappen aan
    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i];
      await adminClient
        .from("steps")
        .insert({
          recipe_id: recipe.id,
          order_no: i + 1,
          instruction: step.instruction,
          timer_minutes: step.timerMinutes || null,
          target_temp: step.targetTemp || null,
        });
    }

    // 4. Maak photo record aan en koppel aan recept
    const { error: photoError } = await adminClient
      .from("photos")
      .insert({
        user_id: user.id,
        recipe_id: recipe.id,
        path: data.path,
        type: "prep", // Import foto als prep foto
      });

    if (photoError) {
      console.error("Error creating photo record:", photoError);
      // Niet fataal - recept is al aangemaakt
    }

    // Revalidate cache
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipe.id}`);

    return NextResponse.json({
      id: recipe.id,
      title: recipe.title,
      message: "Recept succesvol geïmporteerd",
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het importeren" },
      { status: 500 }
    );
  }
}


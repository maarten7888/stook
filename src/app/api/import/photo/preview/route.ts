import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { parseOcrText } from "@/server/import/ocr";

const previewSchema = z.object({
  rawText: z.string().min(1, "Tekst is vereist"),
  path: z.string().min(1, "Pad is vereist"),
});

/**
 * POST /api/import/photo/preview
 * 
 * Parse OCR tekst naar een recept preview.
 * Retourneert dezelfde structuur als URL import preview.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      );
    }

    // Parse en valideer input
    const body = await request.json();
    const result = previewSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { rawText, path } = result.data;

    // Security check: pad moet onder imports/{user_id}/ vallen
    if (!path.includes(`/imports/${user.id}/`)) {
      return NextResponse.json(
        { error: "Geen toegang tot dit bestand" },
        { status: 403 }
      );
    }

    // Parse de OCR tekst
    const parsed = parseOcrText(rawText);

    // Converteer naar preview formaat (zelfde als URL import)
    const preview = {
      path,
      title: parsed.title,
      description: parsed.description,
      serves: parsed.serves,
      prepMinutes: parsed.prepMinutes,
      cookMinutes: parsed.cookMinutes,
      targetInternalTemp: parsed.targetInternalTemp,
      ingredients: parsed.ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
      })),
      steps: parsed.steps.map((step) => ({
        instruction: step.instruction,
        timerMinutes: step.timerMinutes,
        targetTemp: step.targetTemp,
      })),
      confidence: parsed.confidence.overall,
      confidenceDetails: parsed.confidence,
      source: "OCR Import",
    };

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwerken van de tekst" },
      { status: 500 }
    );
  }
}


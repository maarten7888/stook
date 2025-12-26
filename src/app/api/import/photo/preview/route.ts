import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { parseOcrText } from "@/server/import/ocr";

const previewSchema = z.object({
  rawText: z.string().min(1, "Tekst is vereist"),
  path: z.string().min(1, "Pad is vereist"),
  jobId: z.string().uuid("Job ID moet een geldige UUID zijn"),
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
        { 
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Je moet ingelogd zijn",
          },
        },
        { status: 401 }
      );
    }

    // Parse en valideer input
    const body = await request.json();
    const result = previewSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.issues[0].message,
          },
        },
        { status: 400 }
      );
    }

    const { rawText, path, jobId } = result.data;

    // Security check: pad moet onder imports/{user_id}/ vallen
    if (!path.includes(`/imports/${user.id}/`)) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Geen toegang tot dit bestand",
          },
        },
        { status: 403 }
      );
    }

    // Valideer job ownership en status
    const adminClient = createAdminClient();
    const { data: job, error: jobError } = await adminClient
      .from('ocr_jobs')
      .select('id, status, user_id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "JOB_NOT_FOUND",
            message: "Job niet gevonden of geen toegang",
          },
        },
        { status: 404 }
      );
    }

    // Job moet minimaal started zijn (kan ook done zijn)
    if (job.status === 'failed') {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "JOB_FAILED",
            message: "Deze import is mislukt. Probeer opnieuw.",
          },
        },
        { status: 400 }
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

    return NextResponse.json({
      ok: true,
      data: preview,
    });
  } catch (error) {
    console.error("Preview error:", error);
    const requestId = crypto.randomUUID();
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Er is een fout opgetreden bij het verwerken van de tekst",
          requestId,
        },
      },
      { status: 500 }
    );
  }
}


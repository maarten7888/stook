import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { performOcr, validateImage } from "@/server/import/ocr";

const ocrSchema = z.object({
  path: z.string().min(1),
  jobId: z.string().uuid().optional(),
});

// Database-based rate limiting (werkt op Vercel met meerdere instances)
const RATE_LIMIT = 10; // Max 10 OCR requests per uur
const RATE_LIMIT_WINDOW = 3600; // 1 uur in seconden

async function checkRateLimit(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    // Roep SQL functie aan voor atomic rate limit check
    const { data, error } = await adminClient.rpc('check_rate_limit', {
      p_user_id: userId,
      p_key: 'ocr_photo',
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_LIMIT_WINDOW,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Bij fout: allow (fail open, maar log)
      return { allowed: true, remaining: RATE_LIMIT };
    }

    const allowed = data === true;
    
    // Haal huidige count op voor remaining calculation
    const { data: limitData } = await adminClient
      .from('rate_limits')
      .select('count')
      .eq('user_id', userId)
      .eq('key', 'ocr_photo')
      .single();

    const currentCount = limitData?.count || 0;
    const remaining = Math.max(0, RATE_LIMIT - currentCount);

    return { allowed, remaining };
  } catch (error) {
    console.error('Rate limit check exception:', error);
    // Fail open bij exception
    return { allowed: true, remaining: RATE_LIMIT };
  }
}

/**
 * POST /api/import/photo/ocr
 * 
 * Voer OCR uit op een geüploade foto.
 * Download de foto uit Storage en stuur naar Google Vision.
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
            message: "Je moet ingelogd zijn om OCR te gebruiken",
          },
        },
        { status: 401 }
      );
    }

    // Rate limiting (database-based)
    const adminClient = createAdminClient();
    const rateLimit = await checkRateLimit(adminClient, user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Je hebt je OCR-limiet bereikt (10 per uur). Probeer het later opnieuw.",
            retryAfter: 3600,
          },
        },
        { status: 429 }
      );
    }

    // Parse en valideer input
    const body = await request.json();
    const result = ocrSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Ongeldig verzoek: pad is vereist",
          },
        },
        { status: 400 }
      );
    }

    const { path, jobId } = result.data;

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

    // Job-based flow: check bestaande job of maak nieuwe aan
    let currentJobId = jobId;
    let jobStatus: string | null = null;

    if (jobId) {
      // Check bestaande job
      const { data: existingJob, error: jobError } = await adminClient
        .from('ocr_jobs')
        .select('id, status, recipe_id')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

      if (jobError || !existingJob) {
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

      jobStatus = existingJob.status;

      if (jobStatus === 'done') {
        // Job al voltooid - return cached result (als rawText opgeslagen) of laat client door naar preview
        // Voor nu: return "already done" en laat client door naar preview met bestaande rawText
        return NextResponse.json({
          ok: true,
          data: {
            jobId: existingJob.id,
            status: 'done',
            alreadyDone: true,
            recipeId: existingJob.recipe_id,
          },
        });
      }

      if (jobStatus === 'started') {
        // Job al bezig - return 409
        return NextResponse.json(
          { 
            ok: false,
            error: {
              code: "JOB_IN_PROGRESS",
              message: "Deze import is al bezig. Probeer opnieuw over een paar seconden.",
            },
          },
          { status: 409 }
        );
      }

      if (jobStatus === 'failed') {
        // Failed job - reset naar started voor retry
        const { error: updateError } = await adminClient
          .from('ocr_jobs')
          .update({ 
            status: 'started',
            error_code: null,
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        if (updateError) {
          console.error('Failed to reset job:', updateError);
        }
      }
    } else {
      // Maak nieuwe job aan
      const { data: newJob, error: createError } = await adminClient
        .from('ocr_jobs')
        .insert({
          user_id: user.id,
          photo_path: path,
          status: 'started',
        })
        .select()
        .single();

      if (createError || !newJob) {
        console.error('Failed to create job:', createError);
        return NextResponse.json(
          { 
            ok: false,
            error: {
              code: "JOB_CREATE_FAILED",
              message: "Kon job niet aanmaken",
            },
          },
          { status: 500 }
        );
      }

      currentJobId = newJob.id;
    }

    // Download bestand uit Storage met admin client (al aangemaakt voor rate limiting)
    const { data: fileData, error: downloadError } = await adminClient
      .storage
      .from("photos")
      .download(path);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "FILE_NOT_FOUND",
            message: "Kon het bestand niet downloaden. Controleer of de upload is gelukt.",
          },
        },
        { status: 404 }
      );
    }

    // Valideer bestand
    const mimeType = fileData.type || "image/jpeg";
    const sizeBytes = fileData.size;
    
    const validation = validateImage(mimeType, sizeBytes);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validation.error || "Ongeldig bestand",
          },
        },
        { status: 400 }
      );
    }

    // Converteer Blob naar Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Voer OCR uit
    let ocrResult;
    try {
      ocrResult = await performOcr(buffer);

      if (!ocrResult.rawText || ocrResult.rawText.trim().length === 0) {
        // Markeer job als failed
        await adminClient
          .from('ocr_jobs')
          .update({
            status: 'failed',
            error_code: 'NO_TEXT_FOUND',
            error_message: 'Geen tekst gevonden in de afbeelding',
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentJobId);

        return NextResponse.json(
          { 
            ok: false,
            error: {
              code: "NO_TEXT_FOUND",
              message: "Geen tekst gevonden in de afbeelding. Probeer een foto met duidelijke, gedrukte tekst.",
            },
          },
          { status: 422 }
        );
      }

      // Markeer job als done
      await adminClient
        .from('ocr_jobs')
        .update({
          status: 'done',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentJobId);

      return NextResponse.json({
        ok: true,
        data: {
          jobId: currentJobId,
          rawText: ocrResult.rawText,
          confidence: ocrResult.confidence,
          remaining: rateLimit.remaining,
        },
      });
    } catch (ocrError) {
      // Markeer job als failed
      const errorMessage = ocrError instanceof Error ? ocrError.message : 'Unknown error';
      await adminClient
        .from('ocr_jobs')
        .update({
          status: 'failed',
          error_code: 'OCR_ERROR',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentJobId);

      // Re-throw voor normale error handling
      throw ocrError;
    }
  } catch (error) {
    console.error("OCR error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as { code?: string })?.code,
    });

    // Check voor specifieke Google Vision errors
    const errorMessage = error instanceof Error ? error.message : "";
    
    const requestId = crypto.randomUUID();
    
    if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("credentials")) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "OCR_SERVICE_ERROR",
            message: "OCR service is niet correct geconfigureerd. Neem contact op met de beheerder.",
            requestId,
          },
        },
        { status: 503 }
      );
    }

    if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: "OCR_QUOTA_EXCEEDED",
            message: "OCR service quota bereikt. Probeer het later opnieuw.",
            requestId,
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Er is een fout opgetreden bij het lezen van de tekst",
          requestId,
        },
      },
      { status: 500 }
    );
  }
}


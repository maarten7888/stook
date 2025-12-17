import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { performOcr, validateImage } from "@/server/import/ocr";

const ocrSchema = z.object({
  path: z.string().min(1),
});

// Simple in-memory rate limiting (in productie: Redis of database)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // Max 10 OCR requests per uur
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 uur in ms

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
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
        { error: "Je moet ingelogd zijn om OCR te gebruiken" },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Je hebt het maximum aantal OCR verzoeken bereikt. Probeer het over een uur opnieuw.",
          retryAfter: 3600,
        },
        { status: 429 }
      );
    }

    // Parse en valideer input
    const body = await request.json();
    const result = ocrSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Ongeldig verzoek: pad is vereist" },
        { status: 400 }
      );
    }

    const { path } = result.data;

    // Security check: pad moet onder imports/{user_id}/ vallen
    if (!path.includes(`/imports/${user.id}/`)) {
      return NextResponse.json(
        { error: "Geen toegang tot dit bestand" },
        { status: 403 }
      );
    }

    // Download bestand uit Storage met admin client
    const adminClient = createAdminClient();
    const { data: fileData, error: downloadError } = await adminClient
      .storage
      .from("photos")
      .download(path);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return NextResponse.json(
        { error: "Kon het bestand niet downloaden. Controleer of de upload is gelukt." },
        { status: 404 }
      );
    }

    // Valideer bestand
    const mimeType = fileData.type || "image/jpeg";
    const sizeBytes = fileData.size;
    
    const validation = validateImage(mimeType, sizeBytes);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Converteer Blob naar Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Voer OCR uit
    const ocrResult = await performOcr(buffer);

    if (!ocrResult.rawText || ocrResult.rawText.trim().length === 0) {
      return NextResponse.json(
        { 
          error: "Geen tekst gevonden in de afbeelding. Probeer een foto met duidelijke, gedrukte tekst.",
          code: "NO_TEXT_FOUND",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      rawText: ocrResult.rawText,
      confidence: ocrResult.confidence,
      remaining: rateLimit.remaining,
    });
  } catch (error) {
    console.error("OCR error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as { code?: string })?.code,
    });

    // Check voor specifieke Google Vision errors
    const errorMessage = error instanceof Error ? error.message : "";
    
    if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("credentials")) {
      return NextResponse.json(
        { error: "OCR service is niet correct geconfigureerd. Neem contact op met de beheerder." },
        { status: 503 }
      );
    }

    if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { error: "OCR service quota bereikt. Probeer het later opnieuw." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het lezen van de tekst" },
      { status: 500 }
    );
  }
}


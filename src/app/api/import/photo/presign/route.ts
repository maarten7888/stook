import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const presignSchema = z.object({
  filename: z.string().min(1), // Used for validation, filename is generated server-side
  contentType: z.string().refine(
    (type) => ["image/jpeg", "image/png", "image/webp"].includes(type),
    { message: "Alleen JPG, PNG of WebP bestanden zijn toegestaan" }
  ),
});

/**
 * POST /api/import/photo/presign
 * 
 * Genereer een signed upload URL voor het uploaden van een foto voor OCR import.
 * De foto wordt opgeslagen in photos/{year}/{month}/imports/{user_id}/{uuid}.{ext}
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om foto's te uploaden" },
        { status: 401 }
      );
    }

    // Parse en valideer input
    const body = await request.json();
    const result = presignSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { contentType } = result.data;

    // Genereer unieke bestandsnaam
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();
    const ext = getExtension(contentType);
    
    const path = `${year}/${month}/imports/${user.id}/${uuid}.${ext}`;

    // Gebruik admin client voor storage operaties
    const adminClient = createAdminClient();
    
    // Genereer signed upload URL
    const { data: signedData, error: signedError } = await adminClient
      .storage
      .from("photos")
      .createSignedUploadUrl(path);

    if (signedError) {
      console.error("Error creating signed upload URL:", {
        message: signedError.message,
        name: signedError.name,
      });
      return NextResponse.json(
        { error: "Kon geen upload URL genereren" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      path,
      signedUrl: signedData.signedUrl,
      token: signedData.token,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[contentType] || "jpg";
}


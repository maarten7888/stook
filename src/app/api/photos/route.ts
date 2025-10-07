import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { photos, recipes, cookSessions } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const uploadPhotoSchema = z.object({
  recipeId: z.string().uuid().optional(),
  cookSessionId: z.string().uuid().optional(),
  type: z.enum(["prep", "final", "session"]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const recipeId = formData.get("recipeId") as string;
    const cookSessionId = formData.get("cookSessionId") as string;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate input
    const { recipeId: validRecipeId, cookSessionId: validCookSessionId, type: validType } = 
      uploadPhotoSchema.parse({ recipeId, cookSessionId, type });

    // Verify access to recipe or session
    if (validRecipeId) {
      const recipe = await db
        .select()
        .from(recipes)
        .where(eq(recipes.id, validRecipeId))
        .limit(1);

      if (recipe.length === 0) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
      }

      if (recipe[0].userId !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    if (validCookSessionId) {
      const session = await db
        .select()
        .from(cookSessions)
        .where(eq(cookSessions.id, validCookSessionId))
        .limit(1);

      if (session.length === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (session[0].userId !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const maxSize = 8 * 1024 * 1024; // 8MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Generate file path
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const fileName = `${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    
    let folderPath = "";
    if (validRecipeId) {
      folderPath = `photos/${year}/${month}/recipes/${validRecipeId}/${fileName}`;
    } else if (validCookSessionId) {
      folderPath = `photos/${year}/${month}/sessions/${validCookSessionId}/${fileName}`;
    } else {
      return NextResponse.json({ error: "Either recipeId or cookSessionId required" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(folderPath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Save photo record to database
    const [newPhoto] = await db
      .insert(photos)
      .values({
        recipeId: validRecipeId || null,
        cookSessionId: validCookSessionId || null,
        path: uploadData.path,
        type: validType,
      })
      .returning();

    // Generate signed URL for immediate use
    const { data: signedUrlData } = await supabase.storage
      .from("photos")
      .createSignedUrl(uploadData.path, 3600); // 1 hour expiry

    return NextResponse.json({
      ...newPhoto,
      signedUrl: signedUrlData?.signedUrl || null,
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

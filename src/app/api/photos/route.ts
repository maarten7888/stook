import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const uploadPhotoSchema = z.object({
  recipeId: z.string().uuid().nullable().optional(),
  cookSessionId: z.string().uuid().nullable().optional(),
  type: z.enum(["prep", "final", "session"]),
});

export async function POST(request: NextRequest) {
  try {
    // Use the same createClient as other API routes
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const recipeId = formData.get("recipeId") as string | null;
    const cookSessionId = formData.get("cookSessionId") as string | null;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Normalize null to undefined for Zod
    const recipeIdValue = recipeId || undefined;
    const cookSessionIdValue = cookSessionId || undefined;

    // Validate input
    const { recipeId: validRecipeId, cookSessionId: validCookSessionId, type: validType } = 
      uploadPhotoSchema.parse({ recipeId: recipeIdValue, cookSessionId: cookSessionIdValue, type });

    // Use Admin Client ONLY for verification (reads work fine)
    const adminSupabase = createAdminClient();

    // Verify access to recipe or session
    if (validRecipeId) {
      const { data: recipe, error: recipeError } = await adminSupabase
        .from('recipes')
        .select('user_id')
        .eq('id', validRecipeId)
        .single();

      if (recipeError || !recipe) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
      }

      if (recipe.user_id !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    if (validCookSessionId) {
      const { data: session, error: sessionError } = await adminSupabase
        .from('cook_sessions')
        .select('user_id')
        .eq('id', validCookSessionId)
        .single();

      if (sessionError || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (session.user_id !== user.id) {
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
      return NextResponse.json({ 
        error: "Upload failed", 
        details: uploadError.message || "Unknown upload error"
      }, { status: 500 });
    }

    // Save photo record to database using REGULAR Supabase Client (not admin)
    // This way RLS policies work correctly with the authenticated user context
    console.log("Attempting to insert photo:", {
      recipe_id: validRecipeId || null,
      cook_session_id: validCookSessionId || null,
      path: uploadData.path,
      type: validType,
    });

    const { data: newPhoto, error: insertError } = await supabase
      .from('photos')
      .insert({
        user_id: user.id,
        recipe_id: validRecipeId || null,
        cook_session_id: validCookSessionId || null,
        path: uploadData.path,
        type: validType,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      console.error("Error code:", insertError.code);
      console.error("Error message:", insertError.message);
      return NextResponse.json({ 
        error: "Failed to save photo record", 
        details: insertError.message || "Unknown database error",
        code: insertError.code
      }, { status: 500 });
    }

    console.log("Photo inserted successfully:", newPhoto);

    // Generate signed URL for immediate use
    const { data: signedUrlData } = await supabase.storage
      .from("photos")
      .createSignedUrl(uploadData.path, 3600); // 1 hour expiry

    return NextResponse.json({
      id: newPhoto.id,
      path: newPhoto.path,
      type: newPhoto.type,
      createdAt: newPhoto.created_at,
      signedUrl: signedUrlData?.signedUrl || null,
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

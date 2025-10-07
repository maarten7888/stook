import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { photos, cookSessions } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify session exists and user has access
    const session = await db
      .select()
      .from(cookSessions)
      .where(eq(cookSessions.id, id))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session[0].userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get session photos
    const sessionPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.cookSessionId, id));

    // Generate signed URLs for each photo
    const photosWithUrls = await Promise.all(
      sessionPhotos.map(async (photo) => {
        const { data: signedUrl } = await supabase.storage
          .from("photos")
          .createSignedUrl(photo.path, 3600); // 1 hour expiry

        return {
          ...photo,
          signedUrl: signedUrl?.signedUrl || null,
        };
      })
    );

    return NextResponse.json(photosWithUrls);
  } catch (error) {
    console.error("Error fetching session photos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

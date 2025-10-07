import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().optional(),
  favoriteMeat: z.string().optional(),
  bbqStyle: z.string().optional(),
  experienceLevel: z.string().optional(),
  favoriteWood: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile.length === 0) {
      // Create profile if it doesn't exist
      const [newProfile] = await db
        .insert(profiles)
        .values({
          id: user.id,
          displayName: user.email?.split("@")[0] || "Gebruiker",
        })
        .returning();
      
      return NextResponse.json(newProfile);
    }

    return NextResponse.json(profile[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updateData = updateProfileSchema.parse(body);

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    let updatedProfile;
    if (existingProfile.length === 0) {
      // Create new profile
      [updatedProfile] = await db
        .insert(profiles)
        .values({
          id: user.id,
          ...updateData,
        })
        .returning();
    } else {
      // Update existing profile
      [updatedProfile] = await db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.id, user.id))
        .returning();
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

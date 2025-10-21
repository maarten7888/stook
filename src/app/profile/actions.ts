"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().min(1, "Weergavenaam is verplicht").max(100),
  favoriteMeat: z.string().max(100).optional(),
  bbqStyle: z.string().max(100).optional(),
  experienceLevel: z.string().max(100).optional(),
  favoriteWood: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      redirect("/login");
    }

    // Parse form data
    const rawData = {
      displayName: formData.get("displayName") as string,
      favoriteMeat: formData.get("favoriteMeat") as string,
      bbqStyle: formData.get("bbqStyle") as string,
      experienceLevel: formData.get("experienceLevel") as string,
      favoriteWood: formData.get("favoriteWood") as string,
      bio: formData.get("bio") as string,
      location: formData.get("location") as string,
      avatarUrl: formData.get("avatarUrl") as string,
    };

    // Validate data
    const validatedData = updateProfileSchema.parse(rawData);

    // Clean up empty strings
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== "")
    );

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (existingProfile.length === 0) {
      // Create new profile
      await db
        .insert(profiles)
        .values({
          id: user.id,
          ...updateData,
        });
    } else {
      // Update existing profile
      await db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.id, user.id));
    }

    // Revalidate the profile page
    revalidatePath("/profile");
    
  } catch (error) {
    console.error("Error updating profile:", error);
    
    if (error instanceof z.ZodError) {
      throw new Error("Validatiefout: " + error.issues.map(e => e.message).join(", "));
    }
    
    throw new Error("Er is een fout opgetreden bij het opslaan van je profiel");
  }
}

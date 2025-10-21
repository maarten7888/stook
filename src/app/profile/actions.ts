"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function updateProfile(formData: FormData) {
  try {
    console.log("Starting profile update...");
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("Auth error or no user:", authError);
      redirect("/login");
    }

    console.log("User authenticated:", user.id);

    // Parse form data - alleen de velden die we nodig hebben
    const displayName = formData.get("displayName") as string;
    const favoriteMeat = formData.get("favoriteMeat") as string;
    const bbqStyle = formData.get("bbqStyle") as string;
    const experienceLevel = formData.get("experienceLevel") as string;
    const favoriteWood = formData.get("favoriteWood") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;

    console.log("Form data parsed:", { displayName, favoriteMeat, bbqStyle, experienceLevel, favoriteWood, bio, location });

    // Eenvoudige validatie
    if (!displayName || displayName.trim().length === 0) {
      throw new Error("Weergavenaam is verplicht");
    }

    // Bereid update data voor - alleen niet-lege velden
    const updateData: Partial<typeof profiles.$inferInsert> = {
      displayName: displayName.trim(),
    };

    if (favoriteMeat && favoriteMeat.trim()) updateData.favoriteMeat = favoriteMeat.trim();
    if (bbqStyle && bbqStyle.trim()) updateData.bbqStyle = bbqStyle.trim();
    if (experienceLevel && experienceLevel.trim()) updateData.experienceLevel = experienceLevel.trim();
    if (favoriteWood && favoriteWood.trim()) updateData.favoriteWood = favoriteWood.trim();
    if (bio && bio.trim()) updateData.bio = bio.trim();
    if (location && location.trim()) updateData.location = location.trim();

    console.log("Update data prepared:", updateData);

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    console.log("Existing profile found:", existingProfile.length > 0);

    if (existingProfile.length === 0) {
      // Create new profile
      console.log("Creating new profile...");
      await db
        .insert(profiles)
        .values({
          id: user.id,
          ...updateData,
        });
    } else {
      // Update existing profile
      console.log("Updating existing profile...");
      await db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.id, user.id));
    }

    console.log("Profile update successful, revalidating...");
    // Revalidate the profile page
    revalidatePath("/profile");
    
    console.log("Profile update completed successfully");
    
  } catch (error) {
    console.error("Error updating profile:", error);
    
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    
    throw new Error("Er is een fout opgetreden bij het opslaan van je profiel");
  }
}

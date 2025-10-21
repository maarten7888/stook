"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  try {
    console.log("Starting profile update with Supabase Admin Client...");
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("Auth error or no user:", authError);
      redirect("/login");
    }

    console.log("User authenticated:", user.id);

    // Parse form data
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
    const updateData: Record<string, string> = {
      display_name: displayName.trim(),
    };

    if (favoriteMeat && favoriteMeat.trim()) updateData.favorite_meat = favoriteMeat.trim();
    if (bbqStyle && bbqStyle.trim()) updateData.bbq_style = bbqStyle.trim();
    if (experienceLevel && experienceLevel.trim()) updateData.experience_level = experienceLevel.trim();
    if (favoriteWood && favoriteWood.trim()) updateData.favorite_wood = favoriteWood.trim();
    if (bio && bio.trim()) updateData.bio = bio.trim();
    if (location && location.trim()) updateData.location = location.trim();

    console.log("Update data prepared:", updateData);

    // Gebruik Supabase Admin Client voor database operaties
    const adminSupabase = createAdminClient();
    
    // Check if profile exists
    console.log("Checking for existing profile...");
    const { data: existingProfile, error: selectError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log("Existing profile:", existingProfile);
    console.log("Select error:", selectError);

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking profile:", selectError);
      throw new Error("Fout bij ophalen profiel");
    }

    if (!existingProfile) {
      // Create new profile
      console.log("Creating new profile with data:", { id: user.id, ...updateData });
      const { data: newProfile, error: insertError } = await adminSupabase
        .from('profiles')
        .insert({
          id: user.id,
          ...updateData,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating profile:", insertError);
        throw new Error("Fout bij aanmaken profiel");
      }
      
      console.log("Profile created:", newProfile);
    } else {
      // Update existing profile
      console.log("Updating existing profile with data:", updateData);
      const { data: updatedProfile, error: updateError } = await adminSupabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw new Error("Fout bij bijwerken profiel");
      }
      
      console.log("Profile updated:", updatedProfile);
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

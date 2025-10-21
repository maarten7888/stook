import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
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

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Gebruik Supabase Admin Client voor database operaties
    const adminSupabase = createAdminClient();
    
    const { data: profile, error: selectError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error fetching profile:", selectError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if (!profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: insertError } = await adminSupabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: user.email?.split("@")[0] || "Gebruiker",
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating profile:", insertError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      
      return NextResponse.json(newProfile);
    }

    return NextResponse.json(profile);
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

    // Gebruik Supabase Admin Client voor database operaties
    const adminSupabase = createAdminClient();

    // Check if profile exists
    const { data: existingProfile, error: selectError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking profile:", selectError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    let updatedProfile;
    if (!existingProfile) {
      // Create new profile
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
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      
      updatedProfile = newProfile;
    } else {
      // Update existing profile
      const { data: updated, error: updateError } = await adminSupabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("Error updating profile:", updateError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      
      updatedProfile = updated;
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

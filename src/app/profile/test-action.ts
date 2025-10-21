"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function testProfileUpdate(formData: FormData) {
  try {
    console.log("Testing profile update...");
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("Auth error or no user:", authError);
      redirect("/login");
    }

    console.log("User authenticated:", user.id);
    console.log("Form data received:", Object.fromEntries(formData.entries()));

    // Revalidate the profile page
    revalidatePath("/profile");
    
    console.log("Test completed successfully");
    
  } catch (error) {
    console.error("Test error:", error);
    throw new Error("Test failed: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

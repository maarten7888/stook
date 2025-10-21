"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...");
    
    // Test 1: Supabase auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("Auth error:", authError);
      return { success: false, error: "Auth failed", details: authError };
    }

    console.log("Auth successful, user:", user.id);

    // Test 2: Database query
    console.log("Testing database query...");
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    console.log("Database query successful, result:", result);

    return { 
      success: true, 
      message: "Database connection successful",
      user: user.id,
      profileExists: result.length > 0
    };
    
  } catch (error) {
    console.error("Database connection test failed:", error);
    return { 
      success: false, 
      error: "Database connection failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

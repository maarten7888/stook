import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const startSessionSchema = z.object({
  recipeId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("POST /api/recipes/[id]/sessions - Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId } = startSessionSchema.parse(body);
    
    console.log("POST /api/recipes/[id]/sessions - Creating session:", { recipeId, userId: user.id });

    // Use Supabase Admin Client for database operations
    const adminSupabase = createAdminClient();

    // Verify recipe exists and user has access
    const { data: recipe, error: recipeError } = await adminSupabase
      .from('recipes')
      .select('id, user_id, visibility, title, description, serves, prep_minutes, cook_minutes, target_internal_temp')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      console.error("POST /api/recipes/[id]/sessions - Error fetching recipe:", recipeError);
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Check if user owns recipe or recipe is public
    if (recipe.user_id !== user.id && recipe.visibility !== "public") {
      console.error("POST /api/recipes/[id]/sessions - Access denied:", {
        recipeUserId: recipe.user_id,
        requestUserId: user.id,
        visibility: recipe.visibility
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create new cook session using Supabase Admin Client
    const { data: newSession, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .insert({
        recipe_id: recipeId,
        user_id: user.id,
        started_at: new Date().toISOString(),
        recipe_snapshot: {
          title: recipe.title,
          description: recipe.description,
          serves: recipe.serves,
          prepMinutes: recipe.prep_minutes,
          cookMinutes: recipe.cook_minutes,
          targetInternalTemp: recipe.target_internal_temp,
        },
      })
      .select()
      .single();

    if (sessionError) {
      console.error("POST /api/recipes/[id]/sessions - Error creating session:", {
        error: sessionError,
        code: sessionError.code,
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint
      });
      return NextResponse.json({ 
        error: "Internal server error", 
        details: sessionError.message 
      }, { status: 500 });
    }

    console.log("POST /api/recipes/[id]/sessions - Session created successfully:", {
      sessionId: newSession.id,
      recipeId: newSession.recipe_id,
      userId: newSession.user_id
    });

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("POST /api/recipes/[id]/sessions - Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

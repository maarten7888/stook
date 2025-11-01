import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Get session first
    const { data: session, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      console.error("Error fetching session:", sessionError);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access: user owns session
    if (session.user_id !== user.id) {
      // Also check if recipe is public
      const { data: recipe, error: recipeError } = await adminSupabase
        .from('recipes')
        .select('visibility')
        .eq('id', session.recipe_id)
        .single();

      if (recipeError || !recipe || recipe.visibility !== "public") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get recipe data
    const { data: recipe, error: recipeError } = await adminSupabase
      .from('recipes')
      .select('id, title, description, visibility, serves, prep_minutes, cook_minutes, target_internal_temp')
      .eq('id', session.recipe_id)
      .single();

    if (recipeError || !recipe) {
      console.error("Error fetching recipe:", recipeError);
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Get profile data
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', session.user_id)
      .single();

    // Profile is optional, so don't fail if it doesn't exist
    const profileData = profileError ? { id: session.user_id, display_name: null } : profile;

    // Transform to match expected format
    return NextResponse.json({
      id: session.id,
      recipeId: session.recipe_id,
      userId: session.user_id,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      notes: session.notes,
      rating: session.rating,
      conclusion: session.conclusion,
      adjustments: session.adjustments,
      recipeSnapshot: session.recipe_snapshot,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        visibility: recipe.visibility,
        serves: recipe.serves,
        prepMinutes: recipe.prep_minutes,
        cookMinutes: recipe.cook_minutes,
        targetInternalTemp: recipe.target_internal_temp,
      },
      user: {
        id: profileData?.id || session.user_id,
        displayName: profileData?.display_name || null,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const adminSupabase = createAdminClient();

    // Verify session exists and user owns it
    const { data: existingSession, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('id, user_id, ended_at')
      .eq('id', id)
      .single();

    if (sessionError || !existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existingSession.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prepare update data
    const updateData: {
      notes?: string;
      rating?: number;
      conclusion?: string;
      adjustments?: unknown;
      ended_at?: string;
    } = {};

    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.conclusion !== undefined) updateData.conclusion = body.conclusion;
    if (body.adjustments !== undefined) updateData.adjustments = body.adjustments;
    if (body.endedAt !== undefined) {
      updateData.ended_at = body.endedAt ? new Date(body.endedAt).toISOString() : undefined;
    }

    // Update session
    const { data: updatedSession, error: updateError } = await adminSupabase
      .from('cook_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating session:", updateError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

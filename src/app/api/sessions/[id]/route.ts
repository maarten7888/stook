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

    // Get session with recipe and user info
    const { data: session, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select(`
        id,
        recipe_id,
        user_id,
        started_at,
        ended_at,
        notes,
        rating,
        conclusion,
        adjustments,
        recipe_snapshot,
        recipes!inner(
          id,
          title,
          description,
          visibility,
          serves,
          prep_minutes,
          cook_minutes,
          target_internal_temp
        ),
        profiles!inner(
          id,
          display_name
        )
      `)
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      console.error("Error fetching session:", sessionError);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access: user owns session or recipe is public
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipe = session.recipes as any;
    if (session.user_id !== user.id && recipe.visibility !== "public") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Transform to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = session.profiles as any;
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
        id: profile.id,
        displayName: profile.display_name,
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

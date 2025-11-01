import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get all sessions for the user with recipe info
    const { data: sessions, error: sessionsError } = await adminSupabase
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
          visibility
        )
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Get counts for temps and photos for each session
    const sessionsWithCounts = await Promise.all(
      (sessions || []).map(async (session) => {
        // Get temp count
        const { count: tempCount } = await adminSupabase
          .from('session_temps')
          .select('*', { count: 'exact', head: true })
          .eq('cook_session_id', session.id);

        // Get photo count
        const { count: photoCount } = await adminSupabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('cook_session_id', session.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipe = session.recipes as any;
        
        return {
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
          },
          tempCount: tempCount || 0,
          photoCount: photoCount || 0,
        };
      })
    );

    return NextResponse.json(sessionsWithCounts);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

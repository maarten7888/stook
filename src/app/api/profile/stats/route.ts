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

    // Get recipe count
    const { count: recipeCount, error: recipeError } = await adminSupabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (recipeError) {
      console.error("Error fetching recipe count:", recipeError);
    }

    // Get session count
    const { count: sessionCount, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (sessionError) {
      console.error("Error fetching session count:", sessionError);
    }

    // Get review count
    const { count: reviewCount, error: reviewError } = await adminSupabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (reviewError) {
      console.error("Error fetching review count:", reviewError);
    }

    return NextResponse.json({
      recipes: recipeCount || 0,
      sessions: sessionCount || 0,
      reviews: reviewCount || 0,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

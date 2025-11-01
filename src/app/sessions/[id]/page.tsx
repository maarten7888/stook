import { redirect } from "next/navigation";
import { getSession, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import SessionDetail from "@/components/session-detail";

async function fetchSession(sessionId: string, userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Get session first
    const { data: session, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Error fetching session:", sessionError);
      return null;
    }

    // Check access: user owns session
    if (session.user_id !== userId) {
      // Also check if recipe is public
      const { data: recipe, error: recipeError } = await adminSupabase
        .from('recipes')
        .select('visibility')
        .eq('id', session.recipe_id)
        .single();

      if (recipeError || !recipe || recipe.visibility !== "public") {
        console.error("Access denied:", { sessionUserId: session.user_id, requestUserId: userId });
        return null;
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
      return null;
    }

    // Get profile data
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', session.user_id)
      .single();

    // Profile is optional
    const profileData = profileError ? { id: session.user_id, display_name: null } : profile;

    // Transform to match expected format
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
        serves: recipe.serves,
        prepMinutes: recipe.prep_minutes,
        cookMinutes: recipe.cook_minutes,
        targetInternalTemp: recipe.target_internal_temp,
      },
      user: {
        id: profileData?.id || session.user_id,
        displayName: profileData?.display_name || null,
      },
    };
  } catch (error) {
    console.error("Error in fetchSession:", error);
    return null;
  }
}

async function fetchSessionTemps(sessionId: string, userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.user_id !== userId) {
      return [];
    }

    // Get temperature readings
    const { data: temps, error: tempsError } = await adminSupabase
      .from('session_temps')
      .select('*')
      .eq('cook_session_id', sessionId)
      .order('recorded_at', { ascending: false });

    if (tempsError) {
      console.error("Error fetching temps:", tempsError);
      return [];
    }

    // Transform to match expected format
    return temps?.map(temp => ({
      id: temp.id,
      cookSessionId: temp.cook_session_id,
      recordedAt: temp.recorded_at,
      grateTemp: temp.grate_temp,
      meatTemp: temp.meat_temp,
      probeName: temp.probe_name,
    })) || [];
  } catch (error) {
    console.error("Error in fetchSessionTemps:", error);
    return [];
  }
}

async function fetchSessionPhotos(sessionId: string, userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await adminSupabase
      .from('cook_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session || session.user_id !== userId) {
      return [];
    }

    // Get session photos
    const { data: sessionPhotos, error: photosError } = await adminSupabase
      .from('photos')
      .select('*')
      .eq('cook_session_id', sessionId);

    if (photosError) {
      console.error("Error fetching photos:", photosError);
      return [];
    }

    // Generate signed URLs for each photo using admin client
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    
    const photosWithUrls = await Promise.all(
      (sessionPhotos || []).map(async (photo) => {
        const { data: signedUrl } = await supabase.storage
          .from("photos")
          .createSignedUrl(photo.path, 3600); // 1 hour expiry

        return {
          id: photo.id,
          signedUrl: signedUrl?.signedUrl || '',
          type: photo.type,
          createdAt: photo.created_at,
        };
      })
    );

    // Filter out photos without signed URLs
    return photosWithUrls.filter(photo => photo.signedUrl !== '');
  } catch (error) {
    console.error("Error in fetchSessionPhotos:", error);
    return [];
  }
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;
  
  const [sessionData, temps, photos] = await Promise.all([
    fetchSession(id, userId),
    fetchSessionTemps(id, userId),
    fetchSessionPhotos(id, userId),
  ]);

  if (!sessionData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold text-ash">Sessie niet gevonden</h1>
        <Card className="bg-coals border-ash">
          <CardContent className="p-6">
            <p className="text-smoke">Deze kooksessie bestaat niet of je hebt geen toegang.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SessionDetail sessionData={sessionData} temps={temps} photos={photos} />;
}

import { redirect } from "next/navigation";
import { getSession, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Thermometer, Star, Camera, Plus } from "lucide-react";
import Link from "next/link";

async function fetchUserSessions(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Get all sessions for the user
    const { data: sessions, error: sessionsError } = await adminSupabase
      .from('cook_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Get counts for temps and photos for each session, and fetch recipe data
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
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

        // Get recipe data (optional, can use snapshot if recipe is deleted)
        const { data: recipe } = await adminSupabase
          .from('recipes')
          .select('id, title, description, visibility')
          .eq('id', session.recipe_id)
          .single();

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
          recipe: recipe ? {
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            visibility: recipe.visibility,
          } : null,
          tempCount: tempCount || 0,
          photoCount: photoCount || 0,
        };
      })
    );

    return sessionsWithCounts;
  } catch (error) {
    console.error("Error in fetchUserSessions:", error);
    return [];
  }
}

export default async function SessionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const sessions = await fetchUserSessions(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-ash">Mijn Sessies</h1>
          <p className="text-smoke mt-2">
            Overzicht van al je BBQ kooksessies
          </p>
        </div>
        <Link href="/recipes">
          <Button className="bg-ember hover:bg-ember/90">
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Sessie
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card className="bg-coals border-ash">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-charcoal rounded-full flex items-center justify-center">
                <Thermometer className="h-8 w-8 text-smoke" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-ash mb-2">Nog geen sessies</h3>
                <p className="text-smoke mb-4">
                  Start je eerste BBQ kooksessie door een recept te selecteren
                </p>
                <Link href="/recipes">
                  <Button className="bg-ember hover:bg-ember/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Sessie
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session: {
            id: string;
            recipeSnapshot?: { title: string };
            recipe?: { title: string } | null;
            endedAt?: string;
            startedAt: string;
            rating?: number;
            tempCount: number;
            photoCount: number;
            notes?: string;
          }) => {
            const isActive = !session.endedAt;
            const duration = session.endedAt 
              ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60))
              : Math.round((Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60));

            const title = session.recipeSnapshot?.title || session.recipe?.title || "Onbekend recept";

            return (
              <Card key={session.id} className="bg-coals border-ash hover:border-ember/50 transition-colors">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-ash">
                        {title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-smoke">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {Math.floor(duration / 60)}u {duration % 60}m
                        </div>
                        <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-ember" : ""}>
                          {isActive ? "Actief" : "Voltooid"}
                        </Badge>
                        {session.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current text-ember" />
                            {session.rating}/5
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.tempCount > 0 && (
                        <div className="flex items-center gap-1 text-sm text-smoke">
                          <Thermometer className="h-4 w-4" />
                          {session.tempCount} metingen
                        </div>
                      )}
                      {session.photoCount > 0 && (
                        <div className="flex items-center gap-1 text-sm text-smoke">
                          <Camera className="h-4 w-4" />
                          {session.photoCount} foto&apos;s
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                    <div className="space-y-2 text-sm text-smoke">
                      <p>
                        <span className="font-medium">Gestart:</span>{" "}
                        {new Date(session.startedAt).toLocaleString('nl-NL')}
                      </p>
                      {session.endedAt && (
                        <p>
                          <span className="font-medium">Beëindigd:</span>{" "}
                          {new Date(session.endedAt).toLocaleString('nl-NL')}
                        </p>
                      )}
                      {session.notes && (
                        <p className="text-ash">
                          <span className="font-medium">Notitie:</span>{" "}
                          {session.notes.length > 100 
                            ? `${session.notes.substring(0, 100)}...` 
                            : session.notes
                          }
                        </p>
                      )}
                    </div>
                    <Link href={`/sessions/${session.id}`}>
                      <Button variant="outline" className="border-ash text-ash hover:bg-ember hover:text-white">
                        Bekijk Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

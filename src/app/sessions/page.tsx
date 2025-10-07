import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Thermometer, Star, Camera, Plus } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

async function fetchUserSessions() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  const res = await fetch(`${baseUrl}/api/sessions`, {
    cache: "no-store",
  });
  
  if (!res.ok) return [];
  return res.json();
}

export default async function SessionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const sessions = await fetchUserSessions();

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
            recipe?: { title: string };
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

            return (
              <Card key={session.id} className="bg-coals border-ash hover:border-ember/50 transition-colors">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-ash">
                        {session.recipeSnapshot?.title || session.recipe?.title}
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

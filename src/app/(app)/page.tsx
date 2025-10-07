import { getSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, BookOpen, Camera, Clock, Star } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  async function fetchFeed() {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;
    const res = await fetch(`${baseUrl}/api/recipes`, { cache: "no-store" });
    if (!res.ok) return { items: [] };
    return res.json();
  }

  const data = await fetchFeed();

  type RecipeListItem = {
    id: string;
    title: string;
    description: string | null;
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-heading font-bold text-ash mb-4">
          Welkom bij Stook
        </h1>
        <p className="text-xl text-smoke mb-8">
          Elke sessie beter — je ultieme BBQ companion
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-ember hover:bg-ember/90">
            <Link href="/recipes/new">
              <ChefHat className="h-4 w-4 mr-2" />
              Nieuw Recept
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-ash text-ash hover:bg-coals">
            <Link href="/import">
              <Camera className="h-4 w-4 mr-2" />
              Importeren
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-coals border-ash">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-smoke">
              Mijn Recepten
            </CardTitle>
            <BookOpen className="h-4 w-4 text-ember" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ash">0</div>
            <p className="text-xs text-smoke">
              +0 deze maand
            </p>
          </CardContent>
        </Card>

        <Card className="bg-coals border-ash">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-smoke">
              Kooksessies
            </CardTitle>
            <Clock className="h-4 w-4 text-ember" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ash">0</div>
            <p className="text-xs text-smoke">
              +0 deze week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-coals border-ash">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-smoke">
              Gemiddelde Rating
            </CardTitle>
            <Star className="h-4 w-4 text-ember" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ash">—</div>
            <p className="text-xs text-smoke">
              Nog geen beoordelingen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-ash">Feed</h2>
        {data.items.length === 0 ? (
          <Card className="bg-coals border-ash">
            <CardContent className="p-6 text-smoke">
              Nog geen recepten. Begin met een nieuw recept of importeer er een.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.slice(0, 6).map((r: RecipeListItem) => (
              <Card key={r.id} className="bg-coals border-ash">
                <CardContent className="p-4">
                  <Link href={`/recipes/${r.id}`} className="block">
                    <h3 className="text-lg font-heading text-ash mb-1">{r.title}</h3>
                    <p className="text-sm text-smoke line-clamp-2">{r.description ?? ""}</p>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-ash">
          Recente Activiteit
        </h2>
        <Card className="bg-coals border-ash">
          <CardContent className="p-6">
            <div className="text-center text-smoke">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-ember/50" />
              <p className="text-lg mb-2">Nog geen activiteit</p>
              <p className="text-sm">
                Begin met het maken van je eerste recept of importeer er een!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
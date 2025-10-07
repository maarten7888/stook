import { getSession } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Camera, Clock, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function RootPage() {
  const session = await getSession();
  
  if (session) {
    // User is logged in, show the app content directly
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
      <div className="min-h-screen bg-charcoal text-ash">
        <div className="container mx-auto px-4 py-8 space-y-8">
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
                  <BookOpen className="h-4 w-4 mr-2" />
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
      </div>
    );
  }

  // Marketing page content for non-authenticated users
  async function fetchPublicRecipes() {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;
    
    try {
      const res = await fetch(`${baseUrl}/api/recipes?visibility=public`, { 
        cache: "no-store"
      });
      if (!res.ok) {
        console.error('API error:', res.status, res.statusText);
        return { items: [] };
      }
      return await res.json();
    } catch (error) {
      console.error('Error fetching public recipes:', error);
      return { items: [] };
    }
  }

  const { items: recipes } = await fetchPublicRecipes();

  return (
    <div className="min-h-screen bg-charcoal text-ash">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-ash mb-6 font-outfit">
            Stook
          </h1>
          <p className="text-xl text-smoke mb-8 max-w-2xl mx-auto">
            Elke sessie beter
          </p>
          <p className="text-lg text-smoke mb-12 max-w-3xl mx-auto">
            Je ultieme BBQ companion. Deel recepten, track je kooksessies en word een betere pitmaster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-ember hover:bg-ember/90 text-white">
              <Link href="/register">Start Gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-ash text-ash hover:bg-coals">
              <Link href="#recipes">Bekijk Recepten</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-ash text-center mb-12 font-outfit">
            Alles wat je nodig hebt voor perfecte BBQ
          </h2>
          <p className="text-lg text-smoke text-center mb-16 max-w-2xl mx-auto">
            Van recepten tot temperatuur tracking
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-coals border-ash">
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 text-ember mx-auto mb-4" />
                <CardTitle className="text-xl text-ash">Recepten</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke">
                  Bewaar en deel je favoriete BBQ recepten. Van klassiekers tot experimenten.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-coals border-ash">
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-ember mx-auto mb-4" />
                <CardTitle className="text-xl text-ash">Kooksessies</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke">
                  Track je kooksessies met temperatuur logs, foto&apos;s en notities.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-coals border-ash">
              <CardHeader className="text-center">
                <Camera className="h-12 w-12 text-ember mx-auto mb-4" />
                <CardTitle className="text-xl text-ash">Importeren</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke">
                  Importeer recepten van je favoriete BBQ websites met één klik.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Public Recipes Section */}
      <section id="recipes" className="py-20 px-4 bg-coals">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-ash text-center mb-12 font-outfit">
            Publieke Recepten
          </h2>
          <p className="text-lg text-smoke text-center mb-16 max-w-2xl mx-auto">
            Ontdek recepten van de community
          </p>
          
          {recipes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe: { id: string; title: string; description?: string; user?: { displayName?: string } }) => (
                <Card key={recipe.id} className="bg-charcoal border-ash hover:border-ember transition-colors">
                  <CardHeader>
                    <CardTitle className="text-xl text-ash font-outfit">
                      {recipe.title}
                    </CardTitle>
                    <p className="text-smoke text-sm">
                      door {recipe.user?.displayName || "Anoniem"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-smoke text-sm mb-4 line-clamp-3">
                      {recipe.description || "Geen beschrijving beschikbaar."}
                    </p>
                    <Button asChild variant="outline" size="sm" className="border-ember text-ember hover:bg-ember hover:text-white">
                      <Link href={`/recipes/${recipe.id}`}>
                        Bekijk Recept
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-smoke text-lg">Geen publieke recepten beschikbaar.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-ash mb-6 font-outfit">
            Klaar om te beginnen?
          </h2>
          <p className="text-lg text-smoke mb-12 max-w-2xl mx-auto">
            Sluit je aan bij de BBQ community en deel je passie voor perfecte vlees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-ember hover:bg-ember/90 text-white">
              <Link href="/register">Registreer Gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-ash text-ash hover:bg-coals">
              <Link href="/login">Al een account? Inloggen</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

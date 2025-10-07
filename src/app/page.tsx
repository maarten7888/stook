import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Camera, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function RootPage() {
  const session = await getSession();
  
  if (session) {
    redirect("/app");
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

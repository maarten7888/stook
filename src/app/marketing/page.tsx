import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, BookOpen, Camera, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function MarketingPage() {
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
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error fetching public recipes:', error);
      return { items: [] };
    }
  }

  const data = await fetchPublicRecipes();

  type RecipeListItem = {
    id: string;
    title: string;
    description: string | null;
    user: {
      displayName: string | null;
    };
  };

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-coals to-charcoal py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-heading font-bold text-ash mb-6">
              Stook
            </h1>
            <p className="text-2xl text-smoke mb-4">
              Elke sessie beter
            </p>
            <p className="text-lg text-smoke/80 mb-8 max-w-2xl mx-auto">
              Je ultieme BBQ companion. Deel recepten, track je kooksessies en word een betere pitmaster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-ember hover:bg-ember/90 text-lg px-8 py-3">
                <Link href="/register">
                  <ChefHat className="h-5 w-5 mr-2" />
                  Start Gratis
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-ash text-ash hover:bg-coals text-lg px-8 py-3">
                <Link href="#recipes">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Bekijk Recepten
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-ash mb-4">
              Alles wat je nodig hebt voor perfecte BBQ
            </h2>
            <p className="text-lg text-smoke">
              Van recepten tot temperatuur tracking
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
      </div>

      {/* Public Recipes Section */}
      <div id="recipes" className="py-16 bg-coals/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-ash mb-4">
              Publieke Recepten
            </h2>
            <p className="text-lg text-smoke">
              Ontdek recepten van de community
            </p>
          </div>

          {data.items.length === 0 ? (
            <Card className="bg-coals border-ash">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-ember/50" />
                <h3 className="text-xl font-heading text-ash mb-2">
                  Nog geen publieke recepten
                </h3>
                <p className="text-smoke mb-6">
                  Word de eerste die een recept deelt!
                </p>
                <Button asChild className="bg-ember hover:bg-ember/90">
                  <Link href="/register">
                    <ChefHat className="h-4 w-4 mr-2" />
                    Registreer om te beginnen
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.slice(0, 6).map((recipe: RecipeListItem) => (
                <Card key={recipe.id} className="bg-coals border-ash hover:border-ember/50 transition-colors">
                  <CardContent className="p-6">
                    <Link href={`/recipes/${recipe.id}`} className="block group">
                      <h3 className="text-lg font-heading text-ash mb-2 group-hover:text-ember transition-colors">
                        {recipe.title}
                      </h3>
                      <p className="text-sm text-smoke mb-3 line-clamp-2">
                        {recipe.description ?? "Geen beschrijving beschikbaar"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-smoke">
                          door {recipe.user.displayName || "Anoniem"}
                        </span>
                        <ArrowRight className="h-4 w-4 text-ember group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {data.items.length > 6 && (
            <div className="text-center mt-8">
              <Button asChild variant="outline" className="border-ash text-ash hover:bg-coals">
                <Link href="/register">
                  Bekijk alle recepten na registratie
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-heading font-bold text-ash mb-4">
            Klaar om te beginnen?
          </h2>
          <p className="text-lg text-smoke mb-8">
            Sluit je aan bij de BBQ community en deel je passie voor perfecte vlees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-ember hover:bg-ember/90 text-lg px-8 py-3">
              <Link href="/register">
                <ChefHat className="h-5 w-5 mr-2" />
                Registreer Gratis
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-ash text-ash hover:bg-coals text-lg px-8 py-3">
              <Link href="/login">
                Al een account? Inloggen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

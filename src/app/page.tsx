import { getSession, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Camera, Thermometer, Clock, ArrowRight, Scan, Link as LinkIcon, Users } from "lucide-react";
import Link from "next/link";
import { HomeFeed } from "@/components/home-feed";
import { UserSuggestions } from "@/components/user-suggestions";
import { RecentActivity } from "@/components/recent-activity";

async function fetchRecentActivity(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Get recent sessions (last 5)
    const { data: recentSessions } = await adminSupabase
      .from('cook_sessions')
      .select('id, recipe_id, started_at, ended_at, recipe_snapshot')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(5);

    // Get recent recipes (last 5)
    const { data: recentRecipes } = await adminSupabase
      .from('recipes')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Combine and sort by date
    const activities: Array<{
      type: 'recipe' | 'session';
      id: string;
      title: string;
      date: string;
      link: string;
      icon: typeof BookOpen | typeof Thermometer;
    }> = [];

    if (recentSessions) {
      recentSessions.forEach(session => {
        const title = (session.recipe_snapshot as { title?: string })?.title || 'Kooksessie';
        activities.push({
          type: 'session',
          id: session.id,
          title,
          date: session.started_at,
          link: `/sessions/${session.id}`,
          icon: Thermometer,
        });
      });
    }

    if (recentRecipes) {
      recentRecipes.forEach(recipe => {
        activities.push({
          type: 'recipe',
          id: recipe.id,
          title: recipe.title,
          date: recipe.created_at,
          link: `/recipes/${recipe.id}`,
          icon: BookOpen,
        });
      });
    }

    // Sort by date (newest first) and take top 5
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return activities.slice(0, 5);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}


export default async function RootPage() {
  const session = await getSession();
  
  if (session) {
    // User is logged in, show the app content with layout
    const userId = session.user.id;

    const [recentActivity] = await Promise.all([
      fetchRecentActivity(userId),
    ]);

    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-ash mb-4">
            Welkom bij Stook
          </h1>
          <p className="text-lg sm:text-xl text-smoke mb-6 sm:mb-8">
            Elke sessie beter — je ultieme BBQ companion
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button asChild size="sm" className="bg-ember hover:bg-ember/90 w-full sm:w-auto">
              <Link href="/recipes/new">
                <BookOpen className="h-4 w-4 mr-2" />
                Nieuw Recept
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-ash text-ash hover:bg-coals w-full sm:w-auto">
              <Link href="/import">
                <Camera className="h-4 w-4 mr-2" />
                Importeren
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed */}
          <div className="lg:col-span-2">
            <HomeFeed />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RecentActivity activities={recentActivity} />
            <UserSuggestions />
          </div>
        </div>
      </div>
    );
  }

  // Marketing page content for non-authenticated users
  const adminSupabase = createAdminClient();
  
  // Fetch public recipes and stats
  const [publicRecipesResult, publicRecipesCountResult] = await Promise.all([
    adminSupabase
      .from('recipes')
      .select('id, title, description, visibility, user_id')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6),
    adminSupabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'public')
  ]);

  const recipes = publicRecipesResult.data || [];
  const totalPublicRecipes = publicRecipesCountResult.count || 0;

  return (
    <>
      {/* Hero Section - Full Screen */}
      <section className="h-screen relative overflow-hidden flex items-center justify-center -mt-16">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/hero-background.webm" type="video/webm" />
          <source src="/videos/Hero stook.MP4" type="video/mp4" />
        </video>
        
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-charcoal/70 z-10"></div>
        
        {/* Content - Centered */}
        <div className="max-w-4xl mx-auto px-4 text-center relative z-20 pt-16">
          <div className="inline-block mb-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-ash mb-4 font-heading drop-shadow-lg">
              Stook
            </h1>
            <div className="h-1 w-24 bg-ember mx-auto rounded-full"></div>
          </div>
          <p className="text-2xl sm:text-3xl text-ash mb-4 font-heading font-semibold drop-shadow-lg">
            Elke sessie beter
          </p>
          <p className="text-lg sm:text-xl text-smoke mb-8 max-w-2xl mx-auto drop-shadow-md">
            Je ultieme BBQ companion. Deel recepten, track je kooksessies en word een betere pitmaster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-ember hover:bg-ember/90 text-white text-base px-8 py-6 shadow-lg">
              <Link href="/register">
                Gratis starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-ash text-ash hover:bg-coals text-base px-8 py-6 bg-charcoal/50 backdrop-blur-sm shadow-lg">
              <Link href="/login">Inloggen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-16 sm:space-y-20">
        {/* Social Proof Section */}
        {totalPublicRecipes > 0 && (
          <section className="py-8 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg text-smoke">
                <span className="text-2xl font-bold text-ember font-heading">{totalPublicRecipes}+</span> publieke recepten beschikbaar
              </p>
              <p className="text-sm text-smoke mt-2">Word onderdeel van de community</p>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section id="features" className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-ash mb-4 font-heading">
              Alles wat je nodig hebt voor perfecte BBQ
            </h2>
            <p className="text-lg text-smoke max-w-2xl mx-auto">
              Van recepten tot temperatuur tracking — alles op één plek
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-coals border-ash hover:border-ember/50 transition-all hover:shadow-lg hover:shadow-ember/10">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-ember" />
                </div>
                <CardTitle className="text-xl text-ash font-heading">Recepten</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke text-sm leading-relaxed">
                  Bewaar en deel je favoriete BBQ recepten. Van klassiekers tot experimenten — alles op één plek.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-coals border-ash hover:border-ember/50 transition-all hover:shadow-lg hover:shadow-ember/10">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Thermometer className="h-8 w-8 text-ember" />
                </div>
                <CardTitle className="text-xl text-ash font-heading">Kooksessies</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke text-sm leading-relaxed">
                  Track elke kooksessie met real-time temperatuur logs, foto&apos;s en notities. Leer van elke sessie.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-coals border-ash hover:border-ember/50 transition-all hover:shadow-lg hover:shadow-ember/10">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scan className="h-8 w-8 text-ember" />
                </div>
                <CardTitle className="text-xl text-ash font-heading">OCR Import</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke text-sm leading-relaxed">
                  Scan recepten van foto&apos;s met AI. Upload een foto en laat Google Vision de tekst voor je uitlezen.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-coals border-ash hover:border-ember/50 transition-all hover:shadow-lg hover:shadow-ember/10">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LinkIcon className="h-8 w-8 text-ember" />
                </div>
                <CardTitle className="text-xl text-ash font-heading">URL Import</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke text-sm leading-relaxed">
                  Importeer recepten van je favoriete BBQ websites met één klik. Ondersteunt BBQNerds, BBQJunkie en meer.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-coals border-ash hover:border-ember/50 transition-all hover:shadow-lg hover:shadow-ember/10">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-ember" />
                </div>
                <CardTitle className="text-xl text-ash font-heading">Social</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke text-sm leading-relaxed">
                  Volg vrienden, deel recepten, geef reviews en bewaar favorieten. Bouw je BBQ community.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-coals border-ash hover:border-ember/50 transition-all hover:shadow-lg hover:shadow-ember/10">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-ember/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-ember" />
                </div>
                <CardTitle className="text-xl text-ash font-heading">Temperatuur Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke text-sm leading-relaxed">
                  Real-time monitoring van rooster- en vleestemperaturen. Log elke meting en analyseer je sessies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 px-4 bg-coals/30 rounded-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-ash mb-4 font-heading">
              Hoe het werkt
            </h2>
            <p className="text-lg text-smoke max-w-2xl mx-auto">
              Start binnen 2 minuten met je eerste recept
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-ember rounded-full flex items-center justify-center mx-auto mb-4 text-charcoal font-bold text-2xl font-heading">
                1
              </div>
              <h3 className="text-xl font-bold text-ash mb-3 font-heading">Registreer gratis</h3>
              <p className="text-smoke text-sm leading-relaxed">
                Maak een account aan en begin direct. Geen creditcard nodig.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-ember rounded-full flex items-center justify-center mx-auto mb-4 text-charcoal font-bold text-2xl font-heading">
                2
              </div>
              <h3 className="text-xl font-bold text-ash mb-3 font-heading">Importeer of maak</h3>
              <p className="text-smoke text-sm leading-relaxed">
                Importeer een recept van een website of foto, of maak je eigen recept aan.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-ember rounded-full flex items-center justify-center mx-auto mb-4 text-charcoal font-bold text-2xl font-heading">
                3
              </div>
              <h3 className="text-xl font-bold text-ash mb-3 font-heading">Start je sessie</h3>
              <p className="text-smoke text-sm leading-relaxed">
                Begin je eerste kooksessie en track de temperatuur in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

        {/* Public Recipes Section */}
        <section id="recipes" className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-ash mb-4 font-heading">
              Publieke Recepten
            </h2>
            <p className="text-lg text-smoke max-w-2xl mx-auto">
              Ontdek recepten van de community en laat je inspireren
            </p>
          </div>
          
          {recipes.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-stretch">
                {recipes.map((recipe: { id: string; title: string; description?: string; user_id?: string }) => (
                  <Card key={recipe.id} className="bg-coals border-ash hover:border-ember/50 transition-all hover:shadow-lg hover:shadow-ember/10 group h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-ash font-heading group-hover:text-ember transition-colors">
                        {recipe.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col">
                      <p className="text-smoke text-sm mb-4 line-clamp-3">
                        {recipe.description || "Geen beschrijving beschikbaar."}
                      </p>
                      <Button asChild variant="outline" size="sm" className="border-ember text-ember hover:bg-ember hover:text-white w-full mt-auto">
                        <Link href={`/recipes/${recipe.id}`}>
                          Bekijk Recept
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center">
                <Button asChild variant="outline" size="lg" className="border-ash text-ash hover:bg-coals">
                  <Link href="/recipes">Bekijk alle recepten</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-6 text-ember/50" />
              <p className="text-smoke text-lg mb-4">Geen publieke recepten beschikbaar.</p>
              <p className="text-smoke text-sm mb-6">
                Registreer je om je eigen recepten te maken en te delen met de community.
              </p>
              <Button asChild size="lg" className="bg-ember hover:bg-ember/90 text-white">
                <Link href="/register">Gratis account aanmaken</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

        {/* Final CTA Section */}
        <section className="py-16 px-4 bg-coals/50 rounded-2xl">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-ash mb-4 font-heading">
            Klaar om te beginnen?
          </h2>
          <p className="text-lg text-smoke mb-8 max-w-2xl mx-auto">
            Sluit je aan bij de community en word een betere pitmaster. Elke sessie beter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-ember hover:bg-ember/90 text-white text-base px-8 py-6">
              <Link href="/register">
                Gratis account aanmaken
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-ash text-ash hover:bg-coals text-base px-8 py-6">
              <Link href="/recipes">Eerst recepten bekijken</Link>
            </Button>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}


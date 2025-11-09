import { getSession, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Camera, Clock, ArrowRight, Star, Thermometer, Heart } from "lucide-react";
import Link from "next/link";

async function fetchUserStats(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Get counts
    const [recipeCountResult, sessionCountResult, avgRatingResult] = await Promise.all([
      adminSupabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      adminSupabase
        .from('cook_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      adminSupabase
        .from('cook_sessions')
        .select('rating')
        .eq('user_id', userId)
        .not('rating', 'is', null),
    ]);

    const recipeCount = recipeCountResult.count || 0;
    const sessionCount = sessionCountResult.count || 0;

    // Calculate average rating
    const ratings = avgRatingResult.data || [];
    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, s) => sum + (s.rating || 0), 0) / ratings.length).toFixed(1)
      : null;

    // Get counts for this month/week
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const [thisMonthRecipes, thisWeekSessions] = await Promise.all([
      adminSupabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', thisMonth.toISOString()),
      adminSupabase
        .from('cook_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('started_at', thisWeek.toISOString()),
    ]);

    return {
      recipes: recipeCount,
      sessions: sessionCount,
      avgRating,
      recipesThisMonth: thisMonthRecipes.count || 0,
      sessionsThisWeek: thisWeekSessions.count || 0,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      recipes: 0,
      sessions: 0,
      avgRating: null,
      recipesThisMonth: 0,
      sessionsThisWeek: 0,
    };
  }
}

async function fetchFavorites(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Get favorites (without JOIN to avoid RLS issues)
    const { data: favorites, error: favoritesError } = await adminSupabase
      .from('recipe_favorites')
      .select('id, created_at, recipe_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6);

    if (favoritesError) {
      console.error("Error fetching favorites:", favoritesError);
      return [];
    }

    if (!favorites || favorites.length === 0) {
      return [];
    }

    // Get recipe IDs
    const recipeIds = favorites.map((fav: { recipe_id: string }) => fav.recipe_id);

    // Fetch recipes separately (same pattern as fetchFeed)
    const { data: recipesData, error: recipesError } = await adminSupabase
      .from('recipes')
      .select('id, title, description')
      .in('id', recipeIds);

    if (recipesError) {
      console.error("Error fetching favorite recipes:", recipesError);
      return [];
    }

    // Create a map for quick lookup
    const recipesMap = new Map(
      (recipesData || []).map((recipe: { id: string; title: string; description: string | null }) => [recipe.id, recipe])
    );

    // Combine favorites with recipe details, preserving order
    const favoriteRecipes = favorites
      .map((fav: { recipe_id: string }) => {
        const recipe = recipesMap.get(fav.recipe_id);
        if (!recipe) return null;
        return {
          id: fav.recipe_id,
          title: recipe.title,
          description: recipe.description,
        };
      })
      .filter((recipe): recipe is { id: string; title: string; description: string | null } => recipe !== null);

    return favoriteRecipes;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}

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

async function fetchFeed(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Get own recipes + public recipes
    const { data: ownRecipes } = await adminSupabase
      .from('recipes')
      .select('id, title, description, visibility, user_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: publicRecipes } = await adminSupabase
      .from('recipes')
      .select('id, title, description, visibility, user_id, created_at')
      .eq('visibility', 'public')
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Combine and sort
    const allRecipes = [...(ownRecipes || []), ...(publicRecipes || [])];
    allRecipes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      items: allRecipes.slice(0, 6).map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
      })),
    };
  } catch (error) {
    console.error("Error fetching feed:", error);
    return { items: [] };
  }
}

export default async function RootPage() {
  const session = await getSession();
  
  if (session) {
    // User is logged in, show the app content with layout
    const userId = session.user.id;

    const [data, stats, favorites, recentActivity] = await Promise.all([
      fetchFeed(userId),
      fetchUserStats(userId),
      fetchFavorites(userId),
      fetchRecentActivity(userId),
    ]);

    type RecipeListItem = {
      id: string;
      title: string;
      description: string | null;
    };

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
              <div className="text-2xl font-bold text-ash">{stats.recipes}</div>
              <p className="text-xs text-smoke">
                +{stats.recipesThisMonth} deze maand
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
              <div className="text-2xl font-bold text-ash">{stats.sessions}</div>
              <p className="text-xs text-smoke">
                +{stats.sessionsThisWeek} deze week
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
              <div className="text-2xl font-bold text-ash">
                {stats.avgRating || '—'}
              </div>
              <p className="text-xs text-smoke">
                {stats.avgRating ? `${stats.avgRating} van 5 sterren` : 'Nog geen beoordelingen'}
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

        {/* Favorites */}
        <div className="space-y-4">
          <h2 className="text-2xl font-heading font-bold text-ash">Mijn Favorieten</h2>
          {favorites.length === 0 ? (
            <Card className="bg-coals border-ash">
              <CardContent className="p-6 text-smoke">
                Nog geen favorieten. Voeg recepten toe aan je favorieten.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((recipe: { id: string; title: string; description: string | null }) => (
                <Card key={recipe.id} className="bg-coals border-ash">
                  <CardContent className="p-4">
                    <Link href={`/recipes/${recipe.id}`} className="block">
                      <div className="flex items-start gap-2 mb-1">
                        <Heart className="h-4 w-4 text-ember flex-shrink-0 mt-1" />
                        <h3 className="text-lg font-heading text-ash flex-1">{recipe.title}</h3>
                      </div>
                      <p className="text-sm text-smoke line-clamp-2">{recipe.description ?? ""}</p>
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
          {recentActivity.length === 0 ? (
            <Card className="bg-coals border-ash">
              <CardContent className="p-6">
                <div className="text-center text-smoke">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-ember/50" />
                  <p className="text-lg mb-2">Nog geen activiteit</p>
                  <p className="text-sm">
                    Begin met het maken van je eerste recept of start een kooksessie!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                const date = new Date(activity.date);
                const timeAgo = getTimeAgo(date);

                return (
                  <Card key={`${activity.type}-${activity.id}`} className="bg-coals border-ash hover:border-ember/50 transition-colors">
                    <CardContent className="p-4">
                      <Link href={activity.link} className="flex items-center gap-4 group">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'recipe' ? 'bg-ember/20' : 'bg-blue-500/20'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            activity.type === 'recipe' ? 'text-ember' : 'text-blue-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-ash font-medium group-hover:text-ember transition-colors truncate">
                            {activity.type === 'recipe' ? 'Recept aangemaakt' : 'Sessie gestart'}
                          </p>
                          <p className="text-smoke text-sm truncate">{activity.title}</p>
                        </div>
                        <div className="flex-shrink-0 text-xs text-smoke">
                          {timeAgo}
                        </div>
                        <ArrowRight className="h-4 w-4 text-smoke group-hover:text-ember transition-colors flex-shrink-0" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Marketing page content for non-authenticated users
  const adminSupabase = createAdminClient();
  const { data: publicRecipes } = await adminSupabase
    .from('recipes')
    .select('id, title, description, visibility, user_id')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(6);

  const recipes = publicRecipes || [];

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-ash mb-4 font-heading">
            Stook
          </h1>
          <p className="text-xl text-smoke mb-6 max-w-2xl mx-auto">
            Elke sessie beter
          </p>
          <p className="text-lg text-smoke mb-8 max-w-3xl mx-auto">
            Je ultieme BBQ companion. Deel recepten, track je kooksessies en word een betere pitmaster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-ember hover:bg-ember/90 text-white">
              <Link href="/recipes">Bekijk Recepten</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-ash text-center mb-8 font-heading">
            Alles wat je nodig hebt voor perfecte BBQ
          </h2>
          <p className="text-lg text-smoke text-center mb-12 max-w-2xl mx-auto">
            Van recepten tot temperatuur tracking
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-coals border-ash hover:border-ember/50 transition-colors">
              <CardHeader className="text-center pb-4">
                <BookOpen className="h-10 w-10 text-ember mx-auto mb-3" />
                <CardTitle className="text-lg text-ash">Recepten</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke text-sm">
                  Bewaar en deel je favoriete BBQ recepten. Van klassiekers tot experimenten.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-coals border-ash hover:border-ember/50 transition-colors">
              <CardHeader className="text-center pb-4">
                <Clock className="h-10 w-10 text-ember mx-auto mb-3" />
                <CardTitle className="text-lg text-ash">Kooksessies</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke text-sm">
                  Track je kooksessies met temperatuur logs, foto&apos;s en notities.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-coals border-ash hover:border-ember/50 transition-colors">
              <CardHeader className="text-center pb-4">
                <Camera className="h-10 w-10 text-ember mx-auto mb-3" />
                <CardTitle className="text-lg text-ash">Importeren</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-smoke text-sm">
                  Importeer recepten van je favoriete BBQ websites met één klik.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Public Recipes Section */}
      <section id="recipes" className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-ash text-center mb-8 font-heading">
            Publieke Recepten
          </h2>
          <p className="text-lg text-smoke text-center mb-12 max-w-2xl mx-auto">
            Ontdek recepten van de community
          </p>
          
          {recipes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe: { id: string; title: string; description?: string; user_id?: string }) => (
                <Card key={recipe.id} className="bg-coals border-ash hover:border-ember/50 transition-colors group">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-ash font-heading group-hover:text-ember transition-colors">
                      {recipe.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-smoke text-sm mb-4 line-clamp-3">
                      {recipe.description || "Geen beschrijving beschikbaar."}
                    </p>
                    <Button asChild variant="outline" size="sm" className="border-ember text-ember hover:bg-ember hover:text-white w-full">
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
              <BookOpen className="h-16 w-16 mx-auto mb-6 text-ember/50" />
              <p className="text-smoke text-lg mb-4">Geen publieke recepten beschikbaar.</p>
              <p className="text-smoke text-sm">
                Registreer je om je eigen recepten te maken en te delen met de community.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Zojuist';
  if (diffMins < 60) return `${diffMins} min geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays < 7) return `${diffDays} dag${diffDays > 1 ? 'en' : ''} geleden`;
  
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

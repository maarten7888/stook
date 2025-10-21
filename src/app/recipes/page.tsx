import { getSession } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Search, Clock, Users, Thermometer, ArrowRight, Star } from "lucide-react";

async function fetchRecipes(visibility?: string, query?: string, userId?: string) {
  try {
    const supabase = createAdminClient();
    
    let dbQuery = supabase
      .from('recipes')
      .select(`
        id,
        title,
        description,
        serves,
        prep_minutes,
        cook_minutes,
        target_internal_temp,
        visibility,
        created_at,
        updated_at,
        user_id,
        profiles(display_name)
      `);

    // Apply visibility filter
    if (visibility === "public") {
      dbQuery = dbQuery.eq('visibility', 'public');
    } else if (visibility === "private") {
      if (!userId) {
        return { items: [] };
      }
      dbQuery = dbQuery.eq('user_id', userId);
    } else if (userId) {
      // "all" - show public recipes + user's own recipes
      dbQuery = dbQuery.or(`visibility.eq.public,user_id.eq.${userId}`);
    } else {
      // No user - only public recipes
      dbQuery = dbQuery.eq('visibility', 'public');
    }

    // Apply search filter
    if (query) {
      dbQuery = dbQuery.ilike('title', `%${query}%`);
    }

    const { data, error } = await dbQuery.order('created_at', { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return { items: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = data?.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      serves: row.serves,
      prepMinutes: row.prep_minutes,
      cookMinutes: row.cook_minutes,
      targetInternalTemp: row.target_internal_temp,
      visibility: row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userId: row.user_id,
      user: {
        displayName: (() => {
          if (!row.profiles) return null;
          if (Array.isArray(row.profiles)) {
            return row.profiles[0]?.display_name || null;
          }
          return row.profiles.display_name || null;
        })(),
      },
    })) || [];

    return { items };
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return { items: [] };
  }
}

export default async function RecipesPage({ 
  searchParams 
}: { 
  searchParams: { 
    query?: string; 
    visibility?: string; 
  } 
}) {
  const session = await getSession();
  const query = searchParams?.query;
  const visibility = searchParams?.visibility;
  const userId = session?.user.id;
  
  const data = await fetchRecipes(visibility, query, userId);

  type RecipeListItem = {
    id: string;
    title: string;
    description: string | null;
    serves?: number;
    prepMinutes?: number;
    cookMinutes?: number;
    targetInternalTemp?: number;
    user?: { displayName?: string };
    tags?: { tagName: string }[];
    reviews?: { rating: number }[];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-ash mb-4">
          {visibility === "public" ? "Publieke Recepten" : 
           visibility === "private" ? "Mijn Recepten" : 
           session ? "Alle Recepten" : "Publieke Recepten"}
        </h1>
        <p className="text-lg text-smoke max-w-2xl mx-auto">
          {visibility === "public" ? "Ontdek geweldige BBQ recepten van de community" :
           visibility === "private" ? "Beheer je eigen BBQ recepten" :
           session ? "Ontdek recepten en beheer je eigen collectie" : "Ontdek geweldige BBQ recepten van de community"}
        </p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <form action="/recipes" className="flex w-full sm:w-96 items-center gap-2">
          {visibility && <input type="hidden" name="visibility" value={visibility} />}
          <Input 
            name="query" 
            placeholder="Zoek recepten..." 
            defaultValue={query ?? ""} 
            className="bg-coals border-ash text-ash placeholder:text-smoke focus:border-ember" 
          />
          <Button type="submit" variant="outline" className="border-ash text-ash hover:bg-coals">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        {session && (
          <Button asChild className="bg-ember hover:bg-ember/90">
            <Link href="/recipes/new">
              <ChefHat className="h-4 w-4 mr-2" />
              Nieuw Recept
            </Link>
          </Button>
        )}
      </div>

      {/* Results */}
      {data.items.length === 0 ? (
        <Card className="bg-coals border-ash">
          <CardContent className="p-12 text-center">
            <ChefHat className="h-16 w-16 mx-auto mb-6 text-ember/50" />
            <CardTitle className="text-xl text-ash mb-4">Geen recepten gevonden</CardTitle>
            <CardDescription className="text-smoke text-lg">
              {session ? "Maak je eerste recept of pas je zoekopdracht aan." : "Er zijn nog geen publieke recepten beschikbaar."}
            </CardDescription>
            {session && (
              <Button asChild className="mt-6 bg-ember hover:bg-ember/90">
                <Link href="/recipes/new">
                  <ChefHat className="h-4 w-4 mr-2" />
                  Maak je eerste recept
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data.items as RecipeListItem[]).map((recipe) => (
            <Card key={recipe.id} className="bg-coals border-ash hover:border-ember/50 transition-all duration-300 group hover:shadow-lg hover:shadow-ember/10">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-ash font-heading group-hover:text-ember transition-colors line-clamp-2">
                    {recipe.title}
                  </CardTitle>
                  {recipe.reviews && recipe.reviews.length > 0 && (
                    <div className="flex items-center gap-1 ml-2">
                      <Star className="h-4 w-4 text-ember fill-ember" />
                      <span className="text-sm text-smoke">
                        {(recipe.reviews.reduce((sum, r) => sum + r.rating, 0) / recipe.reviews.length).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                {recipe.user?.displayName && (
                  <p className="text-smoke text-sm">
                    door {recipe.user.displayName}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <p className="text-smoke text-sm line-clamp-3">
                  {recipe.description || "Geen beschrijving beschikbaar."}
                </p>
                
                {/* Recipe Info */}
                <div className="flex flex-wrap gap-2 text-xs text-smoke">
                  {recipe.serves && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{recipe.serves} porties</span>
                    </div>
                  )}
                  {recipe.prepMinutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{recipe.prepMinutes} min prep</span>
                    </div>
                  )}
                  {recipe.cookMinutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{recipe.cookMinutes} min koken</span>
                    </div>
                  )}
                  {recipe.targetInternalTemp && (
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3" />
                      <span>{recipe.targetInternalTemp}°C</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-ember/20 text-ember border-ember/30 text-xs"
                      >
                        {tag.tagName}
                      </Badge>
                    ))}
                    {recipe.tags.length > 3 && (
                      <Badge variant="secondary" className="bg-ash/20 text-smoke text-xs">
                        +{recipe.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <Button asChild variant="outline" size="sm" className="border-ember text-ember hover:bg-ember hover:text-white w-full group-hover:border-ember transition-colors">
                  <Link href={`/recipes/${recipe.id}`}>
                    Bekijk Recept
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



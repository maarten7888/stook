import { redirect } from "next/navigation";
import { getSession, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { RecipeCard } from "@/components/recipe-card";
import { Heart } from "lucide-react";

async function fetchFavorites(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Get favorite recipes
    const { data: favorites, error: favoritesError } = await adminSupabase
      .from('recipe_favorites')
      .select(`
        id,
        created_at,
        recipes(
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
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favoritesError || !favorites) {
      return [];
    }

    // Get tags for each recipe
    const recipeIds = favorites
      .map((fav) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipe = fav.recipes as any;
        return recipe?.id;
      })
      .filter((id) => id !== undefined);

    let recipesWithTags: Array<{
      id: string;
      title: string;
      description: string | null;
      serves: number | null;
      prepMinutes: number | null;
      cookMinutes: number | null;
      targetInternalTemp: number | null;
      visibility: string;
      createdAt: string;
      updatedAt: string;
      userId: string;
      authorName: string | null;
      authorId: string;
      favoritedAt: string;
      tags?: Array<{ id: string; name: string }>;
    }> = favorites.map((fav) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recipe = fav.recipes as any;
      if (!recipe) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = recipe.profiles as any;

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        serves: recipe.serves,
        prepMinutes: recipe.prep_minutes,
        cookMinutes: recipe.cook_minutes,
        targetInternalTemp: recipe.target_internal_temp,
        visibility: recipe.visibility,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        userId: recipe.user_id,
        authorName: profile?.display_name || null,
        authorId: recipe.user_id,
        favoritedAt: fav.created_at,
        tags: [],
      };
    }).filter((r) => r !== null) as typeof recipesWithTags;

    // Get tags for recipes
    if (recipeIds.length > 0) {
      const { data: recipeTags } = await adminSupabase
        .from('recipe_tags')
        .select('recipe_id, tags(id, name)')
        .in('recipe_id', recipeIds);

      if (recipeTags) {
        const tagsByRecipe = recipeTags.reduce((acc, rt) => {
          const recipeId = rt.recipe_id;
          if (!acc[recipeId]) {
            acc[recipeId] = [];
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tag = rt.tags as any;
          if (tag && tag.id && tag.name) {
            acc[recipeId].push({ id: tag.id, name: tag.name });
          }
          return acc;
        }, {} as Record<string, Array<{ id: string; name: string }>>);

        recipesWithTags = recipesWithTags.map((recipe) => {
          return {
            ...recipe,
            tags: tagsByRecipe[recipe.id] || [],
          };
        });
      }
    }

    return recipesWithTags;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;
  const favorites = await fetchFavorites(userId);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-3">
        <Heart className="h-8 w-8 text-ember fill-ember" />
        <h1 className="text-3xl font-heading font-bold text-ash">
          Mijn Favorieten
        </h1>
      </div>

      {favorites.length === 0 ? (
        <Card className="bg-coals border-ash">
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-6 text-ember/50" />
            <CardTitle className="text-xl text-ash mb-4">Nog geen favorieten</CardTitle>
            <p className="text-smoke text-lg">
              Voeg recepten toe aan je favorieten door op het hartje te klikken bij een recept.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              description={recipe.description || undefined}
              serves={recipe.serves || undefined}
              prepMinutes={recipe.prepMinutes || undefined}
              cookMinutes={recipe.cookMinutes || undefined}
              targetInternalTemp={recipe.targetInternalTemp || undefined}
              visibility={recipe.visibility as "private" | "public"}
              createdAt={recipe.createdAt}
              updatedAt={recipe.updatedAt}
              authorName={recipe.authorName || undefined}
              authorId={recipe.authorId}
              tags={recipe.tags || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}


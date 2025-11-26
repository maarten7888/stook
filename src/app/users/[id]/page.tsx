import { notFound } from "next/navigation";
import { createAdminClient, getSession } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RecipeCard } from "@/components/recipe-card";
import { FollowButton } from "@/components/follow-button";
import { FriendRequestButton } from "@/components/friend-request-button";
import { MapPin, ChefHat, Award } from "lucide-react";
import Link from "next/link";

async function fetchUserProfile(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, display_name, bio, location, avatar_url, bbq_style, experience_level, favorite_meat, favorite_wood, created_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

async function fetchUserStats(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Get recipe count (only public)
    const { count: recipeCount } = await adminSupabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('visibility', 'public');

    // Get session count
    const { count: sessionCount } = await adminSupabase
      .from('cook_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get follower count
    const { count: followerCount } = await adminSupabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // Get following count
    const { count: followingCount } = await adminSupabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Get friends count
    const { count: friendsCount } = await adminSupabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get average rating
    const { data: publicRecipes } = await adminSupabase
      .from('recipes')
      .select('id')
      .eq('user_id', userId)
      .eq('visibility', 'public');

    let avgRating = null;
    if (publicRecipes && publicRecipes.length > 0) {
      const recipeIds = publicRecipes.map(r => r.id);
      const { data: reviews } = await adminSupabase
        .from('reviews')
        .select('rating')
        .in('recipe_id', recipeIds);

      if (reviews && reviews.length > 0) {
        const ratings = reviews.map(r => r.rating).filter(r => r !== null && r !== undefined);
        if (ratings.length > 0) {
          avgRating = (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
        }
      }
    }

    return {
      recipes: recipeCount || 0,
      sessions: sessionCount || 0,
      followers: followerCount || 0,
      following: followingCount || 0,
      friends: friendsCount || 0,
      avgRating: avgRating ? parseFloat(avgRating) : null,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      recipes: 0,
      sessions: 0,
      followers: 0,
      following: 0,
      friends: 0,
      avgRating: null,
    };
  }
}

async function fetchUserRecipes(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    const { data: recipes, error: recipesError } = await adminSupabase
      .from('recipes')
      .select('id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility, created_at, updated_at')
      .eq('user_id', userId)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(12);

    if (recipesError || !recipes) {
      return [];
    }

    // Get tags for each recipe
    const recipeIds = recipes.map(r => r.id);
    let recipesWithTags = recipes;

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

        recipesWithTags = recipes.map(recipe => ({
          ...recipe,
          tags: tagsByRecipe[recipe.id] || [],
        })) as Array<typeof recipes[0] & { tags: Array<{ id: string; name: string }> }>;
      }
    }

    return recipesWithTags as Array<typeof recipes[0] & { tags: Array<{ id: string; name: string }> }>;
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    return [];
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const currentUserId = session?.user.id;

  const [profile, stats, recipesWithTags] = await Promise.all([
    fetchUserProfile(id),
    fetchUserStats(id),
    fetchUserRecipes(id),
  ]);

  if (!profile) {
    notFound();
  }

  const isOwnProfile = currentUserId === id;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Profile Header */}
      <Card className="bg-coals border-ash">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="bg-ember text-white text-2xl">
                {profile.display_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-heading font-bold text-ash">
                  {profile.display_name || "Gebruiker"}
                </h1>
                {!isOwnProfile && session && (
                  <div className="flex gap-2">
                    <FriendRequestButton userId={id} />
                    <FollowButton userId={id} />
                  </div>
                )}
              </div>
              {profile.bio && (
                <p className="text-smoke mb-4">{profile.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-smoke">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.bbq_style && (
                  <div className="flex items-center gap-1">
                    <ChefHat className="h-4 w-4" />
                    <span>{profile.bbq_style}</span>
                  </div>
                )}
                {profile.experience_level && (
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{profile.experience_level}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-coals border-ash">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-ash">{stats.recipes}</div>
            <div className="text-xs text-smoke mt-1">Recepten</div>
          </CardContent>
        </Card>
        <Card className="bg-coals border-ash">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-ash">{stats.sessions}</div>
            <div className="text-xs text-smoke mt-1">Sessies</div>
          </CardContent>
        </Card>
        <Card className="bg-coals border-ash">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-ash">{stats.followers}</div>
            <div className="text-xs text-smoke mt-1">Volgers</div>
          </CardContent>
        </Card>
        <Card className="bg-coals border-ash">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-ash">{stats.following}</div>
            <div className="text-xs text-smoke mt-1">Volgend</div>
          </CardContent>
        </Card>
        <Card className="bg-coals border-ash">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-ash">{stats.friends}</div>
            <div className="text-xs text-smoke mt-1">Vrienden</div>
          </CardContent>
        </Card>
        <Card className="bg-coals border-ash">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-ash">
              {stats.avgRating || '—'}
            </div>
            <div className="text-xs text-smoke mt-1">Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Followers/Following Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-coals border-ash">
          <CardContent className="p-6">
            <h3 className="text-lg font-heading font-bold text-ash mb-4">
              Volgers ({stats.followers})
            </h3>
            <div className="text-smoke text-sm">
              {stats.followers > 0 ? (
                <Link
                  href={`/users/${id}/followers`}
                  className="hover:text-ember transition-colors"
                >
                  Bekijk alle {stats.followers} volger{stats.followers !== 1 ? "s" : ""}
                </Link>
              ) : (
                "Nog geen volgers"
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-coals border-ash">
          <CardContent className="p-6">
            <h3 className="text-lg font-heading font-bold text-ash mb-4">
              Volgend ({stats.following})
            </h3>
            <div className="text-smoke text-sm">
              {stats.following > 0 ? (
                <Link
                  href={`/users/${id}/following`}
                  className="hover:text-ember transition-colors"
                >
                  Bekijk alle {stats.following} gebruiker{stats.following !== 1 ? "s" : ""}
                </Link>
              ) : (
                "Volgt nog niemand"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Public Recipes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-ash">
          Publieke Recepten
        </h2>
        {recipesWithTags.length === 0 ? (
          <Card className="bg-coals border-ash">
            <CardContent className="p-6 text-center text-smoke">
              Deze gebruiker heeft nog geen publieke recepten.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipesWithTags.map((recipe) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const recipeWithTags = recipe as any;
              return (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                  description={recipe.description}
                  serves={recipe.serves}
                  prepMinutes={recipe.prep_minutes}
                  cookMinutes={recipe.cook_minutes}
                  targetInternalTemp={recipe.target_internal_temp}
                  visibility={recipe.visibility as "private" | "public"}
                  createdAt={recipe.created_at}
                  updatedAt={recipe.updated_at}
                  tags={recipeWithTags.tags || []}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


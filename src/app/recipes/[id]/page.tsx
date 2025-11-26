import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient, getSession } from "@/lib/supabase/server";
import { Edit, ArrowLeft, Eye, EyeOff, Clock } from "lucide-react";
import Link from "next/link";
import { PhotoCarousel } from "@/components/photo-carousel";
import { RatingStars } from "@/components/rating-stars";
import { StartSessionButton } from "@/components/start-session-button";
import { FavoriteButton } from "@/components/favorite-button";

async function fetchRecipe(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
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
        profiles(display_name),
        steps(id, order_no, instruction, timer_minutes, target_temp),
        recipe_ingredients(
          amount,
          unit,
          ingredients(name)
        ),
        recipe_tags(
          tags(name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error("Error fetching recipe:", error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      serves: data.serves,
      prepMinutes: data.prep_minutes,
      cookMinutes: data.cook_minutes,
      targetInternalTemp: data.target_internal_temp,
      visibility: data.visibility,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id,
      user: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        displayName: (data.profiles as any)?.display_name || null,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: data.steps?.map((step: any) => ({
        id: step.id,
        orderNo: step.order_no,
        instruction: step.instruction,
        timerMinutes: step.timer_minutes,
        targetTemp: step.target_temp,
      })) || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ingredients: data.recipe_ingredients?.map((ri: any) => ({
        id: ri.id || Math.random().toString(),
        amount: ri.amount,
        unit: ri.unit,
        ingredientName: ri.ingredients?.name || 'Unknown',
      })) || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags: data.recipe_tags?.map((rt: any) => ({
        tagName: rt.tags?.name || 'Unknown',
      })) || [],
    };
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
}

async function fetchPhotos(recipeId: string) {
  try {
    const supabase = await createClient();
    
    // Fetch photos for this recipe
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (photosError) {
      console.error("Error fetching photos:", photosError);
      return [];
    }

    if (!photos || photos.length === 0) {
      return [];
    }

    // Generate signed URLs for each photo
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const { data: signedUrlData } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.path, 3600); // 1 hour expiry

        return {
          id: photo.id,
          url: signedUrlData?.signedUrl || null,
        };
      })
    );

    return photosWithUrls;
  } catch (error) {
    console.error("Error fetching photos:", error);
    return [];
  }
}

async function fetchReviews(recipeId: string, isPublic: boolean) {
  try {
    // Only fetch reviews for public recipes
    if (!isPublic) {
      return [];
    }

    const supabase = await createClient();
    
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles(id, display_name)
      `)
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return [];
    }

    if (!reviews || reviews.length === 0) {
      return [];
    }

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment || '',
      createdAt: review.created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (review.profiles as any)?.id || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userName: (review.profiles as any)?.display_name || 'Review Gebruiker',
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const data = await fetchRecipe(id);
  
  if (!data) {
    redirect("/recipes");
  }

  const isOwner = session?.user.id === data.userId;
  const photos = await fetchPhotos(id);
  const reviews = await fetchReviews(id, data.visibility === 'public');

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Recipe Header - Full Width */}
        <div className="mb-8">
          {/* Back button + Start Session button (mobile: same line) */}
          <div className="mb-6 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="text-smoke hover:text-ash">
              <Link href="/recipes">
                <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Terug naar recepten</span>
              </Link>
            </Button>
            {/* Start Sessie button + Favorite button - Mobile: visible here, Desktop: hidden - Only show if logged in */}
            {session && (
              <div className="lg:hidden flex items-center gap-2">
                <FavoriteButton recipeId={data.id} />
                <StartSessionButton recipeId={data.id} />
              </div>
            )}
          </div>

          <h1 className="text-4xl font-heading font-bold text-ash mb-4">{data.title}</h1>
          
          {data.user?.displayName && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-smoke text-lg">
                door{" "}
                <Link 
                  href={`/users/${data.userId}`}
                  className="hover:text-ember transition-colors"
                >
                  {data.user.displayName}
                </Link>
              </p>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`${data.visibility === 'public' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}
                  >
                    {data.visibility === 'public' ? (
                      <>
                        <Eye className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Publiek</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Privé</span>
                      </>
                    )}
                  </Badge>
                  <Button asChild size="sm" className="bg-ember hover:bg-ember/90">
                    <Link href={`/recipes/${data.id}/edit`}>
                      <Edit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Bewerken</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Photos Carousel - Full Width */}
          {photos && photos.length > 0 && (
            <Card className="bg-coals border-ash mb-8">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Foto&apos;s</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoCarousel photos={photos.map((p) => ({ id: p.id, url: p.url || '' }))} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Two Column Layout: Left (Description, Ingredients, Steps) | Right (Recipe Info, Tags, Reviews) */}
        {/* Mobile: Single column with flex order - Description → Recipe Info → Ingredients → Steps → Reviews → Tags */}
        {/* Desktop: Two columns grid (2/3 left, 1/3 right) */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          {/* Mobile: Items use flex order, Desktop: col-span-2 groups them together */}
          <div className="flex flex-col lg:col-span-2 space-y-8 order-1 lg:order-1">
            {/* Description - Mobile: Order 1 */}
            {data.description && (
              <Card className="bg-coals border-ash order-1">
                <CardHeader>
                  <CardTitle className="text-xl text-ash">Beschrijving</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-smoke text-lg leading-relaxed">{data.description}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Ingredients - Mobile: Order 3 */}
            {data.ingredients && data.ingredients.length > 0 && (
              <Card className="bg-coals border-ash order-3">
                <CardHeader>
                  <CardTitle className="text-xl text-ash">Ingrediënten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.ingredients.map((ingredient) => (
                      <div key={ingredient.id} className="flex justify-between items-center py-3 px-4 bg-charcoal/50 rounded-lg border border-ash/20">
                        <span className="text-ash font-medium">
                          {ingredient.ingredientName}
                        </span>
                        <span className="text-ember font-semibold">
                          {ingredient.amount && ingredient.unit ? `${ingredient.amount} ${ingredient.unit}` : ingredient.amount || 'Naar smaak'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Steps - Mobile: Order 4 */}
            {data.steps && data.steps.length > 0 && (
              <Card className="bg-coals border-ash order-4">
                <CardHeader>
                  <CardTitle className="text-xl text-ash">Bereidingswijze</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.steps.map((step, index) => (
                      <div key={step.id} className="flex gap-4 p-4 bg-charcoal/50 rounded-lg border border-ash/20">
                        <div className="flex-shrink-0 w-8 h-8 bg-ember rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{step.orderNo || index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-ash leading-relaxed">{step.instruction}</p>
                          {step.timerMinutes && (
                            <div className="mt-2 flex items-center gap-1 text-ember text-sm font-medium">
                              <Clock className="h-4 w-4" />
                              <span>{step.timerMinutes} min</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Recipe Info, Tags, Reviews */}
          {/* Mobile: Items use flex order, Desktop: col-span-1 groups them together */}
          <div className="flex flex-col lg:col-span-1 space-y-8 order-2 lg:order-2">
            {/* Start Sessie button + Favorite button - Desktop: above Recipe Info, right aligned - Only show if logged in */}
            {session && (
              <div className="hidden lg:block order-1">
                <div className="flex justify-end gap-2">
                  <FavoriteButton recipeId={data.id} />
                  <StartSessionButton recipeId={data.id} />
                </div>
              </div>
            )}

            {/* Recipe Info Card - Mobile: Order 2 (after Description) */}
            <Card className="bg-coals border-ash order-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-ash">Recept Info</CardTitle>
                  {session && (
                    <div className="lg:hidden">
                      <FavoriteButton recipeId={data.id} size="sm" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-smoke">Porties</span>
                    <span className="text-ember font-semibold">{data.serves || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-smoke">Voorbereiding</span>
                    <span className="text-ember font-semibold">{data.prepMinutes ? `${data.prepMinutes} min` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-smoke">Bereiding</span>
                    <span className="text-ember font-semibold">{data.cookMinutes ? `${data.cookMinutes} min` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-smoke">Doel temperatuur</span>
                    <span className="text-ember font-semibold">{data.targetInternalTemp ? `${data.targetInternalTemp}°C` : '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags - Mobile: Order 6 (after Reviews) */}
            {data.tags && data.tags.length > 0 && (
              <Card className="bg-coals border-ash order-6">
                <CardHeader>
                  <CardTitle className="text-xl text-ash">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-ember/20 text-ember border-ember/30"
                      >
                        {tag.tagName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews - Only for public recipes - Mobile: Order 5 (after Steps) */}
            {data.visibility === 'public' && (
              <Card className="bg-coals border-ash order-5">
                <CardHeader>
                  <CardTitle className="text-xl text-ash">Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            {review.userId ? (
                              <Link 
                                href={`/users/${review.userId}`}
                                className="text-smoke font-medium hover:text-ember transition-colors"
                              >
                                {review.userName}
                              </Link>
                            ) : (
                              <span className="text-smoke font-medium">{review.userName}</span>
                            )}
                            <RatingStars rating={review.rating} size="sm" />
                          </div>
                          {review.comment && (
                            <p className="text-smoke text-sm leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-smoke text-sm">Nog geen reviews</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
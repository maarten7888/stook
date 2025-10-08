import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { headers } from "next/headers";
import { Clock, Users, Thermometer, ChefHat, Star, Calendar } from "lucide-react";

async function fetchRecipe(id: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  const res = await fetch(`${baseUrl}/api/recipes/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const data = await fetchRecipe(params.id);
  
  if (!data) {
    redirect("/recipes");
  }

  // The API already handles access control - if we get data, user has access
  // No need for additional checks here

  type StepItem = { 
    id: string; 
    orderNo: number; 
    instruction: string; 
    timerMinutes?: number; 
    targetTemp?: number; 
  };
  type IngredientItem = { 
    id: string; 
    amount: number | null; 
    unit: string | null; 
    ingredientName: string; 
  };
  type TagItem = { 
    tagId: string; 
    tagName: string; 
  };
  type ReviewItem = { 
    id: string; 
    rating: number; 
    comment: string | null; 
    createdAt: string; 
    user?: { displayName: string | null }; 
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="space-y-6">
        {/* Title and Description */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-ash leading-tight">
            {data.title}
          </h1>
          {data.description && (
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-smoke leading-relaxed">
                {data.description}
              </p>
            </div>
          )}
        </div>

        {/* Recipe Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.serves && (
            <Card className="bg-coals border-ash hover:border-ember/50 transition-colors">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-ember mx-auto mb-2" />
                <div className="text-3xl font-bold text-ember">{data.serves}</div>
                <div className="text-sm text-smoke font-medium">Personen</div>
              </CardContent>
            </Card>
          )}
          {data.prepMinutes && (
            <Card className="bg-coals border-ash hover:border-ember/50 transition-colors">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-ember mx-auto mb-2" />
                <div className="text-3xl font-bold text-ember">{data.prepMinutes}</div>
                <div className="text-sm text-smoke font-medium">Min. voorbereiding</div>
              </CardContent>
            </Card>
          )}
          {data.cookMinutes && (
            <Card className="bg-coals border-ash hover:border-ember/50 transition-colors">
              <CardContent className="p-6 text-center">
                <ChefHat className="h-8 w-8 text-ember mx-auto mb-2" />
                <div className="text-3xl font-bold text-ember">{data.cookMinutes}</div>
                <div className="text-sm text-smoke font-medium">Min. kooktijd</div>
              </CardContent>
            </Card>
          )}
          {data.targetInternalTemp && (
            <Card className="bg-coals border-ash hover:border-ember/50 transition-colors">
              <CardContent className="p-6 text-center">
                <Thermometer className="h-8 w-8 text-ember mx-auto mb-2" />
                <div className="text-3xl font-bold text-ember">{data.targetInternalTemp}°C</div>
                <div className="text-sm text-smoke font-medium">Kerntemperatuur</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Ingredients */}
        <div className="lg:col-span-1">
          <Card className="bg-coals border-ash sticky top-8">
            <CardHeader>
              <CardTitle className="text-xl text-ash flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-ember" />
                Ingrediënten
              </CardTitle>
              <CardDescription className="text-smoke">
                Voor {data.serves || '?'} personen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.ingredients?.length ? (
                (data.ingredients as IngredientItem[]).map((ri) => (
                  <div key={ri.id} className="flex justify-between items-center py-3 px-4 bg-charcoal/50 rounded-lg border border-ash/20">
                    <span className="text-ash font-medium">{ri.ingredientName}</span>
                    <span className="text-ember font-bold text-lg">
                      {ri.amount ? `${ri.amount}${ri.unit ?? ""}` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-smoke">
                  <ChefHat className="h-12 w-12 mx-auto mb-4 text-ash/30" />
                  <p>Nog geen ingrediënten toegevoegd</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Steps and Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cooking Steps */}
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-xl text-ash flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-ember" />
                Bereidingswijze
              </CardTitle>
              <CardDescription className="text-smoke">
                Stap-voor-stap instructies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.steps?.length ? (
                (data.steps as StepItem[]).map((s) => (
                  <div key={s.id} className="flex gap-4 p-4 bg-charcoal/30 rounded-lg border border-ash/20">
                    <div className="flex-shrink-0 w-10 h-10 bg-ember text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {s.orderNo}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-ash leading-relaxed">{s.instruction}</p>
                      {(s.timerMinutes || s.targetTemp) && (
                        <div className="flex gap-4 text-sm text-smoke">
                          {s.timerMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {s.timerMinutes} min
                            </span>
                          )}
                          {s.targetTemp && (
                            <span className="flex items-center gap-1">
                              <Thermometer className="h-4 w-4" />
                              {s.targetTemp}°C
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-smoke">
                  <ChefHat className="h-16 w-16 mx-auto mb-4 text-ash/30" />
                  <p className="text-lg">Nog geen stappen toegevoegd</p>
                  <p className="text-sm">De bereidingswijze wordt binnenkort toegevoegd</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {data.tags?.length > 0 && (
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Tags</CardTitle>
                <CardDescription className="text-smoke">
                  Categorieën voor dit recept
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(data.tags as TagItem[]).map((tag) => (
                    <Badge 
                      key={tag.tagId} 
                      variant="secondary" 
                      className="bg-ember/20 text-ember border-ember/30 hover:bg-ember/30 transition-colors"
                    >
                      {tag.tagName}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-xl text-ash flex items-center gap-2">
                <Star className="h-5 w-5 text-ember" />
                Reviews
                {data.reviews?.length > 0 && (
                  <span className="text-sm text-smoke font-normal">
                    ({data.reviews.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-smoke">
                Wat anderen vinden van dit recept
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.reviews?.length ? (
                (data.reviews as ReviewItem[]).map((review) => (
                  <div key={review.id} className="p-4 bg-charcoal/30 rounded-lg border border-ash/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-ember fill-ember' : 'text-ash/30'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-smoke text-sm">
                          {review.user?.displayName || 'Anoniem'}
                        </span>
                      </div>
                      <span className="text-smoke text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.createdAt).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-ash leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-smoke">
                  <Star className="h-16 w-16 mx-auto mb-4 text-ash/30" />
                  <p className="text-lg">Nog geen reviews</p>
                  <p className="text-sm">Wees de eerste om dit recept te beoordelen!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



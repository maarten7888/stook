import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { headers } from "next/headers";
import { Clock, Thermometer, ChefHat, Star } from "lucide-react";

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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-ash leading-tight">
          {data.title}
        </h1>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description Section */}
          {data.description && (
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Beschrijving</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-smoke leading-relaxed">{data.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Ingredients Section */}
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-xl text-ash">Ingrediënten</CardTitle>
            </CardHeader>
            <CardContent>
              {data.ingredients?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(data.ingredients as IngredientItem[]).map((ri) => (
                    <div key={ri.id} className="flex justify-between items-center py-3 px-4 bg-charcoal/50 rounded-lg border border-ash/20">
                      <span className="text-ash font-medium">
                        {ri.ingredientName || 'Onbekend ingrediënt'}
                      </span>
                      <span className="text-ember font-bold text-lg">
                        {ri.amount ? `${ri.amount}${ri.unit ?? ""}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-smoke">
                  <ChefHat className="h-12 w-12 mx-auto mb-4 text-ash/30" />
                  <p>Nog geen ingrediënten toegevoegd</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cooking Steps */}
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-xl text-ash">Bereidingswijze</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.steps?.length ? (
                (data.steps as StepItem[]).map((s) => (
                  <div key={s.id} className="flex gap-4">
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
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Recipe Info */}
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-xl text-ash">Recept Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.serves && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-smoke">Porties:</span>
                  <span className="text-ash font-medium">{data.serves}</span>
                </div>
              )}
              {data.prepMinutes && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-smoke">Voorbereiding:</span>
                  <span className="text-ash font-medium">{data.prepMinutes} min</span>
                </div>
              )}
              {data.cookMinutes && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-smoke">Bereiding:</span>
                  <span className="text-ash font-medium">{data.cookMinutes} min</span>
                </div>
              )}
              {data.targetInternalTemp && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-smoke">Doel temperatuur:</span>
                  <span className="text-ember font-bold">{data.targetInternalTemp}°C</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {data.tags?.length > 0 && (
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Tags</CardTitle>
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
              <CardTitle className="text-xl text-ash">Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.reviews?.length ? (
                (data.reviews as ReviewItem[]).map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-smoke text-sm">
                        {review.user?.displayName || 'Anoniem'}
                      </span>
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
                    </div>
                    {review.comment && (
                      <p className="text-ash text-sm leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-smoke">
                  <Star className="h-12 w-12 mx-auto mb-4 text-ash/30" />
                  <p className="text-sm">Nog geen reviews</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



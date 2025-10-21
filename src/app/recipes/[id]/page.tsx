import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient, getSession } from "@/lib/supabase/server";
import { Clock, Thermometer, ChefHat, Star, Edit, ArrowLeft, Users, Calendar, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

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

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const data = await fetchRecipe(params.id);
  
  if (!data) {
    redirect("/recipes");
  }

  const isOwner = session?.user.id === data.userId;
  const totalTime = (data.prepMinutes || 0) + (data.cookMinutes || 0);

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <div className="bg-coals border-b border-ash/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm" className="text-smoke hover:text-ash">
                <Link href="/recipes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Terug naar recepten
                </Link>
              </Button>
            </div>
            
            {isOwner && (
              <div className="flex items-center gap-3">
                <Badge 
                  variant="secondary" 
                  className={`${data.visibility === 'public' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}
                >
                  {data.visibility === 'public' ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Publiek
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Privé
                    </>
                  )}
                </Badge>
                <Button asChild size="sm" className="bg-ember hover:bg-ember/90">
                  <Link href={`/recipes/${data.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Bewerken
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Recipe Header - Single Column Layout */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-ash mb-4">{data.title}</h1>
          
          {data.user?.displayName && (
            <p className="text-smoke text-lg mb-4">
              door {data.user.displayName}
            </p>
          )}
          
          {/* Recipe Stats - Horizontal Layout */}
          <Card className="bg-coals border-ash mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {data.serves && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ash">{data.serves}</p>
                    <p className="text-sm text-smoke">porties</p>
                  </div>
                )}
                {data.prepMinutes && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ash">{data.prepMinutes}</p>
                    <p className="text-sm text-smoke">min prep</p>
                  </div>
                )}
                {data.cookMinutes && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ash">{data.cookMinutes}</p>
                    <p className="text-sm text-smoke">min koken</p>
                  </div>
                )}
                {data.targetInternalTemp && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ash">{data.targetInternalTemp}°</p>
                    <p className="text-sm text-smoke">doel temperatuur</p>
                  </div>
                )}
              </div>
              
              {totalTime > 0 && (
                <div className="mt-6 pt-6 border-t border-ash/20 text-center">
                  <p className="text-smoke">
                    <span className="font-semibold text-ash">Totale tijd:</span> {totalTime} minuten
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Single Column Layout for Description, Ingredients and Steps */}
        <div className="space-y-8">
          {/* Description */}
          {data.description && (
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Beschrijving</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-smoke text-lg leading-relaxed">{data.description}</p>
              </CardContent>
            </Card>
          )}
          {/* Ingredients */}
          {data.ingredients && data.ingredients.length > 0 && (
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Ingrediënten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.ingredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex justify-between items-center py-3 px-4 bg-charcoal/50 rounded-lg border border-ash/20">
                      <span className="text-ash font-medium">
                        {ingredient.ingredientName}
                      </span>
                      <span className="text-smoke font-semibold">
                        {ingredient.amount && ingredient.unit ? `${ingredient.amount} ${ingredient.unit}` : ingredient.amount || 'Naar smaak'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps */}
          {data.steps && data.steps.length > 0 && (
            <Card className="bg-coals border-ash">
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
                          <div className="mt-2 text-sm text-smoke">
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

          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <Card className="bg-coals border-ash">
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

          {/* Meta Info */}
          <Card className="bg-coals border-ash">
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-sm text-smoke">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Aangemaakt: {new Date(data.createdAt).toLocaleDateString('nl-NL')}</span>
                  </div>
                  {data.updatedAt !== data.createdAt && (
                    <div className="flex items-center gap-1">
                      <Edit className="h-4 w-4" />
                      <span>Bijgewerkt: {new Date(data.updatedAt).toLocaleDateString('nl-NL')}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {data.visibility === 'public' ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Publiek recept</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Privé recept</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
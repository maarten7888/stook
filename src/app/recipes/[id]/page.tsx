import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { Clock, Thermometer, ChefHat, Star } from "lucide-react";

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
  const data = await fetchRecipe(params.id);
  
  if (!data) {
    redirect("/recipes");
  }

  // The RLS policies already handle access control - if we get data, user has access
  // No need for additional checks here

  type StepItem = { 
    id: string; 
    orderNo: number; 
    instruction: string; 
    timerMinutes: number | null; 
    targetTemp: number | null; 
  };

  type IngredientItem = { 
    id: string; 
    amount: number | null; 
    unit: string | null; 
    ingredientName: string; 
  };

  type TagItem = { 
    tagName: string; 
  };

  return (
    <div className="min-h-screen bg-charcoal text-ash">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="h-6 w-6 text-ember" />
            <h1 className="text-3xl font-heading font-bold text-ash">{data.title}</h1>
          </div>
          
          {data.user?.displayName && (
            <p className="text-smoke text-lg mb-4">
              door {data.user.displayName}
            </p>
          )}
          
          {data.description && (
            <p className="text-smoke text-lg leading-relaxed">{data.description}</p>
          )}
        </div>

        {/* Recipe Info */}
        <Card className="bg-coals border-ash mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-ash">Recept Informatie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.serves && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-ember/20 rounded-full flex items-center justify-center">
                    <span className="text-ember text-sm font-bold">{data.serves}</span>
                  </div>
                  <span className="text-smoke">porties</span>
                </div>
              )}
              {data.prepMinutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-ember" />
                  <span className="text-smoke">{data.prepMinutes} min prep</span>
                </div>
              )}
              {data.cookMinutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-ember" />
                  <span className="text-smoke">{data.cookMinutes} min koken</span>
                </div>
              )}
              {data.targetInternalTemp && (
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-ember" />
                  <span className="text-smoke">{data.targetInternalTemp}°C</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        {data.ingredients && data.ingredients.length > 0 && (
          <Card className="bg-coals border-ash mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-ash">Ingrediënten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(data.ingredients as IngredientItem[]).map((ri) => (
                  <div key={ri.id} className="flex justify-between items-center py-3 px-4 bg-charcoal/50 rounded-lg border border-ash/20">
                    <span className="text-ash font-medium">
                      {ri.ingredientName || 'Onbekend ingrediënt'}
                    </span>
                    <span className="text-smoke">
                      {ri.amount && ri.unit ? `${ri.amount} ${ri.unit}` : ri.amount || 'Naar smaak'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        {data.steps && data.steps.length > 0 && (
          <Card className="bg-coals border-ash mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-ash">Bereidingswijze</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data.steps as StepItem[]).map((step, index) => (
                  <div key={step.id} className="flex gap-4 p-4 bg-charcoal/50 rounded-lg border border-ash/20">
                    <div className="flex-shrink-0 w-8 h-8 bg-ember rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{step.orderNo || index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-ash leading-relaxed">{step.instruction}</p>
                      {(step.timerMinutes || step.targetTemp) && (
                        <div className="flex gap-4 mt-2 text-sm text-smoke">
                          {step.timerMinutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{step.timerMinutes} min</span>
                            </div>
                          )}
                          {step.targetTemp && (
                            <div className="flex items-center gap-1">
                              <Thermometer className="h-3 w-3" />
                              <span>{step.targetTemp}°C</span>
                            </div>
                          )}
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
                {(data.tags as TagItem[]).map((tag, index) => (
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
      </div>
    </div>
  );
}
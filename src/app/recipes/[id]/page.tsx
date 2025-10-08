import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { headers } from "next/headers";

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

  type StepItem = { id: string; orderNo: number; instruction: string };
  type IngredientItem = { id: string; amount: string | null; unit: string | null; ingredientName: string };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold text-ash">{data.title}</h1>
        {data.description && (
          <p className="text-lg text-smoke">{data.description}</p>
        )}
      </div>

      {/* Recipe Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.serves && (
          <Card className="bg-coals border-ash">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-ember">{data.serves}</div>
              <div className="text-sm text-smoke">Personen</div>
            </CardContent>
          </Card>
        )}
        {data.prepMinutes && (
          <Card className="bg-coals border-ash">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-ember">{data.prepMinutes}</div>
              <div className="text-sm text-smoke">Min. voorbereiding</div>
            </CardContent>
          </Card>
        )}
        {data.cookMinutes && (
          <Card className="bg-coals border-ash">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-ember">{data.cookMinutes}</div>
              <div className="text-sm text-smoke">Min. kooktijd</div>
            </CardContent>
          </Card>
        )}
        {data.targetInternalTemp && (
          <Card className="bg-coals border-ash">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-ember">{data.targetInternalTemp}°C</div>
              <div className="text-sm text-smoke">Kerntemperatuur</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Steps */}
        <Card className="bg-coals border-ash">
          <CardHeader>
            <CardTitle className="text-ash">Bereidingswijze</CardTitle>
            <CardDescription className="text-smoke">Volgorde en instructies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.steps?.length ? (
              (data.steps as StepItem[]).map((s) => (
                <div key={s.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-ember text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {s.orderNo}
                  </div>
                  <div className="text-ash">{s.instruction}</div>
                </div>
              ))
            ) : (
              <div className="text-smoke">Nog geen stappen toegevoegd</div>
            )}
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card className="bg-coals border-ash">
          <CardHeader>
            <CardTitle className="text-ash">Ingrediënten</CardTitle>
            <CardDescription className="text-smoke">Benodigde ingrediënten</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.ingredients?.length ? (
              (data.ingredients as IngredientItem[]).map((ri) => (
                <div key={ri.id} className="flex justify-between items-center py-2 border-b border-ash/20 last:border-b-0">
                  <span className="text-ash">{ri.ingredientName}</span>
                  <span className="text-smoke font-medium">
                    {ri.amount ? `${ri.amount}${ri.unit ?? ""}` : ""}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-smoke">Nog geen ingrediënten toegevoegd</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



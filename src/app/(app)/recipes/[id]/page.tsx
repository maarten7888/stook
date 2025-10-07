import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

async function fetchRecipe(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/recipes/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await fetchRecipe(params.id);
  if (!data) {
    redirect("/recipes");
  }

  type StepItem = { id: string; orderNo: number; instruction: string };
  type IngredientItem = { id: string; amount: string | null; unit: string | null; ingredientName: string };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-ash">{data.title}</h1>
        {data.description && (
          <p className="text-smoke mt-2">{data.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-coals border-ash md:col-span-2">
          <CardHeader>
            <CardTitle className="text-ash">Stappen</CardTitle>
            <CardDescription className="text-smoke">Volgorde en timers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.steps?.length ? (
              (data.steps as StepItem[]).map((s) => (
                <div key={s.id} className="text-ash">
                  <span className="text-smoke mr-2">{s.orderNo}.</span>
                  {s.instruction}
                </div>
              ))
            ) : (
              <div className="text-smoke">Nog geen stappen</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-coals border-ash">
          <CardHeader>
            <CardTitle className="text-ash">Ingrediënten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.ingredients?.length ? (
              (data.ingredients as IngredientItem[]).map((ri) => (
                <div key={ri.id} className="text-ash">
                  {ri.amount ? `${ri.amount}${ri.unit ?? ""} ` : ""}
                  {ri.ingredientName}
                </div>
              ))
            ) : (
              <div className="text-smoke">Nog geen ingrediënten</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



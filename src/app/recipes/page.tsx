import { getSession } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChefHat, Search } from "lucide-react";
import { headers } from "next/headers";

async function fetchRecipes(params?: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  const res = await fetch(`${baseUrl}/api/recipes${params || ""}`, {
    cache: "no-store",
  });
  if (!res.ok) return { items: [] };
  return res.json();
}

export default async function RecipesPage({ searchParams }: { searchParams: { query?: string } }) {
  const session = await getSession();
  const query = searchParams?.query;
  
  // For non-authenticated users, only show public recipes
  // For authenticated users, show all accessible recipes (public + own)
  const apiParams = session ? "" : "?visibility=public";
  const searchParam = query ? `&query=${encodeURIComponent(query)}` : "";
  const fullParams = session ? (query ? `?query=${encodeURIComponent(query)}` : "") : apiParams + searchParam;
  
  const data = await fetchRecipes(fullParams);

  type RecipeListItem = {
    id: string;
    title: string;
    description: string | null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-ash">
          {session ? "Recepten" : "Publieke Recepten"}
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form action="/recipes" className="flex w-full sm:w-80 items-center gap-2">
            <Input name="query" placeholder="Zoek op titel" defaultValue={query ?? ""} className="bg-charcoal border-ash text-ash" />
            <Button type="submit" variant="outline" className="border-ash text-ash">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          {session && (
            <Button asChild className="bg-ember hover:bg-ember/90">
              <Link href="/recipes/new">
                <ChefHat className="h-4 w-4 mr-2" />
                Nieuw
              </Link>
            </Button>
          )}
        </div>
      </div>

      {data.items.length === 0 ? (
        <Card className="bg-coals border-ash">
          <CardHeader>
            <CardTitle className="text-ash">Geen recepten gevonden</CardTitle>
            <CardDescription className="text-smoke">
              {session ? "Maak je eerste recept of pas je zoekopdracht aan." : "Er zijn nog geen publieke recepten beschikbaar."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data.items as RecipeListItem[]).map((r) => (
            <Card key={r.id} className="bg-coals border-ash hover:border-ember transition-colors">
              <CardContent className="p-4">
                <Link href={`/recipes/${r.id}`} className="block">
                  <h3 className="text-lg font-heading text-ash mb-1">{r.title}</h3>
                  <p className="text-sm text-smoke line-clamp-2">{r.description ?? ""}</p>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



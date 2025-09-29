import { getSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, BookOpen, Camera, Clock, Star } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-heading font-bold text-ash mb-4">
          Welkom bij Stook
        </h1>
        <p className="text-xl text-smoke mb-8">
          Elke sessie beter — je ultieme BBQ companion
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-ember hover:bg-ember/90">
            <Link href="/recipes/new">
              <ChefHat className="h-4 w-4 mr-2" />
              Nieuw Recept
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-ash text-ash hover:bg-coals">
            <Link href="/import">
              <Camera className="h-4 w-4 mr-2" />
              Importeren
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-coals border-ash">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-smoke">
              Mijn Recepten
            </CardTitle>
            <BookOpen className="h-4 w-4 text-ember" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ash">0</div>
            <p className="text-xs text-smoke">
              +0 deze maand
            </p>
          </CardContent>
        </Card>

        <Card className="bg-coals border-ash">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-smoke">
              Kooksessies
            </CardTitle>
            <Clock className="h-4 w-4 text-ember" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ash">0</div>
            <p className="text-xs text-smoke">
              +0 deze week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-coals border-ash">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-smoke">
              Gemiddelde Rating
            </CardTitle>
            <Star className="h-4 w-4 text-ember" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ash">—</div>
            <p className="text-xs text-smoke">
              Nog geen beoordelingen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-ash">
          Recente Activiteit
        </h2>
        <Card className="bg-coals border-ash">
          <CardContent className="p-6">
            <div className="text-center text-smoke">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-ember/50" />
              <p className="text-lg mb-2">Nog geen activiteit</p>
              <p className="text-sm">
                Begin met het maken van je eerste recept of importeer er een!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
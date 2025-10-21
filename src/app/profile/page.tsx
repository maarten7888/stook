import { redirect } from "next/navigation";
import { getSession, getUser } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  ChefHat, 
  Clock, 
  Star, 
  TrendingUp,
  Calendar,
  Award,
  Save
} from "lucide-react";
import { headers } from "next/headers";
import { updateProfile } from "./actions";

async function fetchUserProfile() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  const res = await fetch(`${baseUrl}/api/profile`, {
    cache: "no-store",
  });
  
  if (!res.ok) return null;
  return res.json();
}

async function fetchUserStats() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  const res = await fetch(`${baseUrl}/api/profile/stats`, {
    cache: "no-store",
  });
  
  if (!res.ok) return { recipes: 0, sessions: 0, reviews: 0 };
  return res.json();
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUser();
  const profile = await fetchUserProfile();
  const stats = await fetchUserStats();

  return (
    <form action={updateProfile} className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-ash">Profiel</h1>
          <p className="text-smoke mt-1">Beheer je account en bekijk je statistieken</p>
        </div>
        <Button type="submit" className="bg-ember hover:bg-ember/90 flex items-center gap-2">
          <Save className="h-4 w-4" />
          Profiel opslaan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash flex items-center gap-2">
                <User className="h-5 w-5" />
                Persoonlijke informatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatarUrl || ""} />
                  <AvatarFallback className="bg-ember text-white text-lg">
                    {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-heading text-ash">
                    {profile?.displayName || "Geen naam ingesteld"}
                  </h3>
                  <p className="text-smoke text-sm">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-ash">Weergavenaam</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    defaultValue={profile?.displayName || ""}
                    placeholder="Je naam"
                    className="bg-charcoal border-ash text-ash"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-ash">Locatie</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={profile?.location || ""}
                    placeholder="Amsterdam, Nederland"
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-ash">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={profile?.bio || ""}
                  placeholder="Vertel iets over jezelf en je BBQ ervaring..."
                  className="bg-charcoal border-ash text-ash min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                BBQ voorkeuren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="favoriteMeat" className="text-ash">Favoriete vlees</Label>
                  <Input
                    id="favoriteMeat"
                    name="favoriteMeat"
                    defaultValue={profile?.favoriteMeat || ""}
                    placeholder="Brisket, ribs, pulled pork..."
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bbqStyle" className="text-ash">BBQ stijl</Label>
                  <Input
                    id="bbqStyle"
                    name="bbqStyle"
                    defaultValue={profile?.bbqStyle || ""}
                    placeholder="Texas, Kansas City, Carolina..."
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel" className="text-ash">Ervaring</Label>
                  <Input
                    id="experienceLevel"
                    name="experienceLevel"
                    defaultValue={profile?.experienceLevel || ""}
                    placeholder="Beginner, Gevorderd, Expert..."
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favoriteWood" className="text-ash">Favoriete hout</Label>
                  <Input
                    id="favoriteWood"
                    name="favoriteWood"
                    defaultValue={profile?.favoriteWood || ""}
                    placeholder="Hickory, Apple, Cherry..."
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Statistieken
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-smoke">
                  <ChefHat className="h-4 w-4" />
                  Recepten
                </div>
                <Badge variant="outline" className="border-ash text-ash">
                  {stats.recipes}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-smoke">
                  <Clock className="h-4 w-4" />
                  Kooksessies
                </div>
                <Badge variant="outline" className="border-ash text-ash">
                  {stats.sessions}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-smoke">
                  <Star className="h-4 w-4" />
                  Reviews geschreven
                </div>
                <Badge variant="outline" className="border-ash text-ash">
                  {stats.reviews}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-smoke">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-smoke">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Lid sinds {profile?.createdAt 
                    ? new Date(profile.createdAt).toLocaleDateString('nl-NL')
                    : "Onbekend"
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash flex items-center gap-2">
                <Award className="h-5 w-5" />
                Prestaties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.recipes >= 1 && (
                <div className="flex items-center gap-2 text-smoke">
                  <Award className="h-4 w-4 text-ember" />
                  <span className="text-sm">Eerste recept</span>
                </div>
              )}
              {stats.sessions >= 5 && (
                <div className="flex items-center gap-2 text-smoke">
                  <Award className="h-4 w-4 text-ember" />
                  <span className="text-sm">5 kooksessies</span>
                </div>
              )}
              {stats.reviews >= 10 && (
                <div className="flex items-center gap-2 text-smoke">
                  <Award className="h-4 w-4 text-ember" />
                  <span className="text-sm">10 reviews</span>
                </div>
              )}
              {stats.recipes === 0 && stats.sessions === 0 && (
                <p className="text-smoke text-sm text-center py-4">
                  Start met het maken van je eerste recept!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

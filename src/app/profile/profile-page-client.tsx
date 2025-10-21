"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Award
} from "lucide-react";
import { ProfileForm } from "./profile-form";

interface Profile {
  id: string;
  display_name?: string;
  favorite_meat?: string;
  bbq_style?: string;
  experience_level?: string;
  favorite_wood?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  created_at: string;
}

interface User {
  id: string;
  email?: string;
}

interface Stats {
  recipes: number;
  sessions: number;
  reviews: number;
}

interface ProfilePageClientProps {
  initialProfile?: Profile | null;
  initialStats?: Stats;
}

export function ProfilePageClient({ initialProfile, initialStats }: ProfilePageClientProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>(initialStats || { recipes: 0, sessions: 0, reviews: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Alleen data ophalen als we geen initial data hebben
    if (!initialProfile || !initialStats) {
      fetchProfileData();
    } else {
      // Set user info from initial profile
      if (initialProfile) {
        setUser({ id: initialProfile.id, email: initialProfile.display_name + '@example.com' });
      }
    }
  }, [initialProfile, initialStats]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch profile data
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        
        // Get user info from profile
        if (profileData) {
          setUser({ id: profileData.id, email: profileData.display_name + '@example.com' });
        }
      }

      // Fetch stats
      const statsRes = await fetch('/api/profile/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    // Refresh profile data after update
    fetchProfileData();
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-ash">Laden...</div>
      </div>
    );
  }

  return (
    <ProfileForm onUpdate={handleProfileUpdate}>
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-ash">Profiel</h1>
          <p className="text-smoke mt-1">Beheer je account en bekijk je statistieken</p>
        </div>
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
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-ember text-white text-lg">
                    {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-heading text-ash">
                    {profile?.display_name || "Geen naam ingesteld"}
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
                    defaultValue={profile?.display_name || ""}
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
                    defaultValue={profile?.favorite_meat || ""}
                    placeholder="Brisket, ribs, pulled pork..."
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bbqStyle" className="text-ash">BBQ stijl</Label>
                  <Input
                    id="bbqStyle"
                    name="bbqStyle"
                    defaultValue={profile?.bbq_style || ""}
                    placeholder="Low & slow, hot & fast..."
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
                    defaultValue={profile?.experience_level || ""}
                    placeholder="Beginner, gevorderd, expert..."
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favoriteWood" className="text-ash">Favoriete hout</Label>
                  <Input
                    id="favoriteWood"
                    name="favoriteWood"
                    defaultValue={profile?.favorite_wood || ""}
                    placeholder="Hickory, mesquite, apple..."
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
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
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-ember" />
                  <span className="text-smoke">Recepten</span>
                </div>
                <Badge variant="secondary" className="bg-ember/20 text-ember">
                  {stats.recipes}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-ember" />
                  <span className="text-smoke">Sessies</span>
                </div>
                <Badge variant="secondary" className="bg-ember/20 text-ember">
                  {stats.sessions}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-ember" />
                  <span className="text-smoke">Reviews</span>
                </div>
                <Badge variant="secondary" className="bg-ember/20 text-ember">
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
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-smoke" />
                <span className="text-smoke">Lid sinds</span>
                <span className="text-ash">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('nl-NL') : 'Onbekend'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-smoke" />
                <span className="text-smoke">Status</span>
                <Badge variant="outline" className="border-ember text-ember">
                  Actief
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash">Snelle acties</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recipes === 0 ? (
                <p className="text-smoke text-sm">
                  Start met het maken van je eerste recept!
                </p>
              ) : (
                <p className="text-smoke text-sm">
                  Je hebt al {stats.recipes} recept{stats.recipes !== 1 ? 'en' : ''} gemaakt!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfileForm>
  );
}

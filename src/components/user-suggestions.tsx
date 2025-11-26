"use client";

import { useState, useEffect } from "react";
import { UserCard } from "@/components/user-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import Link from "next/link";

interface UserSuggestion {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  bbqStyle: string | null;
  experienceLevel: string | null;
  recipeCount: number;
}

export function UserSuggestions() {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/users/suggestions?limit=5");
        
        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <Card className="bg-coals border-ash">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-ember mx-auto mb-2" />
          <p className="text-smoke text-sm">Suggesties laden...</p>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-coals border-ash">
      <CardHeader>
        <CardTitle className="text-lg font-heading text-ash flex items-center gap-2">
          <Users className="h-5 w-5 text-ember" />
          Ontdek nieuwe gebruikers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((user) => (
          <UserCard
            key={user.id}
            userId={user.id}
            displayName={user.displayName}
            bio={user.bio}
            avatarUrl={user.avatarUrl}
            location={user.location}
            bbqStyle={user.bbqStyle}
            experienceLevel={user.experienceLevel}
            showLink
          />
        ))}
        <div className="pt-2 border-t border-ash">
          <Button asChild variant="outline" size="sm" className="w-full border-ash text-ash hover:bg-coals">
            <Link href="/users">
              Bekijk alle gebruikers
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


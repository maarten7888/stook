"use client";

import { useState, useEffect } from "react";
import { UserCard } from "@/components/user-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";

interface Friend {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  bbqStyle: string | null;
  experienceLevel: string | null;
  friendshipCreatedAt: string;
}

interface FriendsListProps {
  userId?: string;
  className?: string;
}

export function FriendsList({ className }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/friends");
        
        if (!response.ok) {
          throw new Error("Failed to fetch friends");
        }

        const data = await response.json();
        setFriends(data);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  if (loading) {
    return (
      <Card className={`bg-coals border-ash ${className || ""}`}>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-ember mx-auto mb-2" />
          <p className="text-smoke text-sm">Vrienden laden...</p>
        </CardContent>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card className={`bg-coals border-ash ${className || ""}`}>
        <CardHeader>
          <CardTitle className="text-lg font-heading text-ash flex items-center gap-2">
            <Users className="h-5 w-5 text-ember" />
            Vrienden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-smoke text-sm text-center py-4">
            Je hebt nog geen vrienden. Voeg vrienden toe via hun profielpagina!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-coals border-ash ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-lg font-heading text-ash flex items-center gap-2">
          <Users className="h-5 w-5 text-ember" />
          Vrienden ({friends.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {friends.map((friend) => (
          <UserCard
            key={friend.id}
            userId={friend.id}
            displayName={friend.displayName}
            bio={friend.bio}
            avatarUrl={friend.avatarUrl}
            location={friend.location}
            bbqStyle={friend.bbqStyle}
            experienceLevel={friend.experienceLevel}
            showLink
          />
        ))}
      </CardContent>
    </Card>
  );
}


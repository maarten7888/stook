"use client";

import { useState } from "react";
import { UserCard } from "@/components/user-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  bbqStyle: string | null;
  experienceLevel: string | null;
  followedAt?: string;
}

interface UserListProps {
  userId: string;
  type: "followers" | "following";
  initialUsers?: User[];
}

export function UserList({ userId, type, initialUsers = [] }: UserListProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(!initialUsers.length);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(initialUsers.length);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/users/${userId}/${type}?limit=20&offset=${offset}`
      );
      if (response.ok) {
        const newUsers = await response.json();
        if (newUsers.length === 0) {
          setHasMore(false);
        } else {
          setUsers((prev) => [...prev, ...newUsers]);
          setOffset((prev) => prev + newUsers.length);
        }
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  if (users.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 text-smoke">
        {type === "followers" ? "Nog geen volgers" : "Volgt nog niemand"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            userId={user.id}
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
            bio={user.bio}
            location={user.location}
            bbqStyle={user.bbqStyle}
            experienceLevel={user.experienceLevel}
          />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            variant="outline"
            className="border-ash text-ash hover:bg-coals"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Laden...
              </>
            ) : (
              "Meer laden"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}


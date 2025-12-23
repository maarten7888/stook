"use client";

import { useState, useEffect } from "react";
import { UserCard } from "@/components/user-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Users as UsersIcon } from "lucide-react";

interface User {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  bbqStyle: string | null;
  experienceLevel: string | null;
  createdAt: string;
  stats: {
    recipes: number;
    sessions: number;
    favorites: number;
    followers: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const limit = 20;

  useEffect(() => {
    loadUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const loadUsers = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: reset ? "0" : offset.toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();

      if (reset) {
        setUsers(data);
      } else {
        setUsers((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === limit);
      setOffset((prev) => (reset ? data.length : prev + data.length));
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadUsers(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-ember mx-auto mb-4" />
          <p className="text-smoke">Gebruikers laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-ash mb-2">
          Alle Gebruikers
        </h1>
        <p className="text-smoke">
          Ontdek de BBQ community van Stook
        </p>
      </div>

      {/* Search */}
      <Card className="bg-coals border-ash">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-smoke" />
              <Input
                type="text"
                placeholder="Zoek op naam, locatie of bio..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-charcoal border-ash text-ash"
              />
            </div>
            <Button
              type="submit"
              className="bg-ember hover:bg-ember/90 text-white"
            >
              Zoeken
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {users.length === 0 ? (
        <Card className="bg-coals border-ash">
          <CardContent className="p-12 text-center">
            <UsersIcon className="h-16 w-16 mx-auto mb-4 text-ember/50" />
            <h2 className="text-xl font-heading text-ash mb-2">
              Geen gebruikers gevonden
            </h2>
            <p className="text-smoke">
              {searchQuery
                ? "Probeer een andere zoekterm"
                : "Er zijn nog geen gebruikers geregistreerd"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <UserCard
                key={user.id}
                userId={user.id}
                displayName={user.displayName}
                bio={user.bio}
                avatarUrl={user.avatarUrl}
                location={user.location}
                bbqStyle={user.bbqStyle}
                experienceLevel={user.experienceLevel}
                stats={user.stats}
                showStats={true}
                showLink={true}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="border-ash text-ash hover:bg-coals"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Laden...
                  </>
                ) : (
                  "Meer gebruikers laden"
                )}
              </Button>
            </div>
          )}

          {!hasMore && users.length > 0 && (
            <div className="text-center py-4 text-smoke">
              <p>Alle gebruikers geladen ({users.length} totaal)</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}


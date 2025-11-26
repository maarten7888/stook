"use client";

import { useState, useEffect } from "react";
import { RecipeCard } from "@/components/recipe-card";
import { FeedFilters } from "@/components/feed-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type FeedFilter = "all" | "following" | "own";

interface FeedItem {
  id: string;
  title: string;
  description: string | null;
  serves?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  targetInternalTemp?: number;
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
  userId: string;
  authorName: string | null;
  authorId: string;
  isFollowed: boolean;
}

export function HomeFeed() {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchFeed = async (currentFilter: FeedFilter, currentOffset: number, append: boolean = false) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feed?filter=${currentFilter}&limit=12&offset=${currentOffset}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }

      const data = await response.json();
      
      if (append) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      
      setHasMore(data.hasMore);
      setOffset(currentOffset + data.items.length);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchFeed(filter, 0, false);
  }, [filter]);

  const handleLoadMore = () => {
    fetchFeed(filter, offset, true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-ash">Feed</h2>
        <FeedFilters currentFilter={filter} onFilterChange={setFilter} />
      </div>

      {loading && items.length === 0 ? (
        <Card className="bg-coals border-ash">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-ember mx-auto mb-2" />
            <p className="text-smoke">Feed laden...</p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="bg-coals border-ash">
          <CardContent className="p-6 text-smoke text-center">
            {filter === "following" ? (
              <>
                <p className="mb-2">Je volgt nog niemand.</p>
                <p className="text-sm">Ontdek nieuwe gebruikers om hun recepten te zien!</p>
              </>
            ) : filter === "own" ? (
              <>
                <p className="mb-2">Je hebt nog geen recepten.</p>
                <p className="text-sm">Begin met een nieuw recept of importeer er een.</p>
              </>
            ) : (
              <>
                <p className="mb-2">Nog geen recepten.</p>
                <p className="text-sm">Begin met een nieuw recept of importeer er een.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <RecipeCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description ?? undefined}
                serves={item.serves}
                prepMinutes={item.prepMinutes}
                cookMinutes={item.cookMinutes}
                targetInternalTemp={item.targetInternalTemp}
                visibility={item.visibility}
                createdAt={item.createdAt}
                updatedAt={item.updatedAt}
                authorName={item.authorName ?? undefined}
                authorId={item.authorId}
                isFollowed={item.isFollowed}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLoadMore}
                variant="outline"
                className="border-ash text-ash hover:bg-coals"
                disabled={loading}
              >
                {loading ? (
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
        </>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";

interface FavoriteButtonProps {
  recipeId: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
}

export function FavoriteButton({ 
  recipeId, 
  className,
  size = "default",
  variant = "outline",
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch favorite status on mount
  useEffect(() => {
    async function fetchFavoriteStatus() {
      try {
        const response = await fetch(`/api/recipes/${recipeId}/favorite-status`);
        if (response.ok) {
          const data = await response.json();
          setIsFavorited(data.isFavorited);
        }
      } catch (error) {
        console.error("Error fetching favorite status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFavoriteStatus();
  }, [recipeId]);

  const handleToggleFavorite = async () => {
    if (isToggling) return;

    setIsToggling(true);
    const previousState = isFavorited;

    // Optimistic update
    setIsFavorited(!isFavorited);

    try {
      if (previousState) {
        // Unfavorite
        const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // Revert on error
          setIsFavorited(previousState);
          const error = await response.json();
          console.error("Error unfavoriting:", error);
        }
      } else {
        // Favorite
        const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
          method: "POST",
        });

        if (!response.ok) {
          // Revert on error
          setIsFavorited(previousState);
          const error = await response.json();
          console.error("Error favoriting:", error);
        }
      }
    } catch (error) {
      // Revert on error
      setIsFavorited(previousState);
      console.error("Error toggling favorite:", error);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <Button
        disabled
        variant={variant}
        size={size}
        className={`border-ash text-ash ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleToggleFavorite}
      disabled={isToggling}
      variant={variant}
      size={size}
      className={
        isFavorited
          ? `bg-ember hover:bg-ember/90 text-white ${className}`
          : `border-ash text-ash hover:bg-coals ${className}`
      }
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart 
          className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} 
        />
      )}
    </Button>
  );
}


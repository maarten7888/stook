"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  recipeId: string;
  className?: string;
}

export function FavoriteButton({ recipeId, className }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Check if recipe is already favorited
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const response = await fetch(`/api/recipes/favorites`);
        if (!response.ok) {
          throw new Error("Failed to fetch favorites");
        }
        const data = await response.json();
        const isFav = data.recipes?.some((r: { id: string }) => r.id === recipeId) || false;
        setIsFavorite(isFav);
      } catch (error) {
        console.error("Error checking favorite:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFavorite();
  }, [recipeId]);

  const handleToggleFavorite = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Fout bij verwijderen favoriet");
        }

        setIsFavorite(false);
        toast.success("Verwijderd uit favorieten");
      } else {
        // Add to favorites
        const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
          method: "POST",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Fout bij toevoegen favoriet");
        }

        setIsFavorite(true);
        toast.success("Toegevoegd aan favorieten");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(error instanceof Error ? error.message : "Er is iets misgegaan");
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={`border-ash text-smoke ${className || ""}`}
      >
        <Heart className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleToggleFavorite}
      disabled={isToggling}
      variant="outline"
      size="sm"
      className={`border-ash text-smoke hover:bg-coals hover:border-ember hover:text-ember transition-colors ${
        isFavorite ? "bg-ember/20 border-ember text-ember" : ""
      } ${className || ""}`}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
    </Button>
  );
}


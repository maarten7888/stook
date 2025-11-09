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
        // Check if this specific recipe is favorited by checking favorites list
        const response = await fetch(`/api/recipes/favorites`, {
          cache: 'no-store', // Always fetch fresh data
        });
        
        if (!response.ok) {
          // If unauthorized, user is not logged in, so not favorite
          if (response.status === 401) {
            setIsFavorite(false);
            setIsLoading(false);
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          console.error("Error fetching favorites:", {
            status: response.status,
            error: errorData
          });
          setIsFavorite(false);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log("Favorites data:", data);
        console.log("Recipe ID to check:", recipeId);
        console.log("Recipes array:", data.recipes);
        
        // Check if this recipe is in the favorites list
        if (Array.isArray(data.recipes)) {
          console.log("Recipe IDs in favorites:", data.recipes.map((r: { id: string }) => r.id));
          const isFav = data.recipes.some((r: { id: string }) => r.id === recipeId);
          console.log("Is favorite:", isFav, "Recipe ID:", recipeId, "Type:", typeof recipeId);
          setIsFavorite(isFav);
        } else {
          console.warn("Recipes is not an array:", data.recipes);
          setIsFavorite(false);
        }
      } catch (error) {
        console.error("Error checking favorite:", error);
        // On error, assume not favorite
        setIsFavorite(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFavorite();
  }, [recipeId]);

  const handleToggleFavorite = async () => {
    if (isToggling) return;

    setIsToggling(true);
    const previousState = isFavorite; // Store previous state for rollback
    
    // Optimistic update
    setIsFavorite(!isFavorite);
    
    try {
      if (previousState) {
        // Remove from favorites
        const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
          method: "DELETE",
          cache: 'no-store',
        });

        if (!response.ok) {
          const error = await response.json();
          // Rollback on error
          setIsFavorite(previousState);
          throw new Error(error.error || "Fout bij verwijderen favoriet");
        }

        toast.success("Verwijderd uit favorieten");
      } else {
        // Add to favorites
        console.log("Adding favorite for recipe:", recipeId);
        const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
          method: "POST",
          cache: 'no-store',
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Error adding favorite:", { status: response.status, error });
          // Rollback on error
          setIsFavorite(previousState);
          throw new Error(error.error || "Fout bij toevoegen favoriet");
        }

        const result = await response.json();
        console.log("Favorite added successfully:", result);
        toast.success("Toegevoegd aan favorieten");
        
        // Re-check favorites after a short delay to ensure state is updated
        setTimeout(() => {
          const recheck = async () => {
            try {
              const checkResponse = await fetch(`/api/recipes/favorites`, { cache: 'no-store' });
              if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                const isFav = Array.isArray(checkData.recipes) && checkData.recipes.some((r: { id: string }) => r.id === recipeId);
                console.log("Re-check after add - Is favorite:", isFav);
                setIsFavorite(isFav);
              }
            } catch (e) {
              console.error("Error re-checking favorite:", e);
            }
          };
          recheck();
        }, 500);
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


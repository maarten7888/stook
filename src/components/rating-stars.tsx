"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  className,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5",
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = () => {
    // Could add hover effects here if needed
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starRating = index + 1;
        const isFilled = starRating <= Math.round(rating);
        const isHalfFilled = starRating === Math.ceil(rating) && rating % 1 !== 0;
        
        return (
          <button
            key={index}
            type="button"
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
            onClick={() => handleStarClick(starRating)}
            onMouseEnter={handleStarHover}
            disabled={!interactive}
            aria-label={`${starRating} sterren`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled || isHalfFilled
                  ? "text-ember fill-ember"
                  : "text-ash fill-ash",
                interactive && "hover:text-ember hover:fill-ember"
              )}
            />
          </button>
        );
      })}
      
      {interactive && (
        <span className="ml-1 text-sm text-smoke">
          {rating > 0 ? rating.toFixed(1) : "Beoordeel"}
        </span>
      )}
    </div>
  );
}

// Compact version for displaying ratings in lists
export function RatingDisplay({ 
  rating, 
  reviewCount, 
  size = "sm",
  className 
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <RatingStars rating={rating} size={size} />
      <span className="text-sm text-smoke">
        {rating.toFixed(1)}
        {reviewCount && ` (${reviewCount})`}
      </span>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
}

interface TagChipsProps {
  tags: Tag[];
  maxVisible?: number;
  variant?: "default" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  onTagClick?: (tag: Tag) => void;
}

export function TagChips({
  tags,
  maxVisible = 5,
  variant = "secondary",
  size = "md",
  className,
  onTagClick,
}: TagChipsProps) {
  if (tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleTags.map((tag) => (
        <Badge
          key={tag.id}
          variant={variant}
          className={cn(
            sizeClasses[size],
            onTagClick && "cursor-pointer hover:bg-ember hover:text-white transition-colors"
          )}
          onClick={() => onTagClick?.(tag)}
        >
          {tag.name}
        </Badge>
      ))}
      
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className={cn(
            sizeClasses[size],
            "text-smoke"
          )}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

// Specialized version for recipe tags
export function RecipeTagChips({
  tags,
  maxVisible = 3,
  className,
  onTagClick,
}: {
  tags: Tag[];
  maxVisible?: number;
  className?: string;
  onTagClick?: (tag: Tag) => void;
}) {
  return (
    <TagChips
      tags={tags}
      maxVisible={maxVisible}
      variant="secondary"
      size="sm"
      className={className}
      onTagClick={onTagClick}
    />
  );
}

// Specialized version for filter tags
export function FilterTagChips({
  tags,
  selectedTags,
  onTagToggle,
  className,
}: {
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        
        return (
          <Badge
            key={tag.id}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              isSelected 
                ? "bg-ember text-white hover:bg-ember/90" 
                : "hover:bg-coals hover:text-white"
            )}
            onClick={() => onTagToggle(tag.id)}
          >
            {tag.name}
          </Badge>
        );
      })}
    </div>
  );
}

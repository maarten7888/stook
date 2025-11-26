import Link from "next/link";
import { Clock, Users, Thermometer, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  id: string;
  title: string;
  description?: string;
  serves?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  targetInternalTemp?: number;
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  authorId?: string;
  tags?: Array<{ id: string; name: string }>;
  rating?: number;
  reviewCount?: number;
  className?: string;
}

export function RecipeCard({
  id,
  title,
  description,
  serves,
  prepMinutes,
  cookMinutes,
  targetInternalTemp,
  visibility,
  createdAt,
  authorName,
  authorId,
  tags = [],
  rating,
  reviewCount,
  className,
}: RecipeCardProps) {
  const totalTime = (prepMinutes || 0) + (cookMinutes || 0);
  
  return (
    <Card className={cn("group hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-outfit leading-tight group-hover:text-ember transition-colors">
            <Link href={`/recipes/${id}`} className="hover:underline">
              {title}
            </Link>
          </CardTitle>
          <div className="flex items-center gap-1 shrink-0">
            {visibility === "public" ? (
              <Eye className="h-4 w-4 text-smoke" />
            ) : (
              <EyeOff className="h-4 w-4 text-smoke" />
            )}
          </div>
        </div>
        
        {description && (
          <p className="text-smoke text-sm line-clamp-2 mt-1">
            {description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Recipe metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-smoke mb-3">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min</span>
            </div>
          )}
          
          {serves && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{serves} personen</span>
            </div>
          )}
          
          {targetInternalTemp && (
            <div className="flex items-center gap-1">
              <Thermometer className="h-4 w-4" />
              <span>{targetInternalTemp}°C</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-smoke pt-2 border-t border-ash">
          <div>
            {authorName && authorId ? (
              <Link 
                href={`/users/${authorId}`}
                className="hover:text-ember transition-colors"
              >
                door {authorName}
              </Link>
            ) : authorName ? (
              <span>door {authorName}</span>
            ) : null}
          </div>
          
          <div className="flex items-center gap-2">
            {rating && (
              <div className="flex items-center gap-1">
                <span className="text-ember font-medium">{rating.toFixed(1)}</span>
                {reviewCount && (
                  <span>({reviewCount})</span>
                )}
              </div>
            )}
            
            <time dateTime={createdAt}>
              {new Date(createdAt).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </time>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

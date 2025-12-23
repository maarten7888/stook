import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ChefHat, Award, BookOpen, Clock, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserStats {
  recipes?: number;
  sessions?: number;
  favorites?: number;
  followers?: number;
}

interface UserCardProps {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  bbqStyle?: string | null;
  experienceLevel?: string | null;
  stats?: UserStats;
  className?: string;
  showLink?: boolean;
  showStats?: boolean;
}

export function UserCard({
  userId,
  displayName,
  avatarUrl,
  bio,
  location,
  bbqStyle,
  experienceLevel,
  stats,
  className,
  showLink = true,
  showStats = false,
}: UserCardProps) {
  const content = (
    <Card className={cn("bg-coals border-ash hover:border-ember/50 transition-colors h-full flex flex-col", className)}>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="bg-ember text-white">
              {displayName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="text-lg font-heading text-ash truncate">
              {displayName || "Gebruiker"}
            </h3>
            <div className="min-h-[2.5rem] mt-1">
              {bio ? (
                <p className="text-smoke text-sm line-clamp-2">
                  {bio}
                </p>
              ) : (
                <p className="text-smoke text-sm line-clamp-2 opacity-0 pointer-events-none">
                  &nbsp;
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-smoke">
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                </div>
              )}
              {bbqStyle && (
                <div className="flex items-center gap-1">
                  <ChefHat className="h-3 w-3" />
                  <span>{bbqStyle}</span>
                </div>
              )}
              {experienceLevel && (
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  <span>{experienceLevel}</span>
                </div>
              )}
            </div>
            
            {showStats && stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto pt-4 border-t border-ash">
                {typeof stats.recipes === 'number' && (
                  <div className="flex flex-col items-center">
                    <BookOpen className="h-4 w-4 text-ember mb-1" />
                    <span className="text-sm font-bold text-ash">{stats.recipes}</span>
                    <span className="text-xs text-smoke">Recepten</span>
                  </div>
                )}
                {typeof stats.sessions === 'number' && (
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 text-ember mb-1" />
                    <span className="text-sm font-bold text-ash">{stats.sessions}</span>
                    <span className="text-xs text-smoke">Sessies</span>
                  </div>
                )}
                {typeof stats.favorites === 'number' && (
                  <div className="flex flex-col items-center">
                    <Heart className="h-4 w-4 text-ember mb-1" />
                    <span className="text-sm font-bold text-ash">{stats.favorites}</span>
                    <span className="text-xs text-smoke">Favorieten</span>
                  </div>
                )}
                {typeof stats.followers === 'number' && (
                  <div className="flex flex-col items-center">
                    <Users className="h-4 w-4 text-ember mb-1" />
                    <span className="text-sm font-bold text-ash">{stats.followers}</span>
                    <span className="text-xs text-smoke">Volgers</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (showLink) {
    return (
      <Link href={`/users/${userId}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}


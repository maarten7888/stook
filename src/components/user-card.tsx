import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ChefHat, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCardProps {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  bbqStyle?: string | null;
  experienceLevel?: string | null;
  className?: string;
  showLink?: boolean;
}

export function UserCard({
  userId,
  displayName,
  avatarUrl,
  bio,
  location,
  bbqStyle,
  experienceLevel,
  className,
  showLink = true,
}: UserCardProps) {
  const content = (
    <Card className={cn("bg-coals border-ash hover:border-ember/50 transition-colors", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="bg-ember text-white">
              {displayName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-heading text-ash truncate">
              {displayName || "Gebruiker"}
            </h3>
            {bio && (
              <p className="text-smoke text-sm line-clamp-2 mt-1">
                {bio}
              </p>
            )}
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


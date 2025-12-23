import Link from "next/link";
import { BookOpen, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserStatsIconsProps {
  recipes: number;
  sessions: number;
  avgRating: string | null;
  recipesThisMonth?: number;
  sessionsThisWeek?: number;
  className?: string;
}

export function UserStatsIcons({
  recipes,
  sessions,
  avgRating,
  recipesThisMonth = 0,
  sessionsThisWeek = 0,
  className,
}: UserStatsIconsProps) {
  return (
    <div className={cn("flex items-center gap-4 sm:gap-6", className)}>
      <Link
        href="/recipes?visibility=private"
        className="flex items-center gap-2 group hover:text-ember transition-colors"
      >
        <div className="relative">
          <BookOpen className="h-5 w-5 text-ember" />
          {recipesThisMonth > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-ember rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">+</span>
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-ash group-hover:text-ember transition-colors">
            {recipes}
          </span>
          <span className="text-xs text-smoke">Recepten</span>
        </div>
      </Link>

      <Link
        href="/sessions"
        className="flex items-center gap-2 group hover:text-ember transition-colors"
      >
        <div className="relative">
          <Clock className="h-5 w-5 text-ember" />
          {sessionsThisWeek > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-ember rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">+</span>
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-ash group-hover:text-ember transition-colors">
            {sessions}
          </span>
          <span className="text-xs text-smoke">Sessies</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-ember" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-ash">
            {avgRating || '—'}
          </span>
          <span className="text-xs text-smoke">Rating</span>
        </div>
      </div>
    </div>
  );
}


"use client";

import Link from "next/link";
import { BookOpen, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarStatsProps {
  recipes: number;
  sessions: number;
  avgRating: string | null;
  recipesThisMonth?: number;
  sessionsThisWeek?: number;
  className?: string;
}

export function NavbarStats({
  recipes,
  sessions,
  avgRating,
  recipesThisMonth = 0,
  sessionsThisWeek = 0,
  className,
}: NavbarStatsProps) {
  return (
    <div className={cn("flex items-center gap-3 pt-2 border-t border-ash/50 mt-2", className)}>
      <Link
        href="/recipes?visibility=private"
        className="flex items-center gap-1.5 group hover:text-ember transition-colors"
        title={`${recipes} recepten${recipesThisMonth > 0 ? ` (+${recipesThisMonth} deze maand)` : ''}`}
      >
        <BookOpen className="h-3.5 w-3.5 text-ember/70 group-hover:text-ember" />
        <span className="text-xs font-medium text-smoke group-hover:text-ember transition-colors">
          {recipes}
        </span>
      </Link>

      <Link
        href="/sessions"
        className="flex items-center gap-1.5 group hover:text-ember transition-colors"
        title={`${sessions} sessies${sessionsThisWeek > 0 ? ` (+${sessionsThisWeek} deze week)` : ''}`}
      >
        <Clock className="h-3.5 w-3.5 text-ember/70 group-hover:text-ember" />
        <span className="text-xs font-medium text-smoke group-hover:text-ember transition-colors">
          {sessions}
        </span>
      </Link>

      <div className="flex items-center gap-1.5" title="Gemiddelde rating">
        <Star className="h-3.5 w-3.5 text-ember/70" />
        <span className="text-xs font-medium text-smoke">
          {avgRating || '—'}
        </span>
      </div>
    </div>
  );
}


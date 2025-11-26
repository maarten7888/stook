"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Users, User } from "lucide-react";

type FeedFilter = "all" | "following" | "own";

interface FeedFiltersProps {
  currentFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

export function FeedFilters({ currentFilter, onFilterChange }: FeedFiltersProps) {
  return (
    <Tabs value={currentFilter} onValueChange={(value) => onFilterChange(value as FeedFilter)}>
      <TabsList className="bg-coals border-ash">
        <TabsTrigger 
          value="all" 
          className="data-[state=active]:bg-ember data-[state=active]:text-white"
        >
          <Home className="h-4 w-4 mr-2" />
          Alles
        </TabsTrigger>
        <TabsTrigger 
          value="following"
          className="data-[state=active]:bg-ember data-[state=active]:text-white"
        >
          <Users className="h-4 w-4 mr-2" />
          Gevolgde
        </TabsTrigger>
        <TabsTrigger 
          value="own"
          className="data-[state=active]:bg-ember data-[state=active]:text-white"
        >
          <User className="h-4 w-4 mr-2" />
          Eigen
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}


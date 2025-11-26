"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function FriendRequestsBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/friends/requests/count");
        if (response.ok) {
          const data = await response.json();
          setCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching friend requests count:", error);
      }
    };

    fetchCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === null || count === 0) {
    return null;
  }

  return (
    <Badge variant="secondary" className="bg-ember/20 text-ember ml-2">
      {count}
    </Badge>
  );
}


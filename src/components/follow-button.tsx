"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export function FollowButton({ userId, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();

  // Fetch follow status on mount
  useEffect(() => {
    async function fetchFollowStatus() {
      try {
        const response = await fetch(`/api/users/${userId}/follow-status`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          setIsOwnProfile(data.isOwnProfile || false);
        }
      } catch (error) {
        console.error("Error fetching follow status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFollowStatus();
  }, [userId]);

  const handleToggleFollow = async () => {
    if (isToggling || isOwnProfile) return;

    setIsToggling(true);
    const previousState = isFollowing;

    // Optimistic update
    setIsFollowing(!isFollowing);

    try {
      if (previousState) {
        // Unfollow
        const response = await fetch(`/api/users/${userId}/follow`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // Revert on error
          setIsFollowing(previousState);
          const error = await response.json();
          console.error("Error unfollowing:", error);
        } else {
          // Refresh page to update stats
          router.refresh();
        }
      } else {
        // Follow
        const response = await fetch(`/api/users/${userId}/follow`, {
          method: "POST",
        });

        if (!response.ok) {
          // Revert on error
          setIsFollowing(previousState);
          const error = await response.json();
          console.error("Error following:", error);
        } else {
          // Refresh page to update stats
          router.refresh();
        }
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(previousState);
      console.error("Error toggling follow:", error);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <Button
        disabled
        variant="outline"
        className={`border-ash text-ash ${className}`}
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Laden...
      </Button>
    );
  }

  if (isOwnProfile) {
    return null; // Don't show button on own profile
  }

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isToggling}
      variant={isFollowing ? "outline" : "default"}
      className={
        isFollowing
          ? `border-ash text-ash hover:bg-coals ${className}`
          : `bg-ember hover:bg-ember/90 ${className}`
      }
    >
      {isToggling ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isFollowing ? "Ontvolgen..." : "Volgen..."}
        </>
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Ontvolgen
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Volgen
        </>
      )}
    </Button>
  );
}


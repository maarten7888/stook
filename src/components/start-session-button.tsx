"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StartSessionButtonProps {
  recipeId: string;
  className?: string;
}

export function StartSessionButton({ recipeId, className }: StartSessionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fout bij starten sessie");
      }

      const session = await response.json();
      toast.success("Sessie gestart!");
      router.push(`/sessions/${session.id}`);
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error(error instanceof Error ? error.message : "Er is iets misgegaan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartSession}
      disabled={isLoading}
      className={`bg-ember hover:bg-ember/90 text-white ${className || ""}`}
    >
      <Play className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">{isLoading ? "Start..." : "Start Sessie"}</span>
      <span className="sm:hidden">{isLoading ? "..." : "Start"}</span>
    </Button>
  );
}


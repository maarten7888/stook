"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { updateProfile } from "./actions";
import { testProfileUpdate } from "./test-action";
import { toast } from "sonner";

interface ProfileFormProps {
  children: React.ReactNode;
}

export function ProfileForm({ children }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    
    try {
      // Test eerst zonder database operaties
      await testProfileUpdate(formData);
      toast.success("Test succesvol!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error instanceof Error ? error.message : "Er is een fout opgetreden");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {children}
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-ember hover:bg-ember/90 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Opslaan..." : "Profiel opslaan"}
        </Button>
      </div>
    </form>
  );
}

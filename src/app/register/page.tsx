"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error("Wachtwoorden komen niet overeen");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Wachtwoord moet minimaal 6 karakters lang zijn");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Account aangemaakt! Check je email voor verificatie.");
      router.push("/login");
    } catch {
      toast.error("Er is iets misgegaan bij het registreren");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-coals border-ash">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-ash font-outfit">Registreren</CardTitle>
          <p className="text-smoke">Word onderdeel van de BBQ community</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-ash">Naam</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Je naam"
                className="bg-charcoal border-ash text-ash"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ash">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="je@email.com"
                className="bg-charcoal border-ash text-ash"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-ash">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-charcoal border-ash text-ash"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-ash">Bevestig wachtwoord</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-charcoal border-ash text-ash"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-ember hover:bg-ember/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Registreren..." : "Registreren"}
            </Button>
          </form>
          <div className="text-center text-sm text-smoke">
            Al een account?{" "}
            <Link href="/login" className="text-ember hover:underline">
              Log hier in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

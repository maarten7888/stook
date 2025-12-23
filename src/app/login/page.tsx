"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    
    if (error) {
      toast.error(error);
    } else if (message) {
      toast.success(message);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      toast.success("Succesvol ingelogd!");
      // Gebruik window.location voor een volledige page reload om ervoor te zorgen
      // dat alle componenten correct worden gereset
      window.location.href = "/";
    } catch {
      toast.error("Er is iets misgegaan bij het inloggen");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-coals border-ash">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-ash font-heading">Inloggen</CardTitle>
          <p className="text-smoke">Welkom terug bij Stook</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
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
            <Button 
              type="submit" 
              className="w-full bg-ember hover:bg-ember/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Inloggen..." : "Inloggen"}
            </Button>
          </form>
          <div className="text-center text-sm text-smoke">
            Nog geen account?{" "}
            <Link href="/register" className="text-ember hover:underline">
              Registreer hier
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

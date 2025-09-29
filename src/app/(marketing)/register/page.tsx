"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 karakters zijn");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/login?message=Check je e-mail voor verificatie");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal p-4">
      <Card className="w-full max-w-md bg-coals border-ash">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-heading text-ash">Registreren</CardTitle>
          <CardDescription className="text-smoke">
            Maak je account aan bij Stook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ash">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-charcoal border-ash text-ash"
                placeholder="je@email.nl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-ash">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-charcoal border-ash text-ash"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-ash">Bevestig wachtwoord</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-charcoal border-ash text-ash"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full bg-ember hover:bg-ember/90 text-white"
              disabled={loading}
            >
              {loading ? "Registreren..." : "Registreren"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-smoke text-sm">
              Al een account?{" "}
              <Link href="/login" className="text-ember hover:underline">
                Inloggen
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal p-4">
      <Card className="w-full max-w-md bg-coals border-ash">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-heading text-ash">Inloggen</CardTitle>
          <CardDescription className="text-smoke">
            Welkom terug bij Stook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full bg-ember hover:bg-ember/90 text-white"
              disabled={loading}
            >
              {loading ? "Inloggen..." : "Inloggen"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-smoke text-sm">
              Nog geen account?{" "}
              <Link href="/register" className="text-ember hover:underline">
                Registreren
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const router = useRouter();

  // Debug Supabase configuratie
  useEffect(() => {
    const debug = `
      Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
      Current Origin: ${window.location.origin}
      Redirect URL: ${window.location.origin}/auth/callback
    `;
    setDebugInfo(debug);
    console.log("=== SUPABASE CONFIG DEBUG ===");
    console.log(debug);
  }, []);

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
      
      // Debug info (alleen in development)
      if (process.env.NODE_ENV === 'development') {
        console.log("=== REGISTRATION DEBUG ===");
        console.log("Email:", email);
        console.log("Display Name:", displayName);
        console.log("Redirect URL:", `${window.location.origin}/auth/callback`);
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      }
      
      // Eerst controleren of het email adres al bestaat via een server action
      try {
        const checkResponse = await fetch('/api/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        if (!checkResponse.ok) {
          console.error("Email check failed with status:", checkResponse.status);
          // Ga door met registratie als check faalt
        } else {
          const checkResult = await checkResponse.json();
          
          if (checkResult.exists) {
            setIsDuplicateEmail(true);
            toast.error("Dit email adres is al geregistreerd.");
            return;
          }
          
          if (checkResult.error) {
            console.log("Email check warning:", checkResult.error);
            // Ga door met registratie
          }
        }
      } catch (checkErr) {
        console.error("Email check error:", checkErr);
        // Ga door met registratie als check faalt
      }
      
      // Nu proberen te registreren
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // Debug response (alleen in development)
      if (process.env.NODE_ENV === 'development') {
        console.log("=== SIGNUP RESPONSE ===");
        console.log("Data:", data);
        console.log("Error:", error);
        console.log("User:", data?.user);
        console.log("Session:", data?.session);
      }

      if (error) {
        console.error("SIGNUP ERROR:", error);
        
        // Specifieke foutmeldingen voor verschillende scenario's
        let errorMessage = "Er is iets misgegaan bij het registreren";
        
        if (error.message.includes("already registered") || 
            error.message.includes("already been registered") ||
            error.message.includes("User already registered")) {
          errorMessage = "Dit email adres is al geregistreerd.";
          setIsDuplicateEmail(true);
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Voer een geldig email adres in";
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Wachtwoord moet minimaal 6 karakters lang zijn";
        } else if (error.message.includes("Signup is disabled")) {
          errorMessage = "Registratie is tijdelijk uitgeschakeld";
        } else {
          errorMessage = `Registratie fout: ${error.message}`;
        }
        
        toast.error(errorMessage);
        return;
      }

      if (data.user) {
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ USER CREATED SUCCESSFULLY");
          console.log("User ID:", data.user.id);
          console.log("Email confirmed:", data.user.email_confirmed_at);
        }
        toast.success("Account aangemaakt! Check je email voor verificatie.");
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log("❌ NO USER IN RESPONSE");
        }
        toast.error("Geen gebruiker aangemaakt - onbekende fout");
      }
      
      router.push("/login");
    } catch (err) {
      console.error("CATCH ERROR:", err);
      toast.error(`Er is iets misgegaan: ${err instanceof Error ? err.message : 'Onbekende fout'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-coals border-ash">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-ash font-heading">Registreren</CardTitle>
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
          
          {/* Speciale melding voor duplicate email */}
          {isDuplicateEmail && (
            <div className="mt-4 p-4 bg-ember/10 border border-ember/20 rounded-lg">
              <p className="text-ember text-sm text-center mb-3">
                Dit email adres is al geregistreerd.
              </p>
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-ember hover:text-ember/80 font-medium underline"
                >
                  Ga naar inloggen
                </Link>
                <span className="text-smoke mx-2">of</span>
                <button 
                  onClick={() => {
                    setEmail("");
                    setIsDuplicateEmail(false);
                  }}
                  className="text-ember hover:text-ember/80 font-medium underline"
                >
                  probeer een ander email adres
                </button>
              </div>
            </div>
          )}
          
          {/* Debug info - alleen in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-300">
              <strong>Debug Info:</strong>
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

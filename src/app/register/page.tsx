import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-coals border-ash">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-ash font-outfit">Registreren</CardTitle>
          <p className="text-smoke">Word onderdeel van de BBQ community</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-ash">Naam</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Je naam"
              className="bg-charcoal border-ash text-ash"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-ash">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="je@email.com"
              className="bg-charcoal border-ash text-ash"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-ash">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="bg-charcoal border-ash text-ash"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-ash">Bevestig wachtwoord</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="bg-charcoal border-ash text-ash"
            />
          </div>
          <Button className="w-full bg-ember hover:bg-ember/90 text-white">
            Registreren
          </Button>
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

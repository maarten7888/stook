import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-coals border-ash">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-ash font-outfit">Inloggen</CardTitle>
          <p className="text-smoke">Welkom terug bij Stook</p>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <Button className="w-full bg-ember hover:bg-ember/90 text-white">
            Inloggen
          </Button>
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

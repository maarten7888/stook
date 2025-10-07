"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewRecipePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, visibility: "private" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Mislukt");
      } else {
        const body = await res.json();
        router.push(`/recipes/${body.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-coals border-ash">
        <CardHeader>
          <CardTitle className="text-ash">Nieuw recept</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Titel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-charcoal border-ash text-ash"
              />
            </div>
            <div>
              <Input
                placeholder="Korte beschrijving (optioneel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-charcoal border-ash text-ash"
              />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <Button type="submit" disabled={loading} className="bg-ember hover:bg-ember/90">
              {loading ? "Aanmaken..." : "Aanmaken"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



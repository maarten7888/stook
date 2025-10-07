"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/recipes/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Laden mislukt");
        const data: { title?: string; description?: string | null } = await res.json();
        if (!active) return;
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fout");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error("Opslaan mislukt");
      router.push(`/recipes/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Weet je zeker dat je dit recept wilt verwijderen?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Verwijderen mislukt");
      router.push("/recipes");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-smoke">Laden…</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-coals border-ash">
        <CardHeader>
          <CardTitle className="text-ash">Recept bewerken</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-charcoal border-ash text-ash"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-charcoal border-ash text-ash"
            />
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="bg-ember hover:bg-ember/90">
                {saving ? "Opslaan…" : "Opslaan"}
              </Button>
              <Button type="button" variant="outline" className="border-ash text-ash" onClick={onDelete} disabled={saving}>
                Verwijderen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



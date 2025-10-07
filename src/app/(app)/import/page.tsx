"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, ChefHat, Clock, Users, Thermometer } from "lucide-react";
import { redirect } from "next/navigation";

interface ImportPreview {
  url: string;
  title: string;
  description?: string;
  serves?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  targetInternalTemp?: number;
  ingredients: Array<{
    name: string;
    amount?: number;
    unit?: string;
  }>;
  steps: Array<{
    instruction: string;
    timerMinutes?: number;
    targetTemp?: number;
  }>;
  confidence: number;
  source: string;
}

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPreview(null);

    try {
      const response = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to preview recipe");
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setImporting(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: preview.url }),
      });

      if (!response.ok) {
        throw new Error("Failed to import recipe");
      }

      const data = await response.json();
      redirect(`/recipes/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-ash">Recept importeren</h1>
        <p className="text-smoke mt-2">
          Importeer recepten van populaire BBQ websites met één klik
        </p>
      </div>

      <Card className="bg-coals border-ash">
        <CardHeader>
          <CardTitle className="text-ash">URL importeren</CardTitle>
          <CardDescription className="text-smoke">
            Plak de URL van een BBQ recept om het te importeren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-ash">Recept URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://bbqnerds.nl/recepten/brisket..."
                className="bg-charcoal border-ash text-ash"
                required
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}
            <Button
              type="submit"
              className="bg-ember hover:bg-ember/90"
              disabled={loading}
            >
              {loading ? "Preview laden..." : "Preview"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {preview && (
        <Card className="bg-coals border-ash">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-ash">{preview.title}</CardTitle>
                <CardDescription className="text-smoke mt-1">
                  {preview.description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-ash text-smoke">
                  {preview.source}
                </Badge>
                <Badge 
                  variant={preview.confidence > 0.8 ? "default" : "secondary"}
                  className={preview.confidence > 0.8 ? "bg-ember" : ""}
                >
                  {Math.round(preview.confidence * 100)}% match
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipe Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {preview.serves && (
                <div className="flex items-center gap-2 text-smoke">
                  <Users className="h-4 w-4" />
                  {preview.serves} personen
                </div>
              )}
              {preview.prepMinutes && (
                <div className="flex items-center gap-2 text-smoke">
                  <ChefHat className="h-4 w-4" />
                  {preview.prepMinutes} min prep
                </div>
              )}
              {preview.cookMinutes && (
                <div className="flex items-center gap-2 text-smoke">
                  <Clock className="h-4 w-4" />
                  {preview.cookMinutes} min koken
                </div>
              )}
              {preview.targetInternalTemp && (
                <div className="flex items-center gap-2 text-smoke">
                  <Thermometer className="h-4 w-4" />
                  {preview.targetInternalTemp}°C
                </div>
              )}
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="text-lg font-heading text-ash mb-3">Ingrediënten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {preview.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2 text-smoke">
                    <span className="text-ash">
                      {ingredient.amount && ingredient.unit 
                        ? `${ingredient.amount} ${ingredient.unit}`
                        : ingredient.amount || ""
                      }
                    </span>
                    <span>{ingredient.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <h3 className="text-lg font-heading text-ash mb-3">Stappen</h3>
              <div className="space-y-3">
                {preview.steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-ember text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-ash">{step.instruction}</p>
                      {(step.timerMinutes || step.targetTemp) && (
                        <div className="flex items-center gap-4 mt-1 text-sm text-smoke">
                          {step.timerMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {step.timerMinutes} min
                            </span>
                          )}
                          {step.targetTemp && (
                            <span className="flex items-center gap-1">
                              <Thermometer className="h-3 w-3" />
                              {step.targetTemp}°C
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-ash">
              <Button
                onClick={handleImport}
                className="bg-ember hover:bg-ember/90"
                disabled={importing}
              >
                <Download className="h-4 w-4 mr-2" />
                {importing ? "Importeren..." : "Importeren"}
              </Button>
              <Button
                variant="outline"
                className="border-ash text-ash"
                onClick={() => window.open(preview.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Origineel bekijken
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

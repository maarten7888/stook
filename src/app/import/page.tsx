"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { OcrPhotoUploader } from "@/components/ocr-photo-uploader";
import { 
  Download, 
  ExternalLink, 
  ChefHat, 
  Clock, 
  Users, 
  Thermometer, 
  Globe, 
  Camera,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";

interface ImportPreview {
  url?: string;
  path?: string;
  title: string;
  description?: string | null;
  serves?: number | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  targetInternalTemp?: number | null;
  ingredients: Array<{
    name: string;
    amount?: number | null;
    unit?: string | null;
  }>;
  steps: Array<{
    instruction: string;
    timerMinutes?: number | null;
    targetTemp?: number | null;
  }>;
  confidence: number;
  confidenceDetails?: {
    overall: number;
    title: number;
    ingredients: number;
    steps: number;
  };
  source: string;
}

export default function ImportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("url");
  
  // URL import state
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  
  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  
  // Shared state
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // URL Import handlers
  const handleUrlPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlLoading(true);
    setError("");
    setPreview(null);

    try {
      const response = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kon recept niet laden");
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview mislukt");
    } finally {
      setUrlLoading(false);
    }
  };

  // OCR handlers
  const handleOcrComplete = async (result: { rawText: string; path: string; confidence: number }) => {
    setOcrLoading(true);
    setError("");

    try {
      const response = await fetch("/api/import/photo/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawText: result.rawText, 
          path: result.path 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kon tekst niet verwerken");
      }

      const data = await response.json();
      setPreview(data);
      // Auto-enable edit mode for OCR imports (vaak correcties nodig)
      setEditMode(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verwerking mislukt");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOcrError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Import handler
  const handleImport = async () => {
    if (!preview) return;

    setImporting(true);
    setError("");

    try {
      let response;

      if (preview.path) {
        // OCR import
        response = await fetch("/api/import/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: preview.path,
            title: preview.title,
            description: preview.description,
            serves: preview.serves,
            prepMinutes: preview.prepMinutes,
            cookMinutes: preview.cookMinutes,
            targetInternalTemp: preview.targetInternalTemp,
            ingredients: preview.ingredients,
            steps: preview.steps,
          }),
        });
      } else {
        // URL import
        response = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: preview.url }),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Import mislukt");
      }

      const data = await response.json();
      router.push(`/recipes/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import mislukt");
    } finally {
      setImporting(false);
    }
  };

  // Edit handlers
  const updatePreviewField = (field: keyof ImportPreview, value: unknown) => {
    if (!preview) return;
    setPreview({ ...preview, [field]: value });
  };

  const updateIngredient = (index: number, field: string, value: unknown) => {
    if (!preview) return;
    const newIngredients = [...preview.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setPreview({ ...preview, ingredients: newIngredients });
  };

  const addIngredient = () => {
    if (!preview) return;
    setPreview({
      ...preview,
      ingredients: [...preview.ingredients, { name: "", amount: null, unit: null }],
    });
  };

  const removeIngredient = (index: number) => {
    if (!preview) return;
    setPreview({
      ...preview,
      ingredients: preview.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateStep = (index: number, field: string, value: unknown) => {
    if (!preview) return;
    const newSteps = [...preview.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setPreview({ ...preview, steps: newSteps });
  };

  const addStep = () => {
    if (!preview) return;
    setPreview({
      ...preview,
      steps: [...preview.steps, { instruction: "", timerMinutes: null, targetTemp: null }],
    });
  };

  const removeStep = (index: number) => {
    if (!preview) return;
    setPreview({
      ...preview,
      steps: preview.steps.filter((_, i) => i !== index),
    });
  };

  const resetPreview = () => {
    setPreview(null);
    setEditMode(false);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-ash">Recept importeren</h1>
        <p className="text-smoke mt-2">
          Importeer recepten van websites of maak een foto van een recept
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetPreview(); }}>
        <TabsList className="bg-coals border border-ash">
          <TabsTrigger 
            value="url" 
            className="data-[state=active]:bg-ember data-[state=active]:text-white"
          >
            <Globe className="h-4 w-4 mr-2" />
            Van website
          </TabsTrigger>
          <TabsTrigger 
            value="photo"
            className="data-[state=active]:bg-ember data-[state=active]:text-white"
          >
            <Camera className="h-4 w-4 mr-2" />
            Van foto
          </TabsTrigger>
        </TabsList>

        {/* URL Tab */}
        <TabsContent value="url">
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash">URL importeren</CardTitle>
              <CardDescription className="text-smoke">
                Plak de URL van een BBQ recept om het te importeren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUrlPreview} className="space-y-4">
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
                {error && activeTab === "url" && (
                  <div className="text-red-400 text-sm">{error}</div>
                )}
                <Button
                  type="submit"
                  className="bg-ember hover:bg-ember/90"
                  disabled={urlLoading}
                >
                  {urlLoading ? "Preview laden..." : "Preview"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photo Tab */}
        <TabsContent value="photo">
          <div className="space-y-4">
            <OcrPhotoUploader 
              onOcrComplete={handleOcrComplete}
              onError={handleOcrError}
            />
            {error && activeTab === "photo" && !preview && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            {ocrLoading && (
              <Card className="bg-coals border-ash">
                <CardContent className="py-8 text-center">
                  <div className="animate-pulse">
                    <p className="text-ash">Recept verwerken...</p>
                    <p className="text-smoke text-sm mt-2">
                      Even geduld terwijl we de tekst analyseren
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Card */}
      {preview && (
        <Card className="bg-coals border-ash">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {editMode ? (
                  <Input
                    value={preview.title}
                    onChange={(e) => updatePreviewField("title", e.target.value)}
                    className="bg-charcoal border-ash text-ash text-xl font-heading"
                  />
                ) : (
                  <CardTitle className="text-ash">{preview.title}</CardTitle>
                )}
                {editMode ? (
                  <Textarea
                    value={preview.description || ""}
                    onChange={(e) => updatePreviewField("description", e.target.value)}
                    placeholder="Beschrijving..."
                    className="bg-charcoal border-ash text-smoke mt-2"
                    rows={2}
                  />
                ) : (
                  preview.description && (
                    <CardDescription className="text-smoke mt-1">
                      {preview.description}
                    </CardDescription>
                  )
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-ash text-smoke">
                    {preview.source}
                  </Badge>
                  <Badge 
                    variant={preview.confidence > 0.8 ? "default" : "secondary"}
                    className={preview.confidence > 0.8 ? "bg-green-600" : preview.confidence > 0.6 ? "bg-amber-600" : "bg-red-600"}
                  >
                    {Math.round(preview.confidence * 100)}% match
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                  className="text-smoke hover:text-ash"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  {editMode ? "Klaar" : "Bewerken"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipe Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {editMode ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-smoke text-xs">Personen</Label>
                    <Input
                      type="number"
                      value={preview.serves || ""}
                      onChange={(e) => updatePreviewField("serves", e.target.value ? Number(e.target.value) : null)}
                      className="bg-charcoal border-ash text-ash h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-smoke text-xs">Voorbereiden (min)</Label>
                    <Input
                      type="number"
                      value={preview.prepMinutes || ""}
                      onChange={(e) => updatePreviewField("prepMinutes", e.target.value ? Number(e.target.value) : null)}
                      className="bg-charcoal border-ash text-ash h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-smoke text-xs">Kooktijd (min)</Label>
                    <Input
                      type="number"
                      value={preview.cookMinutes || ""}
                      onChange={(e) => updatePreviewField("cookMinutes", e.target.value ? Number(e.target.value) : null)}
                      className="bg-charcoal border-ash text-ash h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-smoke text-xs">Kerntemp (°C)</Label>
                    <Input
                      type="number"
                      value={preview.targetInternalTemp || ""}
                      onChange={(e) => updatePreviewField("targetInternalTemp", e.target.value ? Number(e.target.value) : null)}
                      className="bg-charcoal border-ash text-ash h-9"
                    />
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-heading text-ash">Ingrediënten</h3>
                {editMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addIngredient}
                    className="text-ember hover:text-ember/80"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Toevoegen
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {preview.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {editMode ? (
                      <>
                        <Input
                          type="number"
                          value={ingredient.amount || ""}
                          onChange={(e) => updateIngredient(index, "amount", e.target.value ? Number(e.target.value) : null)}
                          placeholder="Aantal"
                          className="bg-charcoal border-ash text-ash w-20 h-8"
                        />
                        <Input
                          value={ingredient.unit || ""}
                          onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                          placeholder="Eenheid"
                          className="bg-charcoal border-ash text-ash w-20 h-8"
                        />
                        <Input
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(index, "name", e.target.value)}
                          placeholder="Ingrediënt"
                          className="bg-charcoal border-ash text-ash flex-1 h-8"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="p-1 text-smoke hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-ash">
                          {ingredient.amount && ingredient.unit 
                            ? `${ingredient.amount} ${ingredient.unit}`
                            : ingredient.amount || ""
                          }
                        </span>
                        <span className="text-smoke">{ingredient.name}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-heading text-ash">Stappen</h3>
                {editMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addStep}
                    className="text-ember hover:text-ember/80"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Toevoegen
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {preview.steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-ember text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      {editMode ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Textarea
                              value={step.instruction}
                              onChange={(e) => updateStep(index, "instruction", e.target.value)}
                              className="bg-charcoal border-ash text-ash flex-1"
                              rows={2}
                            />
                            <button
                              type="button"
                              onClick={() => removeStep(index)}
                              className="p-1 text-smoke hover:text-red-400 self-start"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-smoke" />
                              <Input
                                type="number"
                                value={step.timerMinutes || ""}
                                onChange={(e) => updateStep(index, "timerMinutes", e.target.value ? Number(e.target.value) : null)}
                                placeholder="min"
                                className="bg-charcoal border-ash text-ash w-16 h-7 text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Thermometer className="h-3 w-3 text-smoke" />
                              <Input
                                type="number"
                                value={step.targetTemp || ""}
                                onChange={(e) => updateStep(index, "targetTemp", e.target.value ? Number(e.target.value) : null)}
                                placeholder="°C"
                                className="bg-charcoal border-ash text-ash w-16 h-7 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-ash">
              <Button
                onClick={handleImport}
                className="bg-ember hover:bg-ember/90"
                disabled={importing || !preview.title}
              >
                <Download className="h-4 w-4 mr-2" />
                {importing ? "Importeren..." : "Importeren"}
              </Button>
              {preview.url && (
                <Button
                  variant="outline"
                  className="border-ash text-ash"
                  onClick={() => window.open(preview.url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Origineel bekijken
                </Button>
              )}
              <Button
                variant="ghost"
                className="text-smoke hover:text-ash"
                onClick={resetPreview}
              >
                Annuleren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

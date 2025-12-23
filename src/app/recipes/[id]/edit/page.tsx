"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChefHat, Trash2, ArrowLeft } from "lucide-react";
import { PhotoUploader } from "@/components/photo-uploader";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  id: string;
  orderNo: number;
  instruction: string;
  timerMinutes: string;
}

interface RecipeData {
  id: string;
  title: string;
  description: string | null;
  serves: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  targetInternalTemp: number | null;
  visibility: string;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
}

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic recipe info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serves, setServes] = useState("");
  const [prepMinutes, setPrepMinutes] = useState("");
  const [cookMinutes, setCookMinutes] = useState("");
  const [targetInternalTemp, setTargetInternalTemp] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  // Ingredients
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Steps
  const [steps, setSteps] = useState<Step[]>([]);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Photos
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; path?: string; type: "prep" | "final" | "session" }>>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/recipes/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Laden mislukt");
        const data: RecipeData = await res.json();
        if (!active) return;
        
        // Set basic info
        setTitle(data.title);
        setDescription(data.description || "");
        setServes(data.serves?.toString() || "");
        setPrepMinutes(data.prepMinutes?.toString() || "");
        setCookMinutes(data.cookMinutes?.toString() || "");
        setTargetInternalTemp(data.targetInternalTemp?.toString() || "");
        setVisibility(data.visibility as "private" | "public");
        
        // Set ingredients
        setIngredients(data.ingredients || []);
        
        // Set steps
        setSteps(data.steps || []);
        
        // Set tags
        setTags(data.tags || []);

        // Fetch existing photos
        if (active) {
          try {
            const photosRes = await fetch(`/api/recipes/${id}/photos`);
            if (photosRes.ok) {
              const { photos: existingPhotos } = await photosRes.json();
              setPhotos(existingPhotos || []);
            }
          } catch (photoError) {
            console.error("Error fetching photos:", photoError);
          }
        }
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

  const addIngredient = () => {
    const newId = (ingredients.length + 1).toString();
    setIngredients([...ingredients, { id: newId, name: "", amount: "", unit: "" }]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ));
  };

  const addStep = () => {
    const newId = (steps.length + 1).toString();
    setSteps([...steps, { id: newId, orderNo: steps.length + 1, instruction: "", timerMinutes: "" }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      const newSteps = steps.filter(step => step.id !== id);
      // Reorder steps
      setSteps(newSteps.map((step, index) => ({ ...step, orderNo: index + 1 })));
    }
  };

  const updateStep = (id: string, field: keyof Step, value: string | number) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Prepare recipe data
      const recipeData = {
        title,
        description: description || undefined,
        serves: serves ? parseInt(serves) : undefined,
        prepMinutes: prepMinutes ? parseInt(prepMinutes) : undefined,
        cookMinutes: cookMinutes ? parseInt(cookMinutes) : undefined,
        targetInternalTemp: targetInternalTemp ? parseInt(targetInternalTemp) : undefined,
        visibility,
        ingredients: ingredients.filter(ing => ing.name.trim()),
        steps: steps.filter(step => step.instruction.trim()),
        tags: tags
      };

      const res = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipeData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Opslaan mislukt");
      } else {
        router.push(`/recipes/${id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Weet je zeker dat je dit recept wilt verwijderen?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Verwijderen mislukt");
      }
      router.push("/recipes");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fout bij verwijderen");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center">
      <div className="text-ash text-lg">Laden...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="text-smoke hover:text-ash">
            <Link href={`/recipes/${id}`}>
              <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Terug naar recept</span>
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onDelete}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Verwijderen
          </Button>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-heading font-bold text-ash mb-8">Recept Bewerken</h1>
        <form onSubmit={onSave} className="space-y-8">
          {/* Basic Info */}
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-xl text-ash flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-ember" />
                Basis Informatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-ash">Titel *</Label>
                <Input
                  id="title"
                  placeholder="Bijv. Texas Style Brisket"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-charcoal border-ash text-ash"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-ash">Beschrijving</Label>
                <Textarea
                  id="description"
                  placeholder="Korte beschrijving van het recept..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-charcoal border-ash text-ash"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="serves" className="text-ash">Porties</Label>
                  <Input
                    id="serves"
                    type="number"
                    placeholder="4"
                    value={serves}
                    onChange={(e) => setServes(e.target.value)}
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
                
                <div>
                  <Label htmlFor="prepMinutes" className="text-ash">Prep tijd (min)</Label>
                  <Input
                    id="prepMinutes"
                    type="number"
                    placeholder="30"
                    value={prepMinutes}
                    onChange={(e) => setPrepMinutes(e.target.value)}
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cookMinutes" className="text-ash">Kook tijd (min)</Label>
                  <Input
                    id="cookMinutes"
                    type="number"
                    placeholder="180"
                    value={cookMinutes}
                    onChange={(e) => setCookMinutes(e.target.value)}
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
                
                <div>
                  <Label htmlFor="targetInternalTemp" className="text-ash">Doel temp (°C)</Label>
                  <Input
                    id="targetInternalTemp"
                    type="number"
                    placeholder="95"
                    value={targetInternalTemp}
                    onChange={(e) => setTargetInternalTemp(e.target.value)}
                    className="bg-charcoal border-ash text-ash"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="visibility" className="text-ash">Zichtbaarheid</Label>
                <Select value={visibility} onValueChange={(value: "private" | "public") => setVisibility(value)}>
                  <SelectTrigger className="bg-charcoal border-ash text-ash">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Privé (alleen jij)</SelectItem>
                    <SelectItem value="public">Publiek (iedereen)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-xl text-ash">Ingrediënten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredients.map((ingredient) => (
                <div key={ingredient.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label className="text-sm text-smoke">Ingrediënt</Label>
                    <Input
                      placeholder="Bijv. Brisket"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(ingredient.id, "name", e.target.value)}
                      className="bg-charcoal border-ash text-ash"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-sm text-smoke">Hoeveelheid</Label>
                    <Input
                      placeholder="4"
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(ingredient.id, "amount", e.target.value)}
                      className="bg-charcoal border-ash text-ash"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-sm text-smoke">Eenheid</Label>
                    <Input
                      placeholder="kg"
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(ingredient.id, "unit", e.target.value)}
                      className="bg-charcoal border-ash text-ash"
                    />
                  </div>
                  <div className="col-span-1">
                    {ingredients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(ingredient.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addIngredient}
                className="border-ember text-ember hover:bg-ember hover:text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ingrediënt toevoegen
              </Button>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-xl text-ash">Bereidingswijze</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-ember rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{step.orderNo}</span>
                    </div>
                    <Label className="text-sm text-smoke">Stap {step.orderNo}</Label>
                    {steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="text-red-400 hover:text-red-300 ml-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Beschrijf wat er moet gebeuren..."
                    value={step.instruction}
                    onChange={(e) => updateStep(step.id, "instruction", e.target.value)}
                    className="bg-charcoal border-ash text-ash"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tijd in minuten (optioneel)"
                      value={step.timerMinutes}
                      onChange={(e) => updateStep(step.id, "timerMinutes", e.target.value)}
                      className="bg-charcoal border-ash text-ash w-32"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addStep}
                className="border-ember text-ember hover:bg-ember hover:text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Stap toevoegen
              </Button>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-xl text-ash">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Bijv. low&slow, brisket, texas-style"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  className="bg-charcoal border-ash text-ash"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  className="bg-ember hover:bg-ember/90"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-ember/20 text-ember border-ember/30"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag)}
                        className="ml-2 h-auto p-0 text-ember hover:text-ember/70"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos Upload */}
          <PhotoUploader 
            recipeId={id}
            onPhotosChange={setPhotos}
            existingPhotos={photos}
          />

          {/* Submit */}
          <Card className="bg-coals border-ash">
            <CardContent className="p-6">
              {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="bg-ember hover:bg-ember/90 flex-1"
                >
                  {saving ? "Opslaan..." : "Wijzigingen Opslaan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
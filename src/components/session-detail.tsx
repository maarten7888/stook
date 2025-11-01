"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Camera, Star, CheckCircle, Upload, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface SessionData {
  id: string;
  recipeId: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  rating?: number;
  conclusion?: string;
  adjustments?: Record<string, unknown>;
  recipeSnapshot?: {
    title: string;
    description?: string;
    serves?: number;
    prepMinutes?: number;
    cookMinutes?: number;
    targetInternalTemp?: number;
  };
  recipe?: {
    id: string;
    title: string;
    description?: string;
    visibility: string;
    serves?: number;
    prepMinutes?: number;
    cookMinutes?: number;
    targetInternalTemp?: number;
  };
}

interface TemperatureReading {
  id: string;
  cookSessionId: string;
  recordedAt: string;
  grateTemp?: number;
  meatTemp?: number;
  probeName?: string;
}

interface Photo {
  id: string;
  signedUrl: string;
  type?: string;
  createdAt?: string;
}

interface SessionDetailProps {
  sessionData: SessionData;
  temps: TemperatureReading[];
  photos: Photo[];
}

export default function SessionDetail({ sessionData, temps, photos }: SessionDetailProps) {
  const [currentRating, setCurrentRating] = useState(sessionData.rating || 0);
  const [notes, setNotes] = useState(sessionData.notes || "");
  const [conclusion, setConclusion] = useState(sessionData.conclusion || "");
  const [grateTemp, setGrateTemp] = useState("");
  const [meatTemp, setMeatTemp] = useState("");
  const [probeName, setProbeName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadType, setUploadType] = useState<"prep" | "session" | "final">("session");
  const [currentTemps, setCurrentTemps] = useState<TemperatureReading[]>(temps);

  const isActive = !sessionData.endedAt;
  
  // Calculate duration
  const getDuration = () => {
    const endTime = sessionData.endedAt ? new Date(sessionData.endedAt).getTime() : Date.now();
    const startTime = new Date(sessionData.startedAt).getTime();
    const diffMs = endTime - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  const duration = getDuration();

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  // Auto-save debounced function
  const saveSession = useCallback(async (notesValue: string, conclusionValue: string, ratingValue: number) => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/sessions/${sessionData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notesValue,
          conclusion: conclusionValue,
          rating: ratingValue,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
    } catch (error) {
      console.error("Error saving session:", error);
      // Silent fail for auto-save
    } finally {
      setIsSaving(false);
    }
  }, [sessionData.id, isSaving]);

  // Debounced auto-save for notes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== (sessionData.notes || "") || conclusion !== (sessionData.conclusion || "") || currentRating !== (sessionData.rating || 0)) {
        saveSession(notes, conclusion, currentRating);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [notes, conclusion, currentRating, sessionData.notes, sessionData.conclusion, sessionData.rating, saveSession]);

  const handleFinishSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionData.id}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          conclusion,
          rating: currentRating,
        }),
      });

      if (!response.ok) throw new Error("Failed to finish session");
      
      toast.success("Sessie beëindigd!");
      // Reload page to show updated session
      window.location.reload();
    } catch (error) {
      console.error("Error finishing session:", error);
      toast.error("Fout bij beëindigen sessie");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTemperature = async () => {
    if (!grateTemp && !meatTemp) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionData.id}/temps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grateTemp: grateTemp ? parseInt(grateTemp) : undefined,
          meatTemp: meatTemp ? parseInt(meatTemp) : undefined,
          probeName: probeName || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to add temperature");
      
      const newTemp = await response.json();
      setCurrentTemps([newTemp, ...currentTemps]);
      
      // Clear form
      setGrateTemp("");
      setMeatTemp("");
      setProbeName("");
      toast.success("Temperatuurmeting toegevoegd");
    } catch (error) {
      console.error("Error adding temperature:", error);
      toast.error("Fout bij toevoegen temperatuurmeting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("cookSessionId", sessionData.id);
      formData.append("type", uploadType);

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload photo");
      
      toast.success("Foto geüpload!");
      // Reload page to show new photo
      window.location.reload();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Fout bij uploaden foto");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const recipeInfo = sessionData.recipe || sessionData.recipeSnapshot;

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with back button and title */}
        <div className="mb-8">
          <div className="mb-6">
            <Button asChild variant="ghost" size="sm" className="text-smoke hover:text-ash">
              <Link href="/sessions">
                <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Terug naar sessies</span>
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-heading font-bold text-ash mb-4">
            {recipeInfo?.title || "Kooksessie"}
          </h1>
        </div>

        {/* Two Column Layout: Left (Session Details) | Right (Recipe Info + Evaluation) */}
        {/* Mobile: Single column, Desktop: Two columns (2/3 + 1/3) */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          {/* Left Column - Session Details */}
          <div className="flex flex-col lg:col-span-2 space-y-8">
            {/* Sessie Status */}
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Sessie Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-smoke text-sm">Gestart</Label>
                    <div className="text-red-400 font-medium">
                      {formatTime(sessionData.startedAt)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-smoke text-sm">Beëindigd</Label>
                    <div className={sessionData.endedAt ? "text-green-400 font-medium" : "text-smoke font-medium"}>
                      {sessionData.endedAt ? formatTime(sessionData.endedAt) : "Nog actief"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-smoke text-sm">Duur</Label>
                    <div className="text-ash font-medium">
                      {duration.hours}h {duration.minutes}m
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-smoke text-sm">Temperatuurmetingen</Label>
                    <div className="text-ash font-medium">
                      {currentTemps.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notities */}
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Notities</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Voeg notities toe over je kooksessie..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-charcoal border-ash text-ash min-h-[120px]"
                />
                {isSaving && (
                  <p className="text-xs text-smoke mt-2">Opslaan...</p>
                )}
              </CardContent>
            </Card>

            {/* Temperatuurverloop */}
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Temperatuurverloop
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentTemps.length === 0 ? (
                  <div className="text-center py-8 text-smoke">
                    <Thermometer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nog geen temperatuurmetingen</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {currentTemps.map((temp) => (
                        <div
                          key={temp.id}
                          className="flex items-center gap-4 p-4 bg-charcoal/50 rounded-lg border border-ash/20"
                        >
                          <div className="text-smoke text-sm min-w-[60px]">
                            {formatTime(temp.recordedAt)}
                          </div>
                          {temp.grateTemp && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-ember rounded-full"></div>
                              <span className="text-ember font-semibold">{temp.grateTemp}°C</span>
                            </div>
                          )}
                          {temp.meatTemp && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-400 font-semibold">{temp.meatTemp}°C</span>
                            </div>
                          )}
                          {temp.probeName && (
                            <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30 ml-auto">
                              {temp.probeName}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Form to add new temperature */}
                    <div className="space-y-4 pt-4 border-t border-ash/20">
                      <Label className="text-ash">Nieuwe meting toevoegen</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="grateTemp" className="text-smoke text-sm">Grill temp (°C)</Label>
                          <Input
                            id="grateTemp"
                            type="number"
                            placeholder="200"
                            value={grateTemp}
                            onChange={(e) => setGrateTemp(e.target.value)}
                            className="bg-charcoal border-ash text-ash"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="meatTemp" className="text-smoke text-sm">Vlees temp (°C)</Label>
                          <Input
                            id="meatTemp"
                            type="number"
                            placeholder="65"
                            value={meatTemp}
                            onChange={(e) => setMeatTemp(e.target.value)}
                            className="bg-charcoal border-ash text-ash"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="probeName" className="text-smoke text-sm">Probe naam (optioneel)</Label>
                        <Input
                          id="probeName"
                          placeholder="Bijv. Meat Probe 1"
                          value={probeName}
                          onChange={(e) => setProbeName(e.target.value)}
                          className="bg-charcoal border-ash text-ash"
                        />
                      </div>
                      <Button
                        onClick={handleAddTemperature}
                        disabled={isLoading || (!grateTemp && !meatTemp)}
                        className="bg-ember hover:bg-ember/90"
                      >
                        <Thermometer className="h-4 w-4 mr-2" />
                        {isLoading ? "Toevoegen..." : "Meting toevoegen"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Foto's */}
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Foto&apos;s
                </CardTitle>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <div className="text-center py-8 text-smoke">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nog geen foto&apos;s toegevoegd</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="group relative aspect-square bg-charcoal rounded-lg border border-ash overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.signedUrl}
                            alt={`Sessie foto ${photo.id}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload section */}
                <div className="mt-6 space-y-4">
                  <div className="border-2 border-dashed border-ash rounded-lg p-6 text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-smoke" />
                    <p className="text-ash font-medium mb-1">Foto&apos;s uploaden</p>
                    <p className="text-sm text-smoke mb-4">
                      Sleep foto&apos;s hierheen of klik om te selecteren
                    </p>

                    {/* Upload type selector */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
                      <Button
                        variant={uploadType === "prep" ? "default" : "outline"}
                        className={uploadType === "prep" ? "bg-ember hover:bg-ember/90" : "border-ash text-ash"}
                        onClick={() => setUploadType("prep")}
                        size="sm"
                      >
                        Voorbereiding
                      </Button>
                      <Button
                        variant={uploadType === "session" ? "default" : "outline"}
                        className={uploadType === "session" ? "bg-ember hover:bg-ember/90" : "border-ash text-ash"}
                        onClick={() => setUploadType("session")}
                        size="sm"
                      >
                        Tijdens koken
                      </Button>
                      <Button
                        variant={uploadType === "final" ? "default" : "outline"}
                        className={uploadType === "final" ? "bg-ember hover:bg-ember/90" : "border-ash text-ash"}
                        onClick={() => setUploadType("final")}
                        size="sm"
                      >
                        Eindresultaat
                      </Button>
                    </div>

                    {/* File input */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <Button
                        variant="outline"
                        className="border-ash text-ash"
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploaden..." : "Foto selecteren"}
                      </Button>
                    </div>

                    <p className="text-xs text-smoke mt-2">
                      JPG, PNG of WebP. Max 8MB per foto.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recipe Info + Evaluation */}
          <div className="flex flex-col lg:col-span-1 space-y-8">
            {/* Recept Info */}
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Recept Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-smoke">Porties</span>
                    <span className="text-ember font-semibold">{recipeInfo?.serves || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-smoke">Voorbereiding</span>
                    <span className="text-ember font-semibold">{recipeInfo?.prepMinutes ? `${recipeInfo.prepMinutes} min` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-smoke">Kooktijd</span>
                    <span className="text-ember font-semibold">{recipeInfo?.cookMinutes ? `${recipeInfo.cookMinutes} min` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-smoke">Doel temperatuur</span>
                    <span className="text-red-400 font-semibold">{recipeInfo?.targetInternalTemp ? `${recipeInfo.targetInternalTemp}°C` : '-'}</span>
                  </div>
                  {sessionData.recipe?.id && (
                    <div className="pt-4 border-t border-ash/20">
                      <Button asChild variant="outline" className="w-full border-ash text-ash hover:bg-coals">
                        <Link href={`/recipes/${sessionData.recipe.id}`}>
                          Bekijk volledig recept
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Evaluatie */}
            <Card className="bg-coals border-ash">
              <CardHeader>
                <CardTitle className="text-xl text-ash">Evaluatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Star Rating */}
                <div className="space-y-4">
                  <Label className="text-ash">Beoordeling</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-smoke text-sm">Slecht</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          onClick={() => setCurrentRating(star)}
                          className={`h-8 w-8 cursor-pointer transition-colors ${
                            star <= currentRating ? "fill-current text-ember" : "text-smoke hover:text-ember/70"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-smoke text-sm">Uitstekend</span>
                  </div>
                  {currentRating > 0 && (
                    <div className="text-sm text-smoke">
                      Huidige beoordeling: <span className="text-ember font-semibold">{currentRating}/5</span>
                    </div>
                  )}
                </div>

                {/* Conclusion Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="conclusion" className="text-ash">Evaluatie</Label>
                  <Textarea
                    id="conclusion"
                    placeholder="Wat ging goed? Wat zou je anders doen? Hoe smaakte het eindresultaat?"
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    className="bg-charcoal border-ash text-ash min-h-[120px]"
                  />
                </div>

                {/* Finish Session Button (only if active) */}
                {isActive && (
                  <Button
                    onClick={handleFinishSession}
                    disabled={isLoading}
                    className="w-full bg-ember hover:bg-ember/90"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isLoading ? "Afronden..." : "Sessie beëindigen"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

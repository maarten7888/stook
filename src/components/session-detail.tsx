"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Thermometer, Camera, Star, CheckCircle, Upload } from "lucide-react";

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
  const [adjustments, setAdjustments] = useState(
    sessionData.adjustments ? JSON.stringify(sessionData.adjustments, null, 2) : ""
  );
  const [grateTemp, setGrateTemp] = useState("");
  const [meatTemp, setMeatTemp] = useState("");
  const [probeName, setProbeName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"prep" | "session" | "final">("session");

  const isActive = !sessionData.endedAt;
  const duration = sessionData.endedAt 
    ? Math.round((new Date(sessionData.endedAt).getTime() - new Date(sessionData.startedAt).getTime()) / (1000 * 60))
    : Math.round((Date.now() - new Date(sessionData.startedAt).getTime()) / (1000 * 60));

  const handleSaveNotes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          conclusion,
          adjustments: adjustments ? JSON.parse(adjustments) : null,
          rating: currentRating,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      
      // Show success message
      console.log("Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionData.id}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          conclusion,
          adjustments: adjustments ? JSON.parse(adjustments) : null,
          rating: currentRating,
        }),
      });

      if (!response.ok) throw new Error("Failed to finish session");
      
      // Reload page to show updated session
      window.location.reload();
    } catch (error) {
      console.error("Error finishing session:", error);
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
      
      // Clear form and reload page
      setGrateTemp("");
      setMeatTemp("");
      setProbeName("");
      window.location.reload();
    } catch (error) {
      console.error("Error adding temperature:", error);
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
      
      // Reload page to show new photo
      window.location.reload();
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Er is een fout opgetreden bij het uploaden van de foto");
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

  return (
    <div className="space-y-6">
      {/* Sessie Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-ash">
            {sessionData.recipeSnapshot?.title || sessionData.recipe?.title}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-smoke">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {duration} min
            </div>
            <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-ember" : ""}>
              {isActive ? "Actief" : "Voltooid"}
            </Badge>
            {sessionData.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                {sessionData.rating}/5
              </div>
            )}
          </div>
        </div>
        {isActive && (
          <Button 
            onClick={handleFinishSession}
            disabled={isLoading}
            className="bg-ember hover:bg-ember/90"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isLoading ? "Afronden..." : "Afronden"}
          </Button>
        )}
      </div>

      {/* Sessie Status Overzicht */}
      <Card className="bg-coals border-ash">
        <CardHeader>
          <CardTitle className="text-ash">Sessie overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-smoke text-sm">Gestart</Label>
              <div className="text-ash font-medium">
                {new Date(sessionData.startedAt).toLocaleString('nl-NL')}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-smoke text-sm">Eindigt</Label>
              <div className="text-ash font-medium">
                {sessionData.endedAt 
                  ? new Date(sessionData.endedAt).toLocaleString('nl-NL')
                  : "Nog actief"
                }
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-smoke text-sm">Duur</Label>
              <div className="text-ash font-medium">
                {Math.floor(duration / 60)}u {duration % 60}m
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-smoke text-sm">Metingen</Label>
              <div className="text-ash font-medium">
                {temps.length} temperatuurmetingen
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recept Informatie */}
      <Card className="bg-coals border-ash">
        <CardHeader>
          <CardTitle className="text-ash">Recept informatie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-smoke text-sm">Porties</Label>
              <div className="text-ash font-medium">
                {sessionData.recipeSnapshot?.serves || sessionData.recipe?.serves || "--"}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-smoke text-sm">Voorbereiding</Label>
              <div className="text-ash font-medium">
                {sessionData.recipeSnapshot?.prepMinutes || sessionData.recipe?.prepMinutes || "--"} min
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-smoke text-sm">Kooktijd</Label>
              <div className="text-ash font-medium">
                {sessionData.recipeSnapshot?.cookMinutes || sessionData.recipe?.cookMinutes || "--"} min
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-smoke text-sm">Doeltemperatuur</Label>
              <div className="text-ash font-medium">
                {sessionData.recipeSnapshot?.targetInternalTemp || sessionData.recipe?.targetInternalTemp || "--"}°C
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="notes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-coals border-ash">
          <TabsTrigger value="notes" className="text-smoke data-[state=active]:text-ash">
            Notities
          </TabsTrigger>
          <TabsTrigger value="photos" className="text-smoke data-[state=active]:text-ash">
            Foto&apos;s
          </TabsTrigger>
          <TabsTrigger value="temps" className="text-smoke data-[state=active]:text-ash">
            Temperatuur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash">Sessie notities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-ash">Notities tijdens koken</Label>
                <Textarea
                  id="notes"
                  placeholder="Voeg notities toe over je kooksessie..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-charcoal border-ash text-ash min-h-[120px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conclusion" className="text-ash">Conclusie & evaluatie</Label>
                <Textarea
                  id="conclusion"
                  placeholder="Wat ging goed? Wat zou je anders doen? Hoe smaakte het eindresultaat?"
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className="bg-charcoal border-ash text-ash min-h-[100px]"
                />
              </div>

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
                    Huidige beoordeling: {currentRating} van de 5 sterren
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustments" className="text-ash">Aanpassingen voor volgende keer</Label>
                <Textarea
                  id="adjustments"
                  placeholder="Bijv. meer rook, langer marineren, andere houtsoort..."
                  value={adjustments}
                  onChange={(e) => setAdjustments(e.target.value)}
                  className="bg-charcoal border-ash text-ash min-h-[80px]"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleSaveNotes}
                  disabled={isLoading}
                  className="bg-ember hover:bg-ember/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isLoading ? "Opslaan..." : "Opslaan"}
                </Button>
                {isActive && (
                  <Button 
                    onClick={handleFinishSession}
                    disabled={isLoading}
                    variant="outline" 
                    className="border-ash text-ash"
                  >
                    Sessie afronden
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Sessie foto&apos;s
              </CardTitle>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <div className="text-center py-8 text-smoke">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nog geen foto&apos;s toegevoegd</p>
                  <p className="text-sm">Upload foto&apos;s om je kooksessie vast te leggen</p>
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
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-center text-white">
                            <p className="text-sm font-medium">
                              {photo.type === 'prep' ? 'Voorbereiding' : 
                               photo.type === 'final' ? 'Eindresultaat' : 'Sessie'}
                            </p>
                            {photo.createdAt && (
                              <p className="text-xs opacity-75">
                                {new Date(photo.createdAt).toLocaleDateString('nl-NL')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-smoke text-center">
                    {photos.length} foto&apos;s geüpload
                  </div>
                </div>
              )}
              
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
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Voorbereiding
                    </Button>
                    <Button 
                      variant={uploadType === "session" ? "default" : "outline"}
                      className={uploadType === "session" ? "bg-ember hover:bg-ember/90" : "border-ash text-ash"}
                      onClick={() => setUploadType("session")}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Tijdens koken
                    </Button>
                    <Button 
                      variant={uploadType === "final" ? "default" : "outline"}
                      className={uploadType === "final" ? "bg-ember hover:bg-ember/90" : "border-ash text-ash"}
                      onClick={() => setUploadType("final")}
                    >
                      <Camera className="h-4 w-4 mr-2" />
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
        </TabsContent>

        <TabsContent value="temps" className="space-y-4">
          <Card className="bg-coals border-ash">
            <CardHeader>
              <CardTitle className="text-ash flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Temperatuur log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {temps.length === 0 ? (
                <div className="text-center py-8 text-smoke">
                  <Thermometer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nog geen temperatuurmetingen</p>
                  <p className="text-sm">Start met het loggen van temperaturen</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Huidige temperaturen */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-smoke text-sm">Rost temperatuur</Label>
                      <div className="text-2xl font-bold text-ash">
                        {temps[0]?.grateTemp || "--"}°C
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-smoke text-sm">Vlees temperatuur</Label>
                      <div className="text-2xl font-bold text-ash">
                        {temps[0]?.meatTemp || "--"}°C
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-smoke text-sm">Laatste meting</Label>
                      <div className="text-sm text-smoke">
                        {temps[0]?.recordedAt 
                          ? new Date(temps[0].recordedAt).toLocaleTimeString('nl-NL')
                          : "--"
                        }
                      </div>
                    </div>
                  </div>

                  {/* Temperatuurverloop tabel */}
                  <div className="space-y-4">
                    <Label className="text-ash">Temperatuurverloop</Label>
                    <div className="bg-charcoal rounded-lg border border-ash overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-coals border-b border-ash">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-ash">Tijd</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-ash">BBQ Temp</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-ash">Vlees Temp</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-ash">Probe</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ash">
                            {temps.slice(0, 10).map((temp) => (
                              <tr key={temp.id} className="hover:bg-coals/50">
                                <td className="px-4 py-3 text-sm text-smoke">
                                  {new Date(temp.recordedAt).toLocaleTimeString('nl-NL')}
                                </td>
                                <td className="px-4 py-3 text-sm text-ash font-medium">
                                  {temp.grateTemp ? `${temp.grateTemp}°C` : "--"}
                                </td>
                                <td className="px-4 py-3 text-sm text-ash font-medium">
                                  {temp.meatTemp ? `${temp.meatTemp}°C` : "--"}
                                </td>
                                <td className="px-4 py-3 text-sm text-smoke">
                                  {temp.probeName || "--"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {temps.length > 10 && (
                        <div className="px-4 py-2 text-center text-sm text-smoke border-t border-ash">
                          En {temps.length - 10} meer metingen...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Nieuwe meting toevoegen */}
                  <div className="space-y-4">
                    <Label className="text-ash">Nieuwe meting toevoegen</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grateTemp" className="text-smoke text-sm">Rost temp (°C)</Label>
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
                        placeholder="Bijv. Brisket probe"
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

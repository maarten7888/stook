import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Thermometer, Camera, Star, CheckCircle } from "lucide-react";
import { headers } from "next/headers";

async function fetchSession(sessionId: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  const res = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
    cache: "no-store",
  });
  
  if (!res.ok) return null;
  return res.json();
}

async function fetchSessionTemps(sessionId: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/temps`, {
    cache: "no-store",
  });
  
  if (!res.ok) return [];
  return res.json();
}

async function fetchSessionPhotos(sessionId: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/photos`, {
    cache: "no-store",
  });
  
  if (!res.ok) return [];
  return res.json();
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const sessionData = await fetchSession(id);
  const temps = await fetchSessionTemps(id);
  const photos = await fetchSessionPhotos(id);

  if (!sessionData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold text-ash">Sessie niet gevonden</h1>
        <Card className="bg-coals border-ash">
          <CardContent className="p-6">
            <p className="text-smoke">Deze kooksessie bestaat niet of je hebt geen toegang.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = !sessionData.endedAt;
  const duration = sessionData.endedAt 
    ? Math.round((new Date(sessionData.endedAt).getTime() - new Date(sessionData.startedAt).getTime()) / (1000 * 60))
    : Math.round((Date.now() - new Date(sessionData.startedAt).getTime()) / (1000 * 60));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-ash">{sessionData.recipe.title}</h1>
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
          <Button className="bg-ember hover:bg-ember/90">
            <CheckCircle className="h-4 w-4 mr-2" />
            Afronden
          </Button>
        )}
      </div>

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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-ash">Notities</Label>
                <Textarea
                  id="notes"
                  placeholder="Voeg notities toe over je kooksessie..."
                  defaultValue={sessionData.notes || ""}
                  className="bg-charcoal border-ash text-ash min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conclusion" className="text-ash">Conclusie</Label>
                <Textarea
                  id="conclusion"
                  placeholder="Wat ging goed? Wat zou je anders doen?"
                  defaultValue={sessionData.conclusion || ""}
                  className="bg-charcoal border-ash text-ash min-h-[100px]"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rating" className="text-ash">Beoordeling</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer ${
                          star <= (sessionData.rating || 0) ? "fill-current text-ember" : "text-smoke"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Button className="bg-ember hover:bg-ember/90">
                Opslaan
              </Button>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo: { id: string; signedUrl: string }) => (
                    <div key={photo.id} className="aspect-square bg-charcoal rounded-lg border border-ash overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={photo.signedUrl} 
                        alt={`Sessie foto ${photo.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" className="border-ash text-ash">
                  <Camera className="h-4 w-4 mr-2" />
                  Foto toevoegen
                </Button>
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-smoke text-sm">Rost temperatuur</Label>
                      <div className="text-2xl font-bold text-ash">
                        {temps[temps.length - 1]?.grateTemp || "--"}°C
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-smoke text-sm">Vlees temperatuur</Label>
                      <div className="text-2xl font-bold text-ash">
                        {temps[temps.length - 1]?.meatTemp || "--"}°C
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-smoke text-sm">Laatste meting</Label>
                      <div className="text-sm text-smoke">
                        {temps[temps.length - 1]?.recordedAt 
                          ? new Date(temps[temps.length - 1].recordedAt).toLocaleTimeString('nl-NL')
                          : "--"
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-ash">Nieuwe meting</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grateTemp" className="text-smoke text-sm">Rost temp (°C)</Label>
                        <Input
                          id="grateTemp"
                          type="number"
                          placeholder="200"
                          className="bg-charcoal border-ash text-ash"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meatTemp" className="text-smoke text-sm">Vlees temp (°C)</Label>
                        <Input
                          id="meatTemp"
                          type="number"
                          placeholder="65"
                          className="bg-charcoal border-ash text-ash"
                        />
                      </div>
                    </div>
                    <Button className="bg-ember hover:bg-ember/90">
                      Meting toevoegen
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

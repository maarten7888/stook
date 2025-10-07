import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import SessionDetail from "@/components/session-detail";
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

  return <SessionDetail sessionData={sessionData} temps={temps} photos={photos} />;
}

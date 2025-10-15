import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Succesvol geverifieerd, redirect naar de hoofdpagina
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Error bij verificatie, redirect naar login met error message
  return NextResponse.redirect(`${origin}/login?error=Verificatie mislukt`);
}

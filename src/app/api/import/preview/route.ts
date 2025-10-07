import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const previewSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = previewSchema.parse(body);

    // Simple parser for demonstration - in production you'd use more sophisticated parsing
    const domain = new URL(url).hostname;
    
    // Mock preview data based on domain
    let preview;
    
    if (domain.includes("bbqnerds")) {
      preview = {
        url,
        title: "Brisket Texas Style",
        description: "Klassieke Texas brisket met een perfecte bark en tender vlees.",
        serves: 8,
        prepMinutes: 30,
        cookMinutes: 480,
        targetInternalTemp: 95,
        ingredients: [
          { name: "Brisket", amount: 4, unit: "kg" },
          { name: "Kosher zout", amount: 2, unit: "el" },
          { name: "Zwarte peper", amount: 2, unit: "el" },
          { name: "Paprika", amount: 1, unit: "el" },
          { name: "Knoflookpoeder", amount: 1, unit: "tl" },
        ],
        steps: [
          {
            instruction: "Trim de brisket en verwijder overtollig vet",
            timerMinutes: 30,
          },
          {
            instruction: "Meng alle kruiden en wrijf de brisket in",
            timerMinutes: 15,
          },
          {
            instruction: "Zet de BBQ op 110°C indirecte warmte",
            targetTemp: 110,
          },
          {
            instruction: "Plaats de brisket op de BBQ en rook 8-12 uur",
            timerMinutes: 480,
            targetTemp: 110,
          },
          {
            instruction: "Controleer de kerntemperatuur tot 95°C",
            targetTemp: 95,
          },
          {
            instruction: "Laat 2 uur rusten in aluminiumfolie",
            timerMinutes: 120,
          },
        ],
        confidence: 0.85,
        source: "BBQ Nerds",
      };
    } else {
      // Generic parser fallback
      preview = {
        url,
        title: "Geïmporteerd recept",
        description: "Recept geïmporteerd van externe website",
        serves: 4,
        prepMinutes: 20,
        cookMinutes: 60,
        ingredients: [
          { name: "Ingrediënt 1", amount: 1, unit: "stuk" },
          { name: "Ingrediënt 2", amount: 2, unit: "el" },
        ],
        steps: [
          { instruction: "Stap 1: Bereid de ingrediënten voor" },
          { instruction: "Stap 2: Begin met koken" },
          { instruction: "Stap 3: Serveer en geniet" },
        ],
        confidence: 0.6,
        source: "Externe website",
      };
    }

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Error previewing recipe:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

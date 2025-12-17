/**
 * OcrNormalizer - Normalisatie van OCR tekst
 * 
 * Normaliseer units, whitespace, en stapnummering voor consistente verwerking.
 */

/**
 * Normaliseer whitespace in tekst
 * - Verwijder overtollige spaties
 * - Normaliseer line endings
 * - Verwijder lege regels aan begin/eind
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n") // Windows line endings
    .replace(/\r/g, "\n") // Old Mac line endings
    .replace(/[ \t]+/g, " ") // Multiple spaces/tabs to single space
    .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
    .trim();
}

/**
 * Pre-process OCR tekst voor betere parsing
 * - Voeg gesplitste woorden samen (aardap-\nelen -> aardappelen)
 * - Verwijder paginanummers en ruis
 * - Fix common OCR fouten
 */
export function preprocessOcrText(text: string): string {
  let processed = text;
  
  // 1. Voeg woorden samen die door OCR gesplitst zijn met een streepje
  // "aardap-\nelen" -> "aardappelen"
  processed = processed.replace(/(\w)-\n(\w)/g, "$1$2");
  
  // 2. Verwijder losse paginanummers (regels met alleen cijfers)
  // Aan het begin, midden, of eind van de tekst
  processed = processed.replace(/^\d{1,3}\s*$/gm, "");
  // Ook als laatste regel (vaak paginanummer)
  processed = processed.replace(/\n\d{1,3}\s*$/, "");
  
  // 3. Verwijder copyright/bron tekst patronen
  processed = processed.replace(/^©.*$/gm, "");
  processed = processed.replace(/^bron:.*$/gim, "");
  processed = processed.replace(/^foto:.*$/gim, "");
  
  // 4. Fix common OCR character misreads
  // "0" vaak gelezen als "O" in context van nummers
  // "l" vaak gelezen als "1" of "I"
  // Dit is lastig zonder context, dus we doen alleen veilige fixes
  
  // 5. Verwijder lege regels die alleen streepjes of bullets bevatten
  processed = processed.replace(/^[-–—•·]+\s*$/gm, "");
  
  // 6. Normaliseer verschillende soorten streepjes
  processed = processed.replace(/[–—]/g, "-");
  
  // 7. Normaliseer quotes
  processed = processed.replace(/[""„]/g, '"');
  processed = processed.replace(/[''‚]/g, "'");
  
  return processed;
}

/**
 * Merge lijnen die waarschijnlijk bij elkaar horen
 * OCR splitst soms zinnen op willekeurige plekken
 */
export function mergebrokenLines(lines: string[]): string[] {
  const merged: string[] = [];
  let buffer = "";
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (buffer) {
        merged.push(buffer);
        buffer = "";
      }
      continue;
    }
    
    // Check of de vorige regel onvolledig eindigt
    // (geen punt, vraagteken, uitroepteken, dubbele punt)
    const prevEndsIncomplete = buffer && 
      !buffer.match(/[.!?:;,]$/) && 
      !buffer.match(/\d$/) &&  // Niet als het een nummer is
      buffer.length < 100;     // Korte regels worden vaak voortgezet
    
    // Check of deze regel een voortzetting lijkt
    // (begint met kleine letter, of met "en", "of", "maar", etc.)
    const continuesLine = /^[a-z]/.test(trimmed) || 
      /^(en|of|maar|met|in|op|voor|tot|bij|van|naar|door)\s/i.test(trimmed);
    
    // Check of dit een nieuwe sectie/item is
    const isNewItem = /^\d+[.):\s]/.test(trimmed) ||  // Genummerde stap
      /^[-•*⚫]\s/.test(trimmed) ||                    // Bullet point
      /^[A-Z]{2,}/.test(trimmed);                      // CAPS header
    
    if (prevEndsIncomplete && continuesLine && !isNewItem) {
      // Merge met vorige regel
      buffer = buffer + " " + trimmed;
    } else {
      // Nieuwe regel
      if (buffer) {
        merged.push(buffer);
      }
      buffer = trimmed;
    }
  }
  
  // Laatste buffer toevoegen
  if (buffer) {
    merged.push(buffer);
  }
  
  return merged;
}

/**
 * Normaliseer ingredient hoeveelheden en units
 */
export function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    // Gewicht
    "gram": "g",
    "gr": "g",
    "gr.": "g",
    "g": "g",
    "g.": "g",
    "kilogram": "kg",
    "kilo": "kg",
    "kg": "kg",
    "kg.": "kg",
    "ons": "g", // 100g
    "pond": "g", // 500g
    
    // Volume
    "milliliter": "ml",
    "mililiter": "ml",
    "ml": "ml",
    "ml.": "ml",
    "liter": "l",
    "lt": "l",
    "l": "l",
    "l.": "l",
    "deciliter": "dl",
    "dl": "dl",
    "dl.": "dl",
    
    // Lepels
    "eetlepel": "el",
    "eetlepels": "el",
    "el": "el",
    "el.": "el",
    "eetl": "el",
    "theelepel": "tl",
    "theelepels": "tl",
    "tl": "tl",
    "tl.": "tl",
    "theel": "tl",
    
    // Stuks
    "stuk": "stuks",
    "stuks": "stuks",
    "st": "stuks",
    "st.": "stuks",
    
    // Overig
    "snufje": "snufje",
    "snuf": "snufje",
    "takje": "takje",
    "takjes": "takjes",
    "teen": "teen",
    "tenen": "tenen",
    "teentje": "teen",
    "teentjes": "tenen",
    "blik": "blik",
    "blikje": "blik",
    "pot": "pot",
    "potje": "pot",
    "zakje": "zakje",
    "pak": "pak",
    "pakje": "pak",
    "bosje": "bosje",
    "handje": "handje",
    "handjevol": "handje",
    "kopje": "kopje",
    "kopjes": "kopje",
    "scheutje": "scheutje",
    "schijfje": "schijfje",
    "schijfjes": "schijfjes",
    "plakje": "plakje",
    "plakjes": "plakjes",
    "mespuntje": "mespuntje",
    "sneetje": "sneetje",
    "sneetjes": "sneetjes",
    "blaadje": "blaadje",
    "blaadjes": "blaadjes",
  };

  const normalized = unit.toLowerCase().trim().replace(/\.$/, "");
  return unitMap[normalized] || normalized;
}

/**
 * Parse een ingredient string naar amount, unit, naam en notes
 * Voorbeelden:
 * - "200 gram kipfilet" -> { amount: 200, unit: "g", name: "kipfilet", notes: null }
 * - "2 el olijfolie" -> { amount: 2, unit: "el", name: "olijfolie", notes: null }
 * - "zout naar smaak" -> { amount: null, unit: null, name: "zout", notes: "naar smaak" }
 * - "peterselie, ter garnering" -> { amount: null, unit: null, name: "peterselie", notes: "ter garnering" }
 * - "500g vastkokende aardappelen" -> { amount: 500, unit: "g", name: "vastkokende aardappelen", notes: null }
 */
export function parseIngredientLine(line: string): {
  amount: number | null;
  unit: string | null;
  name: string;
  notes: string | null;
} {
  let trimmed = line.trim();
  
  if (!trimmed) {
    return { amount: null, unit: null, name: "", notes: null };
  }

  // Verwijder leading bullets en speciale karakters
  trimmed = trimmed.replace(/^[-•*⚫·◦‣▪▸►]\s*/, "").trim();
  
  // OCR cleanup: verwijder losse punten aan het begin
  trimmed = trimmed.replace(/^\.\s*/, "").trim();
  
  // Extract notes: "naar smaak", "optioneel", "ter garnering", etc.
  const { text: textWithoutNotes, notes } = extractIngredientNotes(trimmed);
  trimmed = textWithoutNotes;

  // Alle mogelijke units (inclusief OCR variaties)
  const unitPattern = "gram|gr|g|kilogram|kilo|kg|ml|milliliter|mililiter|liter|lt|l|dl|deciliter|" +
    "el|eetlepel|eetlepels|eetl|tl|theelepel|theelepels|theel|" +
    "stuks?|st|snufje|snuf|teen|tenen|teentje|teentjes|takje|takjes|" +
    "blik|blikje|pot|potje|zakje|pak|pakje|bosje|handje|handjevol|" +
    "kopje|kopjes|scheutje|schijfje|schijfjes|plakje|plakjes|" +
    "mespuntje|sneetje|sneetjes|blaadje|blaadjes|" +
    "druppel|druppels|scheut|schep|lepel|lepels";
  
  // Nederlandse woord-hoeveelheden
  const wordAmountPattern = "een|één|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|half|halve|kwart|driekwart";

  // Patronen voor hoeveelheden
  const patterns = [
    // Nummer direct gevolgd door unit (geen spatie): "500g", "200ml"
    new RegExp(`^(\\d+(?:[.,]\\d+)?)(${unitPattern})\\.?\\s+(.+)$`, "i"),
    // Nummer + spatie + unit + rest: "500 g aardappelen", "2 el olijfolie"
    new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})\\.?\\s+(.+)$`, "i"),
    // Breuk + unit + rest: "1/2 tl zout", "½ kopje melk"
    new RegExp(`^(\\d+\\/\\d+|[\\u00bd\\u00bc\\u00be\\u2153\\u2154])\\s*(${unitPattern})\\.?\\s+(.+)$`, "i"),
    // Nederlandse woord-hoeveelheid + unit: "halve liter melk", "een snufje zout"
    new RegExp(`^(${wordAmountPattern})\\s+(${unitPattern})\\.?\\s+(.+)$`, "i"),
    // Nederlandse woord-hoeveelheid zonder unit: "halve ui", "een ei"
    new RegExp(`^(${wordAmountPattern})\\s+([a-zA-ZÀ-ž].+)$`, "i"),
    // Nummer + naam (impliciet stuks): "2 uien", "3 eieren"
    /^(\d+(?:[.,]\d+)?)\s+([a-zA-ZÀ-ž].+)$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let amount: number | null = null;
      let unit: string | null = null;
      let name: string;

      if (match.length === 4) {
        // Pattern met unit
        amount = parseFraction(match[1]);
        unit = normalizeUnit(match[2]);
        name = cleanIngredientName(match[3]);
      } else if (match.length === 3) {
        // Pattern zonder unit
        amount = parseFraction(match[1]);
        name = cleanIngredientName(match[2]);
      } else {
        continue;
      }

      if (name) {
        return { amount, unit, name, notes };
      }
    }
  }

  // Geen patroon gevonden, return hele string als naam (na cleanup)
  return { amount: null, unit: null, name: cleanIngredientName(trimmed), notes };
}

/**
 * Extract notes van een ingrediënt regel
 * Patronen: "naar smaak", "optioneel", "ter garnering", "voor erbij", etc.
 */
function extractIngredientNotes(text: string): { text: string; notes: string | null } {
  const notePatterns = [
    // Met komma ervoor
    /,\s*(naar smaak)/i,
    /,\s*(optioneel)/i,
    /,\s*(ter garnering)/i,
    /,\s*(voor erbij)/i,
    /,\s*(indien gewenst)/i,
    /,\s*(eventueel)/i,
    /,\s*(of naar smaak)/i,
    /,\s*(to taste)/i,
    /,\s*(optional)/i,
    /,\s*(for garnish)/i,
    // Tussen haakjes
    /\s*\((naar smaak)\)/i,
    /\s*\((optioneel)\)/i,
    /\s*\((ter garnering)\)/i,
    /\s*\((eventueel)\)/i,
    // Aan het eind zonder komma
    /\s+(naar smaak)$/i,
    /\s+(ter garnering)$/i,
  ];
  
  for (const pattern of notePatterns) {
    const match = text.match(pattern);
    if (match) {
      const notes = match[1];
      const textWithoutNotes = text.replace(pattern, "").trim();
      return { text: textWithoutNotes, notes };
    }
  }
  
  return { text, notes: null };
}

/**
 * Clean up ingredient naam
 * Verwijdert extra witruimte en ongewenste karakters
 */
function cleanIngredientName(name: string): string {
  return name
    .replace(/\s+/g, " ")           // Meerdere spaties naar één
    .replace(/^[,.\s]+/, "")        // Leading punctuatie verwijderen
    .replace(/[,.\s]+$/, "")        // Trailing punctuatie verwijderen
    .trim();
}

/**
 * Parse breuken en Nederlandse woord-hoeveelheden naar decimale getallen
 */
function parseFraction(value: string): number | null {
  const lowerValue = value.toLowerCase().trim();
  
  // Nederlandse woord-hoeveelheden
  const wordAmounts: Record<string, number> = {
    "een": 1,
    "één": 1,
    "twee": 2,
    "drie": 3,
    "vier": 4,
    "vijf": 5,
    "zes": 6,
    "zeven": 7,
    "acht": 8,
    "negen": 9,
    "tien": 10,
    "half": 0.5,
    "halve": 0.5,
    "kwart": 0.25,
    "driekwart": 0.75,
  };
  
  if (wordAmounts[lowerValue] !== undefined) {
    return wordAmounts[lowerValue];
  }
  
  // Unicode breuken
  const unicodeFractions: Record<string, number> = {
    "\u00bd": 0.5, // ½
    "\u00bc": 0.25, // ¼
    "\u00be": 0.75, // ¾
    "\u2153": 0.333, // ⅓
    "\u2154": 0.667, // ⅔
  };

  if (unicodeFractions[value]) {
    return unicodeFractions[value];
  }

  // Normale breuk (1/2, 1/4, etc.)
  if (value.includes("/")) {
    const [num, denom] = value.split("/").map(Number);
    if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
      return num / denom;
    }
  }

  // Normaal getal (met komma of punt)
  const normalized = value.replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Normaliseer een bereidingsstap
 * - Verwijder leading nummering
 * - Normaliseer whitespace
 */
export function normalizeStep(step: string): string {
  return step
    .replace(/^\d+[.):\s]+/, "") // Remove leading numbers like "1.", "1)", "1:"
    .replace(/^[-•*]\s*/, "") // Remove bullet points
    .trim();
}

/**
 * Extract tijdsindicaties uit tekst (minuten)
 * Voorbeelden: "30 minuten", "1 uur", "2-3 uur"
 */
export function extractTimerMinutes(text: string): number | null {
  const patterns = [
    // X-Y minuten/min (neem gemiddelde)
    /(\d+)\s*[-–]\s*(\d+)\s*(?:minuten|min\.?|minuut)/i,
    // X minuten/min
    /(\d+)\s*(?:minuten|min\.?|minuut)/i,
    // X-Y uur (neem gemiddelde, converteer naar minuten)
    /(\d+)\s*[-–]\s*(\d+)\s*(?:uur|uren|u\.?)/i,
    // X uur (converteer naar minuten)
    /(\d+(?:[.,]\d+)?)\s*(?:uur|uren|u\.?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        // Range: gemiddelde nemen
        const low = parseInt(match[1], 10);
        const high = parseInt(match[2], 10);
        const avg = Math.round((low + high) / 2);
        
        // Check of het uren zijn
        if (pattern.source.includes("uur")) {
          return avg * 60;
        }
        return avg;
      } else {
        // Enkel getal
        const value = parseFloat(match[1].replace(",", "."));
        if (pattern.source.includes("uur")) {
          return Math.round(value * 60);
        }
        return Math.round(value);
      }
    }
  }

  return null;
}

/**
 * Extract temperatuur uit tekst (°C)
 * Voorbeelden: "180°C", "180 graden", "110°C"
 */
export function extractTemperature(text: string): number | null {
  const patterns = [
    // X°C of X °C
    /(\d+)\s*°\s*C/i,
    // X graden (Celsius)
    /(\d+)\s*graden(?:\s*celsius)?/i,
    // kerntemperatuur X
    /kerntemperatuur[:\s]+(\d+)/i,
    // interne temperatuur X
    /interne\s*temperatuur[:\s]+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      // Sanity check: BBQ temperaturen zijn meestal 50-350°C
      if (temp >= 30 && temp <= 400) {
        return temp;
      }
    }
  }

  return null;
}

/**
 * Extract aantal personen uit tekst
 * Voorbeelden: "Voor 4 personen", "4-6 porties", "Serves 8"
 */
export function extractServings(text: string): number | null {
  const patterns = [
    // Voor X personen/porties
    /voor\s*(\d+)\s*(?:personen|porties|persoon)/i,
    // X-Y personen (neem gemiddelde)
    /(\d+)\s*[-–]\s*(\d+)\s*(?:personen|porties)/i,
    // X personen/porties
    /(\d+)\s*(?:personen|porties)/i,
    // Serves X
    /serves?\s*(\d+)/i,
    // Aantal: X
    /aantal[:\s]+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        // Range
        const low = parseInt(match[1], 10);
        const high = parseInt(match[2], 10);
        return Math.round((low + high) / 2);
      }
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Extract bereidingstijd uit tekst
 */
export function extractPrepTime(text: string): number | null {
  const patterns = [
    /voorbereid(?:ing|en)?[:\s]+(\d+)\s*(?:minuten|min)/i,
    /prep(?:aratie)?[:\s]+(\d+)\s*(?:minuten|min)/i,
    /bereidingstijd[:\s]+(\d+)\s*(?:minuten|min)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Extract kooktijd uit tekst
 */
export function extractCookTime(text: string): number | null {
  const patterns = [
    // Kooktijd/Grilltijd/Rooktijd
    /(?:kook|grill|rook|bak|braad)tijd[:\s]+(\d+)\s*[-–]?\s*(\d+)?\s*(?:minuten|min|uur|uren)/i,
    /(?:kook|grill|rook|bak|braad)tijd[:\s]+(\d+(?:[.,]\d+)?)\s*(?:uur|uren)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const isHours = pattern.source.includes("uur");
      if (match[2]) {
        // Range
        const low = parseInt(match[1], 10);
        const high = parseInt(match[2], 10);
        const avg = Math.round((low + high) / 2);
        return isHours ? avg * 60 : avg;
      }
      const value = parseFloat(match[1].replace(",", "."));
      return isHours ? Math.round(value * 60) : Math.round(value);
    }
  }

  return null;
}


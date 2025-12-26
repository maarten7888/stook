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
 * - Merge losse unit lines (500\ng -> 500 g)
 */
export function preprocessOcrText(text: string): string {
  let processed = text;
  
  // 0. Fix veelvoorkomende OCR fouten VOOR andere processing
  // "I" (hoofdletter) gevolgd door unit/ingredient → "1" (niet "ik")
  // Patroon: "I kg", "I ui", "I eetl", "I\nvers" etc.
  // Case-sensitive: alleen hoofdletter "I" (niet "i" want dat kan "ik" zijn)
  
  // EERST: "I" op aparte regel gevolgd door ingredient (meest specifiek)
  processed = processed.replace(/\nI\n([a-z])/gi, "\n1 $1");
  // "I" gevolgd door unit (kg, g, el, tl, etc.) - behoud rest van regel
  // Match: "I kg mager" → "1 kg mager"
  processed = processed.replace(/\bI\s+(kg|g|gram|ml|l|el|tl|eetl|theel|theel\.|eetl\.)\s+/gi, "1 $1 ");
  // "I" gevolgd door spatie en dan ingredient (niet midden in woord) - behoud rest van regel
  // Match: "I ui en" → "1 ui en"
  processed = processed.replace(/\bI\s+(vers|kleine|grote|verse|mager|dikke|dunne|geraspt|gehakt|zure|ui|appel|eieren?)\s+/gi, "1 $1 ");
  // "I" gevolgd door unit/ingredient combinatie (meest algemeen, laatst) - behoud rest van regel
  processed = processed.replace(/\bI\s+(kg|g|gram|ml|l|el|tl|eetl|theel|ui|eieren?|appel|teentje|tenen)\s+/gi, "1 $1 ");
  
  // 0b. Fix "|" als bullet character (vaak OCR fout voor • of -)
  // MAAR: "2 eieren | theel . zout" moet worden: "2 eieren • 1 theel zout"
  processed = processed.replace(/\|\s*theel\s*\.\s*/gi, " • 1 theel ");
  processed = processed.replace(/\|\s*/g, " • ");
  
  // 0c. Fix samengevoegde woorden die gesplitst moeten worden
  // "hetwordt" → "het wordt"
  processed = processed.replace(/\b(het|dat|wat|dit)(wordt|is|was|zijn|zijn|worden)\b/gi, "$1 $2");
  // "aangesneden" → "aangesneden" (niet "aan gesneden")
  // Maar "aan gesneden" → "aangesneden" (als het apart staat)
  processed = processed.replace(/\baan\s+gesneden\b/gi, "aangesneden");
  processed = processed.replace(/\baan\s+gezet\b/gi, "aangezet");
  processed = processed.replace(/\baan\s+gekookt\b/gi, "aangekookt");
  processed = processed.replace(/\baan\s+gebakken\b/gi, "aangebakken");
  processed = processed.replace(/\baan\s+gebraad\b/gi, "aangebraad");
  processed = processed.replace(/\bin\s+gedaan\b/gi, "ingedaan");
  processed = processed.replace(/\bop\s+gewarmd\b/gi, "opgewarmd");
  processed = processed.replace(/\buit\s+gegoten\b/gi, "uitgegoten");
  processed = processed.replace(/\buit\s+gehaald\b/gi, "uitgehaald");
  
  // 1. Voeg woorden samen die door OCR gesplitst zijn met een streepje
  // Patronen: "aardap-\nelen", "opge- pept", "wor- den", "minu- ten"
  // Met newline
  processed = processed.replace(/(\w)-\n\s*(\w)/g, "$1$2");
  // Met spatie (OCR voegt soms spatie toe na het streepje)
  processed = processed.replace(/(\w)-\s+(\w)/g, "$1$2");
  
  // 2. Verwijder losse paginanummers (regels met alleen cijfers)
  // Aan het begin, midden, of eind van de tekst
  processed = processed.replace(/^\d{1,3}\s*$/gm, "");
  // Ook als laatste regel (vaak paginanummer)
  processed = processed.replace(/\n\d{1,3}\s*$/, "");
  
  // 3. Verwijder copyright/bron tekst patronen
  processed = processed.replace(/^©.*$/gm, "");
  processed = processed.replace(/^bron:.*$/gim, "");
  processed = processed.replace(/^foto:.*$/gim, "");
  processed = processed.replace(/^fotografie:.*$/gim, "");
  processed = processed.replace(/^styling:.*$/gim, "");
  processed = processed.replace(/^recept:.*$/gim, "");
  
  // 3a. Verwijder ISBN en andere boek metadata
  processed = processed.replace(/^ISBN[:\s].*$/gim, "");
  processed = processed.replace(/^\d{10,13}\s*$/gm, ""); // Losse ISBN nummers
  
  // 3a2. Verwijder voedingswaarde informatie (we willen alleen ingrediënten en stappen)
  processed = processed.replace(/^(voedingswaarde|nutritional|energie|kcal|kj|eiwit|koolhydraten|vetten?|vezels?|natrium|zout)[\s:].*/gim, "");
  processed = processed.replace(/^\d+\s*(kcal|kj|cal)\s*$/gim, "");
  processed = processed.replace(/^per\s+(portie|persoon|100\s*g)[\s:].*/gim, "");
  
  // 3a3. Verwijder TIP/VARIATIE secties (vaak niet essentieel)
  // Let op: we verwijderen alleen de header, niet de hele sectie
  processed = processed.replace(/^TIP[:\s].*$/gim, "");
  processed = processed.replace(/^TIPS[:\s].*$/gim, "");
  processed = processed.replace(/^VARIATIE[:\s].*$/gim, "");
  processed = processed.replace(/^VARIANT[:\s].*$/gim, "");
  processed = processed.replace(/^LET OP[:\s].*$/gim, "");
  processed = processed.replace(/^OPMERKING[:\s].*$/gim, "");
  
  // 3a4. Verwijder moeilijkheidsgraad en andere metadata regels
  processed = processed.replace(/^(moeilijkheid|niveau|difficulty)[:\s].*/gim, "");
  processed = processed.replace(/^(categorie|category|type)[:\s].*/gim, "");
  processed = processed.replace(/^(keuken|cuisine)[:\s].*/gim, "");
  
  // 3b. Verwijder korte noise regels (1-2 letters/cijfers, vaak afgekapte tekst of codes)
  // "BC", "AB", etc. aan het eind
  processed = processed.replace(/\n[A-Z]{1,3}\s*$/g, "");
  // Aan het begin
  processed = processed.replace(/^[A-Z]{1,3}\s*\n/g, "");
  
  // 3c. Verwijder afgekapte categorie headers zoals "VOOR ONGE" (incomplete woorden)
  // Patronen: korte CAPS tekst gevolgd door afgekapte woord
  processed = processed.replace(/^VOOR\s+[A-Z]{2,6}\s*$/gm, "");
  processed = processed.replace(/^[A-Z]{2,10}\s+[A-Z]{2,6}\s*$/gm, function(match) {
    // Check of het laatste woord lijkt op een afgekapt woord (geen volledig woord)
    const words = match.trim().split(/\s+/);
    if (words.length >= 2) {
      const lastWord = words[words.length - 1];
      // Als laatste woord < 5 chars en niet een bekend woord, waarschijnlijk afgekapt
      const knownShortWords = ["VOOR", "MET", "VAN", "BIJ", "UIT", "AAN", "OP", "IN", "EN", "OF", "TE"];
      if (lastWord.length < 5 && !knownShortWords.includes(lastWord)) {
        return ""; // Verwijder
      }
    }
    return match; // Behoud
  });
  
  // 4. Merge losse unit lines en multi-line ingrediënten
  // Dit gebeurt vaak bij OCR waar hoeveelheid, unit en ingrediënt op aparte regels staan
  const shortUnitPattern = /^(g|gr|gram|kg|kilogram|ml|l|liter|dl|cl|el|tl|stuks?|st)\.?$/i;
  const longUnitPattern = /^(eetlepels?|theelepels?|teentjes?|kopjes?|glazen|blik|blikje|pot|potje|takjes?|snufjes?|handjes?)$/i;
  const lines = processed.split('\n');
  const mergedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1]?.trim();
    const lineAfterNext = lines[i + 2]?.trim();
    
    // Check of regel eindigt met een getal na een header (bv "INGREDIËNTEN : 500")
    const headerWithNumberMatch = line.match(/^(.+?)\s*[:]\s*(\d+(?:[.,]\d+)?)$/);
    if (headerWithNumberMatch && nextLine && (shortUnitPattern.test(nextLine) || longUnitPattern.test(nextLine))) {
      const headerPart = headerWithNumberMatch[1];
      const numberPart = headerWithNumberMatch[2];
      
      mergedLines.push(headerPart);
      
      if (lineAfterNext && /^[a-zA-ZÀ-ž]/.test(lineAfterNext) && !isHeaderLine(lineAfterNext)) {
        mergedLines.push(`${numberPart} ${nextLine} ${lineAfterNext}`);
        i += 2;
      } else {
        mergedLines.push(`${numberPart} ${nextLine}`);
        i++;
      }
      continue;
    }
    
    // Patroon: "24 kleine\nkipvleugeltjes" -> getal + bijvoeglijk naamwoord op één regel, ingrediënt op volgende
    // Check: huidige regel is "getal woord" en volgende regel is een ingredient naam
    const amountWithAdjectiveMatch = line.match(/^(\d+)\s+([a-zA-ZÀ-ž]+)$/);
    if (amountWithAdjectiveMatch && nextLine && /^[a-zA-ZÀ-ž]/.test(nextLine) && !isHeaderLine(nextLine)) {
      // Check of volgende regel geen unit is en geen header
      if (!shortUnitPattern.test(nextLine) && !longUnitPattern.test(nextLine)) {
        // "24 kleine" + "kipvleugeltjes" -> "24 kleine kipvleugeltjes"
        mergedLines.push(`${line} ${nextLine}`);
        i++;
        continue;
      }
    }
    
    // Patroon: "2 eetlepels\nplantaardige olie" of "1 bosje\nlente-uitjes" -> getal + lange unit, ingrediënt op volgende regel
    const amountWithLongUnitMatch = line.match(/^(\d+)\s+(eetlepels?|theelepels?|teentjes?|kopjes?|glazen|blik(?:je)?|pot(?:je)?|takjes?|snufjes?|handjes?|bosje|bosjes)$/i);
    if (amountWithLongUnitMatch && nextLine && /^[a-zA-ZÀ-ž]/.test(nextLine) && !isHeaderLine(nextLine)) {
      // "2 eetlepels" + "plantaardige olie" -> "2 eetlepels plantaardige olie"
      // "1 bosje" + "lente-uitjes" -> "1 bosje lente-uitjes"
      mergedLines.push(`${line} ${nextLine}`);
      i++;
      continue;
    }
    
    // Patroon: "2 el\nolijfolie" of "1 eetl .\nmangochutney" -> korte unit (el, tl) gevolgd door ingrediënt
    const amountWithShortUnitMatch = line.match(/^(\d+)\s+(el|tl|eetl|theel)(\s*\.)?$/i);
    if (amountWithShortUnitMatch && nextLine && /^[a-zA-ZÀ-ž]/.test(nextLine) && !isHeaderLine(nextLine)) {
      // "2 el" + "olijfolie" -> "2 el olijfolie"
      // "1 eetl ." + "mangochutney" -> "1 eetl mangochutney"
      const unit = amountWithShortUnitMatch[2];
      // Check of er nog een volgende regel is (bijv. "mangochutney of\nabrikozenjam")
      const lineAfterNext = lines[i + 2]?.trim();
      if (lineAfterNext && /^(of|en)\s+[a-z]/i.test(lineAfterNext)) {
        // Merge ook de volgende regel (bijv. "mangochutney of abrikozenjam")
        mergedLines.push(`${amountWithShortUnitMatch[1]} ${unit} ${nextLine} ${lineAfterNext}`);
        i += 2;
      } else {
        mergedLines.push(`${amountWithShortUnitMatch[1]} ${unit} ${nextLine}`);
        i++;
      }
      continue;
    }
    
    // Check of huidige regel alleen een getal is en volgende een unit
    if (/^\d+(?:[.,]\d+)?$/.test(line) && nextLine && (shortUnitPattern.test(nextLine) || longUnitPattern.test(nextLine))) {
      if (lineAfterNext && /^[a-zA-ZÀ-ž]/.test(lineAfterNext) && !isHeaderLine(lineAfterNext)) {
        mergedLines.push(`${line} ${nextLine} ${lineAfterNext}`);
        i += 2;
      } else {
        mergedLines.push(`${line} ${nextLine}`);
        i++;
      }
    } else {
      mergedLines.push(lines[i]);
    }
  }
  processed = mergedLines.join('\n');
  
  // 5. Verwijder lege regels die alleen streepjes of bullets bevatten
  processed = processed.replace(/^[-–—•·]+\s*$/gm, "");
  
  // 6. Normaliseer verschillende soorten streepjes
  processed = processed.replace(/[–—]/g, "-");
  
  // 7. Normaliseer quotes
  processed = processed.replace(/[""„]/g, '"');
  processed = processed.replace(/[''‚]/g, "'");
  
  // 8. Normaliseer spaties rond streepjes in woorden
  // "lente - uitjes" -> "lente-uitjes"
  processed = processed.replace(/(\w)\s+-\s+(\w)/g, "$1-$2");
  
  return processed;
}

/**
 * Check of een regel een header is (Ingrediënten, Bereiding, etc.)
 */
function isHeaderLine(line: string): boolean {
  const headerPatterns = [
    /^ingredi[eëé]nten/i,
    /^bereiding/i,
    /^werkwijze/i,
    /^instructies/i,
    /^\d+\./,  // Genummerde stap
  ];
  return headerPatterns.some(p => p.test(line.trim()));
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
    // Met komma ervoor - standaard notities
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
    
    // Met komma ervoor - bereidingswijze (geperst, gesnipperd, etc.)
    /,\s*(geperst)/i,
    /,\s*(gesnipperd)/i,
    /,\s*(gehakt)/i,
    /,\s*(gesneden)/i,
    /,\s*(in stukjes)/i,
    /,\s*(in plakjes)/i,
    /,\s*(in blokjes)/i,
    /,\s*(in ringen)/i,
    /,\s*(in reepjes)/i,
    /,\s*(geraspt)/i,
    /,\s*(geschild)/i,
    /,\s*(schoongemaakt)/i,
    /,\s*(gewassen)/i,
    /,\s*(ontdooid)/i,
    /,\s*(gesmolten)/i,
    /,\s*(kamertemperatuur)/i,
    /,\s*(op kamertemperatuur)/i,
    /,\s*(geweekt)/i,
    /,\s*(fijngesneden)/i,
    /,\s*(grof gehakt)/i,
    /,\s*(fijn gehakt)/i,
    /,\s*(uitgelekt)/i,
    /,\s*(afgespoeld)/i,
    /,\s*(zonder pit)/i,
    /,\s*(zonder zaadjes)/i,
    /,\s*(zonder vel)/i,
    /,\s*(met vel)/i,
    /,\s*(biologisch)/i,
    /,\s*(vers)/i,
    /,\s*(gedroogd)/i,
    
    // Tussen haakjes
    /\s*\((naar smaak)\)/i,
    /\s*\((optioneel)\)/i,
    /\s*\((ter garnering)\)/i,
    /\s*\((eventueel)\)/i,
    /\s*\((geperst)\)/i,
    /\s*\((gesnipperd)\)/i,
    /\s*\((gehakt)\)/i,
    /\s*\((geschild)\)/i,
    /\s*\((geraspt)\)/i,
    
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
    // X-Y minuten/min (neem gemiddelde) - ook met spatie: "50-55 minu- ten"
    /(\d+)\s*[-–]\s*(\d+)\s*(?:minuten|min\.?|minuut)(?:\s*-\s*ten)?/i,
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
    // X°C of X °C (ook met spatie: "190 ° C")
    /(\d+)\s*°\s*C/i,
    // X graden (Celsius)
    /(\d+)\s*graden(?:\s*celsius)?/i,
    // "op X" (bijv. "op 190°C")
    /op\s+(\d+)\s*°\s*C/i,
    // "voor op X" (bijv. "voor op 190°C")
    /voor\s+op\s+(\d+)\s*°\s*C/i,
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
    // X stuks (voor gebak, koekjes)
    /(\d+)\s*stuks?/i,
    // ca. X personen
    /ca\.?\s*(\d+)\s*(?:personen|porties)/i,
    // circa X personen
    /circa\s*(\d+)\s*(?:personen|porties)/i,
    // Recept voor X
    /recept\s*voor\s*(\d+)/i,
    // Maakt X / Makes X
    /(?:maakt|makes)\s*(\d+)/i,
    // Yields X
    /yields?\s*(\d+)/i,
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
    /voorbereid(?:ing|en)?[:\s]+(\d+)\s*(?:minuten|min\.?)/i,
    /prep(?:aratie)?[:\s]+(\d+)\s*(?:minuten|min\.?)/i,
    /bereidingstijd[:\s]+(\d+)\s*(?:minuten|min\.?)/i,
    /voorbereiding[:\s]+(\d+)\s*(?:minuten|min\.?)/i,
    /prep\s*time[:\s]+(\d+)\s*(?:minutes?|min\.?)/i,
    /preparation[:\s]+(\d+)\s*(?:minutes?|min\.?)/i,
    // Snijden/klaarmaken tijd
    /(?:snij|klaarmaak)tijd[:\s]+(\d+)\s*(?:minuten|min\.?)/i,
    // Totale tijd
    /totale?\s*tijd[:\s]+(\d+)\s*(?:minuten|min\.?)/i,
    /total\s*time[:\s]+(\d+)\s*(?:minutes?|min\.?)/i,
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
    // Kooktijd/Grilltijd/Rooktijd/Baktijd/Braadtijd/Stooftijd/Oventijd
    /(?:kook|grill|rook|bak|braad|stoof|oven)tijd[:\s]+(\d+)\s*[-–]?\s*(\d+)?\s*(?:minuten|min\.?|uur|uren)/i,
    /(?:kook|grill|rook|bak|braad|stoof|oven)tijd[:\s]+(\d+(?:[.,]\d+)?)\s*(?:uur|uren)/i,
    // Cook/Cooking time
    /cook(?:ing)?\s*time[:\s]+(\d+)\s*[-–]?\s*(\d+)?\s*(?:minutes?|min\.?|hours?|hrs?)/i,
    // In de oven: X minuten
    /in\s*de\s*oven[:\s]+(\d+)\s*(?:minuten|min\.?)/i,
    // Op het vuur: X minuten
    /op\s*(?:het\s*)?vuur[:\s]+(\d+)\s*(?:minuten|min\.?)/i,
    // Marineren/Rusten tijd (kan ook als kooktijd worden gezien)
    /(?:marineer|rust)tijd[:\s]+(\d+)\s*(?:minuten|min\.?|uur|uren)/i,
    // Garen: X minuten
    /garen[:\s]+(\d+)\s*(?:minuten|min\.?)/i,
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


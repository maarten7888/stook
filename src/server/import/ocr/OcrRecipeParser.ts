/**
 * OcrRecipeParser - Parse OCR tekst naar recept structuur
 * 
 * Herkent secties op basis van NL/EN headings en patronen zoals bullets en nummering.
 */

import {
  normalizeWhitespace,
  preprocessOcrText,
  mergebrokenLines,
  parseIngredientLine,
  extractTimerMinutes,
  extractTemperature,
  extractServings,
  extractPrepTime,
  extractCookTime,
} from "./OcrNormalizer";

export interface ParsedRecipe {
  title: string;
  description: string | null;
  serves: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  targetInternalTemp: number | null;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  confidence: RecipeConfidence;
}

export interface ParsedIngredient {
  name: string;
  amount: number | null;
  unit: string | null;
  notes: string | null; // "naar smaak", "optioneel", "ter garnering", etc.
}

export interface ParsedStep {
  instruction: string;
  timerMinutes: number | null;
  targetTemp: number | null;
  orderNo: number;
}

export interface RecipeConfidence {
  overall: number;
  title: number;
  ingredients: number;
  steps: number;
  // Gedetailleerde breakdown
  details: {
    titlePresent: boolean;
    titleScore: number;
    ingredientsCount: number;
    ingredientsWithAmount: number;
    stepsCount: number;
    avgStepLength: number;
    hasServings: boolean;
    hasCookTime: boolean;
    // Per-sectie scores (0-1) voor repair passes
    ingredientSectionScore?: number;
    stepSectionScore?: number;
    // Repair pass info
    ingredientRepairApplied?: boolean;
    stepRepairApplied?: boolean;
  };
}

// Heading patterns voor sectie herkenning
// Inclusief fuzzy varianten voor OCR fouten
const SECTION_PATTERNS = {
  ingredients: [
    // Standaard
    /^ingredi[eëé]nten/i,
    /^benodigdheden/i,
    /^wat heb je nodig/i,
    /^ingredients?/i,
    /^je hebt nodig/i,
    /^nodig/i,
    // Alternatieve headers uit verschillende kookboeken
    /^boodschappen/i,           // Veel Nederlandse kookboeken
    /^boodschappenlijst/i,
    /^shopping\s*list/i,
    /^je\s*hebt\s*nodig/i,
    /^dit\s*heb\s*je\s*nodig/i,
    /^voor\s*dit\s*recept/i,
    /^voor\s*\d+\s*personen/i,  // "Voor 4 personen"
    /^producten/i,              // "Producten" als header
    /^winkellijst/i,            // "Winkellijst"
    /^hiervoor\s*nodig/i,       // "Hiervoor nodig"
    /^u\s*heeft\s*nodig/i,      // Formeel: "U heeft nodig"
    /^je\s*gebruikt/i,          // "Je gebruikt"
    /^recept\s*voor/i,          // "Recept voor 4 personen"
    // OCR fuzzy varianten (I/l/1 verwisseling, etc.)
    /^[il1]ngred[il1][eëé]nten/i,
    /^lngredi[eëé]nten/i,
    /^1ngred/i,
    /^beno[d1]igd/i,            // OCR fout: benodigdheden
    // Afkortingen en variaties
    /^ingr\./i,
  ],
  steps: [
    // Standaard
    /^bereiding/i,
    /^bereidingswijze/i,
    /^werkwijze/i,
    /^instructies/i,
    /^stappen/i,
    /^zo maak je het/i,
    /^aan de slag/i,
    /^instructions?/i,
    /^method/i,
    /^directions?/i,
    /^preparation/i,
    // OCR fuzzy varianten
    /^bereid[il1]ng/i,
    /^werkw[il1]jze/i,
    // Extra variaties
    /^zo maak je/i,
    /^maak zo/i,
    /^recept/i,
    /^stappenplan/i,
  ],
  info: [
    /^info/i,
    /^informatie/i,
    /^gegevens/i,
    /^over dit recept/i,
    /^tips?/i,
    /^variatie/i,
  ],
};

/**
 * Bereken Levenshtein afstand tussen twee strings
 * Voor fuzzy matching van headers
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Fuzzy match tegen bekende sectie headers
 * Returns true als de string lijkt op een bekend header
 */
function fuzzyMatchHeader(text: string, targetWords: string[]): boolean {
  const cleaned = text.toLowerCase().replace(/[^a-zàáâãäåèéêëìíîïòóôõöùúûüñç]/gi, "");
  
  for (const target of targetWords) {
    const distance = levenshteinDistance(cleaned, target.toLowerCase());
    const maxDistance = Math.floor(target.length * 0.3); // 30% tolerance
    if (distance <= maxDistance) {
      return true;
    }
  }
  
  return false;
}

// Known header words for fuzzy matching
const FUZZY_INGREDIENT_HEADERS = ["ingredienten", "ingrediënten", "benodigdheden", "ingredients", "boodschappen", "boodschappenlijst"];
const FUZZY_STEPS_HEADERS = ["bereiding", "bereidingswijze", "werkwijze", "instructies", "method", "preparation"];

// Nederlandse werkwoorden die vaak stappen beginnen (imperatief)
const STEP_STARTING_VERBS = new Set([
  // Koken basics
  "meng", "roer", "klop", "mix", "voeg", "doe", "giet", "schenk",
  "kook", "bak", "braad", "stoof", "smelt", "verhit", "verwarm", "laat",
  "snijd", "snij", "hak", "rasp", "schil", "was", "spoel", "dep",
  "leg", "zet", "plaats", "dek", "bedek", "strooi", "bestrooi",
  "haal", "neem", "pak", "gebruik", "verdeel", "schep", "lepel",
  // Oven/grill
  "verwarm", "voorverwarm", "gril", "rooster", "gratineer",
  // Afwerking
  "garneer", "serveer", "presenteer", "verdeel", "bestrooi",
  // Tijd gerelateerd
  "wacht", "marineer", "laat", "zet",
  // Extra Nederlandse kookwerkwoorden
  "pureer", "prak", "stamp", "pers", "knijp", "druk",
  "kneed", "vouw", "rol", "wikkel", "draai",
  "bestrijk", "smeer", "besmeer", "penseel",
  "prik", "steek", "scheur", "breek", "ris",
  "blus", "ablusseer", "flambeer", "reduceer",
  "zeef", "giet", "laat", "dompel", "week",
  "fruit", "bak", "pocheer", "blancheer", "stoom",
  "wok", "roerbak", "frituur", "deep-fry",
  "kruid", "breng", "proef", "check", "controleer",
  // Engels (voor gemixte recepten)
  "add", "mix", "stir", "heat", "cook", "bake", "cut", "slice", "pour",
  "combine", "fold", "whisk", "beat", "blend", "season", "taste",
  "preheat", "roast", "grill", "fry", "sauté", "simmer", "boil",
]);

/**
 * Check of een regel waarschijnlijk een stap is
 * (begint met werkwoord of is een lange instructieve zin)
 * Strenger: alleen duidelijke stappen herkennen om geen ingrediënten te verliezen
 */
function isLikelyStep(line: string): boolean {
  const trimmed = line.trim();
  
  // EERST check: is dit een ingredient line? Dan is het GEEN stap
  const isIngredientPattern = /^\d+\s+(bosje|el|tl|gram|g|kg|ml|l|dl|cl|stuks?|st|kleine|grote|theelepel|eetlepel|teentje|takje|tenen|teentjes|eieren?|appel|ui|uien)/i.test(trimmed) ||
                              /^[-•*⚫·◦‣▪▸►]\s*\d+/.test(trimmed) || // bullet + getal
                              /^\d+(?:[.,]\d+)?\s*(?:gram|gr|g|kg|ml|l|dl|el|tl)/i.test(trimmed); // getal + unit
  
  if (isIngredientPattern) {
    return false; // Dit is een ingredient, geen stap
  }
  
  // Te korte regels zijn geen stappen
  if (trimmed.length < 30) {
    return false;
  }
  
  // Genummerde stap (met punt of haakje, NIET alleen spatie)
  if (/^\d+[.):]\s/.test(trimmed)) {
    return true;
  }
  
  // Begint met werkwoord EN is een redelijke zin
  const firstWord = trimmed.split(/[\s,.:]/)[0].toLowerCase();
  if (STEP_STARTING_VERBS.has(firstWord) && trimmed.length > 40) {
    // Extra check: moet een punt hebben of eindigen met instructie
    if (trimmed.endsWith(".") || /minuten|uur|graden|°/i.test(trimmed)) {
      return true;
    }
  }
  
  // Bevat oven temperatuur instructie (zeer specifiek voor kook-stappen)
  if (/verwarm.*oven|oven.*verwarm|voorverwarm/i.test(trimmed) && /\d+\s*°/.test(trimmed)) {
    return true;
  }
  
  // Bevat temperatuur EN tijd indicatie (zeer waarschijnlijk een stap)
  const hasTemp = /\d+\s*°\s*[cCfF]/.test(trimmed) || /\d+\s*graden/i.test(trimmed);
  const hasTime = /\d+\s*minuten?/i.test(trimmed) || /\d+\s*uur/i.test(trimmed);
  if (hasTemp && hasTime && trimmed.length > 40) {
    return true;
  }
  
  return false;
}

/**
 * Parse OCR tekst naar een gestructureerd recept
 */
export function parseOcrText(rawText: string): ParsedRecipe {
  // Pre-process de tekst: fix OCR fouten, verwijder ruis
  const preprocessed = preprocessOcrText(rawText);
  const text = normalizeWhitespace(preprocessed);
  
  // Split in regels en merge gebroken lijnen
  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lines = mergebrokenLines(rawLines);

  if (lines.length === 0) {
    return createEmptyRecipe();
  }

  // Identificeer secties
  const sections = identifySections(lines);

  // Parse elke sectie
  const title = extractTitle(lines, sections);
  const description = extractDescription(lines, sections);
  let ingredients = parseIngredients(sections.ingredients);
  let steps = parseSteps(sections.steps);

  // Bereken per-sectie scores voor repair passes
  const ingredientSectionScore = calculateIngredientSectionScore(sections.ingredients);
  const stepSectionScore = calculateStepSectionScore(sections.steps);

  // Track of repair passes zijn toegepast
  let ingredientRepairApplied = false;
  let stepRepairApplied = false;

  // Repair pass voor ingrediënten: als count laag is maar score hoog
  // Threshold: min 0.5 score (i.p.v. 0.6) voor meer agressieve repair
  if (ingredients.length < 3 && ingredientSectionScore > 0.5) {
    const repairedIngredients = repairIngredientParsing(sections.ingredients, ingredients);
    if (repairedIngredients.length > ingredients.length) {
      ingredients = repairedIngredients;
      ingredientRepairApplied = true;
    }
  }

  // Repair pass voor stappen: als count laag is maar score hoog
  // Threshold: min 0.5 score (i.p.v. 0.6) voor meer agressieve repair
  if (steps.length < 2 && stepSectionScore > 0.5) {
    const repairedSteps = repairStepParsing(sections.steps, steps);
    if (repairedSteps.length > steps.length) {
      steps = repairedSteps;
      stepRepairApplied = true;
    }
  }

  // Extract metadata uit de hele tekst
  const serves = extractServings(text);
  const prepMinutes = extractPrepTime(text);
  const cookMinutes = extractCookTime(text);
  const targetInternalTemp = extractTemperature(text);

  // Bereken confidence scores (met per-sectie scores)
  const confidence = calculateConfidence(
    title, 
    ingredients, 
    steps, 
    serves, 
    cookMinutes,
    ingredientSectionScore,
    stepSectionScore,
    ingredientRepairApplied,
    stepRepairApplied
  );

  return {
    title,
    description,
    serves,
    prepMinutes,
    cookMinutes,
    targetInternalTemp,
    ingredients,
    steps,
    confidence,
  };
}

interface Sections {
  header: string[];
  ingredients: string[];
  steps: string[];
  footer: string[];
}

/**
 * Identificeer secties in de tekst
 * Ondersteunt verschillende volgorden: 
 * - Standaard: Titel → Ingrediënten → Bereiding
 * - Alternatief: Bereiding → Titel → Ingrediënten
 */
function identifySections(lines: string[]): Sections {
  const sections: Sections = {
    header: [],
    ingredients: [],
    steps: [],
    footer: [],
  };

  let currentSection: keyof Sections = "header";
  let ingredientsStartIndex = -1;
  let stepsStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip paginanummers
    if (/^\d{1,3}$/.test(line.trim())) {
      continue;
    }

    // Check voor sectie headers - ook als content op dezelfde regel staat
    const ingredientHeaderMatch = findIngredientHeaderInLine(line);
    if (ingredientHeaderMatch) {
      // Als we al in stappen waren, en nu ingrediënten vinden,
      // check of de vorige regel een titel zou kunnen zijn
      if (currentSection === "steps" && i > 0) {
        const prevLine = lines[i - 1];
        if (isTitleCandidate(prevLine)) {
          // Verplaats deze regel naar header als potentiële titel
          sections.steps = sections.steps.filter(s => s !== prevLine);
          sections.header.push(prevLine);
        }
      }
      
      currentSection = "ingredients";
      ingredientsStartIndex = i;
      // Als er content na de header staat, voeg die toe als ingrediënten
      if (ingredientHeaderMatch.remainder) {
        // Split op bullets en andere scheidingstekens
        const ingredientParts = splitIngredientLine(ingredientHeaderMatch.remainder);
        sections.ingredients.push(...ingredientParts);
      }
      continue;
    }

    // Check voor stappen header
    const stepsHeaderMatch = findStepsHeaderInLine(line);
    if (stepsHeaderMatch) {
      currentSection = "steps";
      stepsStartIndex = i;
      if (stepsHeaderMatch.remainder) {
        sections.steps.push(stepsHeaderMatch.remainder);
      }
      continue;
    }

    // Check of de regel een genummerde stap is (bijv. "1. AARDAPPELEN VOORBEREIDEN:")
    // Dit kan ook na de ingrediënten sectie komen
    // BELANGRIJK: "1 bosje" is geen stap, "1. Snijd" wel
    // Check: getal gevolgd door PUNT of HAAKJE, niet alleen een spatie
    const looksLikeIngredientLine = /^\d+\s+(bosje|el|tl|gram|g|kg|ml|l|dl|cl|stuks?|st|kleine|grote|theelepel|eetlepel|teentje|takje|tenen|teentjes|eieren?|appel|ui|uien)/i.test(line);
    
    // Als het een ingredient line is, skip de stap-detectie
    if (looksLikeIngredientLine) {
      // Dit is zeker een ingredient, niet een stap
      if (currentSection === "ingredients") {
        const parts = splitIngredientLine(line);
        sections.ingredients.push(...parts);
        continue;
      }
    }
    
    // Check voor genummerde stap: getal + punt/haakje + hoofdletter
    // NIET: "1 bosje" (dat is ingredient)
    if (/^\d+[.)]\s*[A-Z]/.test(line) && !looksLikeIngredientLine) {
      // Dit lijkt een genummerde stap - switch naar steps sectie
      currentSection = "steps";
      stepsStartIndex = i;
      sections.steps.push(line);
      continue;
    }
    
    // Check voor ALLCAPS stap header (bijv. "AARDAPPELEN VOORBEREIDEN:")
    // Dit kan helpen om de stappen sectie te identificeren, vooral na ingrediënten
    const nextLine = i + 1 < lines.length ? lines[i + 1] : undefined;
    if (isAllCapsStepHeader(line, nextLine)) {
      // Als we in ingredients sectie zijn of nog geen sectie hebben geïdentificeerd,
      // en dit is een ALLCAPS header, dan zijn we waarschijnlijk in de stappen sectie
      if (currentSection === "ingredients" || currentSection === "header") {
        currentSection = "steps";
        stepsStartIndex = i;
        sections.steps.push(line);
        continue;
      }
    }

    // Voeg toe aan huidige sectie
    if (currentSection === "ingredients") {
      // EERST check: is dit een ingredient line? (begint met hoeveelheid/unit)
      // Dit heeft prioriteit boven stap-detectie
      const isIngredientPattern = /^\d+\s+(bosje|el|tl|gram|g|kg|ml|l|dl|cl|stuks?|st|kleine|grote|theelepel|eetlepel|teentje|takje|tenen|teentjes|eieren?|appel|ui|uien)/i.test(line) ||
                                  /^[-•*⚫·◦‣▪▸►]\s*\d+/.test(line) || // bullet + getal
                                  /^\d+(?:[.,]\d+)?\s*(?:gram|gr|g|kg|ml|l|dl|el|tl)/i.test(line); // getal + unit
      
      if (isIngredientPattern) {
        // Dit is zeker een ingredient, split op bullets
        const parts = splitIngredientLine(line);
        sections.ingredients.push(...parts);
        continue;
      }
      
      // Check of dit een stap is die tussen ingrediënten staat
      // Veel kookboeken hebben mixed content (stappen tussen ingrediënten)
      if (isLikelyStep(line)) {
        // Dit is een stap, niet een ingrediënt
        sections.steps.push(line);
        // Blijf wel in ingredients sectie voor volgende regels
        continue;
      }
      
      // Check of dit misschien een titel is die tussen secties staat
      if (isTitleCandidate(line) && line.length >= 10 && line.length <= 80) {
        // Korte regel zonder ingrediënt-patroon, mogelijk een titel
        // Voeg toe aan header voor titel-extractie
        sections.header.push(line);
      } else {
        // Split ingrediënten op bullets als ze op één regel staan
        const parts = splitIngredientLine(line);
        sections.ingredients.push(...parts);
      }
    } else {
      sections[currentSection].push(line);
    }
  }

  // Als geen expliciete headers gevonden, probeer heuristisch te splitsen
  if (ingredientsStartIndex === -1 && stepsStartIndex === -1) {
    return inferSections(lines);
  }

  return sections;
}

/**
 * Zoek ingredient header in een regel en return eventuele content erna
 */
function findIngredientHeaderInLine(line: string): { remainder: string } | null {
  for (const pattern of SECTION_PATTERNS.ingredients) {
    // Maak een nieuwe regex die ook content na de header vangt
    const extendedPattern = new RegExp(pattern.source + "[:\\s]*(.*)$", "i");
    const match = line.match(extendedPattern);
    if (match) {
      return { remainder: match[1]?.trim() || "" };
    }
    // Check ook of alleen de header matcht
    if (pattern.test(line.split(/[:\s]/)[0])) {
      const remainder = line.replace(pattern, "").replace(/^[:\s]+/, "").trim();
      return { remainder };
    }
  }
  return null;
}

/**
 * Zoek stappen header in een regel en return eventuele content erna
 */
function findStepsHeaderInLine(line: string): { remainder: string } | null {
  for (const pattern of SECTION_PATTERNS.steps) {
    const extendedPattern = new RegExp(pattern.source + "[:\\s]*(.*)$", "i");
    const match = line.match(extendedPattern);
    if (match) {
      return { remainder: match[1]?.trim() || "" };
    }
    if (pattern.test(line.split(/[:\s]/)[0])) {
      const remainder = line.replace(pattern, "").replace(/^[:\s]+/, "").trim();
      return { remainder };
    }
  }
  return null;
}

/**
 * Bekende losse ingrediënten die vaak zonder hoeveelheid/bullet staan
 * Als deze achter elkaar staan, moeten ze gesplitst worden
 */
const STANDALONE_INGREDIENTS = new Set([
  // Kruiden/specerijen
  "peper", "zout", "suiker", "kaneel", "paprikapoeder", "komijn", "kerrie",
  "curry", "kurkuma", "nootmuskaat", "oregano", "basilicum", "tijm", "rozemarijn",
  "peterselie", "bieslook", "dille", "munt", "koriander", "laurier",
  // Vaak zonder hoeveelheid
  "boter", "olie", "olijfolie", "water", "melk", "room", "slagroom",
  // Groenten die vaak "naar smaak" zijn
  "knoflook", "ui", "uien", "sjalot", "sjalotten", "prei",
]);

/**
 * Split een ingrediënten regel op bullets en andere scheidingstekens
 * OCR output heeft vaak: "500g aardappelen • 1 ui ⚫ 2 el olie"
 * Ook: "kerstomaatjes peper zout" moet gesplitst worden
 */
function splitIngredientLine(line: string): string[] {
  if (!line.trim()) return [];
  
  // Eerst: split op bullets (ook als ze direct aan woorden vastzitten zoals "uitjes⚫")
  // Pattern: bullet characters (⚫•·◦‣▪▸►|) met of zonder whitespace
  let processed = line;
  
  // Vervang bullets (ook zonder spatie) door een split-marker
  // Pattern: bullet direct na woord of voor woord
  processed = processed.replace(/([a-zA-ZÀ-ž])([⚫•·◦‣▪▸►|])/g, "$1 ||SPLIT|| ");
  processed = processed.replace(/([⚫•·◦‣▪▸►|])([a-zA-ZÀ-ž])/g, " ||SPLIT|| $2");
  // Ook bullets met whitespace
  processed = processed.replace(/\s*[⚫•·◦‣▪▸►|]\s*/g, " ||SPLIT|| ");
  
  // Split op de marker
  let parts = processed
    .split(/\|\|SPLIT\|\|/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.match(/^SPLIT$/i)); // Filter out split markers
  
  // Als er geen splits zijn gevonden, probeer andere patronen
  if (parts.length === 1) {
    // Probeer splitsen op " • " of "⚫" met whitespace
    parts = line
      .split(/\s*[⚫•·◦‣▪▸►|]\s*|\s+[.]\s+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }
  
  // Verder splitsen van delen die meerdere losse ingrediënten kunnen bevatten
  const finalParts: string[] = [];
  
  for (const part of parts) {
    const subParts = splitStandaloneIngredients(part);
    finalParts.push(...subParts);
  }
  
  return finalParts.length > 0 ? finalParts : [line.trim()];
}

/**
 * Split een deel dat mogelijk meerdere losse ingrediënten bevat
 * "kerstomaatjes peper zout" -> ["kerstomaatjes", "peper", "zout"]
 */
function splitStandaloneIngredients(part: string): string[] {
  // Als het deel begint met een hoeveelheid, niet splitsen
  if (/^\d+|^een|^twee|^drie|^half/i.test(part)) {
    return [part];
  }
  
  const words = part.split(/\s+/);
  
  // Als er maar 1-2 woorden zijn, niet splitsen
  if (words.length <= 2) {
    return [part];
  }
  
  // Check hoeveel woorden bekende losse ingrediënten zijn
  const standaloneCount = words.filter(w => 
    STANDALONE_INGREDIENTS.has(w.toLowerCase())
  ).length;
  
  // Als minstens 2 bekende losse ingrediënten, probeer te splitsen
  if (standaloneCount >= 2) {
    const result: string[] = [];
    let currentIngredient: string[] = [];
    
    for (const word of words) {
      const isStandalone = STANDALONE_INGREDIENTS.has(word.toLowerCase());
      
      if (isStandalone && currentIngredient.length > 0) {
        // Voeg vorige ingrediënt toe en start nieuwe
        result.push(currentIngredient.join(" "));
        currentIngredient = [word];
      } else if (isStandalone && currentIngredient.length === 0) {
        // Losse ingrediënt aan het begin
        result.push(word);
      } else {
        // Voeg toe aan huidige ingrediënt
        currentIngredient.push(word);
      }
    }
    
    // Laatste ingrediënt toevoegen
    if (currentIngredient.length > 0) {
      result.push(currentIngredient.join(" "));
    }
    
    return result.length > 0 ? result : [part];
  }
  
  return [part];
}

/**
 * Heuristisch secties bepalen als er geen headers zijn
 */
function inferSections(lines: string[]): Sections {
  const sections: Sections = {
    header: [],
    ingredients: [],
    steps: [],
    footer: [],
  };

  // Zoek naar patronen die ingrediënten aanduiden
  // (regels met hoeveelheden aan het begin)
  const ingredientPattern = /^\d+(?:[.,]\d+)?\s*(?:gram|gr|g|kg|ml|l|dl|el|tl|stuks?|st)/i;
  const stepPattern = /^\d+[.):\s]/;
  const bulletPattern = /^[-•*]\s/;

  let inIngredients = false;
  let inSteps = false;
  let foundFirstIngredient = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isIngredientLike = ingredientPattern.test(line) || (bulletPattern.test(line) && line.length < 100);
    const isStepLike = stepPattern.test(line) || (bulletPattern.test(line) && line.length > 50);

    // Eerste paar regels zijn vaak titel/beschrijving
    if (i < 3 && !foundFirstIngredient && !isIngredientLike) {
      sections.header.push(line);
      continue;
    }

    if (isIngredientLike && !inSteps) {
      inIngredients = true;
      foundFirstIngredient = true;
      sections.ingredients.push(line);
    } else if (isStepLike || (inSteps && line.length > 30)) {
      inIngredients = false;
      inSteps = true;
      sections.steps.push(line);
    } else if (inIngredients) {
      // Korte regels in ingredient sectie zijn waarschijnlijk ingrediënten
      if (line.length < 80) {
        sections.ingredients.push(line);
      } else {
        // Lange regel kan begin zijn van stappen
        inIngredients = false;
        inSteps = true;
        sections.steps.push(line);
      }
    } else if (inSteps) {
      sections.steps.push(line);
    } else {
      sections.header.push(line);
    }
  }

  return sections;
}

/**
 * Check of een regel een ingrediënten header is
 */
function isIngredientHeader(line: string): boolean {
  // Eerst exacte/regex match proberen
  if (SECTION_PATTERNS.ingredients.some((pattern) => pattern.test(line))) {
    return true;
  }
  
  // Dan fuzzy match op korte regels (headers zijn meestal kort)
  if (line.length < 30) {
    const firstWord = line.split(/[\s:]/)[0];
    if (fuzzyMatchHeader(firstWord, FUZZY_INGREDIENT_HEADERS)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check of een regel een stappen header is
 */
function isStepsHeader(line: string): boolean {
  // Eerst exacte/regex match proberen
  if (SECTION_PATTERNS.steps.some((pattern) => pattern.test(line))) {
    return true;
  }
  
  // Dan fuzzy match op korte regels
  if (line.length < 30) {
    const firstWord = line.split(/[\s:]/)[0];
    if (fuzzyMatchHeader(firstWord, FUZZY_STEPS_HEADERS)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract titel uit header sectie of elders in de tekst
 * Sommige recepten hebben de titel niet bovenaan maar ergens midden op de pagina
 */
function extractTitle(lines: string[], sections: Sections): string {
  // Verzamel alle kandidaten met scores
  const scoredCandidates: Array<{ text: string; score: number; source: string }> = [];
  
  // Strategie 1: Zoek in header sectie
  for (const line of sections.header) {
    if (isTitleCandidate(line)) {
      scoredCandidates.push({
        text: line,
        score: scoreTitleCandidate(line) + 1, // Bonus voor header positie
        source: "header"
      });
    }
  }

  // Strategie 2: Zoek een titel-achtige regel vlak voor "Ingrediënten" header
  const titleBeforeIngredients = findTitleBeforeSection(lines, SECTION_PATTERNS.ingredients);
  if (titleBeforeIngredients && isTitleCandidate(titleBeforeIngredients)) {
    scoredCandidates.push({
      text: titleBeforeIngredients,
      score: scoreTitleCandidate(titleBeforeIngredients) + 2, // Bonus voor positie voor ingrediënten
      source: "before_ingredients"
    });
  }

  // Strategie 3: Zoek een titel-achtige regel vlak voor "Bereiding" header
  const titleBeforeSteps = findTitleBeforeSection(lines, SECTION_PATTERNS.steps);
  if (titleBeforeSteps && isTitleCandidate(titleBeforeSteps)) {
    scoredCandidates.push({
      text: titleBeforeSteps,
      score: scoreTitleCandidate(titleBeforeSteps),
      source: "before_steps"
    });
  }

  // Strategie 4: Zoek in eerste 10 regels voor uppercase-heavy titels
  const top10 = lines.slice(0, 10);
  for (const line of top10) {
    if (isTitleCandidate(line) && !scoredCandidates.some(c => c.text === line)) {
      const uppercaseRatio = getUppercaseRatio(line);
      if (uppercaseRatio > 0.5) {
        scoredCandidates.push({
          text: line,
          score: scoreTitleCandidate(line),
          source: "top10_uppercase"
        });
      }
    }
  }

  // Sorteer op score (hoogste eerst) en kies de beste
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  if (scoredCandidates.length > 0 && scoredCandidates[0].score > 0) {
    return scoredCandidates[0].text;
  }

  // Fallback: eerste titel-kandidaat in alle regels
  const fallbackCandidate = lines.find(l => isTitleCandidate(l));
  if (fallbackCandidate) {
    return fallbackCandidate;
  }

  // Laatste fallback: eerste regel van het document
  if (lines.length > 0) {
    return lines[0].substring(0, 100);
  }

  return "Onbekend recept";
}

/**
 * Check of een regel een goede titel-kandidaat is
 */
function isTitleCandidate(line: string): boolean {
  const trimmed = line.trim();
  
  // Te kort of te lang (4-60 karakters is ideaal voor titels)
  if (trimmed.length < 4 || trimmed.length > 60) return false;
  
  // Is een sectie header
  if (isIngredientHeader(trimmed) || isStepsHeader(trimmed)) return false;
  
  // Is een paginanummer
  if (/^\d{1,3}$/.test(trimmed)) return false;
  
  // Is een genummerde stap
  if (/^\d+[.):\s]/.test(trimmed)) return false;
  
  // Is een bullet point
  if (/^[-•*⚫]\s/.test(trimmed)) return false;
  
  // Lijkt op een ingrediënt (begint met getal + unit)
  if (/^\d+(?:[.,]\d+)?\s*(gram|gr|g|kg|ml|l|dl|el|tl|stuks?|st)/i.test(trimmed)) return false;
  
  // Bevat "personen" of "porties" (metadata, geen titel)
  if (/\d+\s*(personen|porties)/i.test(trimmed)) return false;
  
  // Bevat cijfers aan het begin (vaak paginanummers of ruis zoals "Der 100")
  if (/^(Der|Seite|Page|Pagina)?\s*\d+/i.test(trimmed)) return false;
  
  // Is een categorie header (vaak CAPS, generieke termen)
  if (isCategoryHeader(trimmed)) return false;
  
  return true;
}

/**
 * Check of een regel een categorie header is (geen recept titel)
 * Bijv. "MEDITERRAAN", "VOORGERECHTEN", "HOOFDGERECHTEN"
 */
function isCategoryHeader(line: string): boolean {
  const categoryPatterns = [
    /^MEDITERRAAN$/i,
    /^(VOOR|HOOFD|NA)GERECHTEN?$/i,
    /^DESSERTS?$/i,
    /^SALADES?$/i,
    /^SOEPEN?$/i,
    /^BIJGERECHTEN?$/i,
    /^SNACKS?$/i,
    /^DRANKEN?$/i,
    /^ONTBIJT$/i,
    /^LUNCH$/i,
    /^DINER$/i,
    /^HAPJES?$/i,
    /^VLEES$/i,
    /^VIS$/i,
    /^VEGETARISCH$/i,
    /^VEGAN$/i,
    /^BAKKEN$/i,
    /^GRILLEN$/i,
    /^ROKEN$/i,
    /^BBQ$/i,
    /^KAMADO$/i,
  ];
  
  return categoryPatterns.some(p => p.test(line.trim()));
}

/**
 * Bereken uppercase ratio van een string
 * Titels hebben vaak een hoge uppercase ratio
 */
function getUppercaseRatio(text: string): number {
  const letters = text.replace(/[^a-zA-ZÀ-ž]/g, "");
  if (letters.length === 0) return 0;
  
  const uppercase = letters.replace(/[^A-ZÀ-Ž]/g, "");
  return uppercase.length / letters.length;
}

/**
 * Score een titel kandidaat (hoger = beter)
 */
function scoreTitleCandidate(line: string): number {
  let score = 0;
  const trimmed = line.trim();
  
  // Korte titels (5-25 karakters) zijn vaak de beste
  if (trimmed.length >= 5 && trimmed.length <= 25) {
    score += 3;
  } else if (trimmed.length >= 4 && trimmed.length <= 40) {
    score += 2;
  } else if (trimmed.length <= 50) {
    score += 1;
  }
  
  // Begint met hoofdletter
  if (/^[A-ZÀ-Ž]/.test(trimmed)) {
    score += 2;
  }
  
  // Hoge uppercase ratio (>0.5) suggereert een titel
  const uppercaseRatio = getUppercaseRatio(trimmed);
  if (uppercaseRatio > 0.5) {
    score += 2;
  } else if (uppercaseRatio > 0.2) {
    score += 1;
  }
  
  // Bonus voor titel-achtige patronen (twee woorden met hoofdletters)
  if (/^[A-ZÀ-Ž][a-zà-ž]+\s+[A-ZÀ-Ž]/.test(trimmed) || /^[A-ZÀ-Ž][a-zà-ž]+\s+[a-zà-ž]+$/.test(trimmed)) {
    score += 2;
  }
  
  // Penalty voor zinnen (bevat "Een", "Het", "Dit", "De" aan het begin)
  if (/^(Een|Het|Dit|De|Er|We|Je|Als)\s/i.test(trimmed)) {
    score -= 3;
  }
  
  // Penalty voor zinnen met veel woorden (>5)
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 5) {
    score -= 2;
  }
  
  // Penalty voor alleen hoofdletters (vaak categorie)
  if (uppercaseRatio === 1 && trimmed.length < 15) {
    score -= 2;
  }
  
  // Penalty voor tekst met veel leestekens
  const punctuationRatio = (trimmed.match(/[.,;:!?()]/g) || []).length / trimmed.length;
  if (punctuationRatio > 0.05) {
    score -= 2;
  }
  
  return score;
}

/**
 * Zoek een titel-achtige regel vlak voor een sectie header
 */
function findTitleBeforeSection(lines: string[], patterns: RegExp[]): string | null {
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = lines[i - 1];
    
    // Check of deze regel een sectie header is
    const isHeader = patterns.some(p => p.test(line));
    
    if (isHeader && prevLine) {
      // Check of de vorige regel een goede titel-kandidaat is
      if (isTitleCandidate(prevLine) && prevLine.length >= 5 && prevLine.length <= 80) {
        // Extra check: titel moet beginnen met hoofdletter
        if (/^[A-ZÀ-Ž]/.test(prevLine)) {
          return prevLine;
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract beschrijving uit header sectie
 */
function extractDescription(lines: string[], sections: Sections): string | null {
  if (sections.header.length > 1) {
    // Beschrijving zijn de regels na de titel
    const descLines = sections.header.slice(1).filter((l) => l.length > 20);
    if (descLines.length > 0) {
      return descLines.join(" ").substring(0, 500);
    }
  }
  return null;
}

/**
 * Parse ingrediënten sectie
 */
function parseIngredients(ingredientLines: string[]): ParsedIngredient[] {
  const ingredients: ParsedIngredient[] = [];

  for (const line of ingredientLines) {
    // Skip lege regels en headers
    if (!line || isIngredientHeader(line)) {
      continue;
    }

    // Remove bullet points
    const cleanLine = line.replace(/^[-•*]\s*/, "").trim();
    
    if (cleanLine.length < 2) {
      continue;
    }

    const parsed = parseIngredientLine(cleanLine);
    
    if (parsed.name) {
      ingredients.push({
        name: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit,
        notes: parsed.notes,
      });
    }
  }

  return ingredients;
}

/**
 * Parse stappen sectie
 */
function parseSteps(stepLines: string[]): ParsedStep[] {
  const steps: ParsedStep[] = [];
  let currentStep = "";
  let orderNo = 1;

  for (let i = 0; i < stepLines.length; i++) {
    const line = stepLines[i];
    const nextLine = i + 1 < stepLines.length ? stepLines[i + 1] : undefined;
    
    // Skip headers
    if (isStepsHeader(line)) {
      continue;
    }

    // Check of dit een nieuwe stap is (begint met nummer of bullet)
    // Patronen: "1.", "1)", "1:", "1. TITEL:", etc.
    // NIET: "1 bosje" (dat is een ingrediënt, geen stap)
    const startsWithNumberPunct = /^\d+[.):]/.test(line); // getal + punct (geen spatie!)
    const startsWithBullet = /^[-•*⚫]\s/.test(line);
    // "1 bosje", "2 el" etc. zijn ingrediënten, geen stappen
    const looksLikeIngredient = /^\d+\s+(bosje|el|tl|gram|g|kg|ml|l|dl|cl|stuks?|st|kleine|grote|theelepel|eetlepel|teentje|takje)/i.test(line);
    
    // Check voor ALLCAPS stap header (bijv. "AARDAPPELEN VOORBEREIDEN:")
    const isAllCapsHeader = isAllCapsStepHeader(line, nextLine);
    
    const isNewStep = (startsWithNumberPunct || startsWithBullet || isAllCapsHeader) && !looksLikeIngredient;

    if (isNewStep && currentStep) {
      // Vorige stap opslaan
      const instruction = normalizeStepWithTitle(currentStep);
      if (instruction.length >= 5) {
        steps.push({
          instruction,
          timerMinutes: extractTimerMinutes(instruction),
          targetTemp: extractTemperature(instruction),
          orderNo: orderNo++,
        });
      }
      currentStep = line;
    } else if (isNewStep) {
      currentStep = line;
    } else {
      // Voortzetting van huidige stap
      currentStep += " " + line;
    }
  }

  // Laatste stap opslaan
  if (currentStep) {
    const instruction = normalizeStepWithTitle(currentStep);
    if (instruction.length >= 5) {
      steps.push({
        instruction,
        timerMinutes: extractTimerMinutes(instruction),
        targetTemp: extractTemperature(instruction),
        orderNo: orderNo,
      });
    }
  }

  // Als geen stappen met nummering gevonden, splits op zinnen
  if (steps.length === 0 && stepLines.length > 0) {
    const fullText = stepLines.join(" ");
    const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    
    sentences.forEach((sentence, index) => {
      const instruction = sentence.trim();
      steps.push({
        instruction,
        timerMinutes: extractTimerMinutes(instruction),
        targetTemp: extractTemperature(instruction),
        orderNo: index + 1,
      });
    });
  }

  return steps;
}

/**
 * Check of een regel een ALLCAPS stap header is
 * Detecteert patronen zoals "AARDAPPELEN VOORBEREIDEN:" of "VLEES MARINEREN:"
 * 
 * Guards:
 * - Moet 2-5 woorden bevatten
 * - Moet >80% hoofdletters zijn
 * - Moet eindigen met ":" of gevolgd worden door instructie
 * - Geen ingrediënt-patroon (geen "500G AARDAPPELEN")
 */
function isAllCapsStepHeader(line: string, nextLine?: string): boolean {
  const trimmed = line.trim();
  
  // Te korte of te lange regels zijn geen headers
  if (trimmed.length < 5 || trimmed.length > 80) {
    return false;
  }
  
  // Check of het een ingrediënt-patroon is (false positive voorkomen)
  const isIngredientPattern = /^\d+\s*(gram|gr|g|kg|ml|l|dl|el|tl|stuks?|st)/i.test(trimmed) ||
                              /^\d+[.,]\d+\s*(gram|gr|g|kg|ml|l|dl|el|tl)/i.test(trimmed);
  if (isIngredientPattern) {
    return false;
  }
  
  // Tel aantal woorden
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2 || words.length > 5) {
    return false;
  }
  
  // Check of regel >80% hoofdletters bevat (rekening houdend met leestekens)
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length === 0) {
    return false;
  }
  
  const uppercaseLetters = letters.replace(/[^A-Z]/g, "");
  const uppercaseRatio = uppercaseLetters.length / letters.length;
  
  if (uppercaseRatio < 0.8) {
    return false;
  }
  
  // Moet eindigen met ":" of gevolgd worden door instructie op volgende regel
  const endsWithColon = trimmed.endsWith(":");
  const hasInstructionAfter = nextLine && nextLine.trim().length > 20 && 
                              !/^[A-Z\s]+:?\s*$/.test(nextLine.trim());
  
  if (!endsWithColon && !hasInstructionAfter) {
    return false;
  }
  
  // Check of het geen bekende ingredient header is
  if (isIngredientHeader(trimmed) || isStepsHeader(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * Normaliseer een stap en verwerk eventuele titel
 * Input: "1. AARDAPPELEN VOORBEREIDEN: schil de aardappelen..."
 * Output: "Aardappelen voorbereiden: schil de aardappelen..."
 * 
 * Ook: "AARDAPPELEN VOORBEREIDEN:\nschil de aardappelen..." → "Aardappelen voorbereiden: schil de aardappelen..."
 */
function normalizeStepWithTitle(step: string): string {
  let normalized = step
    .replace(/^\d+[.):\s]+/, "") // Remove leading numbers
    .replace(/^[-•*⚫]\s*/, "") // Remove bullet points
    .trim();
  
  // Check of er een ALLCAPS titel is (met of zonder dubbele punt)
  // Patronen:
  // - "AARDAPPELEN VOORBEREIDEN: schil de..." (op één regel)
  // - "AARDAPPELEN VOORBEREIDEN:\nschil de..." (op meerdere regels, maar al gemerged)
  // - "AARDAPPELEN VOORBEREIDEN" (alleen titel, rest komt later)
  const allCapsTitleMatch = normalized.match(/^([A-Z][A-Z\s]{2,}):?\s*(.+)?$/);
  if (allCapsTitleMatch) {
    const titlePart = allCapsTitleMatch[1].trim();
    const restPart = allCapsTitleMatch[2]?.trim() || "";
    
    // Check of het echt ALLCAPS is (>80% hoofdletters)
    const letters = titlePart.replace(/[^A-Za-z]/g, "");
    if (letters.length > 0) {
      const uppercaseLetters = letters.replace(/[^A-Z]/g, "");
      const uppercaseRatio = uppercaseLetters.length / letters.length;
      
      if (uppercaseRatio >= 0.8) {
        // Converteer ALLCAPS titel naar Title Case
        const title = titlePart.toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        if (restPart.length > 0) {
          // Er is content na de titel
          const restNormalized = restPart.charAt(0).toLowerCase() + restPart.slice(1);
          normalized = `${title}: ${restNormalized}`;
        } else {
          // Alleen titel, voeg dubbele punt toe
          normalized = `${title}:`;
        }
      }
    }
  }
  
  return normalized;
}

/**
 * Bereken ingredient section score (0-1)
 * Analyseert de ingredient sectie op basis van statistische cues
 */
function calculateIngredientSectionScore(lines: string[]): number {
  if (lines.length === 0) return 0;
  
  let score = 0;
  let totalLines = 0;
  
  for (const line of lines) {
    // Skip headers en lege regels
    if (!line.trim() || isIngredientHeader(line) || isStepsHeader(line)) {
      continue;
    }
    
    totalLines++;
    const trimmed = line.trim();
    
    // Check voor getal + unit patroon (sterke indicator)
    if (/^\d+(?:[.,]\d+)?\s*(gram|gr|g|kg|ml|l|dl|el|tl|stuks?|st|theelepel|eetlepel)/i.test(trimmed)) {
      score += 0.3;
    }
    // Check voor alleen getal (zwakkere indicator)
    else if (/^\d+(?:[.,]\d+)?\s+[a-z]/i.test(trimmed)) {
      score += 0.15;
    }
    
    // Check voor "naar smaak" / "optioneel" (indicator van ingredient)
    if (/naar\s+smaak|optioneel|ter\s+garnering/i.test(trimmed)) {
      score += 0.2;
    }
    
    // Check voor komma-lijst (meerdere ingrediënten op één regel)
    const commaCount = (trimmed.match(/,/g) || []).length;
    if (commaCount >= 2) {
      score += 0.25; // Sterke indicator van meerdere ingrediënten
    } else if (commaCount === 1) {
      score += 0.1;
    }
    
    // Check voor bullet points
    if (/^[-•*⚫·◦‣▪▸►]\s/.test(trimmed)) {
      score += 0.15;
    }
    
    // Check voor standalone ingredient woorden
    const words = trimmed.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (STANDALONE_INGREDIENTS.has(word)) {
        score += 0.1;
        break;
      }
    }
  }
  
  // Normaliseer naar 0-1 (max score per regel is ~0.8, dus deel door 0.8 * aantal regels)
  if (totalLines === 0) return 0;
  const normalizedScore = Math.min(1, score / (totalLines * 0.8));
  return normalizedScore;
}

/**
 * Bereken step section score (0-1)
 * Analyseert de stappen sectie op basis van statistische cues
 */
function calculateStepSectionScore(lines: string[]): number {
  if (lines.length === 0) return 0;
  
  let score = 0;
  let totalLines = 0;
  
  for (const line of lines) {
    // Skip headers en lege regels
    if (!line.trim() || isIngredientHeader(line) || isStepsHeader(line)) {
      continue;
    }
    
    totalLines++;
    const trimmed = line.trim();
    
    // Check voor genummerde stap (sterke indicator)
    if (/^\d+[.):]\s/.test(trimmed)) {
      score += 0.3;
    }
    
    // Check voor werkwoord aan het begin (sterke indicator)
    const firstWord = trimmed.split(/[\s,.:]/)[0].toLowerCase();
    if (STEP_STARTING_VERBS.has(firstWord)) {
      score += 0.25;
    }
    
    // Check voor tijd indicatie (minuten, uur)
    if (/\d+\s*(minuten?|uur)/i.test(trimmed)) {
      score += 0.2;
    }
    
    // Check voor temperatuur (°C, graden)
    if (/\d+\s*°|graden/i.test(trimmed)) {
      score += 0.2;
    }
    
    // Check voor imperatief (begint met hoofdletter, eindigt met punt)
    if (/^[A-Z][a-z]+.*\.$/.test(trimmed) && trimmed.length > 30) {
      score += 0.15;
    }
    
    // Check voor ALLCAPS kopjes (stap headers)
    if (isAllCapsStepHeader(trimmed)) {
      score += 0.25;
    }
    
    // Check voor lange instructie (waarschijnlijk een stap)
    if (trimmed.length > 50 && !/^\d+\s+(gram|gr|g|kg|ml|l|dl|el|tl)/i.test(trimmed)) {
      score += 0.1;
    }
  }
  
  // Normaliseer naar 0-1
  if (totalLines === 0) return 0;
  const normalizedScore = Math.min(1, score / (totalLines * 0.8));
  return normalizedScore;
}

/**
 * Repair ingredient parsing met agressievere splitting
 * Probeert ingrediënten te vinden die gemist zijn door de normale parsing
 */
function repairIngredientParsing(
  lines: string[],
  _currentIngredients: ParsedIngredient[]
): ParsedIngredient[] {
  const repaired: ParsedIngredient[] = [];
  
  for (const line of lines) {
    // Skip headers en lege regels
    if (!line.trim() || isIngredientHeader(line) || isStepsHeader(line)) {
      continue;
    }
    
    // Skip als het duidelijk een stap is (lange regel met werkwoord)
    if (isLikelyStep(line)) {
      continue;
    }
    
    // EERST: split op bullets (ook als ze direct aan woorden vastzitten)
    const bulletParts = splitIngredientLine(line);
    
    if (bulletParts.length > 1) {
      // Meerdere ingrediënten gevonden via bullets
      for (const part of bulletParts) {
        const parsed = parseIngredientLine(part);
        if (parsed.name && parsed.name.length > 1) {
          repaired.push({
            name: parsed.name,
            amount: parsed.amount,
            unit: parsed.unit,
            notes: parsed.notes,
          });
        }
      }
      continue;
    }
    
    // TWEEDE: split op komma's en puntkomma's (agressiever)
    const commaParts = line
      .split(/[,;]/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (commaParts.length > 1) {
      // Meerdere ingrediënten op één regel gescheiden door komma's
      for (const part of commaParts) {
        const parsed = parseIngredientLine(part);
        if (parsed.name && parsed.name.length > 1) {
          repaired.push({
            name: parsed.name,
            amount: parsed.amount,
            unit: parsed.unit,
            notes: parsed.notes,
          });
        }
      }
      continue;
    }
    
    // DERDE: split standalone ingrediënten (peper zout suiker)
    const standaloneParts = splitStandaloneIngredients(line);
    if (standaloneParts.length > 1) {
      for (const part of standaloneParts) {
        const parsed = parseIngredientLine(part);
        if (parsed.name && parsed.name.length > 1) {
          repaired.push({
            name: parsed.name,
            amount: parsed.amount,
            unit: parsed.unit,
            notes: parsed.notes,
          });
        }
      }
      continue;
    }
    
    // VIERDE: normale parsing (als fallback)
    const parsed = parseIngredientLine(line);
    if (parsed.name && parsed.name.length > 1) {
      repaired.push({
        name: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit,
        notes: parsed.notes,
      });
    }
  }
  
  // Verwijder duplicaten (op basis van naam, case-insensitive)
  const unique: ParsedIngredient[] = [];
  const seenNames = new Set<string>();
  
  for (const ing of repaired) {
    const nameLower = ing.name.toLowerCase().trim();
    if (!seenNames.has(nameLower) && nameLower.length > 1) {
      seenNames.add(nameLower);
      unique.push(ing);
    }
  }
  
  return unique;
}

/**
 * Repair step parsing met slimmere detectie
 * Probeert stappen te vinden die gemist zijn door de normale parsing
 */
function repairStepParsing(
  lines: string[],
  _currentSteps: ParsedStep[]
): ParsedStep[] {
  const repaired: ParsedStep[] = [];
  let currentStep = "";
  let orderNo = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : undefined;
    
    // Skip headers en lege regels
    if (!line.trim() || isStepsHeader(line)) {
      continue;
    }
    
    // Skip ingrediënten (duidelijke ingredient patterns)
    const looksLikeIngredient = /^\d+\s+(bosje|el|tl|gram|g|kg|ml|l|dl|cl|stuks?|st|kleine|grote|theelepel|eetlepel|teentje|takje)/i.test(line) ||
                                /^\d+(?:[.,]\d+)?\s*(gram|gr|g|kg|ml|l|dl|el|tl)/i.test(line);
    if (looksLikeIngredient) {
      continue;
    }
    
    // Check voor ALLCAPS header (ook als het gemist was)
    if (isAllCapsStepHeader(line, nextLine)) {
      if (currentStep) {
        // Vorige stap opslaan
        const instruction = normalizeStepWithTitle(currentStep);
        if (instruction.length >= 5) {
          repaired.push({
            instruction,
            timerMinutes: extractTimerMinutes(instruction),
            targetTemp: extractTemperature(instruction),
            orderNo: orderNo++,
          });
        }
      }
      currentStep = line;
      continue;
    }
    
    // Check voor genummerde stap (ook met lagere threshold)
    const startsWithNumberPunct = /^\d+[.):]/.test(line);
    
    if (startsWithNumberPunct && !looksLikeIngredient) {
      if (currentStep) {
        const instruction = normalizeStepWithTitle(currentStep);
        if (instruction.length >= 5) {
          repaired.push({
            instruction,
            timerMinutes: extractTimerMinutes(instruction),
            targetTemp: extractTemperature(instruction),
            orderNo: orderNo++,
          });
        }
      }
      currentStep = line;
      continue;
    }
    
    // Check voor werkwoord (met lagere threshold - ook korte regels vanaf 15 karakters)
    const firstWord = line.trim().split(/[\s,.:]/)[0].toLowerCase();
    if (STEP_STARTING_VERBS.has(firstWord) && line.trim().length > 15) {
      if (currentStep) {
        const instruction = normalizeStepWithTitle(currentStep);
        if (instruction.length >= 5) {
          repaired.push({
            instruction,
            timerMinutes: extractTimerMinutes(instruction),
            targetTemp: extractTemperature(instruction),
            orderNo: orderNo++,
          });
        }
      }
      currentStep = line;
      continue;
    }
    
    // Check voor temperatuur + tijd combinatie (zeer waarschijnlijk stap)
    const hasTemp = /\d+\s*°\s*[cCfF]/.test(line) || /\d+\s*graden/i.test(line);
    const hasTime = /\d+\s*minuten?/i.test(line) || /\d+\s*uur/i.test(line);
    if (hasTemp && hasTime && line.trim().length > 30) {
      if (currentStep) {
        const instruction = normalizeStepWithTitle(currentStep);
        if (instruction.length >= 5) {
          repaired.push({
            instruction,
            timerMinutes: extractTimerMinutes(instruction),
            targetTemp: extractTemperature(instruction),
            orderNo: orderNo++,
          });
        }
      }
      currentStep = line;
      continue;
    }
    
    // Check voor oven/verwarm instructies (zeer specifiek voor stappen)
    if (/verwarm.*oven|oven.*verwarm|voorverwarm/i.test(line) && line.trim().length > 20) {
      if (currentStep) {
        const instruction = normalizeStepWithTitle(currentStep);
        if (instruction.length >= 5) {
          repaired.push({
            instruction,
            timerMinutes: extractTimerMinutes(instruction),
            targetTemp: extractTemperature(instruction),
            orderNo: orderNo++,
          });
        }
      }
      currentStep = line;
      continue;
    }
    
    // Voortzetting van huidige stap (als het lang genoeg is)
    if (currentStep) {
      currentStep += " " + line;
    } else if (line.trim().length > 20) {
      // Start nieuwe stap als regel lang genoeg is
      currentStep = line;
    }
  }
  
  // Laatste stap opslaan
  if (currentStep) {
    const instruction = normalizeStepWithTitle(currentStep);
    if (instruction.length >= 5) {
      repaired.push({
        instruction,
        timerMinutes: extractTimerMinutes(instruction),
        targetTemp: extractTemperature(instruction),
        orderNo: orderNo,
      });
    }
  }
  
  // Verwijder duplicaten (op basis van instruction text, case-insensitive)
  const unique: ParsedStep[] = [];
  const seenInstructions = new Set<string>();
  
  for (const step of repaired) {
    const instructionLower = step.instruction.toLowerCase().trim();
    // Check of we deze instructie al hebben gezien (met fuzzy matching voor kleine verschillen)
    let isDuplicate = false;
    for (const seen of seenInstructions) {
      // Als instructies >80% overeenkomen, beschouw als duplicaat
      const similarity = calculateStringSimilarity(instructionLower, seen);
      if (similarity > 0.8) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate && instructionLower.length > 5) {
      seenInstructions.add(instructionLower);
      unique.push(step);
    }
  }
  
  return unique;
}

/**
 * Bereken string similarity (0-1) met Jaccard similarity
 */
function calculateStringSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Bereken confidence scores met gedetailleerde breakdown
 */
function calculateConfidence(
  title: string,
  ingredients: ParsedIngredient[],
  steps: ParsedStep[],
  serves: number | null,
  cookMinutes: number | null,
  ingredientSectionScore?: number,
  stepSectionScore?: number,
  ingredientRepairApplied?: boolean,
  stepRepairApplied?: boolean
): RecipeConfidence {
  // Verzamel details
  const titlePresent = Boolean(title && title !== "Onbekend recept");
  const titleScore = titlePresent ? scoreTitleCandidate(title) : 0;
  const ingredientsCount = ingredients.length;
  const ingredientsWithAmount = ingredients.filter((i) => i.amount !== null).length;
  const stepsCount = steps.length;
  const avgStepLength = steps.length > 0 
    ? steps.reduce((sum, s) => sum + s.instruction.length, 0) / steps.length 
    : 0;
  const hasServings = serves !== null;
  const hasCookTime = cookMinutes !== null;

  // Component scores (0-1)
  
  // Title: 0.15 max
  let titleConfidence = 0;
  if (titlePresent) {
    titleConfidence = 0.10;
    if (titleScore > 2) titleConfidence = 0.15;
    else if (titleScore > 0) titleConfidence = 0.12;
  }

  // Ingredients: 0.30 max
  // Gebruik per-sectie score als beschikbaar, anders fallback naar count-based
  let ingredientsConfidence = 0;
  if (ingredientSectionScore !== undefined) {
    // Gebruik per-sectie score (0-1) en schaal naar 0-0.30
    ingredientsConfidence = ingredientSectionScore * 0.20;
    // Bonus voor ingrediënten met hoeveelheden
    if (ingredientsCount > 0) {
      const amountRatio = ingredientsWithAmount / ingredientsCount;
      ingredientsConfidence += amountRatio * 0.10;
    }
  } else {
    // Fallback naar oude logica
    if (ingredientsCount >= 5) {
      ingredientsConfidence = 0.20;
    } else if (ingredientsCount >= 3) {
      ingredientsConfidence = 0.15;
    } else if (ingredientsCount >= 1) {
      ingredientsConfidence = 0.08;
    }
    // Bonus voor ingrediënten met hoeveelheden
    if (ingredientsCount > 0) {
      const amountRatio = ingredientsWithAmount / ingredientsCount;
      ingredientsConfidence += amountRatio * 0.10;
    }
  }

  // Steps: 0.30 max
  // Gebruik per-sectie score als beschikbaar, anders fallback naar count-based
  let stepsConfidence = 0;
  if (stepSectionScore !== undefined) {
    // Gebruik per-sectie score (0-1) en schaal naar 0-0.30
    stepsConfidence = stepSectionScore * 0.20;
    // Bonus voor goede stap-lengte (>30 karakters gemiddeld)
    if (avgStepLength > 50) {
      stepsConfidence += 0.10;
    } else if (avgStepLength > 30) {
      stepsConfidence += 0.05;
    }
  } else {
    // Fallback naar oude logica
    if (stepsCount >= 4) {
      stepsConfidence = 0.20;
    } else if (stepsCount >= 2) {
      stepsConfidence = 0.15;
    } else if (stepsCount >= 1) {
      stepsConfidence = 0.08;
    }
    // Bonus voor goede stap-lengte (>30 karakters gemiddeld)
    if (avgStepLength > 50) {
      stepsConfidence += 0.10;
    } else if (avgStepLength > 30) {
      stepsConfidence += 0.05;
    }
  }

  // Metadata: 0.15 max
  let metadataConfidence = 0;
  if (hasServings) metadataConfidence += 0.08;
  if (hasCookTime) metadataConfidence += 0.07;

  // No noise bonus: 0.10 max
  // Als titel geen ruis bevat (geen "Der", geen cijfers)
  let noNoiseBonus = 0;
  if (titlePresent && !/\d/.test(title) && !/^(Der|MEDITERRAAN)/i.test(title)) {
    noNoiseBonus = 0.10;
  }

  // Overall confidence
  const overall = Math.min(1, 
    titleConfidence + 
    ingredientsConfidence + 
    stepsConfidence + 
    metadataConfidence + 
    noNoiseBonus
  );

  return {
    overall: Math.round(overall * 100) / 100,
    title: Math.round((titleConfidence / 0.15) * 100) / 100,
    ingredients: Math.round((ingredientsConfidence / 0.30) * 100) / 100,
    steps: Math.round((stepsConfidence / 0.30) * 100) / 100,
    details: {
      titlePresent,
      titleScore,
      ingredientsCount,
      ingredientsWithAmount,
      stepsCount,
      avgStepLength: Math.round(avgStepLength),
      hasServings,
      hasCookTime,
      ingredientSectionScore: ingredientSectionScore !== undefined 
        ? Math.round(ingredientSectionScore * 100) / 100 
        : undefined,
      stepSectionScore: stepSectionScore !== undefined 
        ? Math.round(stepSectionScore * 100) / 100 
        : undefined,
      ingredientRepairApplied: ingredientRepairApplied || false,
      stepRepairApplied: stepRepairApplied || false,
    },
  };
}

/**
 * Maak een leeg recept (voor als OCR faalt)
 */
function createEmptyRecipe(): ParsedRecipe {
  return {
    title: "Onbekend recept",
    description: null,
    serves: null,
    prepMinutes: null,
    cookMinutes: null,
    targetInternalTemp: null,
    ingredients: [],
    steps: [],
    confidence: {
      overall: 0,
      title: 0,
      ingredients: 0,
      steps: 0,
      details: {
        titlePresent: false,
        titleScore: 0,
        ingredientsCount: 0,
        ingredientsWithAmount: 0,
        stepsCount: 0,
        avgStepLength: 0,
        hasServings: false,
        hasCookTime: false,
      },
    },
  };
}


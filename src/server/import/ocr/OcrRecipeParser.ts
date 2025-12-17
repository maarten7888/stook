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
    // OCR fuzzy varianten (I/l/1 verwisseling, etc.)
    /^[il1]ngred[il1][eëé]nten/i,
    /^lngredi[eëé]nten/i,
    /^1ngred/i,
    // Afkortingen en variaties
    /^ingr\./i,
    /^voor dit recept/i,
    /^dit heb je nodig/i,
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
const FUZZY_INGREDIENT_HEADERS = ["ingredienten", "ingrediënten", "benodigdheden", "ingredients"];
const FUZZY_STEPS_HEADERS = ["bereiding", "bereidingswijze", "werkwijze", "instructies", "method", "preparation"];

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
  const ingredients = parseIngredients(sections.ingredients);
  const steps = parseSteps(sections.steps);

  // Extract metadata uit de hele tekst
  const serves = extractServings(text);
  const prepMinutes = extractPrepTime(text);
  const cookMinutes = extractCookTime(text);
  const targetInternalTemp = extractTemperature(text);

  // Bereken confidence scores
  const confidence = calculateConfidence(title, ingredients, steps);

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
    if (/^\d+[.)]\s*[A-Z]/.test(line)) {
      // Dit lijkt een genummerde stap - switch naar steps sectie
      currentSection = "steps";
      stepsStartIndex = i;
      sections.steps.push(line);
      continue;
    }

    // Voeg toe aan huidige sectie
    if (currentSection === "ingredients") {
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
 * Split een ingrediënten regel op bullets en andere scheidingstekens
 * OCR output heeft vaak: "500g aardappelen • 1 ui ⚫ 2 el olie"
 */
function splitIngredientLine(line: string): string[] {
  if (!line.trim()) return [];
  
  // Split op bullets, dots die als bullets fungeren, en andere scheidingstekens
  // Maar niet op punten die onderdeel zijn van afkortingen (el., tl., gr.)
  const parts = line
    .split(/\s*[⚫•·◦‣▪▸►]\s*|\s+[.]\s+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // Als er maar één deel is, return als array
  if (parts.length <= 1) {
    return [line.trim()];
  }
  
  return parts;
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
  // Strategie 1: Zoek in header sectie
  if (sections.header.length > 0) {
    const candidates = sections.header.filter((l) => isTitleCandidate(l));
    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  // Strategie 2: Zoek een titel-achtige regel vlak voor "Ingrediënten" header
  // Dit is voor recepten waar de volgorde is: Bereiding → Titel → Ingrediënten
  const titleBeforeIngredients = findTitleBeforeSection(lines, SECTION_PATTERNS.ingredients);
  if (titleBeforeIngredients) {
    return titleBeforeIngredients;
  }

  // Strategie 3: Zoek een titel-achtige regel vlak voor "Bereiding" header
  const titleBeforeSteps = findTitleBeforeSection(lines, SECTION_PATTERNS.steps);
  if (titleBeforeSteps) {
    return titleBeforeSteps;
  }

  // Strategie 4: Zoek de beste titel-kandidaat in alle regels
  const allCandidates = lines.filter((l) => isTitleCandidate(l));
  if (allCandidates.length > 0) {
    // Kies de regel die het meest op een titel lijkt (niet te lang, geen cijfers aan begin)
    const bestCandidate = allCandidates.find(c => 
      c.length >= 10 && c.length <= 60 && /^[A-ZÀ-Ž]/.test(c)
    ) || allCandidates[0];
    return bestCandidate;
  }

  // Fallback: eerste regel van het document
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
  
  // Te kort of te lang
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  
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
  
  return true;
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

  for (const line of stepLines) {
    // Skip headers
    if (isStepsHeader(line)) {
      continue;
    }

    // Check of dit een nieuwe stap is (begint met nummer of bullet)
    // Patronen: "1.", "1)", "1:", "1. TITEL:", etc.
    const isNewStep = /^\d+[.):\s]/.test(line) || /^[-•*⚫]\s/.test(line);

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
 * Normaliseer een stap en verwerk eventuele titel
 * Input: "1. AARDAPPELEN VOORBEREIDEN: schil de aardappelen..."
 * Output: "Aardappelen voorbereiden: schil de aardappelen..."
 */
function normalizeStepWithTitle(step: string): string {
  let normalized = step
    .replace(/^\d+[.):\s]+/, "") // Remove leading numbers
    .replace(/^[-•*⚫]\s*/, "") // Remove bullet points
    .trim();
  
  // Check of er een CAPS titel is gevolgd door een dubbele punt
  // "AARDAPPELEN VOORBEREIDEN: schil de..."
  const titleMatch = normalized.match(/^([A-Z][A-Z\s]+):\s*(.+)$/);
  if (titleMatch) {
    // Converteer CAPS titel naar Title Case
    const title = titleMatch[1].toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    const rest = titleMatch[2];
    // Maak eerste letter van rest lowercase als het geen eigennaam lijkt
    const restNormalized = rest.charAt(0).toLowerCase() + rest.slice(1);
    normalized = `${title}: ${restNormalized}`;
  }
  
  return normalized;
}

/**
 * Bereken confidence scores
 */
function calculateConfidence(
  title: string,
  ingredients: ParsedIngredient[],
  steps: ParsedStep[]
): RecipeConfidence {
  // Title confidence
  const titleConfidence = title && title !== "Onbekend recept" ? 0.9 : 0.3;

  // Ingredients confidence
  let ingredientsConfidence = 0;
  if (ingredients.length === 0) {
    ingredientsConfidence = 0;
  } else if (ingredients.length < 3) {
    ingredientsConfidence = 0.5;
  } else {
    // Hoger als meer ingrediënten een hoeveelheid hebben
    const withAmount = ingredients.filter((i) => i.amount !== null).length;
    ingredientsConfidence = 0.5 + (withAmount / ingredients.length) * 0.4;
  }

  // Steps confidence
  let stepsConfidence = 0;
  if (steps.length === 0) {
    stepsConfidence = 0;
  } else if (steps.length < 2) {
    stepsConfidence = 0.4;
  } else {
    // Hoger als stappen een redelijke lengte hebben
    const goodSteps = steps.filter((s) => s.instruction.length > 20).length;
    stepsConfidence = 0.5 + (goodSteps / steps.length) * 0.4;
  }

  // Overall confidence
  const overall =
    titleConfidence * 0.2 +
    ingredientsConfidence * 0.4 +
    stepsConfidence * 0.4;

  return {
    overall: Math.round(overall * 100) / 100,
    title: Math.round(titleConfidence * 100) / 100,
    ingredients: Math.round(ingredientsConfidence * 100) / 100,
    steps: Math.round(stepsConfidence * 100) / 100,
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
    },
  };
}


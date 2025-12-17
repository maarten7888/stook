/**
 * OcrRecipeParser - Parse OCR tekst naar recept structuur
 * 
 * Herkent secties op basis van NL/EN headings en patronen zoals bullets en nummering.
 */

import {
  normalizeWhitespace,
  parseIngredientLine,
  normalizeStep,
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
const SECTION_PATTERNS = {
  ingredients: [
    /^ingredi[eë]nten/i,
    /^benodigdheden/i,
    /^wat heb je nodig/i,
    /^ingredients/i,
    /^je hebt nodig/i,
    /^nodig/i,
  ],
  steps: [
    /^bereiding/i,
    /^bereidingswijze/i,
    /^werkwijze/i,
    /^instructies/i,
    /^stappen/i,
    /^zo maak je het/i,
    /^aan de slag/i,
    /^instructions/i,
    /^method/i,
    /^directions/i,
    /^preparation/i,
  ],
  info: [
    /^info/i,
    /^informatie/i,
    /^gegevens/i,
    /^over dit recept/i,
  ],
};

/**
 * Parse OCR tekst naar een gestructureerd recept
 */
export function parseOcrText(rawText: string): ParsedRecipe {
  const text = normalizeWhitespace(rawText);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

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

    // Check voor sectie headers
    if (isIngredientHeader(line)) {
      currentSection = "ingredients";
      ingredientsStartIndex = i;
      continue;
    }

    if (isStepsHeader(line)) {
      currentSection = "steps";
      stepsStartIndex = i;
      continue;
    }

    // Voeg toe aan huidige sectie
    sections[currentSection].push(line);
  }

  // Als geen expliciete headers gevonden, probeer heuristisch te splitsen
  if (ingredientsStartIndex === -1 && stepsStartIndex === -1) {
    return inferSections(lines);
  }

  return sections;
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
  return SECTION_PATTERNS.ingredients.some((pattern) => pattern.test(line));
}

/**
 * Check of een regel een stappen header is
 */
function isStepsHeader(line: string): boolean {
  return SECTION_PATTERNS.steps.some((pattern) => pattern.test(line));
}

/**
 * Extract titel uit header sectie
 */
function extractTitle(lines: string[], sections: Sections): string {
  // Titel is meestal de eerste regel of de langste regel in de header
  if (sections.header.length > 0) {
    // Filter regels die te kort of te lang zijn
    const candidates = sections.header.filter((l) => l.length >= 3 && l.length <= 100);
    
    if (candidates.length > 0) {
      // Eerste regel is vaak de titel
      return candidates[0];
    }
  }

  // Fallback: eerste regel van het document
  if (lines.length > 0) {
    return lines[0].substring(0, 100);
  }

  return "Onbekend recept";
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
    const isNewStep = /^\d+[.):\s]/.test(line) || /^[-•*]\s/.test(line);

    if (isNewStep && currentStep) {
      // Vorige stap opslaan
      const instruction = normalizeStep(currentStep);
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
    const instruction = normalizeStep(currentStep);
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


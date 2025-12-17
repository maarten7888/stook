/**
 * OCR Import Module
 * 
 * Export alle OCR gerelateerde functies voor eenvoudige import.
 */

export { performOcr, validateImage } from "./GoogleVisionOcr";
export type { OcrResult, TextBlock } from "./GoogleVisionOcr";

export { parseOcrText } from "./OcrRecipeParser";
export type {
  ParsedRecipe,
  ParsedIngredient,
  ParsedStep,
  RecipeConfidence,
} from "./OcrRecipeParser";

export {
  normalizeWhitespace,
  normalizeUnit,
  parseIngredientLine,
  normalizeStep,
  extractTimerMinutes,
  extractTemperature,
  extractServings,
  extractPrepTime,
  extractCookTime,
} from "./OcrNormalizer";


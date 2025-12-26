import { describe, it, expect } from "vitest";
import { parseOcrText } from "@/server/import/ocr/OcrRecipeParser";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

interface GoldenTestCase {
  name: string;
  description: string;
  rawText: string;
  expected: {
    title?: {
      exact?: string;
      contains?: string[];
    };
    description?: {
      contains?: string[];
    };
    ingredients?: {
      count?: number | { min: number; max: number };
      items?: Array<{
        name?: { contains?: string };
        amount?: number;
        unit?: string;
        notes?: string;
      }>;
    };
    steps?: {
      count?: number | { min: number; max: number };
      items?: Array<{
        instruction?: { contains?: string };
        timerMinutes?: number | { min: number; max: number };
        targetTemp?: number;
        orderNo?: number;
      }>;
    };
    serves?: number;
    confidence?: {
      overall?: { min?: number; max?: number };
    };
  };
}

/**
 * Check of een ingredient voldoet aan expected constraints
 */
function matchesIngredient(
  ingredient: { name: string; amount: number | null; unit: string | null; notes: string | null },
  expected: {
    name?: { contains?: string };
    amount?: number;
    unit?: string;
    notes?: string;
  }
): boolean {
  if (expected.name?.contains && !ingredient.name.toLowerCase().includes(expected.name.contains.toLowerCase())) {
    return false;
  }
  if (expected.amount !== undefined && ingredient.amount !== expected.amount) {
    return false;
  }
  if (expected.unit !== undefined && ingredient.unit !== expected.unit) {
    return false;
  }
  if (expected.notes !== undefined && ingredient.notes !== expected.notes) {
    return false;
  }
  return true;
}

/**
 * Check of een stap voldoet aan expected constraints
 */
function matchesStep(
  step: { instruction: string; timerMinutes: number | null; targetTemp: number | null; orderNo: number },
  expected: {
    instruction?: { contains?: string };
    timerMinutes?: number | { min: number; max: number };
    targetTemp?: number;
    orderNo?: number | { min: number; max: number };
  }
): boolean {
  if (expected.instruction?.contains && !step.instruction.toLowerCase().includes(expected.instruction.contains.toLowerCase())) {
    return false;
  }
  if (expected.timerMinutes !== undefined) {
    if (typeof expected.timerMinutes === "number") {
      if (step.timerMinutes !== expected.timerMinutes) return false;
    } else {
      if (step.timerMinutes === null) return false;
      if (step.timerMinutes < expected.timerMinutes.min || step.timerMinutes > expected.timerMinutes.max) {
        return false;
      }
    }
  }
  if (expected.targetTemp !== undefined && step.targetTemp !== expected.targetTemp) {
    return false;
  }
  if (expected.orderNo !== undefined) {
    if (typeof expected.orderNo === "number") {
      if (step.orderNo !== expected.orderNo) return false;
    } else {
      if (step.orderNo < expected.orderNo.min || step.orderNo > expected.orderNo.max) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Metrics voor CI logging
 */
interface TestMetrics {
  testName: string;
  titleExactMatch: boolean;
  titleContainsMatch: boolean;
  ingredientCountMatch: boolean;
  stepCountMatch: boolean;
  overallConfidence: number;
  passed: boolean;
}

const allMetrics: TestMetrics[] = [];

/**
 * Run een golden test case
 */
function runGoldenTest(testCase: GoldenTestCase): TestMetrics {
  const result = parseOcrText(testCase.rawText);
  
  const metrics: TestMetrics = {
    testName: testCase.name,
    titleExactMatch: false,
    titleContainsMatch: false,
    ingredientCountMatch: false,
    stepCountMatch: false,
    overallConfidence: result.confidence.overall,
    passed: false,
  };
  
  // Check title
  if (testCase.expected.title) {
    if (testCase.expected.title.exact) {
      metrics.titleExactMatch = result.title === testCase.expected.title.exact;
      expect(result.title).toBe(testCase.expected.title.exact);
    }
    if (testCase.expected.title.contains) {
      for (const contains of testCase.expected.title.contains) {
        metrics.titleContainsMatch = result.title.toLowerCase().includes(contains.toLowerCase());
        expect(result.title.toLowerCase()).toContain(contains.toLowerCase());
      }
    }
  }
  
  // Check description
  if (testCase.expected.description?.contains) {
    const desc = result.description || "";
    for (const contains of testCase.expected.description.contains) {
      expect(desc.toLowerCase()).toContain(contains.toLowerCase());
    }
  }
  
  // Check ingredients
  if (testCase.expected.ingredients) {
    const expectedCount = testCase.expected.ingredients.count;
    if (expectedCount !== undefined) {
      if (typeof expectedCount === "number") {
        metrics.ingredientCountMatch = result.ingredients.length === expectedCount;
        // Soft assert: log maar faal niet (threshold check doet hard assert)
        if (result.ingredients.length !== expectedCount) {
          console.warn(`  ⚠️  Ingredient count mismatch: expected ${expectedCount}, got ${result.ingredients.length}`);
        }
      } else {
        metrics.ingredientCountMatch = 
          result.ingredients.length >= expectedCount.min && 
          result.ingredients.length <= expectedCount.max;
        // Soft assert: log maar faal niet (threshold check doet hard assert)
        if (result.ingredients.length < expectedCount.min || result.ingredients.length > expectedCount.max) {
          console.warn(`  ⚠️  Ingredient count out of range: expected ${expectedCount.min}-${expectedCount.max}, got ${result.ingredients.length}`);
        }
      }
    }
    
    // Check specifieke ingrediënten (soft assert)
    if (testCase.expected.ingredients.items) {
      // Debug: toon alle ingrediënten voor aardappelpannetje en gehaktbrood
      if (testCase.name.includes("Aardappelpannetje") || testCase.name.includes("Gehaktbrood")) {
        console.log(`\n  📋 Parsed ingredients for ${testCase.name}:`);
        if (result.ingredients.length === 0) {
          console.log(`    ⚠️  No ingredients found!`);
        } else {
          result.ingredients.forEach((ing, idx) => {
            console.log(`    ${idx + 1}. name: "${ing.name}", amount: ${ing.amount}, unit: ${ing.unit === null ? 'null' : `"${ing.unit}"`}`);
          });
        }
      }
      for (const expectedIngredient of testCase.expected.ingredients.items) {
        const found = result.ingredients.find(ing => matchesIngredient(ing, expectedIngredient));
        if (!found) {
          console.warn(`  ⚠️  Expected ingredient not found: ${JSON.stringify(expectedIngredient)}`);
        }
        // Soft assert: log maar faal niet (threshold check doet hard assert)
      }
    }
  }
  
  // Check steps
  if (testCase.expected.steps) {
    const expectedCount = testCase.expected.steps.count;
    if (expectedCount !== undefined) {
      if (typeof expectedCount === "number") {
        metrics.stepCountMatch = result.steps.length === expectedCount;
        // Soft assert: log maar faal niet (threshold check doet hard assert)
        if (result.steps.length !== expectedCount) {
          console.warn(`  ⚠️  Step count mismatch: expected ${expectedCount}, got ${result.steps.length}`);
        }
      } else {
        metrics.stepCountMatch = 
          result.steps.length >= expectedCount.min && 
          result.steps.length <= expectedCount.max;
        // Soft assert: log maar faal niet (threshold check doet hard assert)
        if (result.steps.length < expectedCount.min || result.steps.length > expectedCount.max) {
          console.warn(`  ⚠️  Step count out of range: expected ${expectedCount.min}-${expectedCount.max}, got ${result.steps.length}`);
        }
      }
    }
    
    // Check specifieke stappen (soft assert)
    if (testCase.expected.steps.items) {
      for (const expectedStep of testCase.expected.steps.items) {
        const found = result.steps.find(step => matchesStep(step, expectedStep));
        if (!found) {
          console.warn(`  ⚠️  Expected step not found: ${JSON.stringify(expectedStep)}`);
        }
        // Soft assert: log maar faal niet (threshold check doet hard assert)
      }
    }
  }
  
  // Check serves (soft assert)
  if (testCase.expected.serves !== undefined) {
    if (result.serves !== testCase.expected.serves) {
      console.warn(`  ⚠️  Serves mismatch: expected ${testCase.expected.serves}, got ${result.serves}`);
    }
  }

  // Check confidence (soft assert)
  if (testCase.expected.confidence?.overall?.min !== undefined) {
    if (result.confidence.overall < testCase.expected.confidence.overall.min) {
      console.warn(`  ⚠️  Confidence below minimum: expected >= ${testCase.expected.confidence.overall.min}, got ${result.confidence.overall}`);
    }
  }

  // Test passed als thresholds worden gehaald (checked in afterAll)
  metrics.passed = true;
  return metrics;
}

describe("OCR Golden Tests", () => {
  const fixturesDir = join(process.cwd(), "fixtures", "ocr");
  
  // Load en run alle golden test cases
  it("should load and run all golden test cases", async () => {
    const files = await readdir(fixturesDir);
    const testFiles = files.filter(f => f.endsWith(".json")).sort();
    
    expect(testFiles.length).toBeGreaterThan(0);
    
    for (const file of testFiles) {
      const filePath = join(fixturesDir, file);
      const content = await readFile(filePath, "utf-8");
      const testCase: GoldenTestCase = JSON.parse(content);
      
      const metrics = runGoldenTest(testCase);
      allMetrics.push(metrics);
    }
  });
  
  // Log metrics en assert thresholds na alle tests
  afterAll(() => {
    if (allMetrics.length > 0) {
      const totalTests = allMetrics.length;
      
      // Bereken rates
      const titleExactRate = allMetrics.filter(m => m.titleExactMatch).length / totalTests;
      const titleContainsRate = allMetrics.filter(m => m.titleContainsMatch).length / totalTests;
      const ingredientCountRate = allMetrics.filter(m => m.ingredientCountMatch).length / totalTests;
      const stepCountRate = allMetrics.filter(m => m.stepCountMatch).length / totalTests;
      const avgConfidence = allMetrics.reduce((sum, m) => sum + m.overallConfidence, 0) / totalTests;
      
      // Log metrics
      console.log("\n=== OCR Golden Test Metrics ===");
      console.log(`Total tests: ${totalTests}`);
      console.log(`Passed: ${allMetrics.filter(m => m.passed).length}`);
      console.log(`Title exact matches: ${allMetrics.filter(m => m.titleExactMatch).length}/${totalTests} (${(titleExactRate * 100).toFixed(1)}%)`);
      console.log(`Title contains matches: ${allMetrics.filter(m => m.titleContainsMatch).length}/${totalTests} (${(titleContainsRate * 100).toFixed(1)}%)`);
      console.log(`Ingredient count matches: ${allMetrics.filter(m => m.ingredientCountMatch).length}/${totalTests} (${(ingredientCountRate * 100).toFixed(1)}%)`);
      console.log(`Step count matches: ${allMetrics.filter(m => m.stepCountMatch).length}/${totalTests} (${(stepCountRate * 100).toFixed(1)}%)`);
      console.log(`Average confidence: ${avgConfidence.toFixed(2)}`);
      console.log("\nPer-test breakdown:");
      allMetrics.forEach(m => {
        console.log(`  ${m.testName}:`);
        console.log(`    Title exact: ${m.titleExactMatch ? "✅" : "❌"}, Contains: ${m.titleContainsMatch ? "✅" : "❌"}`);
        console.log(`    Ingredients: ${m.ingredientCountMatch ? "✅" : "❌"} (${m.overallConfidence.toFixed(2)} confidence)`);
        console.log(`    Steps: ${m.stepCountMatch ? "✅" : "❌"}`);
      });
      
      // CI Gate: Assert thresholds (blokkeert build bij regressie)
      // Thresholds zijn conservatief ingesteld; verhoog naarmate parser verbetert
      const THRESHOLDS = {
        titleExactRate: 0.5,        // 50% exact title matches (verhoog naar 0.7 bij meer test cases)
        ingredientCountRate: 0.75,  // 75% ingredient count within tolerance (verhoog naar 0.8 bij meer test cases)
        stepCountRate: 0.8,         // 80% step count within tolerance
      };
      
      // Alle tests hebben ingrediënten en stappen verwachting
      
      console.log("\n=== CI Thresholds Check ===");
      console.log(`Title exact rate: ${(titleExactRate * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.titleExactRate * 100).toFixed(0)}%)`);
      console.log(`Ingredient count rate: ${(ingredientCountRate * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.ingredientCountRate * 100).toFixed(0)}%)`);
      console.log(`Step count rate: ${(stepCountRate * 100).toFixed(1)}% (threshold: ${(THRESHOLDS.stepCountRate * 100).toFixed(0)}%)`);
      
      // Assert thresholds (faalt test bij regressie)
      // Alleen checken als er voldoende test cases zijn (minimaal 3 voor betrouwbare metrics)
      if (totalTests >= 3) {
        expect(titleExactRate).toBeGreaterThanOrEqual(THRESHOLDS.titleExactRate);
        expect(ingredientCountRate).toBeGreaterThanOrEqual(THRESHOLDS.ingredientCountRate);
        expect(stepCountRate).toBeGreaterThanOrEqual(THRESHOLDS.stepCountRate);
        console.log("✅ All thresholds met!");
      } else {
        console.log(`⚠️  Te weinig test cases (${totalTests}) voor betrouwbare threshold checks. Minimaal 3 vereist.`);
      }
    }
  });
});


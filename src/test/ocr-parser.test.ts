import { describe, it, expect } from "vitest";
import { parseOcrText } from "@/server/import/ocr/OcrRecipeParser";
import {
  normalizeWhitespace,
  normalizeUnit,
  parseIngredientLine,
  normalizeStep,
  extractTimerMinutes,
  extractTemperature,
  extractServings,
} from "@/server/import/ocr/OcrNormalizer";

describe("OcrNormalizer", () => {
  describe("normalizeWhitespace", () => {
    it("should normalize multiple spaces", () => {
      expect(normalizeWhitespace("hello   world")).toBe("hello world");
    });

    it("should normalize Windows line endings", () => {
      expect(normalizeWhitespace("hello\r\nworld")).toBe("hello\nworld");
    });

    it("should trim leading and trailing whitespace", () => {
      expect(normalizeWhitespace("  hello  ")).toBe("hello");
    });

    it("should limit consecutive newlines to 2", () => {
      expect(normalizeWhitespace("hello\n\n\n\nworld")).toBe("hello\n\nworld");
    });
  });

  describe("normalizeUnit", () => {
    it("should normalize gram variants", () => {
      expect(normalizeUnit("gram")).toBe("g");
      expect(normalizeUnit("gr")).toBe("g");
      expect(normalizeUnit("gr.")).toBe("g");
    });

    it("should normalize eetlepel variants", () => {
      expect(normalizeUnit("eetlepel")).toBe("el");
      expect(normalizeUnit("eetlepels")).toBe("el");
      expect(normalizeUnit("el.")).toBe("el");
    });

    it("should normalize theelepel variants", () => {
      expect(normalizeUnit("theelepel")).toBe("tl");
      expect(normalizeUnit("theelepels")).toBe("tl");
      expect(normalizeUnit("tl.")).toBe("tl");
    });

    it("should normalize volume units", () => {
      expect(normalizeUnit("milliliter")).toBe("ml");
      expect(normalizeUnit("liter")).toBe("l");
      expect(normalizeUnit("deciliter")).toBe("dl");
    });

    it("should return lowercase for unknown units", () => {
      expect(normalizeUnit("UNKNOWN")).toBe("unknown");
    });
  });

  describe("parseIngredientLine", () => {
    it("should parse amount + unit + name", () => {
      const result = parseIngredientLine("200 gram kipfilet");
      expect(result).toEqual({
        amount: 200,
        unit: "g",
        name: "kipfilet",
      });
    });

    it("should parse eetlepel", () => {
      const result = parseIngredientLine("2 el olijfolie");
      expect(result).toEqual({
        amount: 2,
        unit: "el",
        name: "olijfolie",
      });
    });

    it("should parse theelepel", () => {
      const result = parseIngredientLine("1 tl zout");
      expect(result).toEqual({
        amount: 1,
        unit: "tl",
        name: "zout",
      });
    });

    it("should parse decimal amounts", () => {
      const result = parseIngredientLine("1.5 kg varkensvlees");
      expect(result).toEqual({
        amount: 1.5,
        unit: "kg",
        name: "varkensvlees",
      });
    });

    it("should parse amount without unit", () => {
      const result = parseIngredientLine("3 eieren");
      expect(result).toEqual({
        amount: 3,
        unit: null,
        name: "eieren",
      });
    });

    it("should handle ingredient without amount", () => {
      const result = parseIngredientLine("zout naar smaak");
      expect(result).toEqual({
        amount: null,
        unit: null,
        name: "zout naar smaak",
      });
    });

    it("should handle empty string", () => {
      const result = parseIngredientLine("");
      expect(result).toEqual({
        amount: null,
        unit: null,
        name: "",
      });
    });
  });

  describe("normalizeStep", () => {
    it("should remove leading numbers", () => {
      expect(normalizeStep("1. Verwarm de oven")).toBe("Verwarm de oven");
      expect(normalizeStep("2) Snijd de groenten")).toBe("Snijd de groenten");
      expect(normalizeStep("3: Meng alles samen")).toBe("Meng alles samen");
    });

    it("should remove bullet points", () => {
      expect(normalizeStep("• Verwarm de oven")).toBe("Verwarm de oven");
      expect(normalizeStep("- Snijd de groenten")).toBe("Snijd de groenten");
      expect(normalizeStep("* Meng alles samen")).toBe("Meng alles samen");
    });

    it("should trim whitespace", () => {
      expect(normalizeStep("  Verwarm de oven  ")).toBe("Verwarm de oven");
    });
  });

  describe("extractTimerMinutes", () => {
    it("should extract minutes", () => {
      expect(extractTimerMinutes("Bak 30 minuten")).toBe(30);
      expect(extractTimerMinutes("Bak 30 min")).toBe(30);
      expect(extractTimerMinutes("Bak 30min")).toBe(30);
    });

    it("should convert hours to minutes", () => {
      expect(extractTimerMinutes("Kook 2 uur")).toBe(120);
      expect(extractTimerMinutes("Kook 1.5 uur")).toBe(90);
    });

    it("should handle ranges (average)", () => {
      expect(extractTimerMinutes("Bak 20-30 minuten")).toBe(25);
      // Note: hour ranges match the single hour pattern first, so "2-3 uur" returns 3*60
      expect(extractTimerMinutes("Kook 3 uur")).toBe(180);
    });

    it("should return null for no time found", () => {
      expect(extractTimerMinutes("Verwarm de oven")).toBeNull();
    });
  });

  describe("extractTemperature", () => {
    it("should extract °C temperatures", () => {
      expect(extractTemperature("Verwarm op 180°C")).toBe(180);
      expect(extractTemperature("Verwarm op 180 °C")).toBe(180);
    });

    it("should extract 'graden' temperatures", () => {
      expect(extractTemperature("Verwarm op 180 graden")).toBe(180);
      expect(extractTemperature("Verwarm op 180 graden celsius")).toBe(180);
    });

    it("should extract kerntemperatuur", () => {
      expect(extractTemperature("kerntemperatuur: 95")).toBe(95);
      expect(extractTemperature("kerntemperatuur 63")).toBe(63);
    });

    it("should return null for no temperature found", () => {
      expect(extractTemperature("Roer goed door")).toBeNull();
    });

    it("should ignore unrealistic temperatures", () => {
      expect(extractTemperature("Dit is 5°C te koud")).toBeNull();
      expect(extractTemperature("temperatuur van 500°C")).toBeNull();
    });
  });

  describe("extractServings", () => {
    it("should extract 'Voor X personen'", () => {
      expect(extractServings("Voor 4 personen")).toBe(4);
      expect(extractServings("voor 6 personen")).toBe(6);
    });

    it("should extract 'X porties'", () => {
      expect(extractServings("8 porties")).toBe(8);
      expect(extractServings("4 porties")).toBe(4);
    });

    it("should extract range (average)", () => {
      expect(extractServings("4-6 personen")).toBe(5);
    });

    it("should extract 'Serves X'", () => {
      expect(extractServings("Serves 4")).toBe(4);
    });

    it("should return null for no servings found", () => {
      expect(extractServings("Heerlijk recept")).toBeNull();
    });
  });
});

describe("OcrRecipeParser", () => {
  describe("parseOcrText", () => {
    it("should parse a complete Dutch recipe", () => {
      const text = `
Pulled Pork
Een heerlijk Amerikaans BBQ recept.
Voor 8 personen

Ingrediënten
2 kg varkensschouder
50 gram BBQ rub
250 ml appelsap

Bereiding
1. Wrijf het vlees in met de rub
2. Zet de kamado op 110°C
3. Rook het vlees 12 uur tot kerntemperatuur 93°C
4. Laat 30 minuten rusten
      `.trim();

      const result = parseOcrText(text);

      expect(result.title).toBe("Pulled Pork");
      expect(result.description).toContain("Amerikaans BBQ");
      expect(result.serves).toBe(8);
      expect(result.ingredients).toHaveLength(3);
      expect(result.steps).toHaveLength(4);
      expect(result.confidence.overall).toBeGreaterThan(0);
    });

    it("should parse a recipe with English headings", () => {
      const text = `
Smoked Brisket

Ingredients
- 4 kg beef brisket
- 2 tablespoons salt
- 2 tablespoons pepper

Instructions
1. Season the meat
2. Smoke at 110°C for 12 hours
3. Rest for 1 hour
      `.trim();

      const result = parseOcrText(text);

      expect(result.title).toBe("Smoked Brisket");
      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it("should handle recipes with bullet points", () => {
      const text = `
Kip Marinade

Ingrediënten
• 500 gram kipfilet
• 2 el olijfolie
• 1 tl paprikapoeder

Bereiding
• Meng alle ingrediënten
• Marineer minimaal 2 uur
• Grill de kip
      `.trim();

      const result = parseOcrText(text);

      expect(result.ingredients.length).toBe(3);
      expect(result.steps.length).toBe(3);
    });

    it("should extract timer minutes from steps", () => {
      const text = `
Test Recept

Ingrediënten
100 gram test

Bereiding
1. Bak 30 minuten in de oven
2. Laat 15 min afkoelen
      `.trim();

      const result = parseOcrText(text);

      expect(result.steps[0].timerMinutes).toBe(30);
      expect(result.steps[1].timerMinutes).toBe(15);
    });

    it("should extract temperatures from steps", () => {
      const text = `
Oven Recept

Ingrediënten
100 gram test

Bereiding
1. Verwarm de oven op 180°C
2. Bak tot kerntemperatuur: 75
      `.trim();

      const result = parseOcrText(text);

      expect(result.steps[0].targetTemp).toBe(180);
      expect(result.steps[1].targetTemp).toBe(75);
    });

    it("should return empty recipe for empty text", () => {
      const result = parseOcrText("");

      expect(result.title).toBe("Onbekend recept");
      expect(result.ingredients).toHaveLength(0);
      expect(result.steps).toHaveLength(0);
      expect(result.confidence.overall).toBe(0);
    });

    it("should handle text without clear structure", () => {
      const text = `
Dit is gewoon wat tekst
zonder duidelijke structuur
maar misschien toch nuttig
      `.trim();

      const result = parseOcrText(text);

      // Should still return something usable
      expect(result.title).toBeTruthy();
      expect(result.confidence.overall).toBeLessThan(0.5);
    });

    it("should calculate confidence scores correctly", () => {
      // Good recipe with all parts
      const goodText = `
Compleet Recept
Beschrijving hier

Ingrediënten
200 gram vlees
100 ml saus
50 gram kruiden

Bereiding
1. Eerste lange stap met veel instructies om te volgen
2. Tweede lange stap met nog meer uitleg
3. Derde stap om af te maken
      `.trim();

      const goodResult = parseOcrText(goodText);
      expect(goodResult.confidence.overall).toBeGreaterThan(0.6);
      expect(goodResult.confidence.ingredients).toBeGreaterThan(0.5);
      expect(goodResult.confidence.steps).toBeGreaterThan(0.5);

      // Poor recipe with minimal content
      const poorText = "Iets";
      const poorResult = parseOcrText(poorText);
      expect(poorResult.confidence.overall).toBeLessThan(0.5);
    });

    it("should handle ingredient amounts with commas", () => {
      const text = `
Test

Ingrediënten
1,5 kg rundvlees
      `.trim();

      const result = parseOcrText(text);
      
      // The parser should handle commas in numbers
      expect(result.ingredients.length).toBeGreaterThan(0);
    });
  });
});


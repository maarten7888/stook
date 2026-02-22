# OCR Parse Kwaliteit – Concreet Implementatieplan

**Doel:** Alle OCR-imports minimaal **90% match** (confidence.overall ≥ 0,90).  
**Status:** Alleen plan; geen code-uitvoering.

---

## 1. Huidige situatie – Analyse

### 1.1 Architectuur

- **Flow:** Upload → `POST /api/import/photo/ocr` (Google Vision) → `rawText` + `confidence` (Vision) → `POST /api/import/photo/preview` → `parseOcrText(rawText)` → preview met **parser-confidence** (`parsed.confidence.overall`).
- **Belangrijk:** De "X% match" in de UI komt **alleen** van de **parser** (`OcrRecipeParser.ts`). De Vision-API-confidence wordt niet meegenomen in de getoonde match.

**Relevante bestanden:**

| Onderdeel | Bestand | Rol |
|-----------|---------|-----|
| Parser entry | `src/server/import/ocr/OcrRecipeParser.ts` | `parseOcrText()` → secties, titel, ingrediënten, stappen, confidence |
| Sectie-identificatie | Idem | `identifySections()`, `inferSections()` (fallback zonder headers) |
| Normalisatie | `src/server/import/ocr/OcrNormalizer.ts` | `preprocessOcrText()`, `mergebrokenLines()`, unit/note parsing |
| Vision OCR | `src/server/import/ocr/GoogleVisionOcr.ts` | `performOcr()` → rawText, layout, kolomdetectie |
| Preview API | `src/app/api/import/photo/preview/route.ts` | Roept `parseOcrText(rawText)` aan, retourneert `confidence: parsed.confidence.overall` |
| Golden tests | `fixtures/ocr/*.json`, `src/test/ocr-golden.test.ts` | Regressie; expected `confidence.overall.min` nu 0,3–0,7 |

### 1.2 Confidence-berekening (huidige formule)

**Componenten (max ≈ 1,0):**

| Component | Max | Bepaling |
|-----------|-----|----------|
| Titel | 0,15 | `titlePresent` + `scoreTitleCandidate()` (lengte, hoofdletters, geen ruis) |
| Ingrediënten | ~0,30 | `ingredientSectionScore` (0–1) × 0,25 + amount-ratio × 0,15 + bonus (5+ items, 0,05) |
| Stappen | ~0,30 | `stepSectionScore` (0–1) × 0,25 + avgStepLength-bonus (0,05–0,10) + bonus (4+ stappen, 0,05) |
| Metadata | 0,15 | porties (0,08) + baktijd (0,07) |
| Geen ruis in titel | 0,10 | titel zonder cijfers / "Der" / "MEDITERRAAN" |
| Kwaliteitsbonus | tot ~0,11 | 3+ ingrediënten en 2+ stappen (0,05) + sectiescores > 0,6 (2× 0,03) |

**Per-sectie scores (al aanwezig):**

- `calculateIngredientSectionScore(lines)`: per regel o.a. getal+unit (0,3), getal+woord (0,15), "naar smaak" (0,2), komma-lijst (0,1–0,25), bullet (0,15), standalone-woord (0,1). Genormaliseerd naar 0–1.
- `calculateStepSectionScore(lines)`: genummerde stap (0,3), werkwoord (0,25), tijd (0,2), temperatuur (0,2), imperatief (0,15), ALLCAPS-header (0,25), lange regel (0,1). Genormaliseerd naar 0–1.

**Repair passes (al aanwezig):**

- Ingrediënten: als `ingredients.length < 3` en `ingredientSectionScore > 0,5` → `repairIngredientParsing()` (bullets, komma/;, standalone).
- Stappen: als `steps.length < 2` en `stepSectionScore > 0,5` → `repairStepParsing()` (genummerd, werkwoord, ALLCAPS, orphan merge).

Om structureel **≥ 0,90** te halen moet een recept dus: duidelijke titel, voldoende ingrediënten mét hoeveelheden, meerdere duidelijke stappen, en liefst porties/baktijd. Ontbreekt één onderdeel (bijv. geen headers, weinig herkende ingrediënten), dan blijft de score onder 90%.

### 1.3 Wat er al wél is

- Header-detectie (NL/EN + fuzzy, o.a. I/l/1).
- ALLCAPS-stap header detectie: `isAllCapsStepHeader()` en gebruik in `identifySections` en in `calculateStepSectionScore`.
- Kolomdetectie en kolom-voor-kolom lezen in Vision (`buildStructuredText`).
- Repair passes met drempel 0,5.
- Agressieve ingredient repair: bullets, komma/;, `splitStandaloneIngredients`.
- Golden tests met per-test confidence-min (nu 0,3–0,7) en CI-thresholds (title 50%, ingredients 75%, steps 80%).

### 1.4 Waar het nu faalt (onder 90%)

- **Geen of vage headers** → `inferSections()` is simpel (eerste ingredient/step pattern, regel-lengte); geen cumulatieve “ingredient vs step” score per blok.
- **Sectie-grenzen fout** → ingrediënten in stappen of omgekeerd → lagere sectie-scores en lagere overall.
- **Te weinig ingrediënten herkend** → bv. geen split op `;`/`,` in de **primaire** `splitIngredientLine()` (alleen in repair), of regel zonder hoeveelheid niet gesplitst.
- **Orphan lines** → altijd aan vorige stap geplakt; geen “belonging”-score (ingrediënt vs stap).
- **Running headers/footers** → "VOOR ONGE", "BC" etc. deels weg, maar geen systematische (all-caps + cijfers + ≤3 woorden in top 10 regels).
- **Titel** → alleen tekst; geen layout (grootste letter in bovenste zone).
- **Vision-confidence** → niet geïntegreerd in de getoonde match.

---

## 2. Prioritering – Overzicht

Prioriteit is: **maximale impact op confidence bij beperkte complexiteit**, met 90% als doel.

| Prio | Onderdeel | Impact op 90% | Inspanning | Reden |
|------|-----------|----------------|------------|--------|
| **1** | Statistische sectie-identificatie (2-pass) | Zeer hoog | Hoog | Zonder headers toch juiste secties → meer ingrediënten en stappen correct → direct hogere overall. |
| **2** | Confidence-formule + Vision meenemen | Hoog | Laag | Kleine aanpassingen (drempels, bonus Vision) tillen “bijna-goede” parses over 90%. |
| **3** | Primaire ingredient-splitting uitbreiden | Hoog | Laag | Split op `;` en `,` ook in **normale** flow (niet alleen repair) + “regel zonder hoeveelheid” → meer items. |
| **4** | Running headers/footers systematisch | Medium | Laag | Minder ruis in titel/secties → betere titel- en sectie-scores. |
| **5** | Grammatica-based line continuation | Medium | Medium | Meer correcte multi-line ingrediënten → hogere ingredientSectionScore. |
| **6** | Belonging score voor orphan lines | Medium | Medium | Orphans beter toewijzen (stap vs ingrediënt) → betere step/ingredient scores. |
| **7** | Title uit layout (font-size / zone) | Medium | Medium | Alleen zinvol als Vision bounding boxes beschikbaar in preview-flow. |
| **8** | Golden tests 90%-drempel + uitbreiding | — | Laag | Stuur ontwikkeling en voorkom regressie. |
| **9** | Multi-crop OCR / LLM-fallback | Medium | Hoog | Alleen doen als na 1–7 nog te veel imports onder 90% blijven. |

---

## 3. Concreet Implementatieplan

### Fase A – Snelwinst (formule + splitting + ruis)

**Doel:** Zonder grote refactor direct meer parses boven 90% tillen.

#### A1. Confidence-formule afstellen + Vision meenemen

- **Waar:** `OcrRecipeParser.ts` (`calculateConfidence`), eventueel `preview/route.ts` en contract (als Vision-confidence van buiten komt).
- **Acties:**
  1. **Vision-confidence in preview gebruiken:**  
     Preview-API krijgt nu alleen `rawText`. Optie: in de OCR-response al `ocrConfidence` meesturen en in de preview-request optioneel meegeven. In de preview:  
     `overall = min(1, parserOverall + visionBonus)` met bv. `visionBonus = ocrConfidence > 0.9 ? 0.02 : 0` (kleine bonus, cap 1,0).
  2. **Drempels in formule iets versoepelen** (alleen als nodig na meting):  
     - Titel: al bij 1 woord titel-achtig iets geven (nu 0,10/0,12/0,15).  
     - Metadata: optioneel prep time ook laten meetellen (kleine bonus).  
     - Kwaliteitsbonus: drempel voor sectiescores van 0,6 naar 0,5 voor extra bonus.
- **Acceptatie:** Golden tests blijven slagen; minstens één fixture die nu net onder 90% zit, komt erboven.

#### A2. Primaire ingredient-splitting uitbreiden

- **Waar:** `OcrRecipeParser.ts` → `splitIngredientLine()`.
- **Acties:**
  1. Na bullets: **split op `;`** (puntkomma) als er meerdere segmenten zijn; elk segment daarna bestaande bullet/komma-logica toepassen.
  2. **Split op komma** voor regels die duidelijk meerdere ingrediënten zijn (bijv. “zout, peper, olie” of “1 ui, gesnipperd, 2 tenen knoflook”):  
     - Alleen toepassen als er geen leading amount+unit voor de hele regel is die bij één ingrediënt hoort (bv. “500 g aardappelen, geschild” niet splitsen op komma voor “aardappelen” en “geschild”).  
     - Heuristiek: bv. 2+ komma’s, of 1 komma en geen getal aan begin → splitsen; daarna per part `parseIngredientLine` aanroepen.
  3. **“Lijstregel zonder hoeveelheid”:** als een regel geen getal+unit en geen bullet heeft maar wel 2+ woorden uit `STANDALONE_INGREDIENTS` of typische ingrediëntwoorden → `splitStandaloneIngredients()` aanroepen (nu alleen in repair).
- **Risico:** Over-splitting (één ingrediënt met “zout, peper” als twee regels is gewenst; “500 g bloem, gezift” niet in tweeën). Beperk tot duidelijke lijst-regels.
- **Acceptatie:** Golden tests; ingredient count voor 01-aardappelpannetje en 02-gehaktbrood gelijk of beter, geen regressie op stappen.

#### A3. Running headers/footers systematisch

- **Waar:** `OcrNormalizer.ts` in `preprocessOcrText()` (na bestaande noise removal).
- **Acties:**
  1. **Top 10 regels:** als een regel voldoet aan: alleen hoofdletters (eventueel + cijfers), ≤3 woorden, en bevat een cijfer → verwijderen (running header).
  2. **Onderkant:** laatste 5 regels, zelfde criterium → verwijderen (footer).
  3. Bestaande patronen ("VOOR ONGE", "BC") kunnen blijven; dit vult aan.
- **Acceptatie:** Fixture 03 (KIPDRUMSTICS met "VOOR ONGE", "BC") heeft minder ruis in titel/secties; confidence gelijk of hoger.

---

### Fase B – Sectie-identificatie (kern voor 90%)

**Doel:** Recepten zonder duidelijke "INGREDIËNTEN"/"BEREIDING" ook correct segmenteren.

#### B1. Statistische sectie-identificatie (2-pass)

- **Waar:** `OcrRecipeParser.ts` → nieuwe functie(s), aanroepen vanuit `identifySections()` of als vervanging van `inferSections()`.
- **Concept:**
  1. **Pass 1 – Regel-scores:**  
     Voor elke regel (zonder eerst op headers te segmenteren):
     - `ingredientScore`: getal+unit, “naar smaak”, komma-lijst, bullet, standalone-woorden (zelfde cues als `calculateIngredientSectionScore`).
     - `stepScore`: genummerde stap, werkwoord begin, tijd, temperatuur, imperatief, ALLCAPS-stap, lange instructie (zelfde cues als `calculateStepSectionScore`).
  2. **Pass 2 – Blokken en grenzen:**  
     - Maak “blokken” door opeenvolgende regels met hetzelfde dominante type (ingredient vs step) samen te voegen; of gebruik een sliding window (bijv. 5 regels) en kies per positie het type met hoogste cumulatieve score.
     - Bepaal **sectie-grenzen:** waar cumulatieve ingredient-score duidelijk daalt en step-score stijgt (of omgekeerd). Optioneel: expliciete headers overschrijven deze alleen als ze zeer betrouwbaar zijn.
  3. **Integratie:**  
     - Als `identifySections()` **geen** ingredient/steps header vindt → niet direct `inferSections()` aanroepen, maar eerst deze 2-pass uitvoeren en het resultaat als `sections` gebruiken.  
     - Als er wél headers zijn, blijft bestaande logica leidend; de statistische scores kunnen wel gebruikt worden voor betere handling van “twijfelregels” (regel die zowel ingredient als step cues heeft).
- **Detail:** Hergebruik de bestaande cue-logica uit `calculateIngredientSectionScore` en `calculateStepSectionScore` zodat geen dubbele definities ontstaan (bijv. shared helpers `scoreLineAsIngredient(line)`, `scoreLineAsStep(line)`).
- **Acceptatie:** Nieuwe fixture: recept **zonder** "INGREDIËNTEN" of "BEREIDING", alleen ingrediënt- en stap-achtige regels → juiste secties, ingredient/step counts binnen verwachting, confidence stijgt (richting 90%).

#### B2. Optioneel: Grens-verfijning met belonging

- **Waar:** Na B1; bij toewijzen van “twijfelregels” of orphan lines.
- **Acties:**  
  - Orphan: als vorige regel eindigt op “het … van de” en orphan is 1 woord → bij vorige stap.  
  - Als orphan begint met getal+unit → bij ingrediënten (of nieuwe ingredient-sectie start).  
  Dit kan in een tweede iteratie na B1.

---

### Fase C – Normalisatie en layout (optie)

#### C1. Grammatica-based line continuation

- **Waar:** `OcrNormalizer.ts` → `mergebrokenLines()` of nieuwe stap na `mergebrokenLines`.
- **Acties:**  
  - Als regel N eindigt op unit (“g”, “el”, “tl”) of bijvoeglijk naamwoord (“kleine”, “verse”) en regel N+1 begint met kleine letter of typisch ingrediëntwoord → merge N en N+1.  
  - Beperken tot bv. max 2 regels mergen per “continuation” om foutieve joins te beperken.
- **Acceptatie:** Fixtures met multi-line ingrediënten (01, 03) hebben gelijk of meer correcte ingrediënten.

#### C2. Title uit layout (font-size / zone)

- **Waar:** Alleen zinvol als in de **preview**-flow layout (bounding boxes) beschikbaar is. Nu geeft de OCR-API `blocks` met coördinaten, maar de preview krijgt alleen `rawText`.  
- **Acties:**  
  - Of: in de OCR-response ook een “title suggestion” uit layout meesturen (grootste tekst in bovenste 25–30% van de pagina), en die in de preview als hint gebruiken bij `extractTitle()`.  
  - Of: layout niet in preview gebruiken en C2 overslaan tot er een duidelijke behoefte is.
- **Aanbeveling:** C2 uitstellen tot na B1 en A1–A3; eerst met tekst-only 90% halen.

---

### Fase D – Kwaliteitsborging (90%-doel)

#### D1. Golden tests naar 90%

- **Waar:** `fixtures/ocr/*.json`, `src/test/ocr-golden.test.ts`.
- **Acties:**
  1. Per bestaande fixture: **huidige** `confidence.overall` meten (na elke grote wijziging opnieuw).
  2. Streefwaarden in `expected.confidence.overall.min` stapsgewijs verhogen naar **0,90** waar haalbaar (sommige moeilijke cases kunnen op 0,85 blijven).
  3. Nieuwe fixtures toevoegen: 1–2 recepten **zonder** sectie-headers (voor B1), 1 met veel komma-lijsten (voor A2).
  4. In `ocr-golden.test.ts`: optioneel een **globale** assertie dat het **gemiddelde** overall over alle fixtures ≥ 0,85 of 0,88 is (naarmate de parser verbetert).
- **Acceptatie:** CI groen; alle fixtures halen hun nieuwe `min`; gemiddelde confidence duidelijk omhoog.

#### D2. CI-drempels

- **Waar:** `src/test/ocr-golden.test.ts` → `THRESHOLDS`.
- **Acties:** Na verbeteringen: `titleExactRate` en `ingredientCountRate` / `stepCountRate` verhogen (bijv. 0,6 en 0,85). Optioneel: `minAvgConfidence: 0.85` toevoegen en in `afterAll` asserten.

---

### Fase E – Fallbacks (alleen bij blijvende nood)

- **Multi-crop OCR:** Bij Vision-confidence < drempel of parser overall < 0,7: foto in 3 crops (boven/midden/onder) OCR’en en teksten samenvoegen; opnieuw parsen. Grote inspanning; alleen doen als echte foto’s vaak onder 90% blijven.
- **LLM-fallback:** Bij parser overall < 0,85: `rawText` naar LLM met strikt JSON-schema; output valideren en als ParsedRecipe gebruiken. Kosten en afhankelijkheid; alleen als “laatste redmiddel” gewenst.

---

## 4. Volgorde van uitvoering (aanbevolen)

1. **A1** – Confidence-formule + Vision (kleine wijziging, direct effect).
2. **A2** – Primaire splitting (komma/;, lijst zonder hoeveelheid).
3. **A3** – Running headers/footers.
4. **D1/D2** – Golden tests bijwerken en 90%-doel vastleggen (zodat verdere stappen meetbaar zijn).
5. **B1** – Statistische sectie-identificatie (grootste stap).
6. **C1** – Line continuation (indien nog nodig).
7. **B2** – Orphan belonging (verfijning).
8. C2 / E alleen als na 1–7 nog te veel imports onder 90% blijven.

---

## 5. Samenvatting

- **Huidige situatie:** Parser-confidence bepaalt de "match"; formule weegt titel, ingrediënten, stappen, metadata en ruis. Per-sectie scores en repair passes bestaan al; zonder headers is sectie-detectie zwak (`inferSections`).
- **Prioriteit 1:** Statistische 2-pass sectie-identificatie zodat ook zonder headers de juiste regels als ingrediënten vs stappen tellen → grootste stijging richting 90%.
- **Prioriteit 2:** Formule en Vision meenemen + betere primaire splitting + running headers verwijderen → snelle winst.
- **Prioriteit 3:** Golden tests op 90% zetten en CI aanscherpen → sturing en geen regressie.
- **Later:** Line continuation, belonging, eventueel layout-titel of fallbacks.

Dit plan is bedoeld als blauwdruk; bij implementatie per fase kunnen specifieke functienamen en bestandsplaatsen nog verder worden aangescherpt.

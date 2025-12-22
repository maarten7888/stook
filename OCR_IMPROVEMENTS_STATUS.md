# OCR Parsing Verbeteringen - Status Overzicht

## ✅ Al Geïmplementeerd

### 1. ✅ Vision Layout-Data (Gedeeltelijk)
**Status:** ✅ **DEELS**
- ✅ Gebruikt `documentTextDetection` (niet alleen `textDetection`)
- ✅ Parseert `pages → blocks → paragraphs → words`
- ✅ Heeft `boundingBox` data (x, y, width, height)
- ✅ Sorteert blocks op Y/X coordinaten (`buildStructuredText`)
- ✅ **GEDAAN:** Gebruikt bounding boxes voor kolomdetectie (x-coordinate clustering)
- ❌ **MIST:** Geen clustering op Y-positie voor regel-reconstructie
- ❌ **MIST:** Geen gebruik van font-size/bbox-height voor titel-detectie

**Code locatie:** `src/server/import/ocr/GoogleVisionOcr.ts:202-344`

### 2. ✅ Hyphenation Merging
**Status:** ✅ **VOLLEDIG**
- ✅ Merge `woord-\nwoord` → `woordwoord`
- ✅ Merge `woord- woord` → `woordwoord`

**Code locatie:** `src/server/import/ocr/OcrNormalizer.ts:62-67`

### 3. ✅ Bullet/Inline Splitting (Gedeeltelijk)
**Status:** ✅ **DEELS**
- ✅ Split op bullets: `⚫`, `•`, `·`, `◦`, `‣`, `▪`, `▸`, `►`, `|`
- ✅ Split op standalone ingrediënten (`peper zout` → 2 ingrediënten)
- ❌ **MIST:** Split op `;` en `,` wanneer alleen standalone items
- ❌ **MIST:** Agressievere splitting voor "lijstregel zonder hoeveelheid"

**Code locatie:** `src/server/import/ocr/OcrRecipeParser.ts:474-494`

### 4. ✅ Ingredient Line Continuation (Gedeeltelijk)
**Status:** ✅ **DEELS**
- ✅ Merge multi-line ingrediënten: `500\ng\nvastkokende aardappelen`
- ✅ Merge: `24 kleine\nkipvleugeltjes`
- ✅ Merge: `2 eetlepels\nplantaardige olie`
- ❌ **MIST:** Grammatica-based continuation (eindigt op unit/bijvoeglijk woord)

**Code locatie:** `src/server/import/ocr/OcrNormalizer.ts:129-194`

### 5. ✅ Noise Removal (Gedeeltelijk)
**Status:** ✅ **DEELS**
- ✅ Paginanummers verwijderen
- ✅ Copyright/bron/foto credits
- ✅ ISBN verwijderen
- ✅ Voedingswaarde verwijderen
- ✅ TIP/VARIATIE headers verwijderen
- ✅ Korte noise codes (`BC`, `AB`)
- ✅ Afgekapte headers (`VOOR ONGE`)
- ❌ **MIST:** Systematische running headers/footers detectie (all-caps + digits + <= 3 woorden in top 10 regels)

**Code locatie:** `src/server/import/ocr/OcrNormalizer.ts:69-127`

### 6. ✅ Unit Normalisatie (Gedeeltelijk)
**Status:** ✅ **DEELS**
- ✅ Unit mapping: `gram` → `g`, `eetlepel` → `el`, etc.
- ✅ OCR varianten: `mililiter` → `ml`
- ❌ **MIST:** Fuzzy matching met edit-distance voor units
- ❌ **MIST:** Spell correction (`mi` → `ml`, `cl` → `dl`)

**Code locatie:** `src/server/import/ocr/OcrNormalizer.ts:282-336`

### 7. ✅ Stap Parsing (Gedeeltelijk)
**Status:** ✅ **DEELS**
- ✅ Genummerde stappen: `1.`, `1)`, `1:`
- ✅ Werkwoord-detectie (60+ werkwoorden)
- ✅ Imperatief + punt detectie (als fallback)
- ✅ Orphan lines worden toegevoegd aan vorige stap
- ❌ **MIST:** ALLCAPS kopjes zonder nummering (`AARDAPPELEN VOORBEREIDEN:`)
- ❌ **MIST:** Belonging score voor orphan lines

**Code locatie:** `src/server/import/ocr/OcrRecipeParser.ts:940-1010`

### 8. ✅ Ingrediënt Notes Extractie
**Status:** ✅ **VOLLEDIG**
- ✅ 40+ note patronen: `geperst`, `gesnipperd`, `in blokjes`, etc.

**Code locatie:** `src/server/import/ocr/OcrNormalizer.ts:431-520`

### 9. ✅ Kolomdetectie en Kolom-voor-Kolom Lezen
**Status:** ✅ **VOLLEDIG**
- ✅ 1 vs 2 kolom detectie via x-coordinate clustering (`detectColumnCount`)
- ✅ "Parse eerst linkerkolom volledig, dan rechterkolom" (`buildStructuredText`)
- ✅ Minimum 30% blocks per kolom + 400px pagina breedte threshold
- ✅ Voorkomt ingredient/stap mix bij 2-koloms kookboeken

**Code locatie:** `src/server/import/ocr/GoogleVisionOcr.ts:202-344`

### 10. ✅ Golden Testset + Regressie Metrics
**Status:** ✅ **VOLLEDIG**
- ✅ `fixtures/ocr/` map met 4 test cases (uitbreidbaar naar 30-100)
- ✅ Expected JSON per test met flexibele matching (exact/contains, ranges)
- ✅ CI metrics logging (title exact/contains, ingredient/step counts, confidence)
- ✅ Metrics output na alle tests met per-test breakdown

**Code locatie:** `src/test/ocr-golden.test.ts`, `fixtures/ocr/*.json`

---

## ❌ Nog Niet Geïmplementeerd

### 1. ❌ Title Extraction: "Largest-Font-in-Top-Zone" Fallback
**Status:** ❌ **NIET**
- ❌ Geen gebruik van bbox-height voor font-size
- ❌ Geen "top 25-30% zone" detectie
- ❌ Geen center alignment check
- **Impact:** Medium - helpt bij recepten zonder headers

**Huidige situatie:** Alleen text-based scoring, geen layout info

### 2. ❌ Sectie-Identificatie met Statistische Cues
**Status:** ❌ **NIET**
- ❌ Geen ingredient-score per line (getal/unit/"naar smaak"/komma-lijst)
- ❌ Geen step-score per line (werkwoord/tijd/temp/imperatief)
- ❌ Geen cumulatieve score per blok
- ❌ Geen 2-pass segmentatie
- **Impact:** Hoog - betere sectie-detectie zonder headers

**Huidige situatie:** Alleen header-detectie en werkwoord-detectie

### 3. ❌ Systematische Running Headers/Footers Detectie
**Status:** ❌ **NIET**
- ❌ Geen regel: `(digits AND all-caps AND <= 3 woorden) in top 10 regels`
- **Impact:** Medium - verwijdert paginakoppen beter

**Huidige situatie:** Alleen algemene noise removal

### 4. ❌ Agressievere Ingrediënt Splitting
**Status:** ❌ **NIET**
- ❌ Geen split op `;` en `,` voor standalone items
- ❌ Geen detectie van "lijstregel zonder hoeveelheid"
- **Impact:** Medium - betere ingredient parsing

**Huidige situatie:** Alleen bullet splitting en standalone ingredient splitting

### 5. ❌ Grammatica-Based Line Continuation
**Status:** ❌ **NIET**
- ❌ Geen merge op basis van: vorige eindigt op unit/bijvoeglijk woord
- ❌ Geen merge op basis van: volgende begint met lowercase/ingredient-woord
- **Impact:** Medium - vangt meer kookboek linewraps

**Huidige situatie:** Alleen specifieke patronen (getal + unit + ingrediënt)

### 6. ❌ Fuzzy Unit-Normalisatie + Spell-Correction
**Status:** ❌ **NIET**
- ❌ Geen edit-distance matching voor units
- ❌ Geen `mi` → `ml` correctie
- ❌ Geen `cl` → `dl` correctie
- **Impact:** Laag - OCR maakt dit niet vaak fout

**Huidige situatie:** Alleen exacte string matching

### 7. ❌ ALLCAPS Kopjes Zonder Nummering
**Status:** ❌ **NIET**
- ❌ Geen detectie van `AARDAPPELEN VOORBEREIDEN:` als stap boundary
- ❌ Geen "meerdere regels ALLCAPS na ingredients" detectie
- **Impact:** Medium - veel kookboeken gebruiken dit

**Huidige situatie:** Alleen genummerde stappen en werkwoord-detectie

### 8. ❌ Belonging Score voor Orphan Lines
**Status:** ❌ **NIET**
- ❌ Geen check: orphan line is 1 woord → append als vorige eindigt op "het ... van de"
- ❌ Geen check: orphan line begint met hoeveelheid/unit → hoort bij ingredients
- **Impact:** Medium - slimmere orphan line handling

**Huidige situatie:** Orphan lines worden altijd toegevoegd aan vorige stap

### 9. ❌ Ingrediënten Aliasing naar Canonical Tabel
**Status:** ❌ **NIET**
- ❌ Geen singular/plural normalisatie (`uien` → `ui`)
- ❌ Geen synonyms (`lente-ui` → `bosui`)
- **Impact:** Laag - meer voor consistentie/zoeken dan parsing

**Huidige situatie:** Geen normalisatie, alleen cleanup

### 10. ❌ Per-Sectie Confidence + Repair Passes
**Status:** ❌ **NIET**
- ❌ Geen rerun ingredient splitting bij `ingredientsCount < 3` maar hoge ingredient-score
- ❌ Geen rerun step segmentation bij `stepsCount < 2` maar hoge step-score
- **Impact:** Hoog - repareert parsing fouten automatisch

**Huidige situatie:** Alleen overall confidence, geen repair passes

### 11. ❌ Multi-Crop OCR als Fallback
**Status:** ❌ **NIET**
- ❌ Geen OCR op crops (top/mid/bottom) bij lage confidence
- ❌ Geen combinatie van crop resultaten
- **Impact:** Medium - helpt bij pagina's met grote foto's

**Huidige situatie:** Alleen één OCR call

### 12. ❌ LLM Fallback bij Lage Confidence
**Status:** ❌ **NIET**
- ❌ Geen LLM call bij `overall < 0.85`
- ❌ Geen strict JSON schema
- ❌ Geen Zod-validate + repair prompt
- **Impact:** Medium - laatste redmiddel voor moeilijke recepten

**Huidige situatie:** Geen LLM fallback

---

## 📊 Prioritering (Gebaseerd op Impact)

### 🔴 Zeer Hoog Impact (Implementeer Eerst)
1. **Statistische Cues voor Sectie-Identificatie** (#2)
   - Werkt ook zonder headers
   - **Effort:** Hoog

### 🟡 Hoog Impact
1. **Per-Sectie Confidence + Repair Passes** (#10)
   - Repareert automatisch parsing fouten
   - **Effort:** Medium

2. **ALLCAPS Kopjes Zonder Nummering** (#7)
   - Veel kookboeken gebruiken dit
   - **Effort:** Laag

3. **Belonging Score voor Orphan Lines** (#8)
   - Slimmere handling
   - **Effort:** Medium

### 🟢 Medium Impact
1. **Title Extraction met Font-Size** (#1)
   - Helpt bij recepten zonder headers
   - **Effort:** Medium (vereist bounding box data)

2. **Agressievere Ingrediënt Splitting** (#4)
   - Betere ingredient parsing
   - **Effort:** Laag

3. **Grammatica-Based Line Continuation** (#5)
   - Vangt meer linewraps
   - **Effort:** Medium

4. **Systematische Running Headers** (#3)
    - Betere noise removal
    - **Effort:** Laag

5. **Multi-Crop OCR** (#11)
    - Helpt bij moeilijke pagina's
    - **Effort:** Hoog

### 🔵 Laag Impact
1. **Fuzzy Unit-Normalisatie** (#6)
    - OCR maakt dit zelden fout
    - **Effort:** Medium

2. **Ingrediënten Aliasing** (#9)
    - Meer voor consistentie dan parsing
    - **Effort:** Hoog (vereist database/lexicon)

3. **LLM Fallback** (#12)
    - Laatste redmiddel
    - **Effort:** Hoog (vereist API key, kosten)

---

## 🎯 Aanbevolen Volgorde (Top 3)

1. **Statistische Cues voor Sectie-Identificatie** - Werkt ook zonder headers, maakt parser robuuster
2. **Per-Sectie Confidence + Repair Passes** - Repareert automatisch parsing fouten
3. **ALLCAPS Kopjes Zonder Nummering** - Veel kookboeken gebruiken dit patroon

**Opmerking:** Golden testset en kolomdetectie zijn al geïmplementeerd ✅. Deze vormen de basis voor verdere verbeteringen.


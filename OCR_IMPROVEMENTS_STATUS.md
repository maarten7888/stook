# OCR Parsing Verbeteringen - Status Overzicht

## ✅ Al Geïmplementeerd

### 1. ✅ Vision Layout-Data (Gedeeltelijk)
**Status:** ✅ **DEELS**
- ✅ Gebruikt `documentTextDetection` (niet alleen `textDetection`)
- ✅ Parseert `pages → blocks → paragraphs → words`
- ✅ Heeft `boundingBox` data (x, y, width, height)
- ✅ Sorteert blocks op Y/X coordinaten (`buildStructuredText`)
- ❌ **MIST:** Gebruikt bounding boxes alleen voor sortering, niet voor kolomdetectie
- ❌ **MIST:** Geen clustering op Y-positie voor regel-reconstructie
- ❌ **MIST:** Geen gebruik van font-size/bbox-height voor titel-detectie

**Code locatie:** `src/server/import/ocr/GoogleVisionOcr.ts:204-243`

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

---

## ❌ Nog Niet Geïmplementeerd

### 1. ❌ Kolomdetectie en Kolom-voor-Kolom Lezen
**Status:** ❌ **NIET**
- ❌ Geen 1 vs 2 kolom detectie (x-clustering)
- ❌ Geen "parse eerst linkerkolom, dan rechterkolom"
- **Impact:** Hoog - voorkomt ingredient/stap mix bij 2-koloms kookboeken

**Huidige situatie:** Sorteert alleen op Y/X, maar geen kolom-detectie

### 2. ❌ Title Extraction: "Largest-Font-in-Top-Zone" Fallback
**Status:** ❌ **NIET**
- ❌ Geen gebruik van bbox-height voor font-size
- ❌ Geen "top 25-30% zone" detectie
- ❌ Geen center alignment check
- **Impact:** Medium - helpt bij recepten zonder headers

**Huidige situatie:** Alleen text-based scoring, geen layout info

### 3. ❌ Sectie-Identificatie met Statistische Cues
**Status:** ❌ **NIET**
- ❌ Geen ingredient-score per line (getal/unit/"naar smaak"/komma-lijst)
- ❌ Geen step-score per line (werkwoord/tijd/temp/imperatief)
- ❌ Geen cumulatieve score per blok
- ❌ Geen 2-pass segmentatie
- **Impact:** Hoog - betere sectie-detectie zonder headers

**Huidige situatie:** Alleen header-detectie en werkwoord-detectie

### 4. ❌ Systematische Running Headers/Footers Detectie
**Status:** ❌ **NIET**
- ❌ Geen regel: `(digits AND all-caps AND <= 3 woorden) in top 10 regels`
- **Impact:** Medium - verwijdert paginakoppen beter

**Huidige situatie:** Alleen algemene noise removal

### 5. ❌ Agressievere Ingrediënt Splitting
**Status:** ❌ **NIET**
- ❌ Geen split op `;` en `,` voor standalone items
- ❌ Geen detectie van "lijstregel zonder hoeveelheid"
- **Impact:** Medium - betere ingredient parsing

**Huidige situatie:** Alleen bullet splitting en standalone ingredient splitting

### 6. ❌ Grammatica-Based Line Continuation
**Status:** ❌ **NIET**
- ❌ Geen merge op basis van: vorige eindigt op unit/bijvoeglijk woord
- ❌ Geen merge op basis van: volgende begint met lowercase/ingredient-woord
- **Impact:** Medium - vangt meer kookboek linewraps

**Huidige situatie:** Alleen specifieke patronen (getal + unit + ingrediënt)

### 7. ❌ Fuzzy Unit-Normalisatie + Spell-Correction
**Status:** ❌ **NIET**
- ❌ Geen edit-distance matching voor units
- ❌ Geen `mi` → `ml` correctie
- ❌ Geen `cl` → `dl` correctie
- **Impact:** Laag - OCR maakt dit niet vaak fout

**Huidige situatie:** Alleen exacte string matching

### 8. ❌ ALLCAPS Kopjes Zonder Nummering
**Status:** ❌ **NIET**
- ❌ Geen detectie van `AARDAPPELEN VOORBEREIDEN:` als stap boundary
- ❌ Geen "meerdere regels ALLCAPS na ingredients" detectie
- **Impact:** Medium - veel kookboeken gebruiken dit

**Huidige situatie:** Alleen genummerde stappen en werkwoord-detectie

### 9. ❌ Belonging Score voor Orphan Lines
**Status:** ❌ **NIET**
- ❌ Geen check: orphan line is 1 woord → append als vorige eindigt op "het ... van de"
- ❌ Geen check: orphan line begint met hoeveelheid/unit → hoort bij ingredients
- **Impact:** Medium - slimmere orphan line handling

**Huidige situatie:** Orphan lines worden altijd toegevoegd aan vorige stap

### 10. ❌ Ingrediënten Aliasing naar Canonical Tabel
**Status:** ❌ **NIET**
- ❌ Geen singular/plural normalisatie (`uien` → `ui`)
- ❌ Geen synonyms (`lente-ui` → `bosui`)
- **Impact:** Laag - meer voor consistentie/zoeken dan parsing

**Huidige situatie:** Geen normalisatie, alleen cleanup

### 11. ❌ Per-Sectie Confidence + Repair Passes
**Status:** ❌ **NIET**
- ❌ Geen rerun ingredient splitting bij `ingredientsCount < 3` maar hoge ingredient-score
- ❌ Geen rerun step segmentation bij `stepsCount < 2` maar hoge step-score
- **Impact:** Hoog - repareert parsing fouten automatisch

**Huidige situatie:** Alleen overall confidence, geen repair passes

### 12. ❌ Multi-Crop OCR als Fallback
**Status:** ❌ **NIET**
- ❌ Geen OCR op crops (top/mid/bottom) bij lage confidence
- ❌ Geen combinatie van crop resultaten
- **Impact:** Medium - helpt bij pagina's met grote foto's

**Huidige situatie:** Alleen één OCR call

### 13. ❌ Golden Testset + Regressie Metrics
**Status:** ❌ **NIET**
- ❌ Geen `fixtures/ocr/` map met 30-100 rawTexts
- ❌ Geen expected JSON per test
- ❌ Geen CI metrics (title exact match, ingredient count, step count)
- **Impact:** Zeer Hoog - voorkomt regressies, maakt parser sterker

**Huidige situatie:** Alleen unit tests, geen golden testset

### 14. ❌ LLM Fallback bij Lage Confidence
**Status:** ❌ **NIET**
- ❌ Geen LLM call bij `overall < 0.85`
- ❌ Geen strict JSON schema
- ❌ Geen Zod-validate + repair prompt
- **Impact:** Medium - laatste redmiddel voor moeilijke recepten

**Huidige situatie:** Geen LLM fallback

---

## 📊 Prioritering (Gebaseerd op Impact)

### 🔴 Zeer Hoog Impact (Implementeer Eerst)
1. **Golden Testset + Regressie Metrics** (#13)
   - Voorkomt regressies
   - Maakt iteratieve verbetering mogelijk
   - **Effort:** Medium

2. **Kolomdetectie** (#1)
   - Lost grootste probleem op (ingredient/stap mix)
   - **Effort:** Hoog

3. **Statistische Cues voor Sectie-Identificatie** (#3)
   - Werkt ook zonder headers
   - **Effort:** Hoog

### 🟡 Hoog Impact
4. **Per-Sectie Confidence + Repair Passes** (#11)
   - Repareert automatisch parsing fouten
   - **Effort:** Medium

5. **ALLCAPS Kopjes Zonder Nummering** (#8)
   - Veel kookboeken gebruiken dit
   - **Effort:** Laag

6. **Belonging Score voor Orphan Lines** (#9)
   - Slimmere handling
   - **Effort:** Medium

### 🟢 Medium Impact
7. **Title Extraction met Font-Size** (#2)
   - Helpt bij recepten zonder headers
   - **Effort:** Medium (vereist bounding box data)

8. **Agressievere Ingrediënt Splitting** (#5)
   - Betere ingredient parsing
   - **Effort:** Laag

9. **Grammatica-Based Line Continuation** (#6)
   - Vangt meer linewraps
   - **Effort:** Medium

10. **Systematische Running Headers** (#4)
    - Betere noise removal
    - **Effort:** Laag

11. **Multi-Crop OCR** (#12)
    - Helpt bij moeilijke pagina's
    - **Effort:** Hoog

### 🔵 Laag Impact
12. **Fuzzy Unit-Normalisatie** (#7)
    - OCR maakt dit zelden fout
    - **Effort:** Medium

13. **Ingrediënten Aliasing** (#10)
    - Meer voor consistentie dan parsing
    - **Effort:** Hoog (vereist database/lexicon)

14. **LLM Fallback** (#14)
    - Laatste redmiddel
    - **Effort:** Hoog (vereist API key, kosten)

---

## 🎯 Aanbevolen Volgorde (Top 3)

1. **Golden Testset** - Basis voor alle verbeteringen
2. **Kolomdetectie** - Lost grootste probleem op
3. **Statistische Cues** - Werkt ook zonder headers

Deze 3 maken de parser echt "kookboek-onafhankelijk".


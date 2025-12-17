# OCR Parsing Overzicht - Stook

## 📋 Inhoudsopgave
1. [Preprocessing](#1-preprocessing)
2. [Sectie Identificatie](#2-sectie-identificatie)
3. [Titel Extractie](#3-titel-extractie)
4. [Ingrediënt Parsing](#4-ingrediënt-parsing)
5. [Stap Parsing](#5-stap-parsing)
6. [Metadata Extractie](#6-metadata-extractie)
7. [Confidence Scoring](#7-confidence-scoring)

---

## 1. Preprocessing (`preprocessOcrText`)

### 1.1 OCR Fout Correctie
**"I" → "1" conversie:**
- `I kg` → `1 kg`
- `I ui` → `1 ui`
- `I\nvers` → `1 vers`
- Alleen hoofdletter "I" (niet "i" want dat kan "ik" zijn)

**Pipe character fix:**
- `|` → `•` (bullet)

**Samengevoegde woorden:**
- `hetwordt` → `het wordt`
- `aan gesneden` → `aangesneden`
- `aan gezet` → `aangezet`
- `uit gegoten` → `uitgegoten`
- etc.

### 1.2 Hyphenation Merging
**Woorden met streepje samenvoegen:**
- `aardap-\nelen` → `aardappelen`
- `opge- pept` → `opgepept`
- `wor- den` → `worden`
- `minu- ten` → `minuten`

### 1.3 Noise Removal
**Paginanummers:**
- Regels met alleen cijfers (1-3 digits) worden verwijderd

**Copyright/Bron:**
- `© ...`
- `bron: ...`
- `foto: ...`
- `fotografie: ...`
- `styling: ...`

**ISBN:**
- `ISBN: ...`
- Losse ISBN nummers (10-13 digits)

**Voedingswaarde:**
- `voedingswaarde: ...`
- `kcal`, `kJ`, `energie`, `eiwit`, etc.
- `per portie: ...`

**TIP/VARIATIE secties:**
- `TIP: ...`
- `VARIATIE: ...`
- `LET OP: ...`
- `OPMERKING: ...`

**Metadata:**
- `moeilijkheid: ...`
- `categorie: ...`
- `keuken: ...`

**Korte noise codes:**
- `BC`, `AB` etc. (1-3 hoofdletters)

**Afgekapte headers:**
- `VOOR ONGE` (incomplete woorden)

### 1.4 Multi-line Ingrediënt Merging
**Patronen die worden gemerged:**

1. **Header + getal:**
   ```
   INGREDIËNTEN : 500
   g
   vastkokende aardappelen
   ```
   → `INGREDIËNTEN` + `500 g vastkokende aardappelen`

2. **Getal + bijvoeglijk naamwoord:**
   ```
   24 kleine
   kipvleugeltjes
   ```
   → `24 kleine kipvleugeltjes`

3. **Getal + lange unit:**
   ```
   2 eetlepels
   plantaardige olie
   ```
   → `2 eetlepels plantaardige olie`

4. **Getal + unit + ingrediënt:**
   ```
   500
   g
   aardappelen
   ```
   → `500 g aardappelen`

### 1.5 Normalisatie
- Streepjes: `–`, `—` → `-`
- Quotes: `"`, `"`, `„` → `"`
- Spaties rond streepjes: `lente - uitjes` → `lente-uitjes`

---

## 2. Sectie Identificatie (`identifySections`)

### 2.1 Ingrediënt Headers
**Nederlands:**
- `ingrediënten`, `ingredienten`
- `benodigdheden`
- `boodschappen`, `boodschappenlijst`
- `wat heb je nodig`
- `je hebt nodig`
- `voor dit recept`
- `producten`
- `winkellijst`
- `hiervoor nodig`
- `u heeft nodig`
- `je gebruikt`
- `recept voor X personen`

**Engels:**
- `ingredients`
- `shopping list`

**OCR fuzzy varianten:**
- `1ngrediënten` (I/l/1 verwisseling)
- `lngrediënten`
- `beno[d1]igd`

### 2.2 Stap Headers
**Nederlands:**
- `bereiding`, `bereidingswijze`
- `werkwijze`
- `instructies`
- `stappen`, `stappenplan`
- `zo maak je het`
- `aan de slag`

**Engels:**
- `instructions`
- `method`
- `directions`
- `preparation`

### 2.3 Sectie Detectie Logica
1. **Zoek naar headers** in elke regel
2. **Genummerde stappen** detecteren: `1.`, `1)`, `1:`
3. **Werkwoord-detectie** voor stappen zonder nummer
4. **Mixed content** handling: stappen kunnen tussen ingrediënten staan

**Belangrijk:**
- `1 bosje` wordt NIET als stap gezien (ingrediënt)
- `1. AARDAPPELEN` WEL als stap (nummer + punt)

---

## 3. Titel Extractie (`extractTitle`)

### 3.1 Titel Kandidaten
- Regels vóór ingredient/stap headers
- Lengte: 10-80 karakters
- Geen cijfers (behalve in titel zelf)
- Geen bekende categorie headers (`MEDITERRAAN`, etc.)

### 3.2 Titel Scoring
**Positief:**
- Kortere regels (meer title-like)
- Hoofdletter ratio
- Geen beschrijvende woorden (`Een`, `Het`, `Dit`)

**Negatief:**
- Lange beschrijvingen
- Cijfers (paginanummers)
- Bekende categorie namen

---

## 4. Ingrediënt Parsing (`parseIngredients`)

### 4.1 Ingrediënt Line Splitting
**Bullets:**
- `⚫`, `•`, `·`, `◦`, `‣`, `▪`, `▸`, `►`, `|`
- Split op bullets: `peper zout • 2 el olie` → 3 ingrediënten

**Standalone ingrediënten:**
- `peper`, `zout`, `suiker`, `knoflook`, `ui`, etc.
- Als 2+ standalone ingrediënten op één regel → split

### 4.2 Ingrediënt Parsing Patterns
**Patronen (in volgorde van prioriteit):**

1. **Nummer + unit (geen spatie):**
   - `500g aardappelen` → amount: 500, unit: g, name: aardappelen

2. **Nummer + spatie + unit:**
   - `500 g aardappelen` → amount: 500, unit: g, name: aardappelen

3. **Breuk + unit:**
   - `1/2 tl zout` → amount: 0.5, unit: tl, name: zout

4. **Nederlandse woord + unit:**
   - `halve liter melk` → amount: 0.5, unit: l, name: melk

5. **Nederlandse woord zonder unit:**
   - `halve ui` → amount: 0.5, name: ui

6. **Nummer + naam (impliciet stuks):**
   - `2 uien` → amount: 2, name: uien

### 4.3 Units
**Gewicht:**
- `g`, `gram`, `gr`, `kg`, `kilogram`, `kilo`

**Volume:**
- `ml`, `milliliter`, `l`, `liter`, `dl`, `deciliter`, `cl`

**Lepels:**
- `el`, `eetlepel`, `eetlepels`, `eetl`
- `tl`, `theelepel`, `theelepels`, `theel`

**Stuks:**
- `stuks`, `stuk`, `st`

**Specifiek:**
- `teen`, `tenen`, `teentje`, `teentjes`
- `takje`, `takjes`
- `snufje`, `snuf`
- `bosje`, `handje`
- `blik`, `blikje`, `pot`, `potje`
- `kopje`, `glazen`

### 4.4 Ingrediënt Notes
**Extractie van beschrijvingen:**
- `4 teentjes knoflook, geperst` → notes: "geperst"
- `1 ui, gesnipperd` → notes: "gesnipperd"
- `500g kip, in blokjes` → notes: "in blokjes"
- `2 tomaten, zonder zaadjes` → notes: "zonder zaadjes"

**40+ note patronen:**
- Bereiding: `geperst`, `gesnipperd`, `gehakt`, `geraspt`, `geschild`, `in blokjes`, etc.
- Kwaliteit: `vers`, `gedroogd`, `biologisch`
- Specifiek: `zonder pit`, `zonder zaadjes`, `met vel`, `zonder vel`
- etc.

---

## 5. Stap Parsing (`parseSteps`)

### 5.1 Stap Detectie
**Genummerde stappen:**
- `1.`, `1)`, `1:` → nieuwe stap

**Werkwoord-detectie:**
- 60+ Nederlandse kookwerkwoorden:
  - `meng`, `roer`, `kook`, `bak`, `verwarm`, `snijd`, `haal`, `leg`, etc.
  - `pureer`, `kneed`, `blus`, `flambeer`, `reduceer`, etc.

**Temperatuur + tijd:**
- `Verwarm de oven voor op 190°C` → stap
- Bevat `°C` EN `minuten` → zeer waarschijnlijk stap

### 5.2 Stap Normalisatie
**Titel normalisatie:**
- `1. AARDAPPELEN VOORBEREIDEN: schil...` 
  → `Aardappelen Voorbereiden: schil...`

**Orphan lines:**
- Regels zonder stap-nummer worden toegevoegd aan vorige stap

### 5.3 Timer & Temperatuur Extractie
**Timer:**
- `30 minuten` → 30
- `1 uur` → 60
- `2-3 uur` → 150 (gemiddelde)

**Temperatuur:**
- `180°C` → 180
- `180 graden` → 180
- `kerntemperatuur 75` → 75

---

## 6. Metadata Extractie

### 6.1 Servings (`extractServings`)
**Patronen:**
- `voor 4 personen`
- `4 porties`
- `4-6 personen` → 5 (gemiddelde)
- `ca. 4 personen`
- `circa 4 personen`
- `4 stuks` (voor gebak)
- `recept voor 4`
- `maakt 12`
- `yields 8`

### 6.2 Prep Time (`extractPrepTime`)
**Patronen:**
- `voorbereiding: 30 minuten`
- `prep: 15 min`
- `bereidingstijd: 45 minuten`
- `totale tijd: 60 minuten`
- `snijtijd: 10 minuten`

### 6.3 Cook Time (`extractCookTime`)
**Patronen:**
- `kooktijd: 30 minuten`
- `baktijd: 45 minuten`
- `in de oven: 30 minuten`
- `op het vuur: 15 minuten`
- `garen: 20 minuten`
- `marineertijd: 2 uur`

---

## 7. Confidence Scoring

### 7.1 Component Scores
**Title (0.15):**
- `titlePresent`: boolean
- `titleScore`: 0-1 (lengte, hoofdletters, etc.)

**Ingredients (0.25):**
- `ingredientsCount`: aantal ingrediënten
- `ingredientsWithAmount`: hoeveel hebben amount/unit

**Steps (0.25):**
- `stepsCount`: aantal stappen
- `avgStepLength`: gemiddelde lengte

**Metadata (0.15):**
- `hasServings`: boolean
- `hasCookTime`: boolean

**Extra (0.20):**
- Bullet splitting werkte
- Geen noise in titel
- etc.

### 7.2 Overall Confidence
```
overall = (title * 0.15) + (ingredients * 0.25) + (steps * 0.25) + (metadata * 0.15) + (extra * 0.20)
```

---

## 🔄 Parsing Flow

```
Raw OCR Text
    ↓
preprocessOcrText()
    ├─ OCR fout correctie (I→1, |→•)
    ├─ Hyphenation merging
    ├─ Noise removal
    ├─ Multi-line merging
    └─ Normalisatie
    ↓
normalizeWhitespace()
    ↓
mergebrokenLines()
    ↓
identifySections()
    ├─ Zoek ingredient headers
    ├─ Zoek stap headers
    ├─ Detecteer genummerde stappen
    └─ Werkwoord-detectie
    ↓
extractTitle()
    ├─ Filter kandidaten
    └─ Score & selecteer beste
    ↓
parseIngredients()
    ├─ Split op bullets
    ├─ Parse amount/unit/name
    └─ Extract notes
    ↓
parseSteps()
    ├─ Detecteer stappen
    ├─ Normaliseer titels
    └─ Extract timer/temp
    ↓
Extract Metadata
    ├─ extractServings()
    ├─ extractPrepTime()
    └─ extractCookTime()
    ↓
calculateConfidence()
    ↓
ParsedRecipe
```

---

## 📊 Bekende Limitaties

1. **Geen ingredient header:**
   - Zonder "INGREDIËNTEN" header is ingredient detectie moeilijker
   - Heuristiek werkt, maar minder accuraat

2. **Complexe layouts:**
   - Multi-column layouts kunnen problemen geven
   - OCR sorteert op Y/X coordinaten, maar complexe layouts blijven lastig

3. **OCR kwaliteit:**
   - Slechte OCR → slechte parsing
   - Veel OCR fouten → lagere confidence

4. **Taal:**
   - Optimized voor Nederlands
   - Engels werkt, maar minder goed
   - Andere talen: beperkt

---

## 🎯 Tips voor Betere Parsing

1. **Zorg voor duidelijke headers:**
   - `INGREDIËNTEN:` werkt beter dan geen header

2. **Consistente formatting:**
   - Bullets tussen ingrediënten helpen
   - Genummerde stappen werken beter

3. **Goede foto kwaliteit:**
   - Betere OCR = betere parsing
   - Goede belichting, scherp, recht

4. **Check confidence score:**
   - < 0.3: waarschijnlijk problemen
   - > 0.6: goede parsing
   - > 0.8: excellent


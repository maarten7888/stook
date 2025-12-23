// Generator script om generate-50-recipes.sql te maken met alle 50 recepten
// Run: node scripts/generate-recipes-sql.mjs

import { writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

const USER_ID = '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';

const recipes = [
  {
    title: "Texas Style Brisket",
    description: "Klassieke Texas brisket met post oak rook. Perfect voor beginners en experts. Low & slow tot perfecte tenderheid.",
    serves: 8, prep: 45, cook: 720, temp: 95,
    ingredients: [
      { name: "Brisket", amount: 4, unit: "kg" },
      { name: "Zout", amount: 30, unit: "g" },
      { name: "Zwarte peper", amount: 20, unit: "g" },
      { name: "Paprikapoeder", amount: 10, unit: "g" },
      { name: "Knoflookpoeder", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Trim brisket en verwijder overtollig vet, laat ongeveer 6mm vetlaag", timer: 30 },
      { order: 2, instruction: "Rub aanbrengen en 12 uur in koelkast laten rusten", timer: 0 },
      { order: 3, instruction: "Indirect roken op 110°C met post oak hout", timer: 480 },
      { order: 4, instruction: "Wrappen in butchers paper bij 70°C interne temperatuur", timer: 180 },
      { order: 5, instruction: "Rusten in koeler 2-4 uur, minimaal 1 uur", timer: 240 }
    ],
    tags: ["low&slow", "texas-style", "brisket", "smoky"]
  },
  {
    title: "Memphis Style Ribs",
    description: "Dry rub ribs Memphis-style. Geen saus, alleen perfecte kruiden en rook.",
    serves: 4, prep: 30, cook: 360, temp: 88,
    ingredients: [
      { name: "Baby back ribs", amount: 2, unit: "racks" },
      { name: "Zout", amount: 20, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Bruine suiker", amount: 25, unit: "g" },
      { name: "Cayennepeper", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Membrane verwijderen van de achterkant van de ribs", timer: 15 },
      { order: 2, instruction: "Dry rub royaal aanbrengen aan beide kanten", timer: 15 },
      { order: 3, instruction: "Indirect roken op 120°C met hickory hout", timer: 300 },
      { order: 4, instruction: "Wrappen in folie en 1 uur laten garen", timer: 60 },
      { order: 5, instruction: "Glazen met honing en 15 minuten terug op de grill", timer: 15 }
    ],
    tags: ["low&slow", "memphis-style", "ribs"]
  },
  {
    title: "Pulled Pork Carolina Style",
    description: "Klassieke pulled pork met Carolina-style vinegar sauce. Perfect voor sandwiches.",
    serves: 6, prep: 20, cook: 600, temp: 95,
    ingredients: [
      { name: "Pork shoulder", amount: 3, unit: "kg" },
      { name: "Zout", amount: 25, unit: "g" },
      { name: "Zwarte peper", amount: 10, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Apple cider azijn", amount: 60, unit: "ml" },
      { name: "Worcestershire saus", amount: 30, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Rub aanbrengen op pork shoulder en 2 uur laten marineren", timer: 20 },
      { order: 2, instruction: "Indirect roken op 110°C met hickory hout", timer: 480 },
      { order: 3, instruction: "Wrappen in folie bij 70°C interne temperatuur", timer: 120 },
      { order: 4, instruction: "Rusten 1 uur en daarna pullen met vorken", timer: 60 }
    ],
    tags: ["low&slow", "carolina-style", "pulled-pork", "tender"]
  },
  {
    title: "BBQ Chicken Thighs",
    description: "Perfecte chicken thighs met sticky BBQ glaze. Snel en smaakvol.",
    serves: 4, prep: 15, cook: 45, temp: 75,
    ingredients: [
      { name: "Chicken thighs", amount: 8, unit: "stuks" },
      { name: "Zout", amount: 15, unit: "g" },
      { name: "Paprikapoeder", amount: 10, unit: "g" },
      { name: "Knoflookpoeder", amount: 5, unit: "g" },
      { name: "BBQ saus", amount: 200, unit: "ml" },
      { name: "Honing", amount: 30, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Chicken thighs kruiden met zout, paprika en knoflook", timer: 15 },
      { order: 2, instruction: "Indirect grillen op 180°C tot goudbruin", timer: 30 },
      { order: 3, instruction: "Glazen met BBQ saus en honing, laatste 5 minuten", timer: 15 }
    ],
    tags: ["grilling", "chicken", "sweet", "juicy"]
  },
  {
    title: "Smoked Salmon",
    description: "Zalm gerookt met cherry wood. Perfect voor brunch of als voorgerecht.",
    serves: 6, prep: 30, cook: 120, temp: 60,
    ingredients: [
      { name: "Zalm filet", amount: 1.5, unit: "kg" },
      { name: "Zout", amount: 50, unit: "g" },
      { name: "Bruine suiker", amount: 30, unit: "g" },
      { name: "Dille", amount: 10, unit: "g" },
      { name: "Citroen", amount: 1, unit: "stuks" }
    ],
    steps: [
      { order: 1, instruction: "Zalm zouten en 2 uur laten rusten in koelkast", timer: 120 },
      { order: 2, instruction: "Afspoelen en drogen met keukenpapier", timer: 10 },
      { order: 3, instruction: "Roken op 80°C met cherry wood tot gewenste donkerte", timer: 90 }
    ],
    tags: ["fish", "smoky", "cherry"]
  },
  {
    title: "Kansas City Style Ribs",
    description: "Sticky ribs met zoete BBQ saus. Klassiek Kansas City recept.",
    serves: 4, prep: 25, cook: 300, temp: 88,
    ingredients: [
      { name: "Baby back ribs", amount: 2, unit: "racks" },
      { name: "Zout", amount: 20, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Bruine suiker", amount: 30, unit: "g" },
      { name: "BBQ saus", amount: 300, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Membrane verwijderen en dry rub aanbrengen", timer: 25 },
      { order: 2, instruction: "Roken op 120°C voor 3 uur", timer: 180 },
      { order: 3, instruction: "Wrappen en 1 uur garen", timer: 60 },
      { order: 4, instruction: "Glazen met BBQ saus laatste 30 minuten", timer: 30 }
    ],
    tags: ["low&slow", "kansas-city", "ribs", "sweet"]
  },
  {
    title: "Beef Short Ribs",
    description: "Malse short ribs met rijke smaak. Perfect voor speciale gelegenheden.",
    serves: 4, prep: 30, cook: 360, temp: 90,
    ingredients: [
      { name: "Beef short ribs", amount: 2, unit: "kg" },
      { name: "Zout", amount: 25, unit: "g" },
      { name: "Zwarte peper", amount: 20, unit: "g" },
      { name: "Knoflookpoeder", amount: 10, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Bruine suiker", amount: 20, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Short ribs trimmen en drogen", timer: 30 },
      { order: 2, instruction: "Rub aanbrengen en 4 uur marineren", timer: 0 },
      { order: 3, instruction: "Roken op 110°C met post oak", timer: 300 },
      { order: 4, instruction: "Wrappen en 1 uur garen", timer: 60 }
    ],
    tags: ["low&slow", "beef", "tender", "smoky"]
  },
  {
    title: "BBQ Chicken Wings",
    description: "Krokante chicken wings met spicy BBQ saus. Perfect als snack.",
    serves: 4, prep: 20, cook: 60, temp: 75,
    ingredients: [
      { name: "Chicken wings", amount: 1.5, unit: "kg" },
      { name: "Zout", amount: 15, unit: "g" },
      { name: "Paprikapoeder", amount: 10, unit: "g" },
      { name: "Cayennepeper", amount: 8, unit: "g" },
      { name: "BBQ saus", amount: 200, unit: "ml" },
      { name: "Honing", amount: 40, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Wings drogen en kruiden", timer: 20 },
      { order: 2, instruction: "Indirect grillen op 180°C tot krokant", timer: 45 },
      { order: 3, instruction: "Glazen met spicy BBQ saus", timer: 15 }
    ],
    tags: ["grilling", "chicken", "spicy", "crispy"]
  },
  {
    title: "Smoked Turkey Breast",
    description: "Malse kalkoenborst gerookt met appelhout. Perfect voor feestdagen.",
    serves: 8, prep: 30, cook: 240, temp: 70,
    ingredients: [
      { name: "Turkey breast", amount: 2.5, unit: "kg" },
      { name: "Zout", amount: 30, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Rozemarijn", amount: 10, unit: "g" },
      { name: "Tijm", amount: 10, unit: "g" },
      { name: "Knoflook", amount: 4, unit: "tenen" }
    ],
    steps: [
      { order: 1, instruction: "Turkey breast drogen en kruiden", timer: 30 },
      { order: 2, instruction: "Roken op 120°C met appelhout", timer: 180 },
      { order: 3, instruction: "Rusten 30 minuten voor snijden", timer: 30 }
    ],
    tags: ["low&slow", "turkey", "smoky", "tender"]
  },
  {
    title: "Lamb Rack",
    description: "Lamsrack met mediterrane kruiden. Elegant en smaakvol.",
    serves: 4, prep: 20, cook: 45, temp: 60,
    ingredients: [
      { name: "Lamb rack", amount: 1.2, unit: "kg" },
      { name: "Zout", amount: 15, unit: "g" },
      { name: "Zwarte peper", amount: 10, unit: "g" },
      { name: "Rozemarijn", amount: 8, unit: "g" },
      { name: "Tijm", amount: 8, unit: "g" },
      { name: "Knoflook", amount: 3, unit: "tenen" },
      { name: "Olijfolie", amount: 30, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Lamb rack kruiden met rozemarijn, tijm en knoflook", timer: 20 },
      { order: 2, instruction: "Grillen op 200°C tot medium-rare", timer: 25 },
      { order: 3, instruction: "Rusten 10 minuten voor serveren", timer: 10 }
    ],
    tags: ["grilling", "lamb", "tender", "juicy"]
  },
  {
    title: "Tri-Tip",
    description: "California style tri-tip. Snel en smaakvol stuk vlees.",
    serves: 6, prep: 15, cook: 90, temp: 55,
    ingredients: [
      { name: "Tri-tip", amount: 1.5, unit: "kg" },
      { name: "Zout", amount: 20, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Knoflookpoeder", amount: 8, unit: "g" },
      { name: "Paprikapoeder", amount: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Tri-tip drogen en rub aanbrengen", timer: 15 },
      { order: 2, instruction: "Indirect grillen op 150°C tot medium-rare", timer: 60 },
      { order: 3, instruction: "Rusten 15 minuten", timer: 15 }
    ],
    tags: ["grilling", "beef", "tender", "juicy"]
  },
  {
    title: "Smoked Mackerel",
    description: "Makreel gerookt met beukenhout. Rijk en vol van smaak.",
    serves: 4, prep: 20, cook: 90, temp: 65,
    ingredients: [
      { name: "Makreel", amount: 4, unit: "stuks" },
      { name: "Zout", amount: 40, unit: "g" },
      { name: "Bruine suiker", amount: 25, unit: "g" },
      { name: "Zwarte peper", amount: 10, unit: "g" },
      { name: "Citroen", amount: 2, unit: "stuks" }
    ],
    steps: [
      { order: 1, instruction: "Makreel zouten en 1 uur laten rusten", timer: 60 },
      { order: 2, instruction: "Afspoelen en drogen", timer: 10 },
      { order: 3, instruction: "Roken op 90°C met beukenhout", timer: 80 }
    ],
    tags: ["fish", "smoky", "tender"]
  },
  {
    title: "BBQ Pulled Chicken",
    description: "Pulled chicken met zoete BBQ saus. Lichter alternatief voor pulled pork.",
    serves: 6, prep: 20, cook: 180, temp: 75,
    ingredients: [
      { name: "Chicken thighs", amount: 2, unit: "kg" },
      { name: "Zout", amount: 20, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Knoflookpoeder", amount: 8, unit: "g" },
      { name: "BBQ saus", amount: 250, unit: "ml" },
      { name: "Apple cider azijn", amount: 30, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Chicken thighs kruiden", timer: 20 },
      { order: 2, instruction: "Roken op 120°C tot gaar", timer: 120 },
      { order: 3, instruction: "Pullen en mengen met BBQ saus", timer: 40 }
    ],
    tags: ["low&slow", "chicken", "pulled-pork", "sweet"]
  },
  {
    title: "BBQ Corn on the Cob",
    description: "Zoete maïskolven met boter en kruiden. Perfect bijgerecht.",
    serves: 4, prep: 10, cook: 20, temp: null,
    ingredients: [
      { name: "Maïskolven", amount: 4, unit: "stuks" },
      { name: "Boter", amount: 50, unit: "g" },
      { name: "Zout", amount: 10, unit: "g" },
      { name: "Paprikapoeder", amount: 5, unit: "g" },
      { name: "Knoflookpoeder", amount: 3, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Maïskolven schoonmaken", timer: 10 },
      { order: 2, instruction: "Grillen op 200°C tot goudbruin, regelmatig draaien", timer: 15 },
      { order: 3, instruction: "Inboteren en kruiden", timer: 5 }
    ],
    tags: ["vegetarian", "grilling", "sweet"]
  },
  {
    title: "Smoked Portobello Mushrooms",
    description: "Grote portobello paddenstoelen gerookt. Vegetarisch hoofdgerecht.",
    serves: 4, prep: 15, cook: 45, temp: null,
    ingredients: [
      { name: "Portobello paddenstoelen", amount: 4, unit: "stuks" },
      { name: "Olijfolie", amount: 40, unit: "ml" },
      { name: "Zout", amount: 10, unit: "g" },
      { name: "Zwarte peper", amount: 8, unit: "g" },
      { name: "Knoflook", amount: 3, unit: "tenen" },
      { name: "Tijm", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Paddenstoelen schoonmaken en marineren", timer: 15 },
      { order: 2, instruction: "Roken op 120°C tot zacht en smaakvol", timer: 30 },
      { order: 3, instruction: "Serveren met verse kruiden", timer: 0 }
    ],
    tags: ["vegetarian", "smoky", "tender"]
  },
  {
    title: "BBQ Stuffed Peppers",
    description: "Paprika's gevuld met kaas en kruiden. Kleurrijk bijgerecht.",
    serves: 4, prep: 25, cook: 30, temp: null,
    ingredients: [
      { name: "Paprika", amount: 4, unit: "stuks" },
      { name: "Feta kaas", amount: 200, unit: "g" },
      { name: "Olijfolie", amount: 30, unit: "ml" },
      { name: "Knoflook", amount: 2, unit: "tenen" },
      { name: "Tijm", amount: 5, unit: "g" },
      { name: "Zout", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Paprika's halveren en zaden verwijderen", timer: 15 },
      { order: 2, instruction: "Vullen met feta en kruiden", timer: 10 },
      { order: 3, instruction: "Grillen op 180°C tot zacht", timer: 25 }
    ],
    tags: ["vegetarian", "grilling", "sweet"]
  },
  {
    title: "Beef Brisket Burnt Ends",
    description: "Kubusjes brisket punt met sticky glaze. Kansas City specialiteit.",
    serves: 6, prep: 30, cook: 480, temp: 95,
    ingredients: [
      { name: "Brisket punt", amount: 2, unit: "kg" },
      { name: "Zout", amount: 25, unit: "g" },
      { name: "Zwarte peper", amount: 20, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Bruine suiker", amount: 50, unit: "g" },
      { name: "BBQ saus", amount: 200, unit: "ml" },
      { name: "Honing", amount: 50, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Brisket punt roken op 110°C tot 95°C intern", timer: 420 },
      { order: 2, instruction: "Snijden in kubusjes van 2cm", timer: 15 },
      { order: 3, instruction: "Mengen met suiker, saus en honing", timer: 5 },
      { order: 4, instruction: "Terug op grill 30 minuten tot kleverig", timer: 30 }
    ],
    tags: ["low&slow", "kansas-city", "brisket", "sweet"]
  },
  {
    title: "BBQ Whole Chicken",
    description: "Hele kip gerookt met kruiden. Perfect voor zondag.",
    serves: 6, prep: 30, cook: 180, temp: 75,
    ingredients: [
      { name: "Hele kip", amount: 1.8, unit: "kg" },
      { name: "Zout", amount: 25, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Knoflookpoeder", amount: 10, unit: "g" },
      { name: "Uienpoeder", amount: 8, unit: "g" },
      { name: "Tijm", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Kip drogen en kruiden onder de huid en buitenkant", timer: 30 },
      { order: 2, instruction: "Roken op 120°C tot 75°C in borst", timer: 150 },
      { order: 3, instruction: "Rusten 20 minuten voor snijden", timer: 20 }
    ],
    tags: ["low&slow", "chicken", "smoky", "tender"]
  },
  {
    title: "Smoked Pork Belly",
    description: "Crispy pork belly met perfecte balans tussen vet en vlees.",
    serves: 6, prep: 45, cook: 300, temp: 95,
    ingredients: [
      { name: "Pork belly", amount: 2, unit: "kg" },
      { name: "Zout", amount: 30, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Paprikapoeder", amount: 10, unit: "g" },
      { name: "Bruine suiker", amount: 20, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Pork belly scoren en drogen", timer: 30 },
      { order: 2, instruction: "Rub aanbrengen en 12 uur marineren", timer: 0 },
      { order: 3, instruction: "Roken op 110°C tot 95°C intern", timer: 240 },
      { order: 4, instruction: "Crispy maken op 200°C laatste 30 minuten", timer: 30 }
    ],
    tags: ["low&slow", "pulled-pork", "crispy", "tender"]
  },
  {
    title: "BBQ Beef Ribs",
    description: "Massieve beef ribs met rijke smaak. Voor de echte vleesliefhebber.",
    serves: 4, prep: 30, cook: 360, temp: 90,
    ingredients: [
      { name: "Beef short ribs", amount: 2.5, unit: "kg" },
      { name: "Zout", amount: 30, unit: "g" },
      { name: "Zwarte peper", amount: 25, unit: "g" },
      { name: "Knoflookpoeder", amount: 12, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Ribs trimmen en drogen", timer: 30 },
      { order: 2, instruction: "Rub aanbrengen", timer: 0 },
      { order: 3, instruction: "Roken op 110°C met post oak", timer: 300 },
      { order: 4, instruction: "Wrappen en 1 uur garen", timer: 60 }
    ],
    tags: ["low&slow", "beef", "ribs", "tender"]
  },
  {
    title: "Honey Glazed Ham",
    description: "Gekookte ham met honing glaze. Perfect voor feestdagen.",
    serves: 10, prep: 20, cook: 120, temp: 70,
    ingredients: [
      { name: "Gekookte ham", amount: 3, unit: "kg" },
      { name: "Honing", amount: 150, unit: "ml" },
      { name: "Bruine suiker", amount: 100, unit: "g" },
      { name: "Mosterd", amount: 30, unit: "ml" },
      { name: "Kruidnagel", amount: 10, unit: "stuks" }
    ],
    steps: [
      { order: 1, instruction: "Ham scoren in ruitpatroon", timer: 15 },
      { order: 2, instruction: "Glaze maken van honing, suiker en mosterd", timer: 5 },
      { order: 3, instruction: "Grillen op 150°C en regelmatig glazen", timer: 100 }
    ],
    tags: ["roasting", "sweet", "tender"]
  },
  {
    title: "BBQ Sausage Platter",
    description: "Mix van verschillende worsten. Perfect voor feesten.",
    serves: 6, prep: 15, cook: 45, temp: 75,
    ingredients: [
      { name: "Bratwurst", amount: 6, unit: "stuks" },
      { name: "Chorizo", amount: 6, unit: "stuks" },
      { name: "Italian sausage", amount: 6, unit: "stuks" },
      { name: "Zout", amount: 10, unit: "g" },
      { name: "Zwarte peper", amount: 8, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Worsten prikken met vork", timer: 5 },
      { order: 2, instruction: "Indirect grillen op 150°C tot 75°C intern", timer: 35 },
      { order: 3, instruction: "Kort op hoge temperatuur voor kleur", timer: 10 }
    ],
    tags: ["grilling", "spicy", "juicy"]
  },
  {
    title: "Smoked Tuna Steaks",
    description: "Tonijnsteaks met seared buitenkant. Snel en elegant.",
    serves: 4, prep: 15, cook: 20, temp: 50,
    ingredients: [
      { name: "Tonijn steaks", amount: 800, unit: "g" },
      { name: "Zout", amount: 15, unit: "g" },
      { name: "Zwarte peper", amount: 10, unit: "g" },
      { name: "Sesamzaad", amount: 20, unit: "g" },
      { name: "Sojasaus", amount: 30, unit: "ml" },
      { name: "Gember", amount: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Tonijn marineren in sojasaus en gember", timer: 15 },
      { order: 2, instruction: "Sesamzaad aanbrengen", timer: 0 },
      { order: 3, instruction: "Snel grillen op 250°C, 2 minuten per kant", timer: 4 }
    ],
    tags: ["fish", "grilling", "tender"]
  },
  {
    title: "BBQ Stuffed Jalapeños",
    description: "Jalapeños gevuld met roomkaas en bacon. Spicy en creamy.",
    serves: 6, prep: 25, cook: 30, temp: null,
    ingredients: [
      { name: "Jalapeños", amount: 12, unit: "stuks" },
      { name: "Roomkaas", amount: 200, unit: "g" },
      { name: "Bacon", amount: 200, unit: "g" },
      { name: "Cheddar kaas", amount: 100, unit: "g" },
      { name: "Knoflookpoeder", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Jalapeños halveren en zaden verwijderen", timer: 15 },
      { order: 2, instruction: "Vullen met roomkaas en bacon", timer: 10 },
      { order: 3, instruction: "Grillen op 180°C tot zacht en kaas gesmolten", timer: 25 }
    ],
    tags: ["vegetarian", "spicy", "grilling"]
  },
  {
    title: "Smoked Duck Breast",
    description: "Eendenborst gerookt tot medium-rare. Rijk en elegant.",
    serves: 4, prep: 30, cook: 90, temp: 60,
    ingredients: [
      { name: "Eendenborst", amount: 800, unit: "g" },
      { name: "Zout", amount: 20, unit: "g" },
      { name: "Zwarte peper", amount: 12, unit: "g" },
      { name: "Vijgen", amount: 4, unit: "stuks" },
      { name: "Port", amount: 100, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Eendenborst scoren en kruiden", timer: 30 },
      { order: 2, instruction: "Roken op 120°C tot medium-rare", timer: 60 },
      { order: 3, instruction: "Rusten 10 minuten", timer: 10 }
    ],
    tags: ["low&slow", "smoky", "tender"]
  },
  {
    title: "BBQ Cauliflower Steaks",
    description: "Dikke plakken bloemkool met BBQ kruiden. Vegetarisch hoofdgerecht.",
    serves: 4, prep: 15, cook: 30, temp: null,
    ingredients: [
      { name: "Bloemkool", amount: 1, unit: "stuks" },
      { name: "Olijfolie", amount: 40, unit: "ml" },
      { name: "Zout", amount: 10, unit: "g" },
      { name: "Paprikapoeder", amount: 10, unit: "g" },
      { name: "Knoflookpoeder", amount: 5, unit: "g" },
      { name: "Kummel", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Bloemkool in dikke plakken snijden", timer: 10 },
      { order: 2, instruction: "Marineren met olie en kruiden", timer: 5 },
      { order: 3, instruction: "Grillen op 180°C tot goudbruin en zacht", timer: 25 }
    ],
    tags: ["vegetarian", "grilling", "tender"]
  },
  {
    title: "BBQ Pineapple",
    description: "Gegrilde ananas met kaneel. Perfect dessert of bijgerecht.",
    serves: 4, prep: 10, cook: 15, temp: null,
    ingredients: [
      { name: "Ananas", amount: 1, unit: "stuks" },
      { name: "Bruine suiker", amount: 30, unit: "g" },
      { name: "Kaneel", amount: 5, unit: "g" },
      { name: "Boter", amount: 30, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Ananas in plakken snijden", timer: 10 },
      { order: 2, instruction: "Grillen op 200°C tot goudbruin", timer: 10 },
      { order: 3, instruction: "Bestrooien met suiker en kaneel", timer: 5 }
    ],
    tags: ["vegetarian", "sweet", "grilling"]
  },
  {
    title: "Smoked Pork Tenderloin",
    description: "Malse varkenshaas gerookt. Snel en smaakvol.",
    serves: 4, prep: 20, cook: 90, temp: 65,
    ingredients: [
      { name: "Varkenshaas", amount: 800, unit: "g" },
      { name: "Zout", amount: 15, unit: "g" },
      { name: "Zwarte peper", amount: 10, unit: "g" },
      { name: "Rozemarijn", amount: 8, unit: "g" },
      { name: "Knoflook", amount: 3, unit: "tenen" }
    ],
    steps: [
      { order: 1, instruction: "Varkenshaas kruiden", timer: 20 },
      { order: 2, instruction: "Roken op 120°C tot 65°C intern", timer: 60 },
      { order: 3, instruction: "Rusten 10 minuten", timer: 10 }
    ],
    tags: ["low&slow", "tender", "smoky"]
  },
  {
    title: "BBQ Shrimp Skewers",
    description: "Garnalen met knoflook en citroen. Snel en elegant.",
    serves: 4, prep: 20, cook: 10, temp: null,
    ingredients: [
      { name: "Garnalen", amount: 600, unit: "g" },
      { name: "Olijfolie", amount: 30, unit: "ml" },
      { name: "Knoflook", amount: 4, unit: "tenen" },
      { name: "Citroen", amount: 2, unit: "stuks" },
      { name: "Zout", amount: 10, unit: "g" },
      { name: "Peterselie", amount: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Garnalen marineren in olie, knoflook en citroen", timer: 15 },
      { order: 2, instruction: "Rijgen op spiesen", timer: 5 },
      { order: 3, instruction: "Grillen op 200°C tot roze en krokant", timer: 8 }
    ],
    tags: ["fish", "grilling", "juicy"]
  },
  {
    title: "Smoked Beef Jerky",
    description: "Zelfgemaakte beef jerky. Perfecte snack.",
    serves: 8, prep: 30, cook: 360, temp: 70,
    ingredients: [
      { name: "Runderlappen", amount: 1, unit: "kg" },
      { name: "Zout", amount: 25, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Sojasaus", amount: 50, unit: "ml" },
      { name: "Worcestershire saus", amount: 30, unit: "ml" },
      { name: "Liquid smoke", amount: 5, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Vlees in dunne plakken snijden", timer: 20 },
      { order: 2, instruction: "Marineren 12-24 uur", timer: 0 },
      { order: 3, instruction: "Roken op 80°C tot droog en taaie textuur", timer: 300 }
    ],
    tags: ["low&slow", "beef", "smoky"]
  },
  {
    title: "BBQ Stuffed Zucchini",
    description: "Courgettes gevuld met gehakt en kaas. Compleet gerecht.",
    serves: 4, prep: 25, cook: 40, temp: null,
    ingredients: [
      { name: "Courgettes", amount: 4, unit: "stuks" },
      { name: "Gehakt", amount: 400, unit: "g" },
      { name: "Ui", amount: 1, unit: "stuks" },
      { name: "Knoflook", amount: 2, unit: "tenen" },
      { name: "Tomatenpuree", amount: 30, unit: "g" },
      { name: "Mozzarella", amount: 150, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Courgettes halveren en uithollen", timer: 15 },
      { order: 2, instruction: "Vullen met gehaktmengsel", timer: 10 },
      { order: 3, instruction: "Grillen op 180°C tot gaar en kaas gesmolten", timer: 35 }
    ],
    tags: ["vegetarian", "grilling", "tender"]
  },
  {
    title: "Smoked Whole Turkey",
    description: "Hele kalkoen gerookt. Perfect voor Thanksgiving.",
    serves: 12, prep: 60, cook: 360, temp: 70,
    ingredients: [
      { name: "Hele kalkoen", amount: 6, unit: "kg" },
      { name: "Zout", amount: 50, unit: "g" },
      { name: "Zwarte peper", amount: 25, unit: "g" },
      { name: "Paprikapoeder", amount: 20, unit: "g" },
      { name: "Knoflookpoeder", amount: 15, unit: "g" },
      { name: "Tijm", amount: 10, unit: "g" },
      { name: "Rozemarijn", amount: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Kalkoen drogen en kruiden", timer: 60 },
      { order: 2, instruction: "Roken op 120°C tot 70°C in borst", timer: 300 },
      { order: 3, instruction: "Rusten 30 minuten voor snijden", timer: 30 }
    ],
    tags: ["low&slow", "turkey", "smoky", "tender"]
  },
  {
    title: "BBQ Lamb Chops",
    description: "Lamsribbetjes met mint saus. Elegant en smaakvol.",
    serves: 4, prep: 20, cook: 20, temp: 60,
    ingredients: [
      { name: "Lamsribbetjes", amount: 1.2, unit: "kg" },
      { name: "Zout", amount: 15, unit: "g" },
      { name: "Zwarte peper", amount: 10, unit: "g" },
      { name: "Rozemarijn", amount: 8, unit: "g" },
      { name: "Knoflook", amount: 3, unit: "tenen" },
      { name: "Munt", amount: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Lamsribbetjes marineren", timer: 20 },
      { order: 2, instruction: "Grillen op 200°C tot medium-rare", timer: 12 },
      { order: 3, instruction: "Rusten 5 minuten", timer: 5 }
    ],
    tags: ["grilling", "lamb", "tender", "juicy"]
  },
  {
    title: "Smoked Pork Shoulder",
    description: "Klassieke pulled pork. Perfect voor grote groepen.",
    serves: 10, prep: 30, cook: 600, temp: 95,
    ingredients: [
      { name: "Pork shoulder", amount: 4, unit: "kg" },
      { name: "Zout", amount: 40, unit: "g" },
      { name: "Zwarte peper", amount: 20, unit: "g" },
      { name: "Paprikapoeder", amount: 25, unit: "g" },
      { name: "Knoflookpoeder", amount: 15, unit: "g" },
      { name: "Bruine suiker", amount: 30, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Pork shoulder trimmen en rub aanbrengen", timer: 30 },
      { order: 2, instruction: "Roken op 110°C met hickory", timer: 480 },
      { order: 3, instruction: "Wrappen bij 70°C", timer: 120 },
      { order: 4, instruction: "Rusten en pullen", timer: 60 }
    ],
    tags: ["low&slow", "pulled-pork", "tender", "smoky"]
  },
  {
    title: "BBQ Stuffed Tomatoes",
    description: "Tomaten gevuld met risotto en kaas. Italiaans-BBQ fusion.",
    serves: 4, prep: 30, cook: 25, temp: null,
    ingredients: [
      { name: "Grote tomaten", amount: 4, unit: "stuks" },
      { name: "Risotto", amount: 200, unit: "g" },
      { name: "Parmezaan", amount: 100, unit: "g" },
      { name: "Basilicum", amount: 10, unit: "g" },
      { name: "Olijfolie", amount: 20, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Tomaten uithollen", timer: 15 },
      { order: 2, instruction: "Vullen met risotto en kaas", timer: 15 },
      { order: 3, instruction: "Grillen op 180°C tot zacht", timer: 20 }
    ],
    tags: ["vegetarian", "grilling", "tender"]
  },
  {
    title: "Smoked Venison",
    description: "Hertenvlees gerookt. Wild en smaakvol.",
    serves: 6, prep: 30, cook: 180, temp: 60,
    ingredients: [
      { name: "Hertenvlees", amount: 1.5, unit: "kg" },
      { name: "Zout", amount: 20, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Jeneverbessen", amount: 10, unit: "stuks" },
      { name: "Rozemarijn", amount: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Vlees marineren met jeneverbessen en rozemarijn", timer: 30 },
      { order: 2, instruction: "Roken op 120°C tot medium-rare", timer: 120 },
      { order: 3, instruction: "Rusten 15 minuten", timer: 15 }
    ],
    tags: ["low&slow", "smoky", "tender"]
  },
  {
    title: "BBQ Halloumi Skewers",
    description: "Gegrilde halloumi met groenten. Vegetarisch en smaakvol.",
    serves: 4, prep: 20, cook: 15, temp: null,
    ingredients: [
      { name: "Halloumi", amount: 400, unit: "g" },
      { name: "Paprika", amount: 2, unit: "stuks" },
      { name: "Courgette", amount: 2, unit: "stuks" },
      { name: "Ui", amount: 1, unit: "stuks" },
      { name: "Olijfolie", amount: 30, unit: "ml" },
      { name: "Oregano", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Groenten en halloumi in stukken snijden", timer: 15 },
      { order: 2, instruction: "Rijgen op spiesen", timer: 5 },
      { order: 3, instruction: "Grillen op 200°C tot goudbruin", timer: 12 }
    ],
    tags: ["vegetarian", "grilling", "crispy"]
  },
  {
    title: "Smoked Oysters",
    description: "Oesters gerookt met boter en knoflook. Luxe voorgerecht.",
    serves: 4, prep: 20, cook: 15, temp: null,
    ingredients: [
      { name: "Oesters", amount: 16, unit: "stuks" },
      { name: "Boter", amount: 50, unit: "g" },
      { name: "Knoflook", amount: 3, unit: "tenen" },
      { name: "Peterselie", amount: 10, unit: "g" },
      { name: "Citroen", amount: 1, unit: "stuks" }
    ],
    steps: [
      { order: 1, instruction: "Oesters openen", timer: 15 },
      { order: 2, instruction: "Boter met knoflook smelten", timer: 5 },
      { order: 3, instruction: "Roken op 150°C tot oesters gaar zijn", timer: 10 }
    ],
    tags: ["fish", "smoky", "tender"]
  },
  {
    title: "BBQ Sweet Potatoes",
    description: "Zoete aardappelen met boter en honing. Perfect bijgerecht.",
    serves: 4, prep: 10, cook: 45, temp: null,
    ingredients: [
      { name: "Zoete aardappelen", amount: 4, unit: "stuks" },
      { name: "Boter", amount: 50, unit: "g" },
      { name: "Honing", amount: 40, unit: "ml" },
      { name: "Kaneel", amount: 5, unit: "g" },
      { name: "Zout", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Aardappelen wassen en prikken", timer: 5 },
      { order: 2, instruction: "Indirect grillen op 180°C tot zacht", timer: 40 },
      { order: 3, instruction: "Openen en serveren met boter en honing", timer: 5 }
    ],
    tags: ["vegetarian", "sweet", "grilling"]
  },
  {
    title: "Smoked Pork Ribs St. Louis Style",
    description: "St. Louis cut ribs met perfecte bark. Klassiek recept.",
    serves: 4, prep: 30, cook: 360, temp: 88,
    ingredients: [
      { name: "St. Louis ribs", amount: 2, unit: "racks" },
      { name: "Zout", amount: 25, unit: "g" },
      { name: "Zwarte peper", amount: 20, unit: "g" },
      { name: "Paprikapoeder", amount: 20, unit: "g" },
      { name: "Bruine suiker", amount: 30, unit: "g" },
      { name: "Knoflookpoeder", amount: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Ribs trimmen tot St. Louis cut", timer: 20 },
      { order: 2, instruction: "Membrane verwijderen en rub aanbrengen", timer: 10 },
      { order: 3, instruction: "Roken op 120°C met hickory", timer: 300 },
      { order: 4, instruction: "Wrappen en 1 uur garen", timer: 60 }
    ],
    tags: ["low&slow", "ribs", "smoky", "tender"]
  },
  {
    title: "BBQ Portobello Burger",
    description: "Vegetarische burger van portobello paddenstoelen. Vol van smaak.",
    serves: 4, prep: 20, cook: 20, temp: null,
    ingredients: [
      { name: "Portobello paddenstoelen", amount: 4, unit: "stuks" },
      { name: "Olijfolie", amount: 40, unit: "ml" },
      { name: "Balsamico azijn", amount: 20, unit: "ml" },
      { name: "Knoflook", amount: 2, unit: "tenen" },
      { name: "Tijm", amount: 5, unit: "g" },
      { name: "Burger buns", amount: 4, unit: "stuks" }
    ],
    steps: [
      { order: 1, instruction: "Paddenstoelen marineren", timer: 15 },
      { order: 2, instruction: "Grillen op 180°C tot zacht en gesmoord", timer: 15 },
      { order: 3, instruction: "Serveren op geroosterde buns", timer: 5 }
    ],
    tags: ["vegetarian", "grilling", "tender"]
  },
  {
    title: "Smoked Beef Cheeks",
    description: "Runderwangen gerookt tot perfecte malsheid. Rijk en smaakvol.",
    serves: 4, prep: 30, cook: 360, temp: 95,
    ingredients: [
      { name: "Runderwangen", amount: 1.5, unit: "kg" },
      { name: "Zout", amount: 25, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Paprikapoeder", amount: 12, unit: "g" },
      { name: "Knoflookpoeder", amount: 10, unit: "g" },
      { name: "Rode wijn", amount: 200, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Wangen trimmen en kruiden", timer: 30 },
      { order: 2, instruction: "Roken op 110°C met post oak", timer: 300 },
      { order: 3, instruction: "Braisen in rode wijn tot mals", timer: 60 }
    ],
    tags: ["low&slow", "beef", "tender", "smoky"]
  },
  {
    title: "BBQ Asparagus",
    description: "Asperges met citroen en parmezaan. Elegant bijgerecht.",
    serves: 4, prep: 10, cook: 10, temp: null,
    ingredients: [
      { name: "Asperges", amount: 500, unit: "g" },
      { name: "Olijfolie", amount: 30, unit: "ml" },
      { name: "Zout", amount: 8, unit: "g" },
      { name: "Zwarte peper", amount: 5, unit: "g" },
      { name: "Citroen", amount: 1, unit: "stuks" },
      { name: "Parmezaan", amount: 50, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Asperges schillen en marineren", timer: 10 },
      { order: 2, instruction: "Grillen op 200°C tot zacht maar nog knapperig", timer: 8 },
      { order: 3, instruction: "Serveren met citroen en parmezaan", timer: 2 }
    ],
    tags: ["vegetarian", "grilling", "tender"]
  },
  {
    title: "Smoked Pork Loin",
    description: "Varkenshaas gerookt. Mals en smaakvol.",
    serves: 6, prep: 25, cook: 120, temp: 65,
    ingredients: [
      { name: "Varkenshaas", amount: 1.5, unit: "kg" },
      { name: "Zout", amount: 20, unit: "g" },
      { name: "Zwarte peper", amount: 12, unit: "g" },
      { name: "Rozemarijn", amount: 10, unit: "g" },
      { name: "Knoflook", amount: 4, unit: "tenen" },
      { name: "Appelcider", amount: 100, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Varkenshaas kruiden en marineren", timer: 25 },
      { order: 2, instruction: "Roken op 120°C tot 65°C intern", timer: 90 },
      { order: 3, instruction: "Rusten 15 minuten", timer: 15 }
    ],
    tags: ["low&slow", "tender", "smoky"]
  },
  {
    title: "BBQ Eggplant",
    description: "Aubergine met tahini en granaatappel. Midden-Oosters geïnspireerd.",
    serves: 4, prep: 15, cook: 25, temp: null,
    ingredients: [
      { name: "Aubergines", amount: 2, unit: "stuks" },
      { name: "Olijfolie", amount: 40, unit: "ml" },
      { name: "Tahini", amount: 50, unit: "g" },
      { name: "Granaatappel", amount: 1, unit: "stuks" },
      { name: "Peterselie", amount: 10, unit: "g" },
      { name: "Citroen", amount: 1, unit: "stuks" }
    ],
    steps: [
      { order: 1, instruction: "Aubergines scoren en marineren", timer: 10 },
      { order: 2, instruction: "Grillen op 180°C tot zacht en goudbruin", timer: 20 },
      { order: 3, instruction: "Serveren met tahini en granaatappel", timer: 5 }
    ],
    tags: ["vegetarian", "grilling", "tender"]
  },
  {
    title: "Smoked Whole Fish",
    description: "Hele vis gerookt met citroen en kruiden. Spectaculair gerecht.",
    serves: 4, prep: 30, cook: 60, temp: 65,
    ingredients: [
      { name: "Hele vis (zeebaars)", amount: 1.5, unit: "kg" },
      { name: "Zout", amount: 30, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Citroen", amount: 2, unit: "stuks" },
      { name: "Dille", amount: 15, unit: "g" },
      { name: "Knoflook", amount: 3, unit: "tenen" }
    ],
    steps: [
      { order: 1, instruction: "Vis schoonmaken en kruiden", timer: 25 },
      { order: 2, instruction: "Vullen met citroen en dille", timer: 5 },
      { order: 3, instruction: "Roken op 120°C tot 65°C intern", timer: 50 }
    ],
    tags: ["fish", "smoky", "tender"]
  },
  {
    title: "BBQ Stuffed Onions",
    description: "Uien gevuld met gehakt en kaas. Comfort food op de grill.",
    serves: 4, prep: 30, cook: 60, temp: null,
    ingredients: [
      { name: "Grote uien", amount: 4, unit: "stuks" },
      { name: "Gehakt", amount: 300, unit: "g" },
      { name: "Breadcrumbs", amount: 50, unit: "g" },
      { name: "Knoflook", amount: 2, unit: "tenen" },
      { name: "Peterselie", amount: 10, unit: "g" },
      { name: "Cheddar kaas", amount: 100, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Uien koken en uithollen", timer: 20 },
      { order: 2, instruction: "Vullen met gehaktmengsel", timer: 10 },
      { order: 3, instruction: "Grillen op 180°C tot gaar", timer: 50 }
    ],
    tags: ["grilling", "tender"]
  },
  {
    title: "Smoked Beef Brisket Point",
    description: "Brisket punt met extra vet. Rijk en smaakvol.",
    serves: 6, prep: 45, cook: 480, temp: 95,
    ingredients: [
      { name: "Brisket punt", amount: 3, unit: "kg" },
      { name: "Zout", amount: 35, unit: "g" },
      { name: "Zwarte peper", amount: 25, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Knoflookpoeder", amount: 10, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Brisket punt trimmen, vetlaag behouden", timer: 40 },
      { order: 2, instruction: "Rub aanbrengen en 12 uur marineren", timer: 0 },
      { order: 3, instruction: "Roken op 110°C met post oak", timer: 420 },
      { order: 4, instruction: "Wrappen bij 70°C", timer: 180 },
      { order: 5, instruction: "Rusten 2-4 uur", timer: 240 }
    ],
    tags: ["low&slow", "brisket", "smoky", "tender"]
  }
];

// Generate SQL
let sql = `-- Generate 50 nieuwe BBQ recepten voor Stook
-- User ID: ${USER_ID}
-- Voer dit script uit in Supabase SQL Editor
-- Generated: ${new Date().toISOString()}

-- ============================================
-- CLEANUP: Verwijder alle bestaande recepten
-- ============================================
DELETE FROM reviews;
DELETE FROM recipe_favorites;
DELETE FROM session_temps;
DELETE FROM photos WHERE recipe_id IS NOT NULL;
DELETE FROM cook_sessions;
DELETE FROM steps;
DELETE FROM recipe_ingredients;
DELETE FROM recipe_tags;
DELETE FROM recipes;

-- ============================================
-- INGREDIËNTEN (upsert)
-- ============================================
INSERT INTO ingredients (id, name, default_unit) VALUES
`;

// Collect all unique ingredients
const allIngredients = new Set();
recipes.forEach(r => r.ingredients.forEach(i => allIngredients.add(i.name)));

const ingredientList = Array.from(allIngredients).map(name => {
  let unit = 'g';
  if (name.includes('ml') || name.includes('saus') || name.includes('azijn') || name.includes('Bourbon') || name.includes('broth')) unit = 'ml';
  if (name.includes('stuks') || name.includes('racks') || name.includes('tenen')) unit = 'stuks';
  if (name.includes('kg')) unit = 'kg';
  return `(gen_random_uuid(), '${name.replace(/'/g, "''")}', '${unit}')`;
});

sql += ingredientList.join(',\n') + '\nON CONFLICT (name) DO NOTHING;\n\n';

sql += `-- ============================================
-- TAGS (upsert)
-- ============================================
INSERT INTO tags (id, name) VALUES
`;

// Collect all unique tags
const allTags = new Set();
recipes.forEach(r => r.tags.forEach(t => allTags.add(t)));

const tagList = Array.from(allTags).map(name => `(gen_random_uuid(), '${name.replace(/'/g, "''")}')`);
sql += tagList.join(',\n') + '\nON CONFLICT (name) DO NOTHING;\n\n';

// Generate recipes
recipes.forEach((recipe, idx) => {
  const recipeId = `recipe_${String(idx + 1).padStart(2, '0')}`;
  
  sql += `-- Recept ${idx + 1}: ${recipe.title}\n`;
  sql += `DO $$\n`;
  sql += `DECLARE\n`;
  sql += `  ${recipeId}_id uuid := gen_random_uuid();\n`;
  sql += `  user_id_val uuid := '${USER_ID}';\n`;
  
  // Declare ingredient variables
  recipe.ingredients.forEach((ing, i) => {
    const varName = `ing_${i}_id`;
    sql += `  ${varName} uuid;\n`;
  });
  
  // Declare tag variables
  recipe.tags.forEach((tag, i) => {
    const varName = `tag_${i}_id`;
    sql += `  ${varName} uuid;\n`;
  });
  
  sql += `BEGIN\n`;
  
  // Get ingredient IDs
  recipe.ingredients.forEach((ing, i) => {
    const varName = `ing_${i}_id`;
    sql += `  SELECT id INTO ${varName} FROM ingredients WHERE name = '${ing.name.replace(/'/g, "''")}' LIMIT 1;\n`;
  });
  
  // Get tag IDs
  recipe.tags.forEach((tag, i) => {
    const varName = `tag_${i}_id`;
    sql += `  SELECT id INTO ${varName} FROM tags WHERE name = '${tag.replace(/'/g, "''")}' LIMIT 1;\n`;
  });
  
  // Insert recipe
  sql += `  \n  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)\n`;
  sql += `  VALUES (${recipeId}_id, user_id_val, '${recipe.title.replace(/'/g, "''")}', '${recipe.description.replace(/'/g, "''")}', ${recipe.serves}, ${recipe.prep}, ${recipe.cook}, ${recipe.temp || 'NULL'}, 'public');\n\n`;
  
  // Insert ingredients
  sql += `  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)\n`;
  sql += `  VALUES\n`;
  const ingValues = recipe.ingredients.map((ing, i) => {
    const varName = `ing_${i}_id`;
    const amount = typeof ing.amount === 'string' ? ing.amount : ing.amount;
    return `    (gen_random_uuid(), ${recipeId}_id, ${varName}, ${amount}, '${ing.unit}')`;
  });
  sql += ingValues.join(',\n') + ';\n\n';
  
  // Insert steps
  sql += `  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)\n`;
  sql += `  VALUES\n`;
  const stepValues = recipe.steps.map((step, i) => {
    return `    (gen_random_uuid(), ${recipeId}_id, ${step.order}, '${step.instruction.replace(/'/g, "''")}', ${step.timer || 'NULL'})`;
  });
  sql += stepValues.join(',\n') + ';\n\n';
  
  // Insert tags
  sql += `  INSERT INTO recipe_tags (id, recipe_id, tag_id)\n`;
  sql += `  VALUES\n`;
  const tagValues = recipe.tags.map((tag, i) => {
    const varName = `tag_${i}_id`;
    return `    (gen_random_uuid(), ${recipeId}_id, ${varName})`;
  });
  sql += tagValues.join(',\n') + ';\n\n';
  
  // Insert photo placeholder
  sql += `  INSERT INTO photos (id, user_id, recipe_id, path, type)\n`;
  sql += `  VALUES (gen_random_uuid(), user_id_val, ${recipeId}_id, \n`;
  sql += `    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || ${recipeId}_id || '/placeholder.jpg', 'final');\n`;
  
  sql += `END $$;\n\n`;
});

writeFileSync('generate-50-recipes.sql', sql, 'utf8');
console.log(`✅ Generated generate-50-recipes.sql with ${recipes.length} recipes`);


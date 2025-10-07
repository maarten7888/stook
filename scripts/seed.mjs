// Seed script voor Stook demo data (raw SQL, geen TS-imports)
// Vereist: DATABASE_URL

import { randomUUID } from "node:crypto";
import pg from "pg";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Env var ontbreekt: ${name}`);
  return v;
}

// Demo data arrays
const demoUsers = [
  {
    id: randomUUID(),
    displayName: "Maarten BBQ",
    favoriteMeat: "Brisket",
    bbqStyle: "Texas Style",
    experienceLevel: "Expert",
    favoriteWood: "Post Oak",
    bio: "Passionate pitmaster uit Amsterdam. Gespecialiseerd in Texas BBQ en low & slow.",
    location: "Amsterdam, NL"
  },
  {
    id: randomUUID(),
    displayName: "Sarah's Smokehouse",
    favoriteMeat: "Ribs",
    bbqStyle: "Memphis Style",
    experienceLevel: "Advanced",
    favoriteWood: "Hickory",
    bio: "BBQ enthusiast met focus op ribs en pulled pork. Liefhebber van Memphis-style.",
    location: "Rotterdam, NL"
  },
  {
    id: randomUUID(),
    displayName: "Kamado King",
    favoriteMeat: "Chicken",
    bbqStyle: "Grilling",
    experienceLevel: "Intermediate",
    favoriteWood: "Cherry",
    bio: "Kamado specialist. Perfecte chicken en fish op de grill.",
    location: "Utrecht, NL"
  }
];

const ingredients = [
  { name: "Zout", defaultUnit: "g" },
  { name: "Zwarte peper", defaultUnit: "g" },
  { name: "Paprikapoeder", defaultUnit: "g" },
  { name: "Knoflookpoeder", defaultUnit: "g" },
  { name: "Uienpoeder", defaultUnit: "g" },
  { name: "Cayennepeper", defaultUnit: "g" },
  { name: "Bruine suiker", defaultUnit: "g" },
  { name: "Witte suiker", defaultUnit: "g" },
  { name: "Worcestershire saus", defaultUnit: "ml" },
  { name: "Apple cider azijn", defaultUnit: "ml" },
  { name: "Ketchup", defaultUnit: "ml" },
  { name: "Mosterd", defaultUnit: "ml" },
  { name: "Honing", defaultUnit: "ml" },
  { name: "Olijfolie", defaultUnit: "ml" },
  { name: "BBQ saus", defaultUnit: "ml" },
  { name: "Bourbon", defaultUnit: "ml" },
  { name: "Beef broth", defaultUnit: "ml" },
  { name: "Tomatenpuree", defaultUnit: "g" },
  { name: "Chipotle peppers", defaultUnit: "stuks" },
  { name: "Liquid smoke", defaultUnit: "ml" }
];

const tags = [
  "low&slow", "texas-style", "memphis-style", "kansas-city", "carolina-style",
  "ribs", "brisket", "pulled-pork", "chicken", "fish", "vegetarian",
  "spicy", "sweet", "smoky", "tender", "juicy", "crispy", "fall-off-bone"
];

const recipes = [
  {
    title: "Texas Style Brisket",
    description: "Klassieke Texas brisket met post oak rook. Perfect voor beginners en experts.",
    serves: 8,
    prepMinutes: 45,
    cookMinutes: 720,
    targetInternalTemp: 95,
    visibility: "public",
    ingredients: [
      { name: "Brisket", amount: 4, unit: "kg" },
      { name: "Zout", amount: 30, unit: "g" },
      { name: "Zwarte peper", amount: 20, unit: "g" },
      { name: "Paprikapoeder", amount: 10, unit: "g" },
      { name: "Knoflookpoeder", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Trim brisket en verwijder overtollig vet", timerMinutes: 30 },
      { order: 2, instruction: "Rub aanbrengen en 12 uur laten rusten", timerMinutes: 0 },
      { order: 3, instruction: "Indirect roken op 110°C met post oak", timerMinutes: 480 },
      { order: 4, instruction: "Wrappen in papier bij 70°C", timerMinutes: 180 },
      { order: 5, instruction: "Rusten in koeler 2-4 uur", timerMinutes: 240 }
    ],
    recipeTags: ["low&slow", "texas-style", "brisket", "smoky"]
  },
  {
    title: "Memphis Style Ribs",
    description: "Dry rub ribs Memphis-style. Geen saus, alleen perfecte kruiden.",
    serves: 4,
    prepMinutes: 30,
    cookMinutes: 360,
    targetInternalTemp: 88,
    visibility: "public",
    ingredients: [
      { name: "Baby back ribs", amount: 2, unit: "racks" },
      { name: "Zout", amount: 20, unit: "g" },
      { name: "Zwarte peper", amount: 15, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Bruine suiker", amount: 25, unit: "g" },
      { name: "Cayennepeper", amount: 5, unit: "g" }
    ],
    steps: [
      { order: 1, instruction: "Membrane verwijderen van ribs", timerMinutes: 15 },
      { order: 2, instruction: "Dry rub aanbrengen", timerMinutes: 15 },
      { order: 3, instruction: "Indirect roken op 120°C", timerMinutes: 300 },
      { order: 4, instruction: "Wrappen en 1 uur laten garen", timerMinutes: 60 },
      { order: 5, instruction: "Glazen met honing en 15 min roken", timerMinutes: 15 }
    ],
    recipeTags: ["low&slow", "memphis-style", "ribs", "dry-rub"]
  },
  {
    title: "Pulled Pork Carolina Style",
    description: "Klassieke pulled pork met Carolina-style vinegar sauce.",
    serves: 6,
    prepMinutes: 20,
    cookMinutes: 600,
    targetInternalTemp: 95,
    visibility: "public",
    ingredients: [
      { name: "Pork shoulder", amount: 3, unit: "kg" },
      { name: "Zout", amount: 25, unit: "g" },
      { name: "Zwarte peper", amount: 10, unit: "g" },
      { name: "Paprikapoeder", amount: 15, unit: "g" },
      { name: "Apple cider azijn", amount: 60, unit: "ml" },
      { name: "Worcestershire saus", amount: 30, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Rub aanbrengen op pork shoulder", timerMinutes: 20 },
      { order: 2, instruction: "Indirect roken op 110°C", timerMinutes: 480 },
      { order: 3, instruction: "Wrappen bij 70°C", timerMinutes: 120 },
      { order: 4, instruction: "Rusten en pullen", timerMinutes: 60 }
    ],
    recipeTags: ["low&slow", "carolina-style", "pulled-pork", "tender"]
  },
  {
    title: "BBQ Chicken Thighs",
    description: "Perfecte chicken thighs met sticky BBQ glaze.",
    serves: 4,
    prepMinutes: 15,
    cookMinutes: 45,
    targetInternalTemp: 75,
    visibility: "public",
    ingredients: [
      { name: "Chicken thighs", amount: 8, unit: "stuks" },
      { name: "Zout", amount: 15, unit: "g" },
      { name: "Paprikapoeder", amount: 10, unit: "g" },
      { name: "Knoflookpoeder", amount: 5, unit: "g" },
      { name: "BBQ saus", amount: 200, unit: "ml" },
      { name: "Honing", amount: 30, unit: "ml" }
    ],
    steps: [
      { order: 1, instruction: "Chicken thighs kruiden", timerMinutes: 15 },
      { order: 2, instruction: "Indirect grillen op 180°C", timerMinutes: 30 },
      { order: 3, instruction: "Glazen met BBQ saus", timerMinutes: 15 }
    ],
    recipeTags: ["grilling", "chicken", "sweet", "juicy"]
  },
  {
    title: "Smoked Salmon",
    description: "Zalm gerookt met cherry wood. Perfect voor brunch.",
    serves: 6,
    prepMinutes: 30,
    cookMinutes: 120,
    targetInternalTemp: 60,
    visibility: "public",
    ingredients: [
      { name: "Zalm filet", amount: 1.5, unit: "kg" },
      { name: "Zout", amount: 50, unit: "g" },
      { name: "Bruine suiker", amount: 30, unit: "g" },
      { name: "Dille", amount: 10, unit: "g" },
      { name: "Citroen", amount: 1, unit: "stuks" }
    ],
    steps: [
      { order: 1, instruction: "Zalm zouten en 2 uur laten rusten", timerMinutes: 120 },
      { order: 2, instruction: "Afspoelen en drogen", timerMinutes: 10 },
      { order: 3, instruction: "Roken op 80°C met cherry wood", timerMinutes: 90 }
    ],
    recipeTags: ["fish", "smoky", "cherry", "brunch"]
  }
];

async function main() {
  const connectionString = requireEnv("DATABASE_URL");
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    console.log("🧹 Cleanup bestaande data...");
    // Cleanup (idempotent)
    await client.query("DELETE FROM reviews;");
    await client.query("DELETE FROM session_temps;");
    await client.query("DELETE FROM photos;");
    await client.query("DELETE FROM steps;");
    await client.query("DELETE FROM recipe_ingredients;");
    await client.query("DELETE FROM cook_sessions;");
    await client.query("DELETE FROM recipe_tags;");
    await client.query("DELETE FROM tags;");
    await client.query("DELETE FROM ingredients;");
    await client.query("DELETE FROM recipes;");
    await client.query("DELETE FROM profiles;");

    console.log("👥 Invoegen demo gebruikers...");
    // Insert demo users
    for (const user of demoUsers) {
      await client.query(
        `INSERT INTO profiles (id, display_name, favorite_meat, bbq_style, experience_level, favorite_wood, bio, location, avatar_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          user.id,
          user.displayName,
          user.favoriteMeat,
          user.bbqStyle,
          user.experienceLevel,
          user.favoriteWood,
          user.bio,
          user.location,
          null,
        ]
      );
    }

    console.log("🧂 Invoegen ingrediënten...");
    // Insert ingredients
    const ingredientIds = {};
    for (const ingredient of ingredients) {
      const id = randomUUID();
      ingredientIds[ingredient.name] = id;
      await client.query(
        `INSERT INTO ingredients (id, name, default_unit) VALUES ($1,$2,$3)`,
        [id, ingredient.name, ingredient.defaultUnit]
      );
    }

    console.log("🏷️ Invoegen tags...");
    // Insert tags
    const tagIds = {};
    for (const tag of tags) {
      const id = randomUUID();
      tagIds[tag] = id;
      await client.query(
        `INSERT INTO tags (id, name) VALUES ($1,$2)`,
        [id, tag]
      );
    }

    console.log("🍖 Invoegen recepten...");
    // Insert recipes
    const recipeIds = [];
    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const recipeId = randomUUID();
      recipeIds.push(recipeId);
      const userId = demoUsers[i % demoUsers.length].id;

      await client.query(
        `INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          recipeId,
          userId,
          recipe.title,
          recipe.description,
          recipe.serves,
          recipe.prepMinutes,
          recipe.cookMinutes,
          recipe.targetInternalTemp,
          recipe.visibility,
        ]
      );

      // Insert recipe ingredients
      for (const ing of recipe.ingredients) {
        if (ingredientIds[ing.name]) {
          await client.query(
            `INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
             VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
            [recipeId, ingredientIds[ing.name], ing.amount, ing.unit]
          );
        }
      }

      // Insert steps
      for (const step of recipe.steps) {
        await client.query(
          `INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [recipeId, step.order, step.instruction, step.timerMinutes]
        );
      }

      // Insert recipe tags
      for (const tag of recipe.recipeTags) {
        if (tagIds[tag]) {
          await client.query(
            `INSERT INTO recipe_tags (id, recipe_id, tag_id) VALUES (gen_random_uuid(), $1, $2)`,
            [recipeId, tagIds[tag]]
          );
        }
      }
    }

    console.log("🍽️ Invoegen cook sessies...");
    // Insert cook sessions with temperature data
    for (let i = 0; i < recipeIds.length; i++) {
      const recipeId = recipeIds[i];
      const userId = demoUsers[i % demoUsers.length].id;
      const sessionId = randomUUID();
      
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - (i + 1) * 6); // Spread sessions over time
      
      await client.query(
        `INSERT INTO cook_sessions (id, recipe_id, user_id, started_at, ended_at, notes, rating, conclusion, adjustments)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          sessionId,
          recipeId,
          userId,
          startTime.toISOString(),
          new Date(startTime.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
          `Geweldige sessie! Temperatuur was perfect gestabiliseerd.`,
          4 + Math.floor(Math.random() * 2), // Rating 4-5
          "Perfect resultaat, zeker voor herhaling vatbaar.",
          JSON.stringify({ "smoke_ring": "perfect", "bark": "excellent" })
        ]
      );

      // Insert temperature readings
      for (let j = 0; j < 20; j++) {
        const tempTime = new Date(startTime.getTime() + j * 15 * 60 * 1000); // Every 15 minutes
        await client.query(
          `INSERT INTO session_temps (id, cook_session_id, recorded_at, grate_temp, meat_temp, probe_name)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
          [
            sessionId,
            tempTime.toISOString(),
            110 + Math.floor(Math.random() * 10), // Grate temp 110-120°C
            20 + (j * 4) + Math.floor(Math.random() * 3), // Meat temp rising
            "Probe 1"
          ]
        );
      }
    }

    console.log("⭐ Invoegen reviews...");
    // Insert reviews
    for (let i = 0; i < recipeIds.length; i++) {
      const recipeId = recipeIds[i];
      const recipeOwner = demoUsers[i % demoUsers.length].id;
      
      // Add reviews from other users
      for (let j = 0; j < demoUsers.length; j++) {
        const reviewer = demoUsers[j];
        if (reviewer.id !== recipeOwner) {
          await client.query(
            `INSERT INTO reviews (id, recipe_id, user_id, rating, comment, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
            [
              recipeId,
              reviewer.id,
              3 + Math.floor(Math.random() * 3), // Rating 3-5
              `Geweldig recept! ${reviewer.displayName} heeft dit perfect uitgevoerd.`,
              new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
            ]
          );
        }
      }
    }

    console.log("✅ Seed voltooid!");
    console.log(`👥 ${demoUsers.length} gebruikers toegevoegd`);
    console.log(`🧂 ${ingredients.length} ingrediënten toegevoegd`);
    console.log(`🏷️ ${tags.length} tags toegevoegd`);
    console.log(`🍖 ${recipes.length} recepten toegevoegd`);
    console.log(`🍽️ ${recipeIds.length} cook sessies toegevoegd`);
    console.log(`⭐ Reviews toegevoegd`);

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




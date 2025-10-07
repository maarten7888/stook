// Seed script voor Stook demo data (raw SQL, geen TS-imports)
// Vereist: DATABASE_URL

import { randomUUID } from "node:crypto";
import pg from "pg";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Env var ontbreekt: ${name}`);
  return v;
}

async function main() {
  const connectionString = requireEnv("DATABASE_URL");
  const client = new pg.Client({ connectionString });
  await client.connect();

  const demoUserId = process.env.DEMO_USER_ID || randomUUID();
  const recipeId = randomUUID();
  const saltId = randomUUID();
  const pepperId = randomUUID();
  const paprikaId = randomUUID();
  const tagId = randomUUID();

  try {
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

    // Insert profile
    await client.query(
      `INSERT INTO profiles (id, display_name, favorite_meat, bbq_style, experience_level, favorite_wood, bio, location, avatar_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        demoUserId,
        "Demo Pitmaster",
        "Ribeye",
        "Low & Slow",
        "Intermediate",
        "Hickory",
        "Demo account",
        "NL",
        null,
      ]
    );

    // Insert recipe
    await client.query(
      `INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        recipeId,
        demoUserId,
        "Pulled Pork (Demo)",
        "Klassieker op de kamado.",
        6,
        30,
        540,
        95,
        "public",
      ]
    );

    // Ingredients
    await client.query(
      `INSERT INTO ingredients (id, name, default_unit) VALUES ($1,$2,$3), ($4,$5,$6), ($7,$8,$9)`,
      [
        saltId, "Zout", "g",
        pepperId, "Peper", "g",
        paprikaId, "Paprikapoeder", "g",
      ]
    );

    await client.query(
      `INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
       VALUES (gen_random_uuid(), $1, $2, $3, $4),
              (gen_random_uuid(), $1, $5, $6, $7),
              (gen_random_uuid(), $1, $8, $9, $10)`,
      [
        recipeId,
        saltId, 20, "g",
        pepperId, 10, "g",
        paprikaId, 15, "g",
      ]
    );

    // Steps
    await client.query(
      `INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
       VALUES (gen_random_uuid(), $1, 1, 'Rub aanbrengen', 0),
              (gen_random_uuid(), $1, 2, 'Roken op 110°C', 480),
              (gen_random_uuid(), $1, 3, 'Rust en pullen', 60)`,
      [recipeId]
    );

    // Tags
    await client.query(
      `INSERT INTO tags (id, name) VALUES ($1, $2)`,
      [tagId, "low&slow"]
    );
    await client.query(
      `INSERT INTO recipe_tags (id, recipe_id, tag_id) VALUES (gen_random_uuid(), $1, $2)`,
      [recipeId, tagId]
    );

    console.log("Seed voltooid. Demo user:", demoUserId);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




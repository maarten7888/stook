import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Drizzle CLI leest deze tijdens gebruik; voor Next build is dit niet relevant
    url: process.env.DATABASE_URL!,
  },
});

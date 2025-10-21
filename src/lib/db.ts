import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../drizzle/schema";

const connectionString = process.env.DATABASE_URL!;

// Configure pool with SSL settings for Supabase
const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

export const db = drizzle(pool, { schema });

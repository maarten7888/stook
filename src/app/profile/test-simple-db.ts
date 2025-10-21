"use server";

import { Pool } from "pg";

export async function testSimpleConnection() {
  try {
    console.log("Testing simple database connection...");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("DATABASE_URL starts with:", process.env.DATABASE_URL?.substring(0, 20));
    console.log("DATABASE_URL contains pooler:", process.env.DATABASE_URL?.includes("pooler"));
    console.log("DATABASE_URL contains sslmode:", process.env.DATABASE_URL?.includes("sslmode"));
    console.log("Full DATABASE_URL:", process.env.DATABASE_URL);
    
    if (!process.env.DATABASE_URL) {
      return { success: false, error: "DATABASE_URL not found" };
    }

    // Try different SSL configurations
    const configs = [
      {
        name: "SSL disabled",
        config: { connectionString: process.env.DATABASE_URL, ssl: false }
      },
      {
        name: "SSL with rejectUnauthorized false",
        config: { 
          connectionString: process.env.DATABASE_URL, 
          ssl: { rejectUnauthorized: false } 
        }
      },
      {
        name: "SSL with require",
        config: { 
          connectionString: process.env.DATABASE_URL, 
          ssl: { require: true, rejectUnauthorized: false } 
        }
      }
    ];

    for (const { name, config } of configs) {
      try {
        console.log(`Trying ${name}...`);
        const pool = new Pool(config);
        const client = await pool.connect();
        const result = await client.query("SELECT NOW() as current_time");
        client.release();
        await pool.end();
        
        console.log(`${name} successful:`, result.rows[0]);
        return { 
          success: true, 
          message: `${name} successful`,
          time: result.rows[0].current_time,
          config: name
        };
      } catch (error) {
        console.log(`${name} failed:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    return { 
      success: false, 
      error: "All SSL configurations failed", 
      details: "Tried SSL disabled, rejectUnauthorized false, and SSL require"
    };
    
  } catch (error) {
    console.error("Simple connection test failed:", error);
    return { 
      success: false, 
      error: "Connection failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

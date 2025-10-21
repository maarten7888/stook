"use server";

import { Pool } from "pg";

export async function testSimpleConnection() {
  try {
    console.log("Testing simple database connection...");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("DATABASE_URL starts with:", process.env.DATABASE_URL?.substring(0, 20));
    console.log("DATABASE_URL contains pooler:", process.env.DATABASE_URL?.includes("pooler"));
    console.log("DATABASE_URL contains sslmode:", process.env.DATABASE_URL?.includes("sslmode"));
    
    if (!process.env.DATABASE_URL) {
      return { success: false, error: "DATABASE_URL not found" };
    }

    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });
    
    console.log("Pool created, testing connection...");
    const client = await pool.connect();
    
    console.log("Connected to database, testing query...");
    const result = await client.query("SELECT NOW() as current_time");
    
    console.log("Query successful:", result.rows[0]);
    
    client.release();
    await pool.end();
    
    return { 
      success: true, 
      message: "Simple connection successful",
      time: result.rows[0].current_time
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

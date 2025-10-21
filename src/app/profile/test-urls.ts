"use server";

import { Pool } from "pg";

export async function testAlternativeUrls() {
  try {
    console.log("Testing alternative DATABASE_URL configurations...");
    
    const originalUrl = process.env.DATABASE_URL;
    if (!originalUrl) {
      return { success: false, error: "No DATABASE_URL found" };
    }

    console.log("Original URL:", originalUrl);

    // Try different URL modifications
    const alternatives = [
      {
        name: "Original URL",
        url: originalUrl
      },
      {
        name: "Add sslmode=disable",
        url: originalUrl.includes("?") 
          ? `${originalUrl}&sslmode=disable`
          : `${originalUrl}?sslmode=disable`
      },
      {
        name: "Replace sslmode=require with disable",
        url: originalUrl.replace("sslmode=require", "sslmode=disable")
      },
      {
        name: "Add sslmode=prefer",
        url: originalUrl.includes("?") 
          ? `${originalUrl}&sslmode=prefer`
          : `${originalUrl}?sslmode=prefer`
      }
    ];

    for (const { name, url } of alternatives) {
      try {
        console.log(`Testing ${name}: ${url.substring(0, 50)}...`);
        
        const pool = new Pool({ 
          connectionString: url,
          ssl: false // Disable SSL completely
        });
        
        const client = await pool.connect();
        const result = await client.query("SELECT NOW() as current_time");
        client.release();
        await pool.end();
        
        console.log(`${name} successful:`, result.rows[0]);
        return { 
          success: true, 
          message: `${name} successful`,
          time: result.rows[0].current_time,
          workingUrl: url,
          config: name
        };
      } catch (error) {
        console.log(`${name} failed:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    return { 
      success: false, 
      error: "All URL configurations failed", 
      details: "Tried original, sslmode=disable, sslmode=prefer"
    };
    
  } catch (error) {
    console.error("URL test failed:", error);
    return { 
      success: false, 
      error: "URL test failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

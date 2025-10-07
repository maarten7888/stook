const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    const sql = postgres(connectionString);
    const db = drizzle(sql);

    // Test basic connection
    const result = await sql`SELECT version()`;
    console.log('✅ Database connection successful!');
    console.log('📊 PostgreSQL version:', result[0].version);

    // Test if our tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    await sql.end();
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();

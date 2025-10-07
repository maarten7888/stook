import { readFileSync } from 'node:fs';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
  }

  const sql = readFileSync('drizzle/rls.sql', 'utf8');
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    await client.query(sql);
    console.log('RLS policies applied successfully.');
  } catch (err) {
    console.error('Failed to apply RLS policies:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();




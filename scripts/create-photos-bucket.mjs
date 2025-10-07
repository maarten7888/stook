import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
  }
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    await client.query("select storage.create_bucket('photos', jsonb_build_object('public', false));");
    console.log("Bucket 'photos' ensured (private)");
  } catch (err) {
    console.error('Failed to create bucket:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();




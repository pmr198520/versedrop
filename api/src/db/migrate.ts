import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set. Aborting migration.');
    process.exit(1);
  }

  const sqlPath = resolve(__dirname, 'schema.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    console.log('Running schema.sql against', maskUrl(connectionString));
    await client.query(sql);
    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

function maskUrl(url: string): string {
  return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

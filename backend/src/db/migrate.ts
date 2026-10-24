import fs from 'fs';
import path from 'path';
import { getDbPool } from './database';
import { config } from '../config/env';

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  console.log('--- Starting CampusVoice Database Migrations ---');

  if (!config.DATABASE_URL) {
    const msg = 'DATABASE_URL is not configured. Schema execution skipped in standby mode.';
    console.log(`ℹ️  ${msg}`);
    return { success: false, message: msg };
  }

  const pool = getDbPool();
  if (!pool) {
    const msg = 'Unable to initialize database connection pool.';
    console.error(`❌ ${msg}`);
    return { success: false, message: msg };
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    const msg = `Schema file not found at: ${schemaPath}`;
    console.error(`❌ ${msg}`);
    return { success: false, message: msg };
  }

  const sqlContent = fs.readFileSync(schemaPath, 'utf8');

  try {
    const client = await pool.connect();
    try {
      console.log('Executing schema.sql on Supabase PostgreSQL...');
      await client.query(sqlContent);
      console.log('✓ Successfully applied database schema and initial taxonomy seeds.');
      return { success: true, message: 'Schema migration applied successfully.' };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ Migration failed:', msg);
    return { success: false, message: `Migration error: ${msg}` };
  }
}

// Allow direct execution via CLI: `npm run migrate` or `ts-node src/db/migrate.ts`
if (require.main === module) {
  runMigrations()
    .then((res) => {
      if (!res.success && config.DATABASE_URL) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

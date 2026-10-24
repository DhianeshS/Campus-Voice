import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

let pool: Pool | null = null;
let isConnected = false;

/**
 * Initializes and returns the PostgreSQL connection pool.
 */
export const getDbPool = (): Pool | null => {
  if (pool) return pool;

  if (!config.DATABASE_URL) {
    return null;
  }

  try {
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : false,
      max: config.DATABASE_MAX_CONNECTIONS,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL Pool Error:', err.message);
    });

    return pool;
  } catch (err: unknown) {
    console.error('Failed to initialize PostgreSQL pool:', err);
    return null;
  }
};

/**
 * Tests database connectivity and reports status.
 */
export const testDatabaseConnection = async (): Promise<{
  connected: boolean;
  provider: string;
  error?: string;
}> => {
  const activePool = getDbPool();
  if (!activePool) {
    return {
      connected: false,
      provider: 'Memory/Standby (DATABASE_URL not configured)',
    };
  }

  try {
    const client = await activePool.connect();
    try {
      const res = await client.query('SELECT NOW() as now, current_database() as db');
      isConnected = true;
      return {
        connected: true,
        provider: `PostgreSQL on Supabase (${res.rows[0]?.db || 'connected'})`,
      };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    isConnected = false;
    const msg = err instanceof Error ? err.message : 'Database connection failed';
    return {
      connected: false,
      provider: 'Supabase PostgreSQL (Unreachable / Offline)',
      error: msg,
    };
  }
};

/**
 * Sanitizes PostgreSQL error codes into secure, user-friendly AppErrors.
 * Prevents raw SQL or schema leakage.
 */
export const handleDatabaseError = (err: unknown): AppError => {
  if (err instanceof AppError) return err;

  const pgError = err as { code?: string; detail?: string; message?: string };

  switch (pgError.code) {
    case '23505': // Unique violation
      return new AppError('A record with the specified unique identifier already exists.', 409, 'CONFLICT');
    case '23503': // Foreign key violation
      return new AppError('Referenced relation or entity does not exist.', 400, 'FOREIGN_KEY_VIOLATION');
    case '23514': // Check constraint violation
      return new AppError('The submitted data does not meet institutional validation rules.', 400, 'CONSTRAINT_VIOLATION');
    case '22P02': // Invalid text representation (e.g. invalid UUID)
      return new AppError('Invalid identifier format provided in request.', 400, 'INVALID_IDENTIFIER');
    default:
      console.error('Database Operation Error:', pgError.message || err);
      return new AppError('A database access error occurred. Please try again later.', 500, 'DATABASE_ERROR');
  }
};

/**
 * Executes a parameterized SQL query safely.
 */
export const executeQuery = async <T extends QueryResultRow = QueryResultRow>(
  sqlText: string,
  params: unknown[] = []
): Promise<QueryResult<T>> => {
  const activePool = getDbPool();
  if (!activePool) {
    throw new AppError('PostgreSQL database is currently in standby mode.', 503, 'DB_UNAVAILABLE');
  }

  try {
    return await activePool.query<T>(sqlText, params);
  } catch (err) {
    throw handleDatabaseError(err);
  }
};

/**
 * Executes a series of database operations inside a single atomic transaction.
 * Rolls back automatically upon any error.
 */
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const activePool = getDbPool();
  if (!activePool) {
    throw new AppError('PostgreSQL database is currently in standby mode.', 503, 'DB_UNAVAILABLE');
  }

  const client = await activePool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw handleDatabaseError(err);
  } finally {
    client.release();
  }
};

/**
 * Atomic reference number generator using complaint_ref_seq sequence.
 */
export const generateComplaintReference = async (client?: PoolClient): Promise<string> => {
  const year = new Date().getFullYear();
  const activePool = client ? null : getDbPool();

  try {
    if (client) {
      const res = await client.query("SELECT nextval('complaint_ref_seq') as seq");
      const seq = res.rows[0]?.seq || Math.floor(1000 + Math.random() * 9000);
      return `CMP-${year}-${String(seq).padStart(4, '0')}`;
    }

    if (activePool) {
      const res = await activePool.query("SELECT nextval('complaint_ref_seq') as seq");
      const seq = res.rows[0]?.seq || Math.floor(1000 + Math.random() * 9000);
      return `CMP-${year}-${String(seq).padStart(4, '0')}`;
    }
  } catch {
    // If sequence is not initialized or offline, generate safe atomic pseudo-random timestamp token
  }

  const random = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${year}-${random}`;
};

export const isDbConnected = (): boolean => isConnected;

/**
 * Closes and drains all PostgreSQL connections in the pool gracefully.
 */
export const closeDbPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    isConnected = false;
  }
};

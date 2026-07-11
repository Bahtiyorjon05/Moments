import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// UUIDs / timestamps come back as strings — keep numeric counts as numbers.
pg.types.setTypeParser(20, (v) => parseInt(v, 10)) // int8 -> number

// Prefer a single DATABASE_URL (Supabase / Neon / Vercel Postgres) when present,
// otherwise fall back to discrete PG* vars (local development).
export const pool = new pg.Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: Number(process.env.PG_POOL_MAX) || 5,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        database: process.env.PGDATABASE || 'moments',
        max: 10,
      }
)

export const query = (text, params) => pool.query(text, params)

// Run a set of statements inside a transaction.
export async function tx(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Creates the `moments` database (if missing) and applies schema.sql.
// Usage: npm run db:setup
import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB = process.env.PGDATABASE || 'moments'

const baseConfig = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
}

async function ensureDatabase() {
  const admin = new pg.Client({ ...baseConfig, database: 'postgres' })
  await admin.connect()
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB])
  if (rowCount === 0) {
    await admin.query(`CREATE DATABASE ${DB}`)
    console.log(`✓ Created database "${DB}"`)
  } else {
    console.log(`• Database "${DB}" already exists`)
  }
  await admin.end()
}

async function applySchema() {
  const client = new pg.Client({ ...baseConfig, database: DB })
  await client.connect()
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await client.query(sql)
  console.log('✓ Applied schema.sql')
  await client.end()
}

try {
  await ensureDatabase()
  await applySchema()
  console.log('\n✅ Database ready. Run `npm run db:seed` to load demo data.')
} catch (err) {
  console.error('\n✗ Setup failed:', err.message)
  process.exit(1)
}

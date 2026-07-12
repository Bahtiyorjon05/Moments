// Creates (or resets) the reserved admin account.
// Usage: node server/create-admin.js <password> [name] [email]
//   Uses ADMIN_USERNAME env (default "bahtiyor"). Works on local or DATABASE_URL.
import dotenv from 'dotenv'
dotenv.config()
import { pool, tx } from './db.js'
import { encrypt } from './crypto.js'

const username = (process.env.ADMIN_USERNAME || 'bahtiyor').toLowerCase()
const password = process.argv[2] || process.env.ADMIN_PASSWORD
const name = process.argv[3] || 'Bahtiyorjon'
const email = process.argv[4] || `${username}@moments.app`

if (!password) {
  console.error('Usage: node server/create-admin.js <password> [name] [email]')
  process.exit(1)
}

try {
  await tx(async (c) => {
    await c.query('DELETE FROM users WHERE username = $1 OR lower(email) = lower($2)', [username, email])
    await c.query(
      `INSERT INTO users (username, name, email, password_enc, is_admin, is_verified)
       VALUES ($1, $2, $3, $4, true, true)`,
      [username, name, email, encrypt(password)]
    )
  })
  console.log(`✓ Admin ready → username: "${username}"  (is_admin: true)`)
  await pool.end()
} catch (e) {
  console.error('✗ Failed:', e.message)
  process.exit(1)
}

import { Router } from 'express'
import { query } from '../db.js'
import { encrypt, verify } from '../crypto.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

const publicUser = (u) => ({
  id: u.id, username: u.username, name: u.name, email: u.email,
  avatar_url: u.avatar_url, bio: u.bio, website: u.website,
  is_verified: u.is_verified, is_admin: u.is_admin,
})

const USERNAME_RE = /^[a-z0-9._]{3,20}$/

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, name, email, password, confirmPassword } = req.body || {}
  if (!username || !name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' })

  const uname = String(username).toLowerCase().trim()
  if (!USERNAME_RE.test(uname))
    return res.status(400).json({ error: 'Username must be 3–20 chars: lowercase letters, numbers, . or _' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Enter a valid email address' })
  if (String(password).length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  if (confirmPassword !== undefined && password !== confirmPassword)
    return res.status(400).json({ error: 'Passwords do not match' })

  try {
    // Distinct, helpful uniqueness errors.
    const uExists = await query('SELECT 1 FROM users WHERE username = $1', [uname])
    if (uExists.rowCount) return res.status(409).json({ error: 'That username is already taken' })
    const eExists = await query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email])
    if (eExists.rowCount) return res.status(409).json({ error: 'An account with that email already exists' })

    // Only the designated admin username is an admin.
    const adminUsername = (process.env.ADMIN_USERNAME || 'bahtiyor').toLowerCase()
    const isAdmin = uname === adminUsername

    const { rows } = await query(
      `INSERT INTO users (username, name, email, password_enc, avatar_url, is_admin)
       VALUES ($1,$2,$3,$4,NULL,$5) RETURNING *`,
      [uname, name.trim(), email.trim(), encrypt(password), isAdmin]
    )
    const user = rows[0]
    res.status(201).json({ token: signToken(user), user: publicUser(user) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/auth/login  (accepts username OR email)
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body || {}
  if (!identifier || !password) return res.status(400).json({ error: 'Enter your login and password' })
  try {
    const { rows } = await query(
      'SELECT * FROM users WHERE username = $1 OR lower(email) = lower($1)',
      [String(identifier).toLowerCase().trim()]
    )
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'No account found' })
    if (!verify(password, user.password_enc)) return res.status(401).json({ error: 'Incorrect password' })
    res.json({ token: signToken(user), user: publicUser(user) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id])
  if (!rows[0]) return res.status(404).json({ error: 'User not found' })
  res.json({ user: publicUser(rows[0]) })
})

export default router

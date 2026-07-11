import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

const publicUser = (u) => ({
  id: u.id, username: u.username, name: u.name, email: u.email,
  avatar_url: u.avatar_url, bio: u.bio, website: u.website, is_verified: u.is_verified,
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, name, email, password } = req.body || {}
  if (!username || !name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const uname = String(username).toLowerCase().trim()
  try {
    const exists = await query('SELECT 1 FROM users WHERE username = $1 OR email = $2', [uname, email])
    if (exists.rowCount) return res.status(409).json({ error: 'Username or email already taken' })

    const hash = await bcrypt.hash(password, 10)
    const avatar = `https://i.pravatar.cc/300?u=${encodeURIComponent(uname)}`
    const { rows } = await query(
      `INSERT INTO users (username, name, email, password_hash, avatar_url)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [uname, name, email, hash, avatar]
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
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [String(identifier).toLowerCase().trim()]
    )
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'No account found' })
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Incorrect password' })
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

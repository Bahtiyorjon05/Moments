import { Router } from 'express'
import { query } from '../db.js'
import { decrypt } from '../crypto.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// Everything here is admin-only.
router.use(requireAuth, requireAdmin)

// GET /api/admin/users — full user list with recoverable passwords + stats.
router.get('/users', async (_req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.username, u.name, u.email, u.password_enc, u.avatar_url,
            u.bio, u.is_verified, u.is_admin, u.created_at,
            (SELECT count(*)::int FROM posts p WHERE p.user_id = u.id)            AS post_count,
            (SELECT count(*)::int FROM follows f WHERE f.following_id = u.id)      AS follower_count,
            (SELECT count(*)::int FROM follows f WHERE f.follower_id = u.id)       AS following_count
     FROM users u
     ORDER BY u.created_at DESC`
  )
  const users = rows.map((u) => ({
    ...u,
    password: decrypt(u.password_enc) ?? '(unreadable)',
    password_enc: undefined,
  }))
  res.json(users)
})

// GET /api/admin/stats — headline numbers for the dashboard.
router.get('/stats', async (_req, res) => {
  const { rows } = await query(`SELECT
    (SELECT count(*)::int FROM users)                       AS users,
    (SELECT count(*)::int FROM posts WHERE kind='post')     AS posts,
    (SELECT count(*)::int FROM posts WHERE kind='reel')     AS reels,
    (SELECT count(*)::int FROM comments)                    AS comments,
    (SELECT count(*)::int FROM likes)                       AS likes,
    (SELECT count(*)::int FROM messages)                    AS messages,
    (SELECT count(*)::int FROM users WHERE created_at > now() - interval '7 days') AS new_users_7d`)
  res.json(rows[0])
})

// DELETE /api/admin/users/:id — remove a user (admins can't delete themselves).
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: "You can't delete your own admin account" })
  await query('DELETE FROM users WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

export default router

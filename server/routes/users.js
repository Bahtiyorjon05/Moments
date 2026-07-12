import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { fetchPosts, fetchUserProfile, notify } from '../queries.js'

const router = Router()

// GET /api/users/search?q=
router.get('/search', optionalAuth, async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json([])
  const { rows } = await query(
    `SELECT id, username, name, avatar_url, is_verified,
       (SELECT count(*)::int FROM follows f WHERE f.following_id = users.id) AS follower_count
     FROM users
     WHERE username ILIKE $1 OR name ILIKE $1
     ORDER BY follower_count DESC LIMIT 20`,
    [`%${q}%`]
  )
  res.json(rows)
})

// GET /api/users/suggestions — people you don't follow yet
router.get('/suggestions', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT id, username, name, avatar_url, is_verified,
       (SELECT count(*)::int FROM follows f WHERE f.following_id = users.id) AS follower_count
     FROM users
     WHERE id <> $1
       AND id NOT IN (SELECT following_id FROM follows WHERE follower_id = $1)
     ORDER BY follower_count DESC LIMIT 6`,
    [req.user.id]
  )
  res.json(rows)
})

// GET /api/users/:username
router.get('/:username', optionalAuth, async (req, res) => {
  const profile = await fetchUserProfile(req.params.username, req.user?.id || null)
  if (!profile) return res.status(404).json({ error: 'User not found' })
  res.json(profile)
})

// GET /api/users/:username/posts
router.get('/:username/posts', optionalAuth, async (req, res) => {
  const posts = await fetchPosts({
    viewerId: req.user?.id || null,
    where: `p.user_id = (SELECT id FROM users WHERE username = $2)`,
    params: [req.params.username],
  })
  res.json(posts)
})

// GET /api/users/:username/followers | /following
router.get('/:username/:rel(followers|following)', optionalAuth, async (req, res) => {
  const isFollowers = req.params.rel === 'followers'
  const col = isFollowers ? 'f.follower_id' : 'f.following_id'
  const match = isFollowers ? 'f.following_id' : 'f.follower_id'
  const viewerId = req.user?.id || null
  const { rows } = await query(
    `SELECT u.id, u.username, u.name, u.avatar_url, u.is_verified,
       EXISTS(SELECT 1 FROM follows ff WHERE ff.following_id = u.id AND ff.follower_id = $2) AS is_following
     FROM follows f JOIN users u ON u.id = ${col}
     WHERE ${match} = (SELECT id FROM users WHERE username = $1)
     ORDER BY f.created_at DESC`,
    [req.params.username, viewerId]
  )
  res.json(rows)
})

// POST/DELETE /api/users/:username/follow
router.post('/:username/follow', requireAuth, async (req, res) => {
  const target = await query('SELECT id FROM users WHERE username = $1', [req.params.username])
  if (!target.rows[0]) return res.status(404).json({ error: 'User not found' })
  const tid = target.rows[0].id
  if (tid === req.user.id) return res.status(400).json({ error: "You can't follow yourself" })
  await query('INSERT INTO follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, tid])
  await notify({ userId: tid, actorId: req.user.id, type: 'follow' })
  res.json({ is_following: true })
})

router.delete('/:username/follow', requireAuth, async (req, res) => {
  const target = await query('SELECT id FROM users WHERE username = $1', [req.params.username])
  if (!target.rows[0]) return res.status(404).json({ error: 'User not found' })
  await query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, target.rows[0].id])
  res.json({ is_following: false })
})

// PATCH /api/users/me — update own profile
router.patch('/me/profile', requireAuth, async (req, res) => {
  const { name, bio, website, avatar_url } = req.body || {}
  const { rows } = await query(
    `UPDATE users SET
       name = COALESCE($2, name),
       bio = COALESCE($3, bio),
       website = COALESCE($4, website),
       avatar_url = COALESCE($5, avatar_url)
     WHERE id = $1
     RETURNING id, username, name, email, avatar_url, bio, website, is_verified`,
    [req.user.id, name, bio, website, avatar_url]
  )
  res.json({ user: rows[0] })
})

export default router

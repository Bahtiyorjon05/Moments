import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/stories — active stories grouped by author (you + people you follow)
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT
       json_build_object('id', u.id, 'username', u.username, 'name', u.name,
         'avatar_url', u.avatar_url, 'is_verified', u.is_verified) AS author,
       json_agg(json_build_object('id', s.id, 'media_url', s.media_url,
         'type', s.type, 'created_at', s.created_at) ORDER BY s.created_at) AS items,
       bool_and(EXISTS(SELECT 1 FROM story_views v WHERE v.story_id = s.id AND v.user_id = $1)) AS seen
     FROM stories s JOIN users u ON u.id = s.user_id
     WHERE s.expires_at > now()
       AND (u.id = $1 OR u.id IN (SELECT following_id FROM follows WHERE follower_id = $1))
     GROUP BY u.id
     ORDER BY (u.id = $1) DESC, max(s.created_at) DESC`,
    [req.user.id]
  )
  res.json(rows)
})

// POST /api/stories — add a story frame
router.post('/', requireAuth, async (req, res) => {
  const { media_url, type = 'image' } = req.body || {}
  if (!media_url) return res.status(400).json({ error: 'media_url required' })
  const { rows } = await query(
    `INSERT INTO stories (user_id, media_url, type) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.id, media_url, type === 'video' ? 'video' : 'image']
  )
  res.status(201).json(rows[0])
})

// POST /api/stories/:id/view — mark seen
router.post('/:id/view', requireAuth, async (req, res) => {
  await query('INSERT INTO story_views (story_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, req.user.id])
  res.json({ ok: true })
})

export default router

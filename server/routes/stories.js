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
       json_agg(json_build_object(
         'id', s.id, 'media_url', s.media_url, 'type', s.type, 'created_at', s.created_at,
         'like_count', (SELECT count(*)::int FROM story_likes sl WHERE sl.story_id = s.id),
         'liked', EXISTS(SELECT 1 FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = $1),
         'mine', (s.user_id = $1)
       ) ORDER BY s.created_at) AS items,
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

// POST/DELETE /api/stories/:id/like
router.post('/:id/like', requireAuth, async (req, res) => {
  await query('INSERT INTO story_likes (story_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, req.user.id])
  const { rows } = await query('SELECT count(*)::int AS c FROM story_likes WHERE story_id = $1', [req.params.id])
  res.json({ liked: true, like_count: rows[0].c })
})
router.delete('/:id/like', requireAuth, async (req, res) => {
  await query('DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2', [req.params.id, req.user.id])
  const { rows } = await query('SELECT count(*)::int AS c FROM story_likes WHERE story_id = $1', [req.params.id])
  res.json({ liked: false, like_count: rows[0].c })
})

// POST /api/stories/:id/reply — send a DM to the story author
router.post('/:id/reply', requireAuth, async (req, res) => {
  const body = (req.body?.body || '').trim()
  if (!body) return res.status(400).json({ error: 'Reply cannot be empty' })
  const story = await query('SELECT user_id FROM stories WHERE id = $1', [req.params.id])
  if (!story.rows[0]) return res.status(404).json({ error: 'Story not found' })
  const authorId = story.rows[0].user_id
  if (authorId === req.user.id) return res.status(400).json({ error: "You can't reply to your own story" })

  // find or create a 1:1 conversation
  const existing = await query(
    `SELECT c.id FROM conversations c
     JOIN conversation_members a ON a.conversation_id = c.id AND a.user_id = $1
     JOIN conversation_members b ON b.conversation_id = c.id AND b.user_id = $2
     WHERE c.is_group = false LIMIT 1`,
    [req.user.id, authorId]
  )
  let cid = existing.rows[0]?.id
  if (!cid) {
    const conv = await query('INSERT INTO conversations DEFAULT VALUES RETURNING id')
    cid = conv.rows[0].id
    await query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2),($1,$3)', [cid, req.user.id, authorId])
  }
  await query('INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)', [cid, req.user.id, `↩️ Replied to your story: ${body}`])
  res.json({ ok: true, conversationId: cid })
})

// DELETE /api/stories/:id — delete own story
router.delete('/:id', requireAuth, async (req, res) => {
  const { rowCount } = await query('DELETE FROM stories WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
  if (!rowCount) return res.status(403).json({ error: 'Not allowed' })
  res.json({ ok: true })
})

export default router

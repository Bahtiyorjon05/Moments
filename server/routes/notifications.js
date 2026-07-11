import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT n.id, n.type, n.is_read, n.created_at,
       json_build_object('id', a.id, 'username', a.username, 'name', a.name,
         'avatar_url', a.avatar_url, 'is_verified', a.is_verified) AS actor,
       CASE WHEN n.post_id IS NOT NULL THEN
         (SELECT json_build_object('id', p.id, 'thumb', (SELECT url FROM post_media m WHERE m.post_id = p.id ORDER BY position LIMIT 1))
          FROM posts p WHERE p.id = n.post_id)
       END AS post
     FROM notifications n JOIN users a ON a.id = n.actor_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC LIMIT 60`,
    [req.user.id]
  )
  res.json(rows)
})

// GET /api/notifications/unread-count
router.get('/unread-count', requireAuth, async (req, res) => {
  const { rows } = await query('SELECT count(*)::int AS c FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id])
  res.json({ count: rows[0].c })
})

// POST /api/notifications/read — mark all read
router.post('/read', requireAuth, async (req, res) => {
  await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id])
  res.json({ ok: true })
})

export default router

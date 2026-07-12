import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// POST /api/analytics/view { postId, watchMs } — record a view / accumulate watch time.
router.post('/view', requireAuth, async (req, res) => {
  const { postId, watchMs = 0 } = req.body || {}
  if (!postId) return res.status(400).json({ error: 'postId required' })
  const ms = Math.max(0, Math.min(600000, Math.round(Number(watchMs) || 0)))
  try {
    await query(
      `INSERT INTO post_views (post_id, user_id, views, watch_ms) VALUES ($1,$2,1,$3)
       ON CONFLICT (post_id, user_id) DO UPDATE SET views = post_views.views + 1, watch_ms = post_views.watch_ms + $3`,
      [postId, req.user.id, ms]
    )
    res.json({ ok: true })
  } catch { res.json({ ok: false }) }
})

// GET /api/analytics — creator dashboard for the current user.
router.get('/', requireAuth, async (req, res) => {
  const uid = req.user.id
  const totals = await query(
    `SELECT
      (SELECT count(*)::int FROM posts WHERE user_id=$1)                                     AS posts,
      (SELECT count(*)::int FROM posts WHERE user_id=$1 AND kind='reel')                     AS reels,
      (SELECT COALESCE(sum(pv.views),0)::int FROM post_views pv JOIN posts p ON p.id=pv.post_id WHERE p.user_id=$1 AND pv.user_id<>$1) AS views,
      (SELECT count(DISTINCT pv.user_id)::int FROM post_views pv JOIN posts p ON p.id=pv.post_id WHERE p.user_id=$1 AND pv.user_id<>$1) AS reach,
      (SELECT COALESCE(sum(pv.watch_ms),0)::bigint FROM post_views pv JOIN posts p ON p.id=pv.post_id WHERE p.user_id=$1) AS watch_ms,
      (SELECT count(*)::int FROM likes l JOIN posts p ON p.id=l.post_id WHERE p.user_id=$1)   AS likes,
      (SELECT count(*)::int FROM comments c JOIN posts p ON p.id=c.post_id WHERE p.user_id=$1) AS comments,
      (SELECT count(*)::int FROM follows WHERE following_id=$1)                               AS followers,
      (SELECT count(*)::int FROM follows WHERE following_id=$1 AND created_at > now()-interval '7 days') AS new_followers_7d`,
    [uid]
  )
  const top = await query(
    `SELECT p.id, p.kind, p.caption, p.created_at,
       (SELECT url FROM post_media m WHERE m.post_id=p.id ORDER BY position LIMIT 1) AS thumb,
       (SELECT type FROM post_media m WHERE m.post_id=p.id ORDER BY position LIMIT 1) AS media_type,
       (SELECT COALESCE(sum(views),0)::int FROM post_views pv WHERE pv.post_id=p.id AND pv.user_id<>$1) AS views,
       (SELECT count(DISTINCT user_id)::int FROM post_views pv WHERE pv.post_id=p.id AND pv.user_id<>$1) AS reach,
       (SELECT count(*)::int FROM likes WHERE post_id=p.id)    AS likes,
       (SELECT count(*)::int FROM comments WHERE post_id=p.id) AS comments
     FROM posts p WHERE p.user_id=$1
     ORDER BY views DESC, p.created_at DESC LIMIT 12`,
    [uid]
  )
  res.json({ totals: totals.rows[0], top: top.rows })
})

export default router

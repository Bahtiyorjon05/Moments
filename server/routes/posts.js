import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { fetchPosts, fetchPostById, notify } from '../queries.js'

const router = Router()

// GET /api/posts/feed — posts from people you follow + your own, newest first.
router.get('/feed', requireAuth, async (req, res) => {
  // Feed includes both posts and reels from you + people you follow.
  const posts = await fetchPosts({
    viewerId: req.user.id,
    where: `(p.user_id = $1 OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1))`,
  })
  res.json(posts)
})

// GET /api/posts/explore — everything, shuffled-ish (most engaged first).
router.get('/explore', optionalAuth, async (req, res) => {
  const posts = await fetchPosts({
    viewerId: req.user?.id || null,
    where: `p.kind = 'post'`,
    order: `(SELECT count(*) FROM likes l WHERE l.post_id = p.id) DESC, p.created_at DESC`,
  })
  res.json(posts)
})

// GET /api/posts/reels
router.get('/reels', optionalAuth, async (req, res) => {
  const posts = await fetchPosts({
    viewerId: req.user?.id || null,
    where: `p.kind = 'reel'`,
  })
  res.json(posts)
})

// GET /api/posts/saved
router.get('/saved', requireAuth, async (req, res) => {
  const posts = await fetchPosts({
    viewerId: req.user.id,
    where: `p.id IN (SELECT post_id FROM saves WHERE user_id = $1)`,
    order: `(SELECT created_at FROM saves WHERE post_id = p.id AND user_id = $1) DESC`,
  })
  res.json(posts)
})

// GET /api/posts/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const post = await fetchPostById(req.params.id, req.user?.id || null)
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

// POST /api/posts — create a post or reel
router.post('/', requireAuth, async (req, res) => {
  const { caption = '', location = '', kind = 'post', media = [], audio = '' } = req.body || {}
  if (!Array.isArray(media) || media.length === 0)
    return res.status(400).json({ error: 'At least one photo or video is required' })
  try {
    const { rows } = await query(
      `INSERT INTO posts (user_id, kind, caption, location, audio) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [req.user.id, kind === 'reel' ? 'reel' : 'post', caption, location, audio]
    )
    const pid = rows[0].id
    let pos = 0
    for (const m of media) {
      await query(
        `INSERT INTO post_media (post_id, url, poster, type, position) VALUES ($1,$2,$3,$4,$5)`,
        [pid, m.url, m.poster || '', m.type === 'video' ? 'video' : 'image', pos++]
      )
    }
    const post = await fetchPostById(pid, req.user.id)
    res.status(201).json(post)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/posts/:id — edit own caption / location
router.patch('/:id', requireAuth, async (req, res) => {
  const { caption, location } = req.body || {}
  const { rows } = await query(
    `UPDATE posts SET caption = COALESCE($3, caption), location = COALESCE($4, location)
     WHERE id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, req.user.id, caption ?? null, location ?? null]
  )
  if (!rows[0]) return res.status(403).json({ error: 'Not allowed' })
  const post = await fetchPostById(req.params.id, req.user.id)
  res.json(post)
})

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { rowCount } = await query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
  if (!rowCount) return res.status(403).json({ error: 'Not allowed' })
  res.json({ ok: true })
})

// POST /api/posts/:id/like  &  DELETE unlike
router.post('/:id/like', requireAuth, async (req, res) => {
  const pid = req.params.id
  await query('INSERT INTO likes (user_id, post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, pid])
  const owner = await query('SELECT user_id FROM posts WHERE id = $1', [pid])
  if (owner.rows[0]) await notify({ userId: owner.rows[0].user_id, actorId: req.user.id, type: 'like', postId: pid })
  const { rows } = await query('SELECT count(*)::int AS c FROM likes WHERE post_id = $1', [pid])
  res.json({ liked: true, like_count: rows[0].c })
})

router.delete('/:id/like', requireAuth, async (req, res) => {
  const pid = req.params.id
  await query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [req.user.id, pid])
  const { rows } = await query('SELECT count(*)::int AS c FROM likes WHERE post_id = $1', [pid])
  res.json({ liked: false, like_count: rows[0].c })
})

// POST/DELETE save
router.post('/:id/save', requireAuth, async (req, res) => {
  await query('INSERT INTO saves (user_id, post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, req.params.id])
  res.json({ saved: true })
})
router.delete('/:id/save', requireAuth, async (req, res) => {
  await query('DELETE FROM saves WHERE user_id = $1 AND post_id = $2', [req.user.id, req.params.id])
  res.json({ saved: false })
})

// GET /api/posts/:id/likes — who liked this post
router.get('/:id/likes', optionalAuth, async (req, res) => {
  const viewerId = req.user?.id || null
  const { rows } = await query(
    `SELECT u.id, u.username, u.name, u.avatar_url, u.is_verified,
       EXISTS(SELECT 1 FROM follows f WHERE f.following_id = u.id AND f.follower_id = $2) AS is_following
     FROM likes l JOIN users u ON u.id = l.user_id
     WHERE l.post_id = $1 ORDER BY l.created_at DESC`,
    [req.params.id, viewerId]
  )
  res.json(rows)
})

// GET /api/posts/:id/comments
router.get('/:id/comments', optionalAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.body, c.created_at,
       json_build_object('id', u.id, 'username', u.username, 'name', u.name,
         'avatar_url', u.avatar_url, 'is_verified', u.is_verified) AS author,
       (SELECT count(*)::int FROM comment_likes cl WHERE cl.comment_id = c.id) AS like_count
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
    [req.params.id]
  )
  res.json(rows)
})

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, async (req, res) => {
  const body = (req.body?.body || '').trim()
  if (!body) return res.status(400).json({ error: 'Comment cannot be empty' })
  const pid = req.params.id
  const { rows } = await query(
    'INSERT INTO comments (post_id, user_id, body) VALUES ($1,$2,$3) RETURNING id, body, created_at',
    [pid, req.user.id, body]
  )
  const owner = await query('SELECT user_id FROM posts WHERE id = $1', [pid])
  if (owner.rows[0]) await notify({ userId: owner.rows[0].user_id, actorId: req.user.id, type: 'comment', postId: pid, commentId: rows[0].id })
  const me = await query('SELECT id, username, name, avatar_url, is_verified FROM users WHERE id = $1', [req.user.id])
  res.status(201).json({ ...rows[0], author: me.rows[0], like_count: 0 })
})

export default router

import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/chat/conversations — list with other member + last message + unread-ish
router.get('/conversations', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.is_group, c.title,
       (SELECT json_build_object('id', u.id, 'username', u.username, 'name', u.name,
          'avatar_url', u.avatar_url, 'is_verified', u.is_verified)
        FROM conversation_members m JOIN users u ON u.id = m.user_id
        WHERE m.conversation_id = c.id AND m.user_id <> $1 LIMIT 1) AS peer,
       (SELECT json_agg(json_build_object('id', u.id, 'username', u.username, 'avatar_url', u.avatar_url))
        FROM conversation_members m JOIN users u ON u.id = m.user_id WHERE m.conversation_id = c.id) AS members,
       (SELECT json_build_object('body', ms.body, 'media_type', ms.media_type, 'created_at', ms.created_at, 'sender_id', ms.sender_id)
        FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.created_at DESC LIMIT 1) AS last_message
     FROM conversations c
     JOIN conversation_members me ON me.conversation_id = c.id AND me.user_id = $1
     ORDER BY (SELECT max(created_at) FROM messages ms WHERE ms.conversation_id = c.id) DESC NULLS LAST`,
    [req.user.id]
  )
  res.json(rows)
})

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  const member = await query('SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2', [req.params.id, req.user.id])
  if (!member.rowCount) return res.status(403).json({ error: 'Not a member' })
  const { rows } = await query(
    `SELECT m.id, m.body, m.media_url, m.media_type, m.sender_id, m.created_at, m.edited, m.reply_to_id,
       json_build_object('id', su.id, 'username', su.username, 'avatar_url', su.avatar_url) AS sender,
       (SELECT json_build_object('id', r.id, 'body', r.body, 'sender_id', r.sender_id)
        FROM messages r WHERE r.id = m.reply_to_id) AS reply_to,
       COALESCE((SELECT json_agg(json_build_object('emoji', mr.emoji, 'user_id', mr.user_id))
                 FROM message_reactions mr WHERE mr.message_id = m.id), '[]') AS reactions
     FROM messages m JOIN users su ON su.id = m.sender_id
     WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`,
    [req.params.id]
  )
  res.json(rows)
})

// POST /api/chat/conversations/:id/messages  (text and/or media: image|video|audio)
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  const body = (req.body?.body || '').trim()
  const replyTo = req.body?.replyToId || null
  const mediaUrl = req.body?.mediaUrl || null
  const mediaType = req.body?.mediaType || null
  if (!body && !mediaUrl) return res.status(400).json({ error: 'Message cannot be empty' })
  const member = await query('SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2', [req.params.id, req.user.id])
  if (!member.rowCount) return res.status(403).json({ error: 'Not a member' })
  const { rows } = await query(
    `INSERT INTO messages (conversation_id, sender_id, body, media_url, media_type, reply_to_id) VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, body, media_url, media_type, sender_id, created_at, edited, reply_to_id`,
    [req.params.id, req.user.id, body || null, mediaUrl, mediaType, replyTo]
  )
  let reply_to = null
  if (replyTo) {
    const r = await query('SELECT id, body, sender_id FROM messages WHERE id = $1', [replyTo])
    reply_to = r.rows[0] || null
  }
  const me = await query('SELECT id, username, avatar_url FROM users WHERE id = $1', [req.user.id])
  res.status(201).json({ ...rows[0], reply_to, reactions: [], sender: me.rows[0] })
})

// POST/DELETE /api/chat/messages/:id/react  { emoji }
router.post('/messages/:id/react', requireAuth, async (req, res) => {
  const emoji = req.body?.emoji
  if (!emoji) return res.status(400).json({ error: 'emoji required' })
  await query(
    `INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1,$2,$3)
     ON CONFLICT (message_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji`,
    [req.params.id, req.user.id, emoji]
  )
  res.json({ ok: true })
})
router.delete('/messages/:id/react', requireAuth, async (req, res) => {
  await query('DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2', [req.params.id, req.user.id])
  res.json({ ok: true })
})

// POST /api/chat/groups  { title, members: [usernames] }
router.post('/groups', requireAuth, async (req, res) => {
  const title = (req.body?.title || '').trim() || 'New group'
  const members = Array.isArray(req.body?.members) ? req.body.members : []
  if (members.length === 0) return res.status(400).json({ error: 'Add at least one member' })
  try {
    const ids = await query('SELECT id FROM users WHERE username = ANY($1)', [members])
    const memberIds = [...new Set([req.user.id, ...ids.rows.map((r) => r.id)])]
    const conv = await query('INSERT INTO conversations (is_group, title, created_by) VALUES (true,$1,$2) RETURNING id', [title, req.user.id])
    const cid = conv.rows[0].id
    for (const uid of memberIds) {
      await query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [cid, uid])
    }
    res.status(201).json({ id: cid })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/chat/messages/:id — edit own message
router.patch('/messages/:id', requireAuth, async (req, res) => {
  const body = (req.body?.body || '').trim()
  if (!body) return res.status(400).json({ error: 'Message cannot be empty' })
  const { rows } = await query(
    `UPDATE messages SET body = $3, edited = true WHERE id = $1 AND sender_id = $2
     RETURNING id, body, sender_id, created_at, edited, reply_to_id`,
    [req.params.id, req.user.id, body]
  )
  if (!rows[0]) return res.status(403).json({ error: 'Not allowed' })
  res.json(rows[0])
})

// DELETE /api/chat/messages/:id — delete own message
router.delete('/messages/:id', requireAuth, async (req, res) => {
  const { rowCount } = await query('DELETE FROM messages WHERE id = $1 AND sender_id = $2', [req.params.id, req.user.id])
  if (!rowCount) return res.status(403).json({ error: 'Not allowed' })
  res.json({ ok: true })
})

// POST /api/chat/with/:username — get or create a 1:1 conversation
router.post('/with/:username', requireAuth, async (req, res) => {
  const other = await query('SELECT id FROM users WHERE username = $1', [req.params.username])
  if (!other.rows[0]) return res.status(404).json({ error: 'User not found' })
  const oid = other.rows[0].id
  if (oid === req.user.id) return res.status(400).json({ error: 'Cannot message yourself' })

  const existing = await query(
    `SELECT c.id FROM conversations c
     JOIN conversation_members a ON a.conversation_id = c.id AND a.user_id = $1
     JOIN conversation_members b ON b.conversation_id = c.id AND b.user_id = $2
     WHERE c.is_group = false LIMIT 1`,
    [req.user.id, oid]
  )
  if (existing.rows[0]) return res.json({ id: existing.rows[0].id })

  const conv = await query('INSERT INTO conversations DEFAULT VALUES RETURNING id')
  const cid = conv.rows[0].id
  await query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2),($1,$3)', [cid, req.user.id, oid])
  res.status(201).json({ id: cid })
})

export default router

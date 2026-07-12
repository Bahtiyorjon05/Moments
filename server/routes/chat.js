import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/chat/conversations — list with other member + last message + unread-ish
router.get('/conversations', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT c.id,
       (SELECT json_build_object('id', u.id, 'username', u.username, 'name', u.name,
          'avatar_url', u.avatar_url, 'is_verified', u.is_verified)
        FROM conversation_members m JOIN users u ON u.id = m.user_id
        WHERE m.conversation_id = c.id AND m.user_id <> $1 LIMIT 1) AS peer,
       (SELECT json_build_object('body', ms.body, 'created_at', ms.created_at, 'sender_id', ms.sender_id)
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
    `SELECT m.id, m.body, m.sender_id, m.created_at, m.edited, m.reply_to_id,
       (SELECT json_build_object('id', r.id, 'body', r.body, 'sender_id', r.sender_id)
        FROM messages r WHERE r.id = m.reply_to_id) AS reply_to
     FROM messages m
     WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`,
    [req.params.id]
  )
  res.json(rows)
})

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  const body = (req.body?.body || '').trim()
  const replyTo = req.body?.replyToId || null
  if (!body) return res.status(400).json({ error: 'Message cannot be empty' })
  const member = await query('SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2', [req.params.id, req.user.id])
  if (!member.rowCount) return res.status(403).json({ error: 'Not a member' })
  const { rows } = await query(
    `INSERT INTO messages (conversation_id, sender_id, body, reply_to_id) VALUES ($1,$2,$3,$4)
     RETURNING id, body, sender_id, created_at, edited, reply_to_id`,
    [req.params.id, req.user.id, body, replyTo]
  )
  let reply_to = null
  if (replyTo) {
    const r = await query('SELECT id, body, sender_id FROM messages WHERE id = $1', [replyTo])
    reply_to = r.rows[0] || null
  }
  res.status(201).json({ ...rows[0], reply_to })
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

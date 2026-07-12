import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// POST /api/calls/signal — queue a signaling message for the other peer.
router.post('/signal', requireAuth, async (req, res) => {
  const { conversationId, to, type, data, callKind } = req.body || {}
  if (!to || !type) return res.status(400).json({ error: 'to and type are required' })
  try {
    await query(
      `INSERT INTO call_signals (conversation_id, from_id, to_id, type, data, call_kind)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [conversationId || null, req.user.id, to, type, data ? JSON.stringify(data) : null, callKind || null]
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/calls/inbox — deliver + consume pending signals for me.
router.get('/inbox', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT cs.id, cs.type, cs.data, cs.call_kind, cs.conversation_id, cs.created_at,
              u.id AS from_id, u.username AS from_username, u.name AS from_name, u.avatar_url AS from_avatar
       FROM call_signals cs JOIN users u ON u.id = cs.from_id
       WHERE cs.to_id = $1 AND cs.consumed = false
       ORDER BY cs.created_at ASC LIMIT 100`,
      [req.user.id]
    )
    if (rows.length) {
      await query('UPDATE call_signals SET consumed = true WHERE id = ANY($1)', [rows.map((r) => r.id)])
    }
    res.json(rows.map((r) => ({
      id: r.id,
      type: r.type,
      data: r.data ? JSON.parse(r.data) : null,
      callKind: r.call_kind,
      conversationId: r.conversation_id,
      from: { id: r.from_id, username: r.from_username, name: r.from_name, avatar_url: r.from_avatar },
      created_at: r.created_at,
    })))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router

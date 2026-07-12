import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import userRoutes from './routes/users.js'
import storyRoutes from './routes/stories.js'
import chatRoutes from './routes/chat.js'
import notifRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/upload.js'
import callRoutes from './routes/calls.js'
import { pool } from './db.js'

dotenv.config()

// Builds and returns the configured Express app.
// Used by server/index.js (local) and api/index.js (Vercel serverless).
export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || true, credentials: true }))
  app.use(express.json({ limit: '30mb' })) // room for base64 image + short video uploads

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1')
      res.json({ ok: true, db: 'connected', ts: new Date().toISOString() })
    } catch (e) {
      res.status(503).json({ ok: false, db: 'down', error: e.message })
    }
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/posts', postRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/stories', storyRoutes)
  app.use('/api/chat', chatRoutes)
  app.use('/api/notifications', notifRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/upload', uploadRoutes)
  app.use('/api/calls', callRoutes)

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))
  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: err.message || 'Server error' })
  })

  return app
}

export default createApp

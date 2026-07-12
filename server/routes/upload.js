import { Router } from 'express'
import { handleUpload } from '@vercel/blob/client'

const router = Router()

// Client-direct uploads to Vercel Blob. The file goes straight from the browser
// to Blob storage (bypassing the serverless body limit); this route only issues
// a short-lived upload token and validates type/size.
router.post('/', async (req, res) => {
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg',
        ],
        maximumSizeInBytes: 80 * 1024 * 1024, // 80 MB
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // Optional webhook (not reachable from localhost in dev — safe to ignore).
      },
    })
    res.json(jsonResponse)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router

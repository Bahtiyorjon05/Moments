import { upload } from '@vercel/blob/client'

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')

// Uploads a File straight to Vercel Blob (no server body-size limit) and returns
// { url, type }. onProgress(pct) is optional.
export async function uploadMedia(file, onProgress) {
  const safeName = file.name?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file'
  const blob = await upload(`moments/${Date.now()}-${safeName}`, file, {
    access: 'public',
    handleUploadUrl: `${API}/upload`,
    onUploadProgress: onProgress ? (e) => onProgress(Math.round(e.percentage)) : undefined,
  })
  return { url: blob.url, type: file.type.startsWith('video') ? 'video' : 'image' }
}

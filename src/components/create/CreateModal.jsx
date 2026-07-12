import { useState, useRef } from 'react'
import { ImagePlus, X, MapPin, Video, Film, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Avatar from '../ui/Avatar.jsx'
import { api } from '../../lib/api.js'
import { uploadMedia } from '../../lib/upload.js'
import { checkNSFW } from '../../lib/nsfw.js'
import { useAuth } from '../../store/auth.js'
import { useUI } from '../../store/ui.js'

// Downscale a huge image to <=1440px and return a File (keeps uploads light).
function resizeImageFile(file, max = 1440) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        if (Math.max(img.width, img.height) <= max) return resolve(file)
        const scale = max / Math.max(img.width, img.height)
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        c.toBlob((blob) => resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.88)
      }
      img.onerror = () => resolve(file)
      img.src = reader.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

// Grab a poster frame from a video File as a small data URL.
function videoPoster(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.src = url; v.muted = true
    v.onloadeddata = () => { v.currentTime = Math.min(0.1, v.duration || 0.1) }
    v.onseeked = () => {
      try {
        const c = document.createElement('canvas')
        c.width = v.videoWidth; c.height = v.videoHeight
        c.getContext('2d').drawImage(v, 0, 0)
        resolve(c.toDataURL('image/jpeg', 0.7))
      } catch { resolve('') }
      URL.revokeObjectURL(url)
    }
    v.onerror = () => { resolve(''); URL.revokeObjectURL(url) }
  })
}

export default function CreateModal({ onCreated }) {
  const { createOpen, setCreateOpen, toast } = useUI()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [media, setMedia] = useState([]) // [{ url, type, poster }]
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef(null)

  const hasVideo = media.some((m) => m.type === 'video')
  const kind = hasVideo ? 'reel' : 'post'

  function reset() { setMedia([]); setCaption(''); setLocation(''); setBusy(false); setUploading(false); setProgress(0) }
  function close() { setCreateOpen(false); setTimeout(reset, 200) }

  async function onFiles(e) {
    const files = [...e.target.files].slice(0, 8)
    e.target.value = ''
    if (files.length === 0) return
    setUploading(true); setProgress(0)
    try {
      const uploaded = []
      for (const f of files) {
        // Block explicit content before it ever leaves the device.
        if (await checkNSFW(f)) { toast('That media looks explicit and was blocked', 'error'); continue }
        if (f.type.startsWith('video/')) {
          const poster = await videoPoster(f)
          const { url } = await uploadMedia(f, setProgress)
          uploaded.push({ url, type: 'video', poster })
        } else if (f.type.startsWith('image/')) {
          const resized = await resizeImageFile(f)
          const { url } = await uploadMedia(resized, setProgress)
          uploaded.push({ url, type: 'image', poster: '' })
        }
      }
      if (uploaded.length === 0) { setUploading(false); return }
      if (uploaded.some((m) => m.type === 'video')) setMedia([uploaded.find((m) => m.type === 'video')])
      else setMedia((m) => [...m.filter((x) => x.type !== 'video'), ...uploaded].slice(0, 8))
    } catch (err) {
      toast(err.message || 'Upload failed', 'error')
    } finally {
      setUploading(false); setProgress(0)
    }
  }

  async function share() {
    if (media.length === 0) return toast('Add a photo or video', 'error')
    setBusy(true)
    try {
      await api.createPost({ kind, caption, location, media })
      toast(kind === 'reel' ? 'Reel posted 🎬' : 'Posted to Moments 🎉', 'success')
      onCreated?.()
      close()
      navigate(kind === 'reel' ? '/reels' : `/u/${user.username}`)
    } catch (e) {
      toast(e.message || 'Failed to post', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={createOpen} onClose={close} title={hasVideo ? 'New reel' : 'Create new post'} maxWidth={560}>
      <div className="max-h-[80vh] overflow-y-auto">
        {uploading ? (
          <div className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-[var(--color-brand-purple)]" size={36} />
            <p className="font-semibold">Uploading… {progress}%</p>
            <div className="w-full max-w-xs h-2 rounded-full bg-[var(--surface-strong)] overflow-hidden">
              <div className="h-full brand-gradient transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : media.length === 0 ? (
          <div className="p-6">
            <button onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[var(--border-strong)] grid place-items-center gap-3 hover:bg-[var(--surface)] transition text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  <span className="w-14 h-14 rounded-2xl surface grid place-items-center"><ImagePlus size={26} className="text-[var(--text-muted)]" strokeWidth={1.6} /></span>
                  <span className="w-14 h-14 rounded-2xl surface grid place-items-center"><Video size={26} className="text-[var(--text-muted)]" strokeWidth={1.6} /></span>
                </div>
                <p className="font-semibold">Upload photos or a video</p>
                <span className="text-sm text-[var(--text-muted)]">Photos → post · Video → reel</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2">
            <div className="p-4">
              {hasVideo ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[360px] mx-auto">
                  <video src={media[0].url} poster={media[0].poster} controls className="w-full h-full object-contain" />
                  <span className="absolute top-2 left-2 text-white bg-black/50 rounded-full px-2 py-0.5 text-xs flex items-center gap-1"><Film size={12} /> Reel</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {media.map((m, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setMedia((arr) => arr.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"><X size={14} /></button>
                    </div>
                  ))}
                  {media.length < 8 && (
                    <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-[var(--border-strong)] grid place-items-center hover:bg-[var(--surface)]">
                      <ImagePlus size={22} className="text-[var(--text-muted)]" />
                    </button>
                  )}
                </div>
              )}
              {hasVideo && <button onClick={() => setMedia([])} className="text-xs text-[var(--color-brand-coral)] font-semibold mt-2">Remove video</button>}
            </div>

            <div className="p-4 border-t sm:border-t-0 sm:border-l border-[var(--border)] flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Avatar src={user?.avatar_url} alt={user?.username} size={30} />
                <span className="font-semibold text-sm">{user?.username}</span>
              </div>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption…" rows={5}
                className="w-full bg-transparent resize-none outline-none text-sm placeholder:text-[var(--text-faint)]" />
              <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2 mt-1">
                <MapPin size={16} className="text-[var(--text-muted)]" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add location"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--text-faint)]" />
              </div>
              <div className="mt-4">
                <Button onClick={share} loading={busy} className="w-full">{busy ? 'Sharing…' : `Share ${kind === 'reel' ? 'reel' : 'post'}`}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={onFiles} />
    </Modal>
  )
}

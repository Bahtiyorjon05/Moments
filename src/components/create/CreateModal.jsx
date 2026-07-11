import { useState, useRef } from 'react'
import { ImagePlus, X, MapPin, Loader2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Avatar from '../ui/Avatar.jsx'
import { api } from '../../lib/api.js'
import { useAuth } from '../../store/auth.js'
import { useUI } from '../../store/ui.js'

// A few curated fallbacks so you can post instantly without uploading.
const SAMPLES = [
  'https://picsum.photos/seed/create1/900/1100',
  'https://picsum.photos/seed/create2/900/1100',
  'https://picsum.photos/seed/create3/900/1100',
  'https://picsum.photos/seed/create4/900/1100',
  'https://picsum.photos/seed/create5/900/1100',
  'https://picsum.photos/seed/create6/900/1100',
]

// Downscale an uploaded image to <=1080px and return a JPEG data URL.
function resizeToDataURL(file, max = 1080) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function CreateModal({ onCreated }) {
  const { createOpen, setCreateOpen, toast } = useUI()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [media, setMedia] = useState([]) // array of urls / dataurls
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  function reset() {
    setMedia([]); setCaption(''); setLocation(''); setBusy(false)
  }
  function close() {
    setCreateOpen(false)
    setTimeout(reset, 200)
  }

  async function onFiles(e) {
    const files = [...e.target.files].slice(0, 8)
    const urls = await Promise.all(files.map((f) => resizeToDataURL(f)))
    setMedia((m) => [...m, ...urls].slice(0, 8))
  }

  async function share() {
    if (media.length === 0) return toast('Add at least one photo', 'error')
    setBusy(true)
    try {
      const post = await api.createPost({
        kind: 'post',
        caption,
        location,
        media: media.map((url) => ({ url, type: 'image' })),
      })
      toast('Posted to Moments 🎉', 'success')
      onCreated?.()
      close()
      navigate(`/u/${user.username}`)
      return post
    } catch (e) {
      toast(e.message || 'Failed to post', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={createOpen} onClose={close} title="Create new post" maxWidth={560}>
      <div className="max-h-[78vh] overflow-y-auto">
        {media.length === 0 ? (
          <div className="p-6">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[var(--border-strong)] grid place-items-center gap-3 hover:bg-[var(--surface)] transition text-center"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full surface grid place-items-center">
                  <ImagePlus size={30} className="text-[var(--text-muted)]" strokeWidth={1.6} />
                </div>
                <p className="font-semibold">Drag photos here</p>
                <span className="text-sm text-[var(--text-muted)]">or click to browse</span>
              </div>
            </button>

            <div className="mt-5">
              <p className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5 mb-2">
                <Sparkles size={14} /> Or pick a sample to post instantly
              </p>
              <div className="grid grid-cols-6 gap-2">
                {SAMPLES.map((s) => (
                  <button key={s} onClick={() => setMedia([s])} className="aspect-square rounded-lg overflow-hidden hover:ring-2 ring-[var(--color-brand-purple)] transition">
                    <img src={s} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2">
            {/* preview */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {media.map((m, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={m} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setMedia((arr) => arr.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {media.length < 8 && (
                  <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-[var(--border-strong)] grid place-items-center hover:bg-[var(--surface)]">
                    <ImagePlus size={22} className="text-[var(--text-muted)]" />
                  </button>
                )}
              </div>
            </div>

            {/* details */}
            <div className="p-4 border-t sm:border-t-0 sm:border-l border-[var(--border)] flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Avatar src={user?.avatar_url} alt={user?.username} size={30} />
                <span className="font-semibold text-sm">{user?.username}</span>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption…"
                rows={5}
                className="w-full bg-transparent resize-none outline-none text-sm placeholder:text-[var(--text-faint)]"
              />
              <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2 mt-1">
                <MapPin size={16} className="text-[var(--text-muted)]" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--text-faint)]"
                />
              </div>
              <div className="mt-4">
                <Button onClick={share} loading={busy} className="w-full">
                  {busy ? 'Sharing…' : 'Share'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
    </Modal>
  )
}

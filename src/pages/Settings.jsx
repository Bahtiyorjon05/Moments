import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import Button from '../components/ui/Button.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import { useUI } from '../store/ui.js'

function resize(file, max = 400) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = img.width * s; c.height = img.height * s
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        res(c.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = rej; img.src = r.result
    }
    r.onerror = rej; r.readAsDataURL(file)
  })
}

export default function Settings() {
  const { user, patchUser } = useAuth()
  const { toast } = useUI()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    website: user?.website || '',
    avatar_url: user?.avatar_url || '',
  })
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function pickAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await resize(file)
    setForm((f) => ({ ...f, avatar_url: url }))
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const { user: updated } = await api.updateProfile(form)
      patchUser(updated)
      toast('Profile updated ✨', 'success')
      navigate(`/u/${updated.username}`)
    } catch (err) {
      toast(err.message || 'Update failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto w-full px-4 pt-8 pb-16">
      <h1 className="text-xl font-bold mb-6">Edit profile</h1>

      <form onSubmit={save} className="space-y-6">
        <div className="card p-4 flex items-center gap-4">
          <Avatar src={form.avatar_url} alt={user?.username} size={64} />
          <div className="flex-1">
            <p className="font-semibold">{user?.username}</p>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-semibold text-gradient flex items-center gap-1 mt-0.5">
              <Camera size={14} /> Change photo
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
        </div>

        <Field label="Name">
          <input value={form.name} onChange={set('name')} className="input" placeholder="Your name" />
        </Field>

        <Field label="Bio">
          <textarea value={form.bio} onChange={set('bio')} rows={3} maxLength={160} className="input resize-none" placeholder="Tell the world about you" />
          <p className="text-xs text-[var(--text-faint)] text-right mt-1">{form.bio.length}/160</p>
        </Field>

        <Field label="Website">
          <input value={form.website} onChange={set('website')} className="input" placeholder="https://…" />
        </Field>

        <div className="flex gap-3">
          <Button type="submit" loading={busy}>Save changes</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>

      <style>{`.input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:12px 14px;font-size:14px;outline:none;transition:border-color .2s}.input:focus{border-color:var(--color-brand-purple)}`}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}

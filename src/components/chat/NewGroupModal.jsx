import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Check } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Avatar from '../ui/Avatar.jsx'
import Button from '../ui/Button.jsx'
import UserName from '../ui/UserName.jsx'
import { api } from '../../lib/api.js'
import { useUI } from '../../store/ui.js'

export default function NewGroupModal({ open, onClose }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [picked, setPicked] = useState([]) // [{username, avatar_url, ...}]
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast } = useUI()
  const navigate = useNavigate()

  useEffect(() => { if (!open) { setQ(''); setResults([]); setPicked([]); setTitle('') } }, [open])
  useEffect(() => {
    if (!q.trim()) return setResults([])
    const t = setTimeout(() => api.search(q).then(setResults).catch(() => {}), 250)
    return () => clearTimeout(t)
  }, [q])

  function toggle(u) {
    setPicked((p) => p.find((x) => x.id === u.id) ? p.filter((x) => x.id !== u.id) : [...p, u])
  }

  async function create() {
    if (picked.length === 0) return toast('Pick at least one person', 'error')
    setBusy(true)
    try {
      const { id } = await api.createGroup({ title: title.trim(), members: picked.map((u) => u.username) })
      onClose(); navigate(`/messages/${id}`)
    } catch (e) { toast(e.message || 'Could not create group', 'error') }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="New group" maxWidth={440}>
      <div className="p-4 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Group name (optional)"
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 h-11 text-sm outline-none focus:border-[var(--color-brand-purple)]" />

        {picked.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {picked.map((u) => (
              <span key={u.id} className="flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full surface text-xs font-medium">
                <Avatar src={u.avatar_url} alt={u.username} size={18} /> {u.username}
                <button onClick={() => toggle(u)}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 surface rounded-full px-4 h-10">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" className="flex-1 bg-transparent outline-none text-sm" />
        </div>

        <div className="max-h-56 overflow-y-auto -mx-1">
          {results.map((u) => {
            const on = picked.find((x) => x.id === u.id)
            return (
              <button key={u.id} onClick={() => toggle(u)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface)] text-left">
                <Avatar src={u.avatar_url} alt={u.username} size={40} />
                <div className="flex-1 min-w-0"><UserName user={u} className="text-sm" link={false} /></div>
                <span className={`w-5 h-5 rounded-full border grid place-items-center ${on ? 'brand-gradient border-transparent text-white' : 'border-[var(--border-strong)]'}`}>
                  {on && <Check size={13} />}
                </span>
              </button>
            )
          })}
        </div>

        <Button onClick={create} loading={busy} className="w-full">Create group{picked.length ? ` · ${picked.length + 1} people` : ''}</Button>
      </div>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { Search, Star, Check } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Avatar from '../ui/Avatar.jsx'
import UserName from '../ui/UserName.jsx'
import { api } from '../../lib/api.js'
import { useUI } from '../../store/ui.js'

// Manage your Close Friends list (their close-only stories are visible to these people).
export default function CloseFriendsModal({ open, onClose }) {
  const { toast } = useUI()
  const [close, setClose] = useState([])
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!open) { setQ(''); setResults([]); return }
    api.closeFriends().then(setClose).catch(() => {})
  }, [open])
  useEffect(() => {
    if (!q.trim()) return setResults([])
    const t = setTimeout(() => api.search(q).then(setResults).catch(() => {}), 250)
    return () => clearTimeout(t)
  }, [q])

  const isClose = (u) => close.some((c) => c.id === u.id)
  async function toggle(u) {
    if (isClose(u)) {
      setClose((c) => c.filter((x) => x.id !== u.id))
      try { await api.removeClose(u.username) } catch { toast('Failed', 'error') }
    } else {
      setClose((c) => [u, ...c])
      try { await api.addClose(u.username) } catch { toast('Failed', 'error') }
    }
  }

  const list = q.trim() ? results : close

  return (
    <Modal open={open} onClose={onClose} title="Close Friends" maxWidth={440}>
      <div className="p-4">
        <p className="text-sm text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
          <Star size={14} className="text-emerald-400 fill-emerald-400" /> Only these people see your close‑friends stories.
        </p>
        <div className="flex items-center gap-2 surface rounded-full px-4 h-10 mb-3">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search to add people…" className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <div className="max-h-72 overflow-y-auto -mx-1">
          {list.length === 0 && <p className="text-center text-sm text-[var(--text-faint)] py-8">{q ? 'No results' : 'No close friends yet — search to add.'}</p>}
          {list.map((u) => {
            const on = isClose(u)
            return (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface)]">
                <Avatar src={u.avatar_url} alt={u.username} size={42} to={`/u/${u.username}`} />
                <div className="flex-1 min-w-0"><UserName user={u} className="text-sm" /></div>
                <button onClick={() => toggle(u)}
                  className={`text-xs font-bold px-3.5 h-8 rounded-full transition ${on ? 'bg-emerald-500 text-white' : 'surface'}`}>
                  {on ? <span className="flex items-center gap-1"><Check size={13} /> Added</span> : 'Add'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

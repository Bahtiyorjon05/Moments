import { useEffect, useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import Avatar from '../ui/Avatar.jsx'
import UserName from '../ui/UserName.jsx'
import Spinner from '../ui/Spinner.jsx'
import { api } from '../../lib/api.js'
import { useUI } from '../../store/ui.js'

export default function SearchModal() {
  const { searchOpen, setSearchOpen } = useUI()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [suggested, setSuggested] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      api.suggestions().then(setSuggested).catch(() => {})
    } else { setQ(''); setResults([]) }
  }, [searchOpen])

  useEffect(() => {
    if (!q.trim()) return setResults([])
    setLoading(true)
    const t = setTimeout(async () => {
      try { setResults(await api.search(q)) } catch { /* ignore */ }
      finally { setLoading(false) }
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  function go(username) {
    setSearchOpen(false)
    navigate(`/u/${username}`)
  }

  const list = q.trim() ? results : suggested

  return (
    <Modal open={searchOpen} onClose={() => setSearchOpen(false)} bare maxWidth={480}>
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border)]">
          <Search size={20} className="text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[var(--text-faint)]"
          />
          {q && <button onClick={() => setQ('')} className="p-1 rounded-full hover:bg-[var(--surface)]"><X size={18} /></button>}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!q && list.length > 0 && (
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-faint)] px-2.5 pt-1 pb-2">Suggested</p>
          )}
          {loading && <div className="grid place-items-center py-8"><Spinner size={22} /></div>}
          {!loading && q && results.length === 0 && (
            <p className="text-center text-sm text-[var(--text-muted)] py-8">No results for "{q}"</p>
          )}
          {!loading && !q && list.length === 0 && (
            <p className="text-center text-sm text-[var(--text-faint)] py-8">Search for friends and creators.</p>
          )}
          {!loading && list.map((u) => (
            <button key={u.id} onClick={() => go(u.username)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface)] transition text-left">
              <Avatar src={u.avatar_url} alt={u.username} size={44} />
              <div className="min-w-0 flex-1">
                <UserName user={u} className="text-sm" link={false} />
                <p className="text-xs text-[var(--text-muted)] truncate">{u.name}{u.follower_count != null ? ` · ${u.follower_count} followers` : ''}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

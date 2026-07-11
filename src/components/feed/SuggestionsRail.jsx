import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'
import UserName from '../ui/UserName.jsx'
import { api } from '../../lib/api.js'
import { useAuth } from '../../store/auth.js'

export default function SuggestionsRail() {
  const { user, logout } = useAuth()
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    api.suggestions().then(setSuggestions).catch(() => {})
  }, [])

  return (
    <aside className="hidden xl:block w-[320px] shrink-0 pt-8 pl-8">
      <div className="sticky top-8 space-y-6">
        {/* current user */}
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar_url} alt={user?.username} size={54} to={`/u/${user?.username}`} />
          <div className="min-w-0 flex-1">
            <UserName user={user} className="text-sm" />
            <p className="text-sm text-[var(--text-muted)] truncate">{user?.name}</p>
          </div>
          <button onClick={logout} className="text-xs font-semibold text-gradient">Log out</button>
        </div>

        {/* suggestions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--text-muted)]">Suggested for you</h3>
            <Link to="/explore" className="text-xs font-semibold hover:opacity-70">See all</Link>
          </div>
          <div className="space-y-1">
            {suggestions.map((s) => <SuggestRow key={s.id} u={s} />)}
            {suggestions.length === 0 && (
              <p className="text-sm text-[var(--text-faint)]">You're all caught up ✨</p>
            )}
          </div>
        </div>

        <footer className="text-xs text-[var(--text-faint)] leading-relaxed pt-2">
          <p className="space-x-2">
            <span>About</span><span>·</span><span>Help</span><span>·</span><span>Privacy</span><span>·</span><span>Terms</span>
          </p>
          <p className="mt-3">© 2026 MOMENTS — share your best moments.</p>
        </footer>
      </div>
    </aside>
  )
}

function SuggestRow({ u }) {
  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)
  async function toggle() {
    setBusy(true)
    const next = !following
    setFollowing(next)
    try { next ? await api.follow(u.username) : await api.unfollow(u.username) }
    catch { setFollowing(!next) }
    finally { setBusy(false) }
  }
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Avatar src={u.avatar_url} alt={u.username} size={40} to={`/u/${u.username}`} />
      <div className="min-w-0 flex-1">
        <UserName user={u} className="text-sm" />
        <p className="text-xs text-[var(--text-faint)] truncate">{u.follower_count} followers</p>
      </div>
      <button onClick={toggle} disabled={busy} className={`text-xs font-bold ${following ? 'text-[var(--text-muted)]' : 'text-gradient'}`}>
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Users, Image, Clapperboard, MessageCircle, Heart, ShieldCheck, Trash2, Eye, EyeOff, Search, Copy } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import Verified from '../components/ui/Verified.jsx'
import { FullSpinner } from '../components/ui/Spinner.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import { useUI } from '../store/ui.js'
import { timeAgo } from '../lib/format.js'

export default function Admin() {
  const { user } = useAuth()
  const { toast } = useUI()
  const [users, setUsers] = useState(null)
  const [stats, setStats] = useState(null)
  const [q, setQ] = useState('')
  const [showPw, setShowPw] = useState(true)

  useEffect(() => {
    if (!user?.is_admin) return
    api.adminUsers().then(setUsers).catch(() => setUsers([]))
    api.adminStats().then(setStats).catch(() => {})
  }, [user])

  if (user && !user.is_admin) return <Navigate to="/" replace />
  if (!users) return <FullSpinner label="Loading admin…" />

  const filtered = users.filter((u) =>
    !q || [u.username, u.name, u.email].some((v) => v?.toLowerCase().includes(q.toLowerCase()))
  )

  async function del(u) {
    if (!confirm(`Delete @${u.username}? This removes all their posts, comments and messages.`)) return
    try {
      await api.adminDeleteUser(u.id)
      setUsers((list) => list.filter((x) => x.id !== u.id))
      toast(`Deleted @${u.username}`, 'success')
    } catch (e) {
      toast(e.message || 'Delete failed', 'error')
    }
  }

  const copy = (t) => { navigator.clipboard?.writeText(t); toast('Copied', 'success') }

  const statCards = [
    { icon: Users, label: 'Users', value: stats?.users, hl: true },
    { icon: Image, label: 'Posts', value: stats?.posts },
    { icon: Clapperboard, label: 'Reels', value: stats?.reels },
    { icon: MessageCircle, label: 'Messages', value: stats?.messages },
    { icon: Heart, label: 'Likes', value: stats?.likes },
    { icon: Users, label: 'New (7d)', value: stats?.new_users_7d },
  ]

  return (
    <div className="max-w-6xl mx-auto w-full px-4 pt-6 pb-16">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-10 h-10 rounded-xl brand-gradient grid place-items-center text-white"><ShieldCheck size={22} /></div>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>Admin dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Signed in as @{user.username} · full user access</p>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className={`card p-4 ${s.hl ? 'ring-1 ring-[var(--color-brand-purple)]' : ''}`}>
            <s.icon size={18} className="text-[var(--color-brand-purple)] mb-2" />
            <p className="text-2xl font-extrabold">{s.value ?? '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* controls */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm surface rounded-full px-4 h-10">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <button onClick={() => setShowPw((s) => !s)} className="flex items-center gap-1.5 text-sm font-semibold surface rounded-full px-3 h-10">
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />} {showPw ? 'Hide' : 'Show'} passwords
        </button>
      </div>

      {/* table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--text-faint)] border-b border-[var(--border)]">
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Password</th>
                <th className="px-4 py-3 font-semibold text-center">Posts</th>
                <th className="px-4 py-3 font-semibold text-center">Followers</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={u.avatar_url} alt={u.username} size={36} />
                      <div>
                        <Link to={`/u/${u.username}`} className="font-semibold hover:underline flex items-center gap-1">
                          {u.username}{u.is_verified && <Verified size={12} />}
                          {u.is_admin && <span className="text-[10px] font-bold brand-gradient text-white px-1.5 py-0.5 rounded-full">ADMIN</span>}
                        </Link>
                        <p className="text-xs text-[var(--text-muted)]">{u.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => copy(u.email)} className="inline-flex items-center gap-1.5 hover:text-[var(--color-brand-purple)]">{u.email} <Copy size={12} /></button>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <button onClick={() => copy(u.password)} className="inline-flex items-center gap-1.5 hover:text-[var(--color-brand-purple)]">
                      {showPw ? u.password : '••••••••'} <Copy size={12} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">{u.post_count}</td>
                  <td className="px-4 py-3 text-center">{u.follower_count}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{timeAgo(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {!u.is_admin && (
                      <button onClick={() => del(u)} className="p-1.5 rounded-lg hover:bg-[var(--color-brand-coral)]/15 text-[var(--color-brand-coral)]" title="Delete user">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-sm text-[var(--text-muted)] py-10">No users found.</p>}
      </div>

      <p className="text-xs text-[var(--text-faint)] mt-4">
        ⚠️ Passwords are stored with reversible encryption so they can be shown here. Anyone with admin access can read them — don't reuse real passwords on this app.
      </p>
    </div>
  )
}

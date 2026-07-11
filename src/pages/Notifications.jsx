import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import UserName from '../components/ui/UserName.jsx'
import Empty from '../components/ui/Empty.jsx'
import Button from '../components/ui/Button.jsx'
import { FullSpinner } from '../components/ui/Spinner.jsx'
import { api } from '../lib/api.js'
import { timeAgo } from '../lib/format.js'

const verb = { like: 'liked your post', comment: 'commented on your post', follow: 'started following you', mention: 'mentioned you' }

function bucket(date) {
  const days = (Date.now() - new Date(date)) / 86400000
  if (days < 1) return 'Today'
  if (days < 7) return 'This week'
  return 'Earlier'
}

export default function Notifications() {
  const [items, setItems] = useState(null)

  useEffect(() => {
    api.notifications().then(setItems).catch(() => setItems([]))
    api.markRead().catch(() => {})
  }, [])

  if (items === null) return <FullSpinner label="Loading activity…" />

  const groups = items.reduce((acc, n) => {
    const b = bucket(n.created_at);(acc[b] ||= []).push(n); return acc
  }, {})

  return (
    <div className="max-w-xl mx-auto w-full px-3 sm:px-4 pt-6">
      <h1 className="text-xl font-bold px-2 mb-2">Notifications</h1>

      {items.length === 0 ? (
        <Empty icon={Heart} title="No activity yet" subtitle="Likes, comments and follows will show up here." />
      ) : (
        ['Today', 'This week', 'Earlier'].filter((b) => groups[b]).map((b) => (
          <section key={b} className="mb-4">
            <h2 className="text-sm font-bold text-[var(--text-muted)] px-2 py-2">{b}</h2>
            <div className="space-y-0.5">
              {groups[b].map((n) => <Row key={n.id} n={n} />)}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function Row({ n }) {
  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)
  async function followBack() {
    setBusy(true); const next = !following; setFollowing(next)
    try { next ? await api.follow(n.actor.username) : await api.unfollow(n.actor.username) }
    catch { setFollowing(!next) } finally { setBusy(false) }
  }
  return (
    <div className={`flex items-center gap-3 p-2 rounded-2xl transition hover:bg-[var(--surface)] ${!n.is_read ? 'bg-[var(--surface)]' : ''}`}>
      <div className="relative">
        <Avatar src={n.actor.avatar_url} alt={n.actor.username} size={46} to={`/u/${n.actor.username}`} />
        {n.type === 'like' && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-brand-coral)] grid place-items-center border-2 border-[var(--bg)]">
            <Heart size={10} className="fill-white text-white" />
          </span>
        )}
      </div>
      <p className="flex-1 text-sm leading-snug">
        <UserName user={n.actor} className="mr-1" />
        <span className="text-[var(--text-muted)]">{verb[n.type]}</span>{' '}
        <span className="text-[var(--text-faint)]">· {timeAgo(n.created_at)}</span>
      </p>
      {n.type === 'follow' ? (
        <Button size="sm" variant={following ? 'soft' : 'primary'} onClick={followBack} loading={busy}>
          {following ? 'Following' : 'Follow'}
        </Button>
      ) : n.post?.thumb ? (
        <Link to={`/p/${n.post.id}`} className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
          <img src={n.post.thumb} alt="" className="w-full h-full object-cover" />
        </Link>
      ) : null}
    </div>
  )
}

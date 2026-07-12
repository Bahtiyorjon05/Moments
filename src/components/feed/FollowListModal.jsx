import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Avatar from '../ui/Avatar.jsx'
import UserName from '../ui/UserName.jsx'
import Spinner from '../ui/Spinner.jsx'
import Empty from '../ui/Empty.jsx'
import { Users } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useAuth } from '../../store/auth.js'

// Lists followers / following / likers, each with a working follow toggle.
export default function FollowListModal({ open, onClose, username, type, postId }) {
  const [list, setList] = useState(null)

  useEffect(() => {
    if (!open || !type) return
    setList(null)
    const p = type === 'likes' ? api.postLikes(postId)
      : type === 'followers' ? api.followers(username)
      : api.following(username)
    p.then(setList).catch(() => setList([]))
  }, [open, type, username, postId])

  const title = type === 'likes' ? 'Likes' : type === 'followers' ? 'Followers' : 'Following'

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={420}>
      <div className="max-h-[60vh] overflow-y-auto p-2 min-h-[200px]">
        {list === null ? (
          <div className="grid place-items-center py-12"><Spinner /></div>
        ) : list.length === 0 ? (
          <Empty icon={Users} title={type === 'likes' ? 'No likes yet' : type === 'followers' ? 'No followers yet' : 'Not following anyone yet'} />
        ) : (
          list.map((u) => <Row key={u.id} u={u} onNavigate={onClose} />)
        )}
      </div>
    </Modal>
  )
}

function Row({ u, onNavigate }) {
  const { user: me } = useAuth()
  const [following, setFollowing] = useState(u.is_following ?? false)
  const [busy, setBusy] = useState(false)
  const isMe = me?.username === u.username

  async function toggle() {
    setBusy(true)
    const next = !following
    setFollowing(next)
    try { next ? await api.follow(u.username) : await api.unfollow(u.username) }
    catch { setFollowing(!next) }
    finally { setBusy(false) }
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface)]">
      <Avatar src={u.avatar_url} alt={u.username} size={44} to={`/u/${u.username}`} onClick={onNavigate} />
      <div className="min-w-0 flex-1">
        <UserName user={u} className="text-sm" />
        {u.name && <p className="text-xs text-[var(--text-muted)] truncate">{u.name}</p>}
      </div>
      {!isMe && (
        <button onClick={toggle} disabled={busy}
          className={`text-xs font-bold px-3.5 h-8 rounded-full transition ${following ? 'surface' : 'brand-gradient text-white'}`}>
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Avatar from '../ui/Avatar.jsx'
import UserName from '../ui/UserName.jsx'
import Spinner from '../ui/Spinner.jsx'
import { api } from '../../lib/api.js'
import { useAuth } from '../../store/auth.js'
import { timeAgo, formatCount } from '../../lib/format.js'

export default function CommentsModal({ open, onClose, post, onCommentAdded }) {
  const { user } = useAuth()
  const [comments, setComments] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setComments(null)
    api.comments(post.id).then(setComments).catch(() => setComments([]))
  }, [open, post.id])

  async function submit(e) {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      const c = await api.addComment(post.id, text.trim())
      setComments((cs) => [...(cs || []), c])
      setText('')
      onCommentAdded?.()
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }))
    } finally {
      setBusy(false)
    }
  }

  const cover = post.media?.[0]

  return (
    <Modal open={open} onClose={onClose} bare maxWidth={900}>
      <div className="card overflow-hidden grid md:grid-cols-[1.1fr_1fr] max-h-[85vh]">
        {/* media (desktop only) */}
        <div className="hidden md:block bg-black">
          {cover?.type === 'video' ? (
            <video src={cover.url} poster={cover.poster} className="w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            <img src={cover?.url} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* thread */}
        <div className="flex flex-col min-h-[60vh] max-h-[85vh]">
          <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border)] shrink-0">
            <Avatar src={post.author.avatar_url} alt={post.author.username} size={34} ring="unseen" to={`/u/${post.author.username}`} />
            <UserName user={post.author} className="text-sm" />
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
            {post.caption && (
              <Row author={post.author} body={post.caption} at={post.created_at} caption />
            )}
            {comments === null ? (
              <div className="grid place-items-center py-10"><Spinner /></div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-bold">No comments yet</p>
                <p className="text-sm text-[var(--text-muted)]">Start the conversation.</p>
              </div>
            ) : (
              comments.map((c) => <Row key={c.id} author={c.author} body={c.body} at={c.created_at} likes={c.like_count} />)
            )}
          </div>

          <div className="px-4 py-2 border-t border-[var(--border)] text-sm shrink-0">
            {post.like_count > 0 && <p className="font-semibold py-1">{formatCount(post.like_count)} likes</p>}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)] shrink-0">
            <Avatar src={user?.avatar_url} alt={user?.username} size={30} />
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-faint)]"
            />
            <button type="submit" disabled={!text.trim() || busy} className="text-sm font-semibold text-gradient disabled:opacity-40">
              Post
            </button>
          </form>
        </div>
      </div>
    </Modal>
  )
}

function Row({ author, body, at, likes = 0, caption }) {
  return (
    <div className="flex gap-3">
      <Avatar src={author.avatar_url} alt={author.username} size={34} to={`/u/${author.username}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm break-words">
          <UserName user={author} className="mr-1.5" />
          {body}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-faint)]">
          <span>{timeAgo(at)}</span>
          {!caption && likes > 0 && <span>{likes} likes</span>}
          {!caption && <button className="hover:text-[var(--text)]">Reply</button>}
        </div>
      </div>
      {!caption && (
        <button className="p-1 text-[var(--text-faint)] hover:text-[var(--color-brand-coral)] self-start">
          <Heart size={14} />
        </button>
      )}
    </div>
  )
}

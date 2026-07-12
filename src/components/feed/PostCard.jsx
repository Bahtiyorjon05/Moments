import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, MapPin, Play } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import UserName from '../ui/UserName.jsx'
import CommentsModal from './CommentsModal.jsx'
import FollowListModal from './FollowListModal.jsx'
import { api } from '../../lib/api.js'
import { useAuth } from '../../store/auth.js'
import { useUI } from '../../store/ui.js'
import { timeAgo, formatCount } from '../../lib/format.js'

export default function PostCard({ post, onChange }) {
  const { user } = useAuth()
  const { toast } = useUI()
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [saved, setSaved] = useState(post.saved)
  const [commentCount, setCommentCount] = useState(post.comment_count)
  const [idx, setIdx] = useState(0)
  const [burst, setBurst] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const lastTap = useRef(0)

  const media = post.media || []
  const multi = media.length > 1

  async function toggleLike(forceOn = false) {
    const next = forceOn ? true : !liked
    if (next === liked && forceOn) return
    setLiked(next)
    setLikeCount((c) => c + (next ? 1 : -1))
    try {
      const r = next ? await api.like(post.id) : await api.unlike(post.id)
      setLikeCount(r.like_count)
    } catch {
      setLiked(!next)
      setLikeCount((c) => c + (next ? -1 : 1))
      toast('Could not update like', 'error')
    }
  }

  async function toggleSave() {
    const next = !saved
    setSaved(next)
    try {
      next ? await api.save(post.id) : await api.unsave(post.id)
      toast(next ? 'Saved' : 'Removed from saved', 'success')
    } catch {
      setSaved(!next)
      toast('Could not update save', 'error')
    }
  }

  function onImageTap() {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      setBurst(true)
      setTimeout(() => setBurst(false), 800)
      toggleLike(true)
    }
    lastTap.current = now
  }

  function share() {
    const url = `${location.origin}/p/${post.id}`
    if (navigator.share) navigator.share({ title: 'Moments', url }).catch(() => {})
    else {
      navigator.clipboard?.writeText(url)
      toast('Link copied to clipboard', 'success')
    }
  }

  return (
    <article className="card overflow-hidden mb-6 animate-float-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar src={post.author.avatar_url} alt={post.author.username} size={40} ring="unseen" to={`/u/${post.author.username}`} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-2">
            <UserName user={post.author} className="text-sm" />
            <span className="text-[var(--text-faint)] text-sm">· {timeAgo(post.created_at)}</span>
          </div>
          {post.location && (
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-0.5">
              <MapPin size={11} /> {post.location}
            </span>
          )}
        </div>
        <button className="p-1.5 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)]">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Media */}
      <div className="relative bg-black select-none" onClick={onImageTap} onDoubleClick={onImageTap}>
        <div className="relative w-full aspect-[4/5] overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            {media[idx]?.type === 'video' ? (
              <motion.video
                key={idx}
                src={media[idx]?.url}
                poster={media[idx]?.poster}
                initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
                className="absolute inset-0 w-full h-full object-cover"
                muted loop autoPlay playsInline
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                key={idx}
                src={media[idx]?.url}
                alt={post.caption}
                initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            )}
          </AnimatePresence>

          {post.kind === 'reel' && (
            <span className="absolute top-3 left-3 z-10 flex items-center gap-1 text-white text-xs font-semibold bg-black/45 rounded-full px-2 py-0.5 backdrop-blur">
              <Play size={12} className="fill-white" /> Reel
            </span>
          )}

          {/* double-tap heart burst */}
          <AnimatePresence>
            {burst && (
              <motion.div
                className="absolute inset-0 grid place-items-center pointer-events-none"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
                exit={{ opacity: 0, scale: 1.3 }}
              >
                <Heart size={96} className="fill-white text-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {multi && (
          <>
            {idx > 0 && (
              <NavBtn side="left" onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1) }}><ChevronLeft size={18} /></NavBtn>
            )}
            {idx < media.length - 1 && (
              <NavBtn side="right" onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1) }}><ChevronRight size={18} /></NavBtn>
            )}
            <div className="absolute top-3 right-3 text-white text-xs font-semibold bg-black/50 rounded-full px-2 py-0.5 backdrop-blur">
              {idx + 1}/{media.length}
            </div>
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
              {media.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-1">
          <IconAction onClick={() => toggleLike()} active={liked}>
            <Heart size={26} className={liked ? 'fill-[var(--color-brand-coral)] text-[var(--color-brand-coral)]' : ''} />
          </IconAction>
          <IconAction onClick={() => setShowComments(true)}><MessageCircle size={26} /></IconAction>
          <IconAction onClick={share}><Send size={25} /></IconAction>
          <div className="flex-1" />
          <IconAction onClick={toggleSave} active={saved}>
            <Bookmark size={25} className={saved ? 'fill-[var(--text)]' : ''} />
          </IconAction>
        </div>

        {likeCount > 0 && (
          <button onClick={() => setShowLikes(true)} className="text-sm font-semibold mt-1.5 hover:opacity-70">
            {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
          </button>
        )}

        {post.caption && (
          <p className="text-sm mt-1 whitespace-pre-line break-words">
            <UserName user={post.author} className="mr-1.5" />
            {post.caption}
          </p>
        )}

        {commentCount > 0 && (
          <button onClick={() => setShowComments(true)} className="text-sm text-[var(--text-muted)] mt-1 hover:opacity-70">
            View all {commentCount} comments
          </button>
        )}
      </div>

      {/* Inline add comment */}
      <QuickComment postId={post.id} me={user} onAdded={() => setCommentCount((c) => c + 1)} />

      <CommentsModal
        open={showComments}
        onClose={() => setShowComments(false)}
        post={{ ...post, liked, like_count: likeCount, saved }}
        onCommentAdded={() => setCommentCount((c) => c + 1)}
        onLikeToggle={toggleLike}
      />

      <FollowListModal open={showLikes} onClose={() => setShowLikes(false)} type="likes" postId={post.id} />
    </article>
  )
}

function NavBtn({ side, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-2' : 'right-2'} w-8 h-8 grid place-items-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/65 transition`}
    >
      {children}
    </button>
  )
}

function IconAction({ children, onClick, active }) {
  return (
    <button onClick={onClick} className={`p-1.5 rounded-full hover:bg-[var(--surface)] transition active:scale-90 ${active ? '' : 'text-[var(--text)]'}`}>
      {children}
    </button>
  )
}

function QuickComment({ postId, me, onAdded }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      await api.addComment(postId, text.trim())
      setText('')
      onAdded()
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2 px-4 py-3 mt-1 border-t border-[var(--border)]">
      <Avatar src={me?.avatar_url} alt={me?.username} size={28} />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment…"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-faint)]"
      />
      {text.trim() && (
        <button type="submit" disabled={busy} className="text-sm font-semibold text-gradient">Post</button>
      )}
    </form>
  )
}

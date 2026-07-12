import { useEffect, useRef, useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark, Music2, Volume2, VolumeX, Play } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import UserName from '../components/ui/UserName.jsx'
import CommentsModal from '../components/feed/CommentsModal.jsx'
import { FullSpinner } from '../components/ui/Spinner.jsx'
import { api } from '../lib/api.js'
import { useUI } from '../store/ui.js'
import { formatCount } from '../lib/format.js'

export default function Reels() {
  const [reels, setReels] = useState(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    api.reels().then(setReels).catch(() => setReels([]))
  }, [])

  if (reels === null) return <FullSpinner label="Loading reels…" />

  return (
    <div className="h-[calc(100dvh-4rem)] md:h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar">
      {reels.length === 0 && (
        <div className="h-full grid place-items-center text-center px-6 text-[var(--text-muted)]">
          <div>
            <p className="font-bold text-lg text-[var(--text)]">No reels yet</p>
            <p className="text-sm mt-1">Create a reel by uploading a video from the + button.</p>
          </div>
        </div>
      )}
      {reels.map((r) => (
        <Reel key={r.id} reel={r} muted={muted} setMuted={setMuted} />
      ))}
    </div>
  )
}

function Reel({ reel, muted, setMuted }) {
  const ref = useRef(null)
  const videoRef = useRef(null)
  const { toast } = useUI()
  const [playing, setPlaying] = useState(true)
  const [liked, setLiked] = useState(reel.liked)
  const [likeCount, setLikeCount] = useState(reel.like_count)
  const [saved, setSaved] = useState(reel.saved)
  const [comments, setComments] = useState(false)

  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver(
      ([e]) => {
        const v = videoRef.current
        if (!v) return
        if (e.isIntersecting) { v.play().catch(() => {}); setPlaying(true) }
        else { v.pause() }
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) } else { v.pause(); setPlaying(false) }
  }

  async function toggleLike() {
    const next = !liked
    setLiked(next); setLikeCount((c) => c + (next ? 1 : -1))
    try { const r = next ? await api.like(reel.id) : await api.unlike(reel.id); setLikeCount(r.like_count) }
    catch { setLiked(!next); setLikeCount((c) => c + (next ? -1 : 1)) }
  }
  async function toggleSave() {
    const next = !saved; setSaved(next)
    try { next ? await api.save(reel.id) : await api.unsave(reel.id); toast(next ? 'Saved' : 'Removed', 'success') }
    catch { setSaved(!next) }
  }

  const video = reel.media?.[0]

  return (
    <div ref={ref} className="snap-start h-full w-full relative md:grid md:place-items-center md:py-3">
      <div className="relative w-full h-full md:w-auto md:max-h-[860px] md:aspect-[9/16] md:rounded-2xl overflow-hidden bg-black md:shadow-2xl">
        <video
          ref={videoRef}
          src={video?.url}
          poster={video?.poster}
          loop muted={muted} playsInline
          onClick={togglePlay}
          className="w-full h-full object-cover"
        />

        {!playing && (
          <button onClick={togglePlay} className="absolute inset-0 grid place-items-center">
            <span className="w-16 h-16 rounded-full bg-black/40 backdrop-blur grid place-items-center text-white"><Play size={30} className="fill-white ml-1" /></span>
          </button>
        )}

        {/* mute */}
        <button onClick={() => setMuted((m) => !m)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/45 backdrop-blur grid place-items-center text-white">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* gradient + meta */}
        <div className="absolute inset-x-0 bottom-0 pt-10 px-4 pb-5 pr-16 bg-gradient-to-t from-black/80 via-black/30 to-transparent text-white z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <Avatar src={reel.author.avatar_url} alt={reel.author.username} size={36} to={`/u/${reel.author.username}`} />
            <UserName user={reel.author} className="text-sm text-white" />
          </div>
          {reel.caption && <p className="text-sm line-clamp-2 mb-2">{reel.caption}</p>}
          {reel.audio && (
            <p className="text-xs flex items-center gap-1.5 opacity-90"><Music2 size={13} /> <span className="truncate">{reel.audio}</span></p>
          )}
        </div>

        {/* side rail */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-white">
          <RailBtn onClick={toggleLike} count={likeCount}>
            <Heart size={28} className={liked ? 'fill-[var(--color-brand-coral)] text-[var(--color-brand-coral)]' : ''} />
          </RailBtn>
          <RailBtn onClick={() => setComments(true)} count={reel.comment_count}>
            <MessageCircle size={28} />
          </RailBtn>
          <RailBtn><Send size={26} /></RailBtn>
          <RailBtn onClick={toggleSave}><Bookmark size={26} className={saved ? 'fill-white' : ''} /></RailBtn>
        </div>
      </div>

      <CommentsModal open={comments} onClose={() => setComments(false)} post={{ ...reel, liked, like_count: likeCount }} />
    </div>
  )
}

function RailBtn({ children, count, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 active:scale-90 transition">
      <span className="drop-shadow-lg">{children}</span>
      {count > 0 && <span className="text-xs font-semibold">{formatCount(count)}</span>}
    </button>
  )
}

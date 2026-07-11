import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import UserName from '../ui/UserName.jsx'
import { api } from '../../lib/api.js'
import { timeAgo } from '../../lib/format.js'

const DURATION = 5000 // ms per frame

export default function StoryViewer({ groups, startGroup = 0, onClose }) {
  const [gi, setGi] = useState(startGroup)
  const [fi, setFi] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const raf = useRef()
  const start = useRef()

  const group = groups[gi]
  const frames = group?.items || []
  const frame = frames[fi]

  const advance = useCallback(() => {
    if (fi < frames.length - 1) {
      setFi((f) => f + 1); setProgress(0)
    } else if (gi < groups.length - 1) {
      setGi((g) => g + 1); setFi(0); setProgress(0)
    } else onClose()
  }, [fi, gi, frames.length, groups.length, onClose])

  const back = useCallback(() => {
    if (fi > 0) { setFi((f) => f - 1); setProgress(0) }
    else if (gi > 0) { const pg = groups[gi - 1]; setGi((g) => g - 1); setFi((pg?.items?.length || 1) - 1); setProgress(0) }
  }, [fi, gi, groups])

  // mark viewed
  useEffect(() => {
    if (frame?.id) api.viewStory(frame.id).catch(() => {})
  }, [frame?.id])

  // progress timer
  useEffect(() => {
    if (paused) return
    start.current = performance.now() - progress * DURATION
    const tick = (now) => {
      const p = Math.min(1, (now - start.current) / DURATION)
      setProgress(p)
      if (p >= 1) advance()
      else raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, fi, paused])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') advance()
      if (e.key === 'ArrowLeft') back()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [advance, back, onClose])

  if (!group) return null

  return createPortal(
    <div className="fixed inset-0 z-[95] bg-black/95 backdrop-blur-xl grid place-items-center">
      <button onClick={onClose} className="absolute top-5 right-5 p-2 text-white/80 hover:text-white z-20"><X size={28} /></button>

      {gi > 0 && (
        <button onClick={back} className="hidden md:grid place-items-center absolute left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white z-20"><ChevronLeft /></button>
      )}
      {gi < groups.length - 1 && (
        <button onClick={advance} className="hidden md:grid place-items-center absolute right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white z-20"><ChevronRight /></button>
      )}

      <motion.div
        key={gi}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full h-full md:w-[420px] md:h-[86vh] md:rounded-3xl overflow-hidden bg-black"
      >
        {/* progress bars */}
        <div className="absolute top-3 inset-x-3 flex gap-1 z-10">
          {frames.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${i < fi ? 100 : i === fi ? progress * 100 : 0}%` }} />
            </div>
          ))}
        </div>

        {/* header */}
        <div className="absolute top-7 inset-x-3 flex items-center gap-2.5 z-10 text-white">
          <Avatar src={group.author.avatar_url} alt={group.author.username} size={34} />
          <UserName user={group.author} className="text-sm text-white" link={false} />
          <span className="text-xs text-white/70">{timeAgo(frame.created_at)}</span>
        </div>

        {/* media */}
        <img src={frame.media_url} alt="" className="w-full h-full object-cover" draggable={false} />

        {/* tap zones */}
        <button className="absolute inset-y-0 left-0 w-1/3 z-[5]" onClick={back}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} aria-label="Previous" />
        <button className="absolute inset-y-0 right-0 w-1/3 z-[5]" onClick={advance}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} aria-label="Next" />

        {/* reply bar */}
        <div className="absolute bottom-0 inset-x-0 p-4 flex items-center gap-2 bg-gradient-to-t from-black/60 to-transparent z-10">
          <input
            placeholder={`Reply to ${group.author.username}…`}
            onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
            className="flex-1 h-11 rounded-full bg-white/10 border border-white/25 px-4 text-white text-sm placeholder:text-white/60 outline-none"
          />
          <button className="p-2.5 text-white hover:scale-110 transition"><Heart size={24} /></button>
          <button className="p-2.5 text-white hover:scale-110 transition"><Send size={22} /></button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

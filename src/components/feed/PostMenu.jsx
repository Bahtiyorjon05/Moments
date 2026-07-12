import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MoreHorizontal, Share2, Download, Link2, Pencil, Trash2, Flag } from 'lucide-react'
import { sharePost, copyLink, downloadMedia } from '../../lib/share.js'
import { useUI } from '../../store/ui.js'
import { useAuth } from '../../store/auth.js'

// "..." menu for a post/reel: share, download, copy link, (owner) edit + delete.
// variant 'overlay' = dark circular button for use over media; align controls
// which side the dropdown opens (use 'left' when the button sits on the left).
export default function PostMenu({ post, onEdit, onDelete, size = 20, className = '', variant = 'default', align = 'right' }) {
  const [open, setOpen] = useState(false)
  const { toast } = useUI()
  const { user } = useAuth()
  const mine = user?.id === post.author?.id
  const media = post.media?.[0]

  const triggerClass = variant === 'overlay'
    ? 'w-9 h-9 grid place-items-center rounded-full bg-black/45 backdrop-blur text-white hover:bg-black/65 transition'
    : 'p-1.5 rounded-full hover:bg-[var(--surface)] text-inherit'
  const dropClass = align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'

  const Row = ({ icon: Icon, label, onClick, danger }) => (
    <button
      onClick={() => { setOpen(false); onClick() }}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition ${danger ? 'text-[var(--color-brand-coral)]' : ''}`}
    >
      <Icon size={17} /> {label}
    </button>
  )

  return (
    <div className={`relative ${className}`}>
      <button onClick={() => setOpen((o) => !o)} className={triggerClass}>
        <MoreHorizontal size={size} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`absolute top-full mt-1 w-52 card p-1.5 z-40 ${dropClass}`}
            >
              <Row icon={Share2} label="Share" onClick={() => sharePost(post, toast)} />
              <Row icon={Link2} label="Copy link" onClick={() => copyLink(post, toast)} />
              {media && <Row icon={Download} label="Download" onClick={() => downloadMedia(media.url, toast)} />}
              {mine ? (
                <>
                  <div className="my-1 border-t border-[var(--border)]" />
                  <Row icon={Pencil} label="Edit caption" onClick={() => onEdit?.()} />
                  <Row icon={Trash2} label="Delete" danger onClick={() => onDelete?.()} />
                </>
              ) : (
                <Row icon={Flag} label="Report" onClick={() => toast('Reported — thanks', 'success')} />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

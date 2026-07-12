import { useEffect, useRef, useState } from 'react'
import { Plus, Loader2, Star, ImagePlus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Avatar from '../ui/Avatar.jsx'
import StoryViewer from './StoryViewer.jsx'
import CloseFriendsModal from './CloseFriendsModal.jsx'
import Spinner from '../ui/Spinner.jsx'
import { api } from '../../lib/api.js'
import { uploadMedia } from '../../lib/upload.js'
import { checkNSFW } from '../../lib/nsfw.js'
import { useAuth } from '../../store/auth.js'
import { useUI } from '../../store/ui.js'

export default function Stories() {
  const { user } = useAuth()
  const { toast } = useUI()
  const [groups, setGroups] = useState(null)
  const [viewer, setViewer] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const audienceRef = useRef('all')
  const fileRef = useRef(null)

  const refresh = () => api.stories().then(setGroups).catch(() => setGroups([]))
  useEffect(() => { refresh() }, [])

  function pick(audience) {
    audienceRef.current = audience
    setMenuOpen(false)
    fileRef.current?.click()
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      if (await checkNSFW(file)) { toast('That media looks explicit and was blocked', 'error'); return }
      const { url, type } = await uploadMedia(file)
      await api.addStory({ media_url: url, type, audience: audienceRef.current })
      toast(audienceRef.current === 'close' ? 'Close-friends story added ✨' : 'Story added ✨', 'success')
      await refresh()
    } catch (err) {
      toast(err.message || 'Could not add story', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (groups === null)
    return <div className="card h-[116px] grid place-items-center mb-6"><Spinner size={20} /></div>

  const mine = groups.find((g) => g.author.username === user?.username)
  const others = groups.filter((g) => g.author.username !== user?.username)
  const ordered = mine ? [mine, ...others] : others

  return (
    <>
      <div className="card mb-6 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-4">
          {/* Your story */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]">
            <div className="relative">
              <button onClick={() => (mine ? setViewer(0) : setMenuOpen(true))} disabled={uploading}>
                <Avatar src={user?.avatar_url} alt="You" size={60} ring={mine ? (mine.has_close ? 'close' : 'unseen') : 'seen'} />
                {uploading && <span className="absolute inset-0 grid place-items-center bg-black/50 rounded-full"><Loader2 size={20} className="animate-spin text-white" /></span>}
              </button>
              <button onClick={() => setMenuOpen((o) => !o)} disabled={uploading}
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full brand-gradient grid place-items-center border-[3px] border-[var(--bg-elev)]" title="Add to your story">
                <Plus size={14} className="text-white" strokeWidth={3} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 card p-1.5 z-40">
                      <MRow icon={ImagePlus} label="Add to Story" sub="Everyone" onClick={() => pick('all')} />
                      <MRow icon={Star} label="Close friends" sub="Only close friends" green onClick={() => pick('close')} />
                      <div className="my-1 border-t border-[var(--border)]" />
                      <MRow icon={Star} label="Manage close friends" onClick={() => { setMenuOpen(false); setCloseOpen(true) }} />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <span className="text-xs text-[var(--text-muted)] truncate w-full text-center">Your story</span>
          </div>

          {(mine ? others : ordered).map((g) => {
            const startIndex = ordered.indexOf(g)
            return (
              <button key={g.author.id} onClick={() => setViewer(startIndex)} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]">
                <Avatar src={g.author.avatar_url} alt={g.author.username} size={60} ring={g.has_close ? 'close' : g.seen ? 'seen' : 'unseen'} />
                <span className="text-xs text-[var(--text-muted)] truncate w-full text-center">{g.author.username}</span>
              </button>
            )
          })}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={onFile} />

      {viewer !== null && (
        <StoryViewer groups={ordered} startGroup={viewer} onClose={() => setViewer(null)} onDeleted={refresh} />
      )}
      <CloseFriendsModal open={closeOpen} onClose={() => setCloseOpen(false)} />
    </>
  )
}

function MRow({ icon: Icon, label, sub, onClick, green }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--surface)] transition text-left">
      <Icon size={17} className={green ? 'text-emerald-400' : 'text-[var(--text-muted)]'} />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {sub && <span className="block text-[11px] text-[var(--text-faint)]">{sub}</span>}
      </span>
    </button>
  )
}

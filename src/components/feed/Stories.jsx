import { useEffect, useRef, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import StoryViewer from './StoryViewer.jsx'
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
  const fileRef = useRef(null)

  const refresh = () => api.stories().then(setGroups).catch(() => setGroups([]))
  useEffect(() => { refresh() }, [])

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const flagged = await checkNSFW(file)
      if (flagged) { toast('That media looks explicit and was blocked', 'error'); return }
      const { url, type } = await uploadMedia(file)
      await api.addStory({ media_url: url, type })
      toast('Story added ✨', 'success')
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
              <button onClick={() => (mine ? setViewer(0) : fileRef.current?.click())} disabled={uploading}>
                <Avatar src={user?.avatar_url} alt="You" size={60} ring={mine ? 'unseen' : 'seen'} />
                {uploading && <span className="absolute inset-0 grid place-items-center bg-black/50 rounded-full"><Loader2 size={20} className="animate-spin text-white" /></span>}
              </button>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full brand-gradient grid place-items-center border-[3px] border-[var(--bg-elev)]" title="Add to your story">
                <Plus size={14} className="text-white" strokeWidth={3} />
              </button>
            </div>
            <span className="text-xs text-[var(--text-muted)] truncate w-full text-center">Your story</span>
          </div>

          {(mine ? others : ordered).map((g) => {
            const startIndex = ordered.indexOf(g)
            return (
              <button key={g.author.id} onClick={() => setViewer(startIndex)} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]">
                <Avatar src={g.author.avatar_url} alt={g.author.username} size={60} ring={g.seen ? 'seen' : 'unseen'} />
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
    </>
  )
}

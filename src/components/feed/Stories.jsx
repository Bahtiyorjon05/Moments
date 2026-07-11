import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import StoryViewer from './StoryViewer.jsx'
import Spinner from '../ui/Spinner.jsx'
import { api } from '../../lib/api.js'
import { useAuth } from '../../store/auth.js'
import { useUI } from '../../store/ui.js'

export default function Stories() {
  const { user } = useAuth()
  const { setCreateOpen } = useUI()
  const [groups, setGroups] = useState(null)
  const [viewer, setViewer] = useState(null) // start index
  const railRef = useRef(null)

  useEffect(() => {
    api.stories().then(setGroups).catch(() => setGroups([]))
  }, [])

  if (groups === null)
    return <div className="card h-[116px] grid place-items-center mb-6"><Spinner size={20} /></div>

  // Split "your" story out so it always sits first with an add button.
  const mine = groups.find((g) => g.author.username === user?.username)
  const others = groups.filter((g) => g.author.username !== user?.username)
  const ordered = mine ? [mine, ...others] : others

  return (
    <>
      <div className="card mb-6 overflow-hidden">
        <div ref={railRef} className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-4">
          {/* Your story / add */}
          <button
            onClick={() => (mine ? setViewer(0) : setCreateOpen(true))}
            className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]"
          >
            <div className="relative">
              <Avatar src={user?.avatar_url} alt="You" size={60} ring={mine ? 'unseen' : 'seen'} />
              {!mine && (
                <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full brand-gradient grid place-items-center border-[3px] border-[var(--bg-elev)]">
                  <Plus size={14} className="text-white" strokeWidth={3} />
                </span>
              )}
            </div>
            <span className="text-xs text-[var(--text-muted)] truncate w-full text-center">Your story</span>
          </button>

          {(mine ? others : ordered).map((g) => {
            const startIndex = ordered.indexOf(g)
            return (
              <button
                key={g.author.id}
                onClick={() => setViewer(startIndex)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]"
              >
                <Avatar src={g.author.avatar_url} alt={g.author.username} size={60} ring={g.seen ? 'seen' : 'unseen'} />
                <span className="text-xs text-[var(--text-muted)] truncate w-full text-center">{g.author.username}</span>
              </button>
            )
          })}
        </div>
      </div>

      {viewer !== null && (
        <StoryViewer groups={ordered} startGroup={viewer} onClose={() => setViewer(null)} />
      )}
    </>
  )
}

import { useEffect, useState } from 'react'
import { Search, Compass } from 'lucide-react'
import PostGrid from '../components/feed/PostGrid.jsx'
import Empty from '../components/ui/Empty.jsx'
import { FullSpinner } from '../components/ui/Spinner.jsx'
import { api } from '../lib/api.js'
import { useUI } from '../store/ui.js'

export default function Explore() {
  const [posts, setPosts] = useState(null)
  const { setSearchOpen } = useUI()

  useEffect(() => {
    api.explore().then(setPosts).catch(() => setPosts([]))
  }, [])

  return (
    <div className="max-w-[935px] mx-auto w-full px-1 sm:px-4 pt-4 sm:pt-8">
      <button
        onClick={() => setSearchOpen(true)}
        className="w-full max-w-md mx-auto mb-6 flex items-center gap-3 h-11 px-4 rounded-full surface text-[var(--text-muted)] hover:bg-[var(--surface-strong)] transition"
      >
        <Search size={18} /> Search people on Moments
      </button>

      {posts === null ? (
        <FullSpinner label="Loading explore…" />
      ) : posts.length === 0 ? (
        <Empty icon={Compass} title="Nothing to explore yet" subtitle="Posts from across Moments will show up here." />
      ) : (
        <PostGrid posts={posts} feature />
      )}
    </div>
  )
}

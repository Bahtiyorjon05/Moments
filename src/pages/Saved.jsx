import { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import PostGrid from '../components/feed/PostGrid.jsx'
import Empty from '../components/ui/Empty.jsx'
import { FullSpinner } from '../components/ui/Spinner.jsx'
import { api } from '../lib/api.js'

export default function Saved() {
  const [posts, setPosts] = useState(null)
  useEffect(() => {
    api.saved().then(setPosts).catch(() => setPosts([]))
  }, [])

  return (
    <div className="max-w-[935px] mx-auto w-full px-4 pt-8">
      <div className="flex items-center gap-2 mb-1 pb-4 border-b border-[var(--border)]">
        <Bookmark size={22} />
        <h1 className="text-xl font-bold">Saved</h1>
      </div>
      <p className="text-sm text-[var(--text-muted)] mt-3 mb-5">Only you can see what you've saved.</p>
      {posts === null ? (
        <FullSpinner />
      ) : posts.length === 0 ? (
        <Empty icon={Bookmark} title="Nothing saved yet" subtitle="Tap the bookmark on any post to save it here." />
      ) : (
        <PostGrid posts={posts} />
      )}
    </div>
  )
}

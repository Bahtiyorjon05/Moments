import { useEffect, useState } from 'react'
import { Camera, UserPlus } from 'lucide-react'
import Stories from '../components/feed/Stories.jsx'
import PostCard from '../components/feed/PostCard.jsx'
import SuggestionsRail from '../components/feed/SuggestionsRail.jsx'
import Empty from '../components/ui/Empty.jsx'
import Button from '../components/ui/Button.jsx'
import { FullSpinner } from '../components/ui/Spinner.jsx'
import { api } from '../lib/api.js'
import { useUI } from '../store/ui.js'

function SkeletonPost() {
  return (
    <div className="card overflow-hidden mb-6">
      <div className="flex items-center gap-3 p-4">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="skeleton h-3 w-28 rounded" />
      </div>
      <div className="skeleton aspect-[4/5] w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-48 rounded" />
      </div>
    </div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState(null)
  const { setCreateOpen } = useUI()

  useEffect(() => {
    api.feed().then(setPosts).catch(() => setPosts([]))
  }, [])

  return (
    <div className="max-w-[975px] mx-auto w-full flex justify-center gap-8 px-2 sm:px-4">
      <div className="w-full max-w-[500px] pt-6">
        <Stories />

        {posts === null ? (
          <>
            <SkeletonPost />
            <SkeletonPost />
          </>
        ) : posts.length === 0 ? (
          <div className="card">
            <Empty
              icon={UserPlus}
              title="Your feed is quiet"
              subtitle="Follow people or share your first moment to fill it up."
              action={
                <div className="flex gap-2">
                  <Button onClick={() => setCreateOpen(true)}><Camera size={16} /> Create post</Button>
                </div>
              }
            />
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}

        {posts?.length > 0 && (
          <p className="text-center text-sm text-[var(--text-faint)] py-8">✨ You're all caught up</p>
        )}
      </div>

      <SuggestionsRail />
    </div>
  )
}

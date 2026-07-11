import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PostCard from '../components/feed/PostCard.jsx'
import Empty from '../components/ui/Empty.jsx'
import Button from '../components/ui/Button.jsx'
import { FullSpinner } from '../components/ui/Spinner.jsx'
import { api } from '../lib/api.js'
import { FileQuestion } from 'lucide-react'

export default function PostView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    setPost(null); setMissing(false)
    api.post(id).then(setPost).catch(() => setMissing(true))
  }, [id])

  if (missing)
    return <div className="max-w-lg mx-auto pt-16"><Empty icon={FileQuestion} title="Post not found" action={<Button onClick={() => navigate('/')}>Go home</Button>} /></div>

  return (
    <div className="max-w-[500px] mx-auto w-full px-2 sm:px-0 pt-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)] mb-3 hover:text-[var(--text)]">
        <ArrowLeft size={18} /> Back
      </button>
      {post === null ? <FullSpinner /> : <PostCard post={post} />}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Layers, Play } from 'lucide-react'
import { formatCount } from '../../lib/format.js'

// Instagram-style grid with occasional feature tiles for visual rhythm.
export default function PostGrid({ posts, feature = false }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((p, i) => {
        const big = feature && i % 10 === 0
        const cover = p.media?.[0]
        return (
          <Link
            key={p.id}
            to={`/p/${p.id}`}
            className={`relative group overflow-hidden bg-[var(--surface-strong)] ${big ? 'col-span-2 row-span-2' : ''} aspect-square`}
          >
            {cover?.type === 'video' ? (
              <video src={cover.url} poster={cover.poster} muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={cover?.url} alt={p.caption} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            )}

            {/* top-right indicator */}
            <div className="absolute top-2 right-2 text-white drop-shadow">
              {p.kind === 'reel' ? <Play size={16} className="fill-white" /> : p.media?.length > 1 ? <Layers size={16} /> : null}
            </div>

            {/* hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition grid place-items-center">
              <div className="flex items-center gap-5 text-white font-bold">
                <span className="flex items-center gap-1.5"><Heart size={20} className="fill-white" /> {formatCount(p.like_count)}</span>
                <span className="flex items-center gap-1.5"><MessageCircle size={20} className="fill-white" /> {formatCount(p.comment_count)}</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

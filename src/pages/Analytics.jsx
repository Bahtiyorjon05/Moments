import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Users, Clock, Heart, MessageCircle, UserPlus, Image, Clapperboard, TrendingUp, Play } from 'lucide-react'
import { FullSpinner } from '../components/ui/Spinner.jsx'
import Empty from '../components/ui/Empty.jsx'
import { api } from '../lib/api.js'
import { formatCount } from '../lib/format.js'

function fmtWatch(ms) {
  const s = Math.round((ms || 0) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

export default function Analytics() {
  const [data, setData] = useState(null)
  useEffect(() => { api.analytics().then(setData).catch(() => setData({ totals: {}, top: [] })) }, [])
  if (!data) return <FullSpinner label="Crunching your numbers…" />

  const t = data.totals || {}
  const cards = [
    { icon: Eye, label: 'Views', value: t.views, hl: true, sub: 'total plays' },
    { icon: Users, label: 'Reach', value: t.reach, sub: 'unique accounts' },
    { icon: Clock, label: 'Watch time', value: fmtWatch(t.watch_ms), raw: true, sub: 'on your reels' },
    { icon: Heart, label: 'Likes', value: t.likes },
    { icon: MessageCircle, label: 'Comments', value: t.comments },
    { icon: UserPlus, label: 'Followers', value: t.followers, sub: `+${t.new_followers_7d || 0} this week` },
    { icon: Image, label: 'Posts', value: t.posts },
    { icon: Clapperboard, label: 'Reels', value: t.reels },
  ]

  return (
    <div className="max-w-5xl mx-auto w-full px-4 pt-6 pb-16">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-10 h-10 rounded-xl brand-gradient grid place-items-center text-white"><TrendingUp size={22} /></div>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>Your analytics</h1>
          <p className="text-sm text-[var(--text-muted)]">Views, reach & watch time across your content</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`card p-4 ${c.hl ? 'ring-1 ring-[var(--color-brand-purple)]' : ''}`}>
            <c.icon size={18} className="text-[var(--color-brand-purple)] mb-2" />
            <p className="text-2xl font-extrabold">{c.raw ? c.value : formatCount(c.value || 0)}</p>
            <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
            {c.sub && <p className="text-[11px] text-[var(--text-faint)] mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      <h2 className="font-bold mb-3">Top content</h2>
      {(!data.top || data.top.length === 0) ? (
        <Empty icon={TrendingUp} title="No data yet" subtitle="Post something — views and watch time will show up here as people engage." />
      ) : (
        <div className="card divide-y divide-[var(--border)]">
          {data.top.map((p, i) => (
            <Link key={p.id} to={`/p/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-[var(--surface)] transition">
              <span className="w-6 text-center font-bold text-[var(--text-faint)]">{i + 1}</span>
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--surface-strong)] shrink-0 relative">
                {p.thumb && (p.media_type === 'video'
                  ? <video src={p.thumb} className="w-full h-full object-cover" muted />
                  : <img src={p.thumb} alt="" className="w-full h-full object-cover" />)}
                {p.kind === 'reel' && <Play size={12} className="absolute top-1 right-1 text-white fill-white drop-shadow" />}
              </div>
              <p className="flex-1 min-w-0 text-sm truncate">{p.caption || <span className="text-[var(--text-faint)]">No caption</span>}</p>
              <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] shrink-0">
                <span className="flex items-center gap-1"><Eye size={14} /> {formatCount(p.views)}</span>
                <span className="hidden sm:flex items-center gap-1"><Users size={14} /> {formatCount(p.reach)}</span>
                <span className="flex items-center gap-1"><Heart size={14} /> {formatCount(p.likes)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

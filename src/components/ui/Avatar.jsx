import { Link } from 'react-router-dom'

// Avatar with optional gradient "story ring".
// ring: false | 'unseen' | 'seen' | 'add'
export default function Avatar({ src, alt = '', size = 40, ring = false, to, onClick, className = '' }) {
  const pad = ring ? Math.max(3, Math.round(size * 0.06)) : 0
  const outer = size + pad * 2 + (ring ? 4 : 0)

  const img = (
    <span
      className="block rounded-full overflow-hidden bg-[var(--surface-strong)]"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} width={size} height={size} loading="lazy"
          className="w-full h-full object-cover" />
      ) : (
        <span className="w-full h-full grid place-items-center text-[var(--text-faint)] text-xs">
          {alt?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </span>
  )

  const ringClass =
    ring === 'seen'
      ? 'bg-[var(--border-strong)]'
      : ring === 'add'
        ? 'bg-[var(--border-strong)]'
        : 'story-ring'

  const content = ring ? (
    <span
      className={`inline-grid place-items-center rounded-full ${ringClass}`}
      style={{ width: outer, height: outer, padding: pad + 2 }}
    >
      <span className="rounded-full p-[2px]" style={{ background: 'var(--bg)' }}>
        {img}
      </span>
    </span>
  ) : (
    img
  )

  const cls = `inline-flex shrink-0 ${onClick || to ? 'cursor-pointer active:scale-95 transition' : ''} ${className}`

  if (to) return <Link to={to} className={cls} aria-label={alt}>{content}</Link>
  if (onClick) return <button onClick={onClick} className={cls} aria-label={alt}>{content}</button>
  return <span className={cls}>{content}</span>
}

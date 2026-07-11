// Compact relative time: 5s, 12m, 3h, 4d, 2w, then date.
export function timeAgo(input) {
  const d = new Date(input)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 5) return 'now'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d`
  const w = Math.floor(days / 7)
  if (w < 5) return `${w}w`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Longer relative for chat headers etc.
export function timeAgoLong(input) {
  const d = new Date(input)
  const m = Math.floor((Date.now() - d.getTime()) / 60000)
  if (m < 1) return 'Active now'
  if (m < 60) return `Active ${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `Active ${h}h ago`
  const days = Math.floor(h / 24)
  return `Active ${days}d ago`
}

// 1234 -> 1,234 ; 12345 -> 12.3k ; 1200000 -> 1.2M
export function formatCount(n) {
  if (n < 1000) return String(n)
  if (n < 10000) return n.toLocaleString()
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 100000 ? 1 : 0)}k`.replace('.0', '')
  return `${(n / 1_000_000).toFixed(1)}M`.replace('.0', '')
}

export function clockTime(input) {
  return new Date(input).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

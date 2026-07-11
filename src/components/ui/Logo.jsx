import { Link } from 'react-router-dom'

// The Moments aperture mark + wordmark.
export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lm" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF5F6D" />
          <stop offset="0.5" stopColor="#A24BCF" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#lm)" />
      <circle cx="32" cy="32" r="13" fill="none" stroke="white" strokeWidth="4.5" />
      <circle cx="32" cy="32" r="4.5" fill="white" />
      <circle cx="46" cy="18" r="3.5" fill="white" />
    </svg>
  )
}

export default function Logo({ compact = false, size = 30 }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 select-none focus-ring rounded-xl">
      <LogoMark size={size} />
      {!compact && (
        <span className="text-[1.6rem] leading-none font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          <span className="text-gradient">Moments</span>
        </span>
      )}
    </Link>
  )
}

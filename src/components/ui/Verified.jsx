export default function Verified({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-label="Verified">
      <defs>
        <linearGradient id="vb" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <path
        fill="url(#vb)"
        d="M12 1.5l2.4 1.8 3 .1 1 2.8 2.3 1.9-.9 2.9.9 2.9-2.3 1.9-1 2.8-3 .1L12 22.5l-2.4-1.8-3-.1-1-2.8-2.3-1.9.9-2.9-.9-2.9 2.3-1.9 1-2.8 3-.1L12 1.5z"
      />
      <path fill="#fff" d="M10.6 15.2l-2.7-2.7 1.3-1.3 1.4 1.4 3.9-3.9 1.3 1.3-5.2 5.2z" />
    </svg>
  )
}

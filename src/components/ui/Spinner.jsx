export default function Spinner({ size = 28, className = '' }) {
  return (
    <span
      className={`inline-block rounded-full border-[3px] border-[var(--border-strong)] border-t-[var(--color-brand-purple)] animate-spin ${className}`}
      style={{ width: size, height: size, animationDuration: '0.7s' }}
      role="status"
      aria-label="Loading"
    />
  )
}

export function FullSpinner({ label }) {
  return (
    <div className="w-full grid place-items-center py-20 gap-3 text-[var(--text-faint)]">
      <Spinner />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}

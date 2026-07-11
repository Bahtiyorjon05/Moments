const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] whitespace-nowrap'

const sizes = {
  sm: 'text-[13px] px-3.5 h-8',
  md: 'text-sm px-5 h-10',
  lg: 'text-[15px] px-6 h-12',
}

const variants = {
  primary: 'brand-gradient text-white shadow-[0_8px_24px_-8px_rgba(162,75,207,0.7)] hover:brightness-110',
  solid: 'bg-[var(--text)] text-[var(--bg)] hover:opacity-90',
  soft: 'bg-[var(--surface-strong)] text-[var(--text)] hover:bg-[var(--border-strong)] border border-[var(--border)]',
  ghost: 'text-[var(--text)] hover:bg-[var(--surface)]',
  outline: 'border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--surface)]',
  danger: 'bg-[var(--color-brand-coral)] text-white hover:brightness-110',
}

export default function Button({
  children, variant = 'primary', size = 'md', className = '', as: As = 'button', loading = false, ...props
}) {
  return (
    <As className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" style={{ animationDuration: '0.7s' }} />
      )}
      {children}
    </As>
  )
}

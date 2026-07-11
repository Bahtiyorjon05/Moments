export default function Empty({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
      {Icon && (
        <div className="w-16 h-16 rounded-full grid place-items-center surface mb-1">
          <Icon size={28} className="text-[var(--text-muted)]" strokeWidth={1.6} />
        </div>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-[var(--text-muted)] max-w-xs">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

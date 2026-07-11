import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, XCircle, X } from 'lucide-react'
import { useUI } from '../../store/ui.js'

const icons = {
  success: <CheckCircle2 size={18} className="text-emerald-400" />,
  error: <XCircle size={18} className="text-[var(--color-brand-coral)]" />,
  info: <Info size={18} className="text-[var(--color-brand-blue)]" />,
}

export default function Toaster() {
  const { toasts, dismissToast } = useUI()
  return (
    <div className="fixed z-[100] bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="glass pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2 py-2.5 rounded-2xl shadow-[var(--shadow-soft)] max-w-[90vw]"
          >
            {icons[t.type] || icons.info}
            <span className="text-sm font-medium">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="p-1 rounded-full hover:bg-[var(--surface)] text-[var(--text-faint)]">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

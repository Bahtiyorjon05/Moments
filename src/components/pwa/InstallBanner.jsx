import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import InstallButton from './InstallButton.jsx'
import { LogoMark } from '../ui/Logo.jsx'
import { usePWA } from '../../store/pwa.js'

// Dismissible "install the app" card for the top of the feed.
export default function InstallBanner() {
  const { installed } = usePWA()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('moments_install_dismissed') === '1')

  if (installed || dismissed) return null

  function dismiss() {
    localStorage.setItem('moments_install_dismissed', '1')
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
        className="card p-4 mb-6 flex items-center gap-3 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.07] brand-gradient" />
        <div className="relative shrink-0"><LogoMark size={44} /></div>
        <div className="relative min-w-0 flex-1">
          <p className="font-bold text-sm flex items-center gap-1.5">
            Install Moments <Sparkles size={13} className="text-[var(--color-brand-purple)]" />
          </p>
          <p className="text-xs text-[var(--text-muted)]">Add it to your home screen — iOS & Android, no App Store.</p>
        </div>
        <InstallButton size="sm" label="Install" className="relative shrink-0" />
        <button onClick={dismiss} className="relative p-1 rounded-full hover:bg-[var(--surface)] text-[var(--text-faint)]">
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

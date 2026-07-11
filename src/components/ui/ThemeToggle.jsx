import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUI } from '../../store/ui.js'

// Visible, animated light/dark switch. `variant`: 'icon' | 'switch' | 'pill'
export default function ThemeToggle({ variant = 'icon', className = '' }) {
  const { theme, toggleTheme } = useUI()
  const dark = theme === 'dark'

  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
        className={`relative w-[52px] h-7 rounded-full p-1 transition-colors ${dark ? 'bg-[var(--surface-strong)]' : 'brand-gradient'} ${className}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`grid place-items-center w-5 h-5 rounded-full bg-white shadow ${dark ? '' : 'ml-auto'}`}
        >
          {dark ? <Moon size={12} className="text-[var(--bg)]" /> : <Sun size={12} className="text-[#a24bcf]" />}
        </motion.span>
      </button>
    )
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
        className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full surface hover:bg-[var(--surface-strong)] transition text-sm font-semibold ${className}`}
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
        <span>{dark ? 'Light' : 'Dark'}</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      className={`w-10 h-10 grid place-items-center rounded-full hover:bg-[var(--surface)] transition active:scale-90 ${className}`}
    >
      <motion.span key={theme} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
        {dark ? <Sun size={22} /> : <Moon size={22} />}
      </motion.span>
    </button>
  )
}

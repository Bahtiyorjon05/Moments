import { Link } from 'react-router-dom'
import { Heart, MessageCircle } from 'lucide-react'
import Logo from '../ui/Logo.jsx'
import ThemeToggle from '../ui/ThemeToggle.jsx'

export default function TopBar({ unread }) {
  return (
    <header className="md:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 glass border-b border-[var(--border)]">
      <Logo size={26} />
      <div className="flex items-center gap-0.5">
        <ThemeToggle className="!w-9 !h-9" />
        <Link to="/notifications" className="relative p-2 rounded-full hover:bg-[var(--surface)]">
          <Heart size={24} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full brand-gradient text-white text-[9px] font-bold grid place-items-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
        <Link to="/messages" className="p-2 rounded-full hover:bg-[var(--surface)]">
          <MessageCircle size={24} />
        </Link>
      </div>
    </header>
  )
}

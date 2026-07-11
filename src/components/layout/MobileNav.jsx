import { NavLink } from 'react-router-dom'
import { Home, Compass, PlusSquare, Clapperboard } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import { useAuth } from '../../store/auth.js'
import { useUI } from '../../store/ui.js'

function Tab({ to, icon: Icon, end }) {
  return (
    <NavLink to={to} end={end} className="flex-1 grid place-items-center h-full">
      {({ isActive }) => (
        <Icon size={26} strokeWidth={isActive ? 2.6 : 1.9} className={isActive ? 'scale-110 transition' : 'transition text-[var(--text-muted)]'} />
      )}
    </NavLink>
  )
}

export default function MobileNav() {
  const { user } = useAuth()
  const { setCreateOpen } = useUI()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 z-40 flex items-center glass border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
      <Tab to="/" end icon={Home} />
      <Tab to="/explore" icon={Compass} />
      <button onClick={() => setCreateOpen(true)} className="flex-1 grid place-items-center h-full">
        <span className="w-11 h-11 rounded-2xl brand-gradient grid place-items-center text-white shadow-[0_8px_20px_-6px_rgba(162,75,207,0.8)] active:scale-90 transition">
          <PlusSquare size={24} />
        </span>
      </button>
      <Tab to="/reels" icon={Clapperboard} />
      <NavLink to={`/u/${user?.username}`} className="flex-1 grid place-items-center h-full">
        {({ isActive }) => <Avatar src={user?.avatar_url} alt={user?.username} size={28} ring={isActive ? 'unseen' : false} />}
      </NavLink>
    </nav>
  )
}

import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Search, Compass, Clapperboard, MessageCircle, Heart,
  PlusSquare, Menu, Moon, Sun, LogOut, Bookmark, Settings, Download, ShieldCheck,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Logo, { LogoMark } from '../ui/Logo.jsx'
import Avatar from '../ui/Avatar.jsx'
import { useAuth } from '../../store/auth.js'
import { useUI } from '../../store/ui.js'
import { usePWA } from '../../store/pwa.js'

function Item({ to, icon: Icon, label, onClick, badge, end, compact }) {
  const content = (active) => (
    <>
      <span className="relative grid place-items-center">
        <Icon size={26} strokeWidth={active ? 2.4 : 1.9} className={active ? 'scale-110 transition' : 'transition'} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full brand-gradient text-white text-[10px] font-bold grid place-items-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {!compact && <span className={`text-[15px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>}
    </>
  )
  const cls = ({ isActive }) =>
    `group flex items-center gap-4 rounded-2xl px-3 py-3 transition-all hover:bg-[var(--surface)] ${
      compact ? 'justify-center' : ''
    } ${isActive ? 'font-bold' : ''}`

  if (onClick)
    return (
      <button onClick={onClick} className={`w-full ${cls({ isActive: false })}`}>{content(false)}</button>
    )
  return (
    <NavLink to={to} end={end} className={cls}>
      {({ isActive }) => content(isActive)}
    </NavLink>
  )
}

export default function Sidebar({ compact, unread }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, setCreateOpen, setSearchOpen } = useUI()
  const { promptInstall, showInstall } = usePWA()
  const [menu, setMenu] = useState(false)
  const loc = useLocation()

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r border-[var(--border)] px-3 py-5 z-40 bg-[var(--bg)]/60 backdrop-blur-xl ${
        compact ? 'w-[76px] items-center' : 'w-[244px]'
      }`}
    >
      <div className={`px-2 mb-6 ${compact ? 'flex justify-center' : ''}`}>
        {compact ? <LogoMark size={34} /> : <Logo />}
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <Item to="/" end icon={Home} label="Home" compact={compact} />
        <Item onClick={() => setSearchOpen(true)} icon={Search} label="Search" compact={compact} />
        <Item to="/explore" icon={Compass} label="Explore" compact={compact} />
        <Item to="/reels" icon={Clapperboard} label="Reels" compact={compact} />
        <Item to="/messages" icon={MessageCircle} label="Messages" compact={compact} />
        <Item to="/notifications" icon={Heart} label="Notifications" badge={unread} compact={compact} />
        <Item onClick={() => setCreateOpen(true)} icon={PlusSquare} label="Create" compact={compact} />
        <NavLink
          to={`/u/${user?.username}`}
          className={({ isActive }) =>
            `flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-all hover:bg-[var(--surface)] ${compact ? 'justify-center' : ''} ${
              isActive ? 'font-bold' : ''
            }`
          }
        >
          <Avatar src={user?.avatar_url} alt={user?.username} size={28} ring={loc.pathname.startsWith('/u/' + user?.username) ? 'unseen' : false} />
          {!compact && <span className="text-[15px]">Profile</span>}
        </NavLink>
      </nav>

      {/* Always-visible theme switch + install */}
      <div className="flex flex-col gap-1 mb-1">
        {showInstall() && (
          <Item onClick={promptInstall} icon={Download} label="Install app" compact={compact} />
        )}
        <Item onClick={toggleTheme} icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Light mode' : 'Dark mode'} compact={compact} />
      </div>

      <div className="relative">
        <AnimatePresence>
          {menu && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              className="absolute bottom-full mb-2 left-0 w-56 card p-1.5 origin-bottom-left"
            >
              {user?.is_admin && <MenuRow icon={ShieldCheck} label="Admin dashboard" to="/admin" onNav={() => setMenu(false)} />}
              <MenuRow icon={Bookmark} label="Saved" to="/saved" onNav={() => setMenu(false)} />
              <MenuRow icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggleTheme} />
              <MenuRow icon={Settings} label="Edit profile" to="/settings" onNav={() => setMenu(false)} />
              <div className="my-1 border-t border-[var(--border)]" />
              <MenuRow icon={LogOut} label="Log out" danger onClick={logout} />
            </motion.div>
          )}
        </AnimatePresence>
        <Item onClick={() => setMenu((m) => !m)} icon={Menu} label="More" compact={compact} />
      </div>
    </aside>
  )
}

function MenuRow({ icon: Icon, label, onClick, to, onNav, danger }) {
  const cls = `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition ${
    danger ? 'text-[var(--color-brand-coral)]' : ''
  }`
  if (to)
    return (
      <NavLink to={to} onClick={onNav} className={cls}>
        <Icon size={18} /> {label}
      </NavLink>
    )
  return (
    <button onClick={onClick} className={cls}>
      <Icon size={18} /> {label}
    </button>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import MobileNav from './MobileNav.jsx'
import TopBar from './TopBar.jsx'
import Toaster from '../ui/Toaster.jsx'
import CreateModal from '../create/CreateModal.jsx'
import SearchModal from '../search/SearchModal.jsx'
import { api } from '../../lib/api.js'

// Routes that want the full immersive width (no centered column).
const WIDE = ['/reels', '/messages', '/explore']

export default function Layout() {
  const loc = useLocation()
  const [unread, setUnread] = useState(0)

  const refreshUnread = useCallback(async () => {
    try {
      const { count } = await api.unreadCount()
      setUnread(count)
    } catch { /* offline is fine */ }
  }, [])

  useEffect(() => {
    refreshUnread()
    const t = setInterval(refreshUnread, 25000)
    return () => clearInterval(t)
  }, [refreshUnread])

  // Clear the badge when visiting notifications.
  useEffect(() => {
    if (loc.pathname === '/notifications') setUnread(0)
  }, [loc.pathname])

  const compact = WIDE.some((p) => loc.pathname.startsWith(p))
  const isMessages = loc.pathname.startsWith('/messages')

  return (
    <div className="flex min-h-screen">
      <Sidebar compact={compact} unread={unread} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar unread={unread} />
        <main className={`flex-1 w-full ${isMessages ? '' : 'pb-20 md:pb-8'}`}>
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <Toaster />
      <CreateModal onCreated={refreshUnread} />
      <SearchModal />
    </div>
  )
}

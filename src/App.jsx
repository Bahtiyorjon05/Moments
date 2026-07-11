import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import Home from './pages/Home.jsx'
import IosInstallSheet from './components/pwa/IosInstallSheet.jsx'
import { usePWA } from './store/pwa.js'
import Explore from './pages/Explore.jsx'
import Reels from './pages/Reels.jsx'
import Profile from './pages/Profile.jsx'
import Saved from './pages/Saved.jsx'
import Settings from './pages/Settings.jsx'
import PostView from './pages/PostView.jsx'
import Messages from './pages/Messages.jsx'
import Notifications from './pages/Notifications.jsx'
import { useAuth } from './store/auth.js'
import { FullSpinner } from './components/ui/Spinner.jsx'
import { LogoMark } from './components/ui/Logo.jsx'

function BootScreen() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-4 animate-float-in">
        <div className="animate-pulse-ring rounded-[18px]"><LogoMark size={56} /></div>
        <FullSpinner />
      </div>
    </div>
  )
}

export default function App() {
  const { status, init } = useAuth()
  const initPWA = usePWA((s) => s.init)
  const loc = useLocation()

  useEffect(() => { init() }, [init])
  useEffect(() => { initPWA() }, [initPWA])

  // Scroll to top on route change (except messages/reels which manage their own).
  useEffect(() => {
    if (!/^\/(messages|reels)/.test(loc.pathname)) window.scrollTo(0, 0)
  }, [loc.pathname])

  if (status === 'loading') return <BootScreen />

  if (status === 'guest')
    return (
      <>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <IosInstallSheet />
      </>
    )

  return (
    <>
      <Routes>
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="/welcome" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/p/:id" element={<PostView />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <IosInstallSheet />
    </>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'
import Logo, { LogoMark } from '../components/ui/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../store/auth.js'
import { useUI } from '../store/ui.js'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ identifier: '', password: '', username: '', name: '', email: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login, register } = useAuth()
  const { toast } = useUI()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      if (mode === 'login') {
        await login(form.identifier.trim(), form.password)
      } else {
        await register({ username: form.username.trim(), name: form.name.trim(), email: form.email.trim(), password: form.password })
      }
      toast('Welcome to Moments 🎉', 'success')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function demo() {
    setError(''); setBusy(true)
    try {
      await login('you', 'moments123')
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Showcase */}
      <div className="hidden lg:flex relative overflow-hidden brand-gradient text-white flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(60vmax 60vmax at 20% 20%, rgba(255,255,255,.35), transparent 60%)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <LogoMark size={44} />
          <span className="text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>Moments</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
            Share your best moments.
          </h1>
          <p className="text-lg text-white/85 mt-5">
            Photos, videos, reels, and stories — with the people who matter. A cleaner, faster, more beautiful place to connect.
          </p>
          <div className="flex gap-6 mt-10 text-sm">
            <Feature icon={Sparkles} label="Stunning stories" />
            <Feature icon={Zap} label="Real-time chat" />
          </div>
        </div>
        <div className="relative z-10 text-white/70 text-sm">© 2026 Moments</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center"><Logo size={40} /></div>

          <div className="card p-7">
            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 className="text-2xl font-bold mb-1">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  {mode === 'login' ? 'Log in to continue to Moments.' : 'Join Moments in a few seconds.'}
                </p>

                <form onSubmit={submit} className="space-y-3">
                  {mode === 'register' && (
                    <>
                      <Input placeholder="Full name" value={form.name} onChange={set('name')} autoComplete="name" required />
                      <Input placeholder="Username" value={form.username} onChange={set('username')} autoComplete="username" required />
                      <Input placeholder="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
                    </>
                  )}
                  {mode === 'login' && (
                    <Input placeholder="Username or email" value={form.identifier} onChange={set('identifier')} autoComplete="username" required />
                  )}
                  <Input placeholder="Password" type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />

                  {error && <p className="text-sm text-[var(--color-brand-coral)] font-medium">{error}</p>}

                  <Button type="submit" loading={busy} className="w-full !mt-4">
                    {mode === 'login' ? 'Log in' : 'Sign up'}
                  </Button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <span className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-xs text-[var(--text-faint)] font-semibold">OR</span>
                  <span className="flex-1 h-px bg-[var(--border)]" />
                </div>

                <Button variant="soft" onClick={demo} className="w-full" disabled={busy}>
                  <Sparkles size={16} /> Try the demo account
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="text-center text-sm text-[var(--text-muted)] mt-5">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="font-bold text-gradient"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-9 h-9 rounded-xl bg-white/20 grid place-items-center"><Icon size={18} /></span>
      {label}
    </span>
  )
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 h-12 text-sm outline-none focus:border-[var(--color-brand-purple)] transition placeholder:text-[var(--text-faint)]"
    />
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, Camera, Eye, EyeOff, Check, X, Heart, MessageCircle } from 'lucide-react'
import Logo, { LogoMark } from '../components/ui/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import ThemeToggle from '../components/ui/ThemeToggle.jsx'
import { useAuth } from '../store/auth.js'
import { useUI } from '../store/ui.js'

const USERNAME_RE = /^[a-z0-9._]{3,20}$/

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ identifier: '', password: '', confirmPassword: '', username: '', name: '', email: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { login, register } = useAuth()
  const { toast } = useUI()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isRegister = mode === 'register'

  // live validation cues (register)
  const unameOk = USERNAME_RE.test(form.username.toLowerCase())
  const pwOk = form.password.length >= 6
  const matchOk = form.confirmPassword.length > 0 && form.password === form.confirmPassword

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (isRegister) {
      if (!unameOk) return setError('Username: 3–20 chars, lowercase letters, numbers, . or _')
      if (!pwOk) return setError('Password must be at least 6 characters')
      if (!matchOk) return setError('Passwords do not match')
    }
    setBusy(true)
    try {
      if (isRegister) {
        await register({
          username: form.username.trim().toLowerCase(),
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        })
      } else {
        await login(form.identifier.trim(), form.password)
      }
      toast('Welcome to Moments 🎉', 'success')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <Link to="/" className="absolute top-5 left-5 z-20 hidden lg:block"><Logo size={28} /></Link>
      <div className="absolute top-4 right-4 z-20"><ThemeToggle variant="pill" /></div>

      {/* Showcase — dark mesh gradient with floating app-preview cards */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-center p-14 text-white" style={{ background: '#07070d' }}>
        {/* mesh gradient */}
        <div className="absolute inset-0" style={{
          background:
            'radial-gradient(40rem 40rem at 15% 10%, rgba(255,95,109,0.35), transparent 55%),' +
            'radial-gradient(38rem 38rem at 85% 30%, rgba(59,130,246,0.32), transparent 55%),' +
            'radial-gradient(45rem 45rem at 50% 105%, rgba(162,75,207,0.4), transparent 55%)',
        }} />
        {/* grid texture */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(60% 60% at 50% 40%, black, transparent)',
        }} />

        {/* floating preview cards */}
        <motion.div className="absolute top-16 right-10 glass rounded-2xl p-3 flex items-center gap-2.5 shadow-2xl"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: [0, -10, 0] }} transition={{ opacity: { duration: 0.6 }, y: { duration: 5, repeat: Infinity } }}>
          <span className="w-9 h-9 rounded-full bg-[var(--color-brand-coral)] grid place-items-center"><Heart size={16} className="fill-white text-white" /></span>
          <div className="text-xs"><b>sardor</b> liked your reel</div>
        </motion.div>

        <motion.div className="absolute bottom-24 right-16 w-52 glass rounded-2xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: [0, 12, 0] }} transition={{ opacity: { delay: 0.3, duration: 0.6 }, y: { duration: 6, repeat: Infinity } }}>
          <div className="flex items-center gap-2 p-2.5">
            <span className="story-ring rounded-full p-[2px]"><span className="block w-6 h-6 rounded-full bg-[var(--brand-purple)]" style={{ background: 'linear-gradient(135deg,#ff5f6d,#3b82f6)' }} /></span>
            <span className="text-xs font-bold">nigora</span>
          </div>
          <div className="h-24 bg-gradient-to-br from-[#ff5f6d]/40 via-[#a24bcf]/40 to-[#3b82f6]/40" />
          <div className="flex gap-3 p-2.5 text-white/90"><Heart size={15} /><MessageCircle size={15} /></div>
        </motion.div>

        {/* copy */}
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-semibold mb-6">
            <Sparkles size={13} className="text-[#ff9db0]" /> Your best moments, beautifully shared
          </div>
          <h1 className="text-[3.4rem] font-extrabold leading-[1.02]" style={{ fontFamily: 'var(--font-display)' }}>
            {isRegister ? (<>Join the <span className="text-gradient">moment.</span></>) : (<>Welcome <span className="text-gradient">back.</span></>)}
          </h1>
          <p className="text-lg text-white/75 mt-5">
            Photos, videos, reels & stories — plus real-time chat and calls with the people who matter.
          </p>
          <div className="flex flex-col gap-3 mt-9 text-sm">
            <Feature icon={Camera} label="Post photos, carousels & reels" />
            <Feature icon={Sparkles} label="Stories that vanish in 24 hours" />
            <Feature icon={Zap} label="Real-time messages, calls & video" />
          </div>
        </div>
        <div className="relative z-10 text-white/50 text-sm mt-12">© 2026 Moments</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center"><Logo size={38} /></div>
          <div className="card p-7">
            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-bold mb-1">{isRegister ? 'Create your account' : 'Log in'}</h2>
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  {isRegister ? 'It only takes a few seconds.' : 'Welcome back — we missed you.'}
                </p>

                <form onSubmit={submit} className="space-y-3">
                  {isRegister ? (
                    <>
                      <Input placeholder="Full name" value={form.name} onChange={set('name')} autoComplete="name" required />
                      <div>
                        <Input placeholder="Username" value={form.username} onChange={set('username')} autoComplete="username" required
                          adorn={form.username && (unameOk ? <Check size={16} className="text-emerald-400" /> : <X size={16} className="text-[var(--color-brand-coral)]" />)} />
                        {form.username && !unameOk && <Hint>3–20 chars · a–z, 0–9, . or _</Hint>}
                      </div>
                      <Input placeholder="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
                    </>
                  ) : (
                    <Input placeholder="Username or email" value={form.identifier} onChange={set('identifier')} autoComplete="username" required />
                  )}

                  <Input placeholder="Password" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    autoComplete={isRegister ? 'new-password' : 'current-password'} required
                    adorn={<button type="button" onClick={() => setShowPw((s) => !s)} className="text-[var(--text-faint)] hover:text-[var(--text)]">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />

                  {isRegister && (
                    <Input placeholder="Confirm password" type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" required
                      adorn={form.confirmPassword && (matchOk ? <Check size={16} className="text-emerald-400" /> : <X size={16} className="text-[var(--color-brand-coral)]" />)} />
                  )}

                  {error && <p className="text-sm text-[var(--color-brand-coral)] font-medium">{error}</p>}

                  <Button type="submit" loading={busy} className="w-full !mt-4">{isRegister ? 'Sign up' : 'Log in'}</Button>
                </form>

                {!isRegister && (
                  <>
                    <div className="flex items-center gap-3 my-5">
                      <span className="flex-1 h-px bg-[var(--border)]" />
                      <span className="text-xs text-[var(--text-faint)] font-semibold">NEW HERE?</span>
                      <span className="flex-1 h-px bg-[var(--border)]" />
                    </div>
                    <Button variant="soft" onClick={() => { setMode('register'); setError('') }} className="w-full">Create an account</Button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="text-center text-sm text-[var(--text-muted)] mt-5">
            {isRegister ? 'Already have an account?' : ''}{' '}
            <button onClick={() => { setMode(isRegister ? 'login' : 'register'); setError('') }} className="font-bold text-gradient">
              {isRegister ? 'Log in' : ''}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, label }) {
  return (
    <span className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-white/20 grid place-items-center shrink-0"><Icon size={18} /></span>
      {label}
    </span>
  )
}

function Hint({ children }) {
  return <p className="text-xs text-[var(--text-faint)] mt-1 px-1">{children}</p>
}

function Input({ adorn, ...props }) {
  return (
    <div className="relative">
      <input
        {...props}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 h-12 text-sm outline-none focus:border-[var(--color-brand-purple)] transition placeholder:text-[var(--text-faint)] pr-11"
      />
      {adorn && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{adorn}</span>}
    </div>
  )
}

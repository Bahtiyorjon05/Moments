import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, ArrowRight, Heart, MessageCircle, Play, Compass, Bell, Camera,
  Zap, ShieldCheck, Smartphone, Star, Bookmark,
} from 'lucide-react'
import Logo, { LogoMark } from '../components/ui/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import ThemeToggle from '../components/ui/ThemeToggle.jsx'
import Verified from '../components/ui/Verified.jsx'
import InstallButton from '../components/pwa/InstallButton.jsx'

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
}

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Logo size={28} />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--text-muted)]">
            <a href="#features" className="hover:text-[var(--text)] transition">Features</a>
            <a href="#install" className="hover:text-[var(--text)] transition">Install</a>
            <Link to="/auth" className="hover:text-[var(--text)] transition">Log in</Link>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="hidden lg:inline-flex"><ThemeToggle variant="pill" /></span>
            <span className="lg:hidden"><ThemeToggle className="!w-9 !h-9" /></span>
            <Button size="sm" onClick={() => navigate('/auth')}>Sign up</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <motion.div className="absolute top-6 -left-16 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(255,95,109,0.20)' }}
            animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute -bottom-10 right-0 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(59,130,246,0.20)' }}
            animate={{ y: [0, -36, 0], scale: [1.05, 1, 1.05] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
        <div className="text-center md:text-left">
          <motion.span
            variants={fade} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface text-xs font-semibold text-[var(--text-muted)] mb-5"
          >
            <Sparkles size={13} className="text-[var(--color-brand-purple)]" /> A cleaner, faster social home
          </motion.span>

          <motion.h1
            variants={fade} initial="hidden" animate="show" custom={1}
            className="text-[2.6rem] sm:text-6xl font-extrabold leading-[1.03] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Share your <span className="text-gradient">best moments.</span>
          </motion.h1>

          <motion.p
            variants={fade} initial="hidden" animate="show" custom={2}
            className="text-lg text-[var(--text-muted)] mt-5 max-w-xl mx-auto md:mx-0"
          >
            Photos, videos, reels, stories and real-time chat — all in one beautifully designed place.
            Everything you love, none of the noise.
          </motion.p>

          <motion.div
            variants={fade} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row items-center gap-3 mt-8 justify-center md:justify-start"
          >
            <Button size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto">
              Get started — it's free <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="soft" onClick={() => navigate('/auth')} className="w-full sm:w-auto">
              Log in
            </Button>
          </motion.div>

          <motion.div variants={fade} initial="hidden" animate="show" custom={4} className="mt-6 flex items-center gap-4 justify-center md:justify-start text-sm text-[var(--text-faint)]">
            <div className="flex -space-x-2">
              {[12, 5, 33, 24].map((n) => (
                <img key={n} src={`https://i.pravatar.cc/60?img=${n}`} alt="" className="w-7 h-7 rounded-full border-2 border-[var(--bg)]" />
              ))}
            </div>
            <span className="flex items-center gap-1">
              <Star size={13} className="fill-[#ffb14e] text-[#ffb14e]" /> Loved by creators everywhere
            </span>
          </motion.div>
        </div>

        {/* Device mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative mx-auto hidden md:block"
        >
          <PhoneMockup />
          <FloatingCard className="hidden sm:flex -left-6 top-24" delay={0.8}>
            <span className="w-8 h-8 rounded-full bg-[var(--color-brand-coral)] grid place-items-center"><Heart size={16} className="fill-white text-white" /></span>
            <div className="text-xs"><b>maya.chen</b> liked your post</div>
          </FloatingCard>
          <FloatingCard className="hidden sm:flex -right-4 bottom-28" delay={1.1}>
            <span className="w-8 h-8 rounded-full brand-gradient grid place-items-center"><MessageCircle size={15} className="text-white" /></span>
            <div className="text-xs"><b>leoblanc</b> · trail run this weekend?</div>
          </FloatingCard>
        </motion.div>
      </section>

      {/* Feature pills */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-4">
        <div className="flex flex-wrap justify-center gap-2.5">
          {['📸 Photos', '🎬 Reels', '⭕ Stories', '💬 Live chat', '🧭 Explore', '🔖 Collections', '🌗 Dark mode', '📲 Installable'].map((t) => (
            <span key={t} className="px-4 py-2 rounded-full surface text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:-translate-y-0.5 transition">{t}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <SectionHead
          eyebrow="Everything in one place"
          title="All your favorite ways to connect"
          subtitle="Built with a modern design system and buttery-smooth interactions — on every screen size."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} custom={i % 3}
              className="card p-6 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="w-12 h-12 rounded-2xl brand-gradient grid place-items-center text-white mb-4">
                <f.icon size={22} />
              </div>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1.5">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Highlights strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="card p-5 text-center">
              <div className="w-11 h-11 mx-auto rounded-xl surface grid place-items-center mb-2 text-[var(--color-brand-purple)]"><h.icon size={20} /></div>
              <p className="font-bold">{h.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{h.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install CTA */}
      <section id="install" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative card overflow-hidden p-8 sm:p-12 text-center brand-gradient text-white">
          <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(50vmax 50vmax at 80% 20%, rgba(255,255,255,.4), transparent 60%)' }} />
          <div className="relative z-10 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/20 grid place-items-center mx-auto mb-5"><Smartphone size={30} /></div>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>Take Moments anywhere</h2>
            <p className="text-white/85 mt-3">
              Install Moments straight to your phone — works on <b>iPhone & Android</b>, right from your browser.
              No App Store, no APK, no downloads.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
              <InstallButton variant="solid" size="lg" label="Install the app" className="w-full sm:w-auto !bg-white !text-[#1a1030]" />
              <Button size="lg" variant="ghost" onClick={() => navigate('/auth')} className="w-full sm:w-auto !text-white hover:!bg-white/15">
                Create free account <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Moments</span>
          </div>
          <p className="text-sm text-[var(--text-faint)]">© 2026 Moments — share your best moments.</p>
          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
            <Link to="/auth" className="hover:text-[var(--text)]">Log in</Link>
            <Link to="/auth" className="hover:text-[var(--text)]">Sign up</Link>
            <ThemeToggle variant="pill" />
          </div>
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  { icon: Camera, title: 'A feed you control', desc: 'See posts from the people you follow — carousels, captions, likes, comments and saves.' },
  { icon: Play, title: 'Reels that autoplay', desc: 'Full-screen vertical video with sound, likes and comments. Swipe and get lost.' },
  { icon: Sparkles, title: 'Stories in 24h', desc: 'Share fleeting moments with an immersive, tap-through story viewer.' },
  { icon: MessageCircle, title: 'Real-time chat', desc: 'Direct messages with a delightful, fast interface and live updates.' },
  { icon: Compass, title: 'Explore & discover', desc: 'A gorgeous discovery grid tuned to what people love most.' },
  { icon: Bell, title: 'Stay in the loop', desc: 'Get notified about likes, comments and new followers — grouped and clean.' },
]

const HIGHLIGHTS = [
  { icon: Zap, label: 'Blazing fast', sub: 'Instant, optimistic UI' },
  { icon: Smartphone, label: 'Installable', sub: 'iOS & Android PWA' },
  { icon: ShieldCheck, label: 'Yours', sub: 'Your data, your DB' },
  { icon: Bookmark, label: 'Save anything', sub: 'Collections built in' },
]

function SectionHead({ eyebrow, title, subtitle }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-purple)]">{eyebrow}</span>
      <h2 className="text-3xl sm:text-4xl font-extrabold mt-2" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
      <p className="text-[var(--text-muted)] mt-3">{subtitle}</p>
    </div>
  )
}

function FloatingCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
      transition={{ opacity: { delay, duration: 0.5 }, scale: { delay, duration: 0.5 }, y: { delay: delay + 0.5, duration: 3.5, repeat: Infinity, ease: 'easeInOut' } }}
      className={`absolute z-20 glass rounded-2xl px-3 py-2.5 flex items-center gap-2.5 shadow-[var(--shadow-soft)] ${className}`}
    >
      {children}
    </motion.div>
  )
}

function PhoneMockup() {
  return (
    <div className="relative w-[280px] sm:w-[320px] mx-auto">
      <div className="rounded-[2.5rem] p-3 bg-[var(--bg-elev-2)] border border-[var(--border-strong)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="rounded-[2rem] overflow-hidden bg-[var(--bg)] aspect-[9/19] relative">
          {/* status notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black/60 z-20" />
          {/* mini app */}
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 pt-7 pb-2">
              <span className="text-sm font-extrabold text-gradient" style={{ fontFamily: 'var(--font-display)' }}>Moments</span>
              <div className="flex gap-2 text-[var(--text-muted)]"><Heart size={16} /><MessageCircle size={16} /></div>
            </div>
            {/* stories */}
            <div className="flex gap-3 px-4 py-2 overflow-hidden">
              {[12, 5, 13, 9, 15].map((n) => (
                <div key={n} className="story-ring rounded-full p-[2px] shrink-0">
                  <img src={`https://i.pravatar.cc/60?img=${n}`} alt="" className="w-11 h-11 rounded-full border-2 border-[var(--bg)]" />
                </div>
              ))}
            </div>
            {/* post */}
            <div className="flex items-center gap-2 px-4 py-2">
              <img src="https://i.pravatar.cc/60?img=12" alt="" className="w-7 h-7 rounded-full" />
              <span className="text-xs font-bold flex items-center gap-1">alex.rivera <Verified size={11} /></span>
            </div>
            <img src="https://picsum.photos/seed/sintra1/600/700" alt="" className="w-full flex-1 object-cover" />
            <div className="flex items-center gap-4 px-4 py-3">
              <Heart size={20} className="fill-[var(--color-brand-coral)] text-[var(--color-brand-coral)]" />
              <MessageCircle size={20} />
              <Play size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

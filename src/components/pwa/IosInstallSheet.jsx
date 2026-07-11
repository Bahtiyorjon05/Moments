import { Share, Plus, Check } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import { LogoMark } from '../ui/Logo.jsx'
import { usePWA } from '../../store/pwa.js'

// iOS Safari has no install prompt API — guide the user through Add to Home Screen.
export default function IosInstallSheet() {
  const { iosSheetOpen, closeIosSheet } = usePWA()
  return (
    <Modal open={iosSheetOpen} onClose={closeIosSheet} title="Install Moments" maxWidth={420}>
      <div className="p-6">
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <LogoMark size={56} />
          <p className="text-sm text-[var(--text-muted)]">
            Add Moments to your Home Screen for a full-screen, app-like experience — no App Store needed.
          </p>
        </div>
        <ol className="space-y-3">
          <Step n={1} icon={Share} accent>
            Tap the <b>Share</b> button in Safari's toolbar
          </Step>
          <Step n={2} icon={Plus}>
            Scroll and choose <b>Add to Home Screen</b>
          </Step>
          <Step n={3} icon={Check}>
            Tap <b>Add</b> — Moments now lives on your Home Screen
          </Step>
        </ol>
      </div>
    </Modal>
  )
}

function Step({ n, icon: Icon, children, accent }) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full surface grid place-items-center text-sm font-bold shrink-0">{n}</span>
      <span className="text-sm flex-1">{children}</span>
      <Icon size={20} className={accent ? 'text-[var(--color-brand-blue)]' : 'text-[var(--text-muted)]'} />
    </li>
  )
}

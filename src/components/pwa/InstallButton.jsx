import { Download } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { usePWA } from '../../store/pwa.js'
import { useUI } from '../../store/ui.js'

// Renders nothing once installed. Otherwise a button that installs the PWA
// (native prompt on Android/desktop, how-to sheet on iOS).
export default function InstallButton({ variant = 'primary', size = 'md', className = '', label = 'Install app', icon = true }) {
  const { promptInstall, showInstall } = usePWA()
  const { toast } = useUI()
  if (!showInstall()) return null

  async function onClick() {
    const r = await promptInstall()
    if (r === 'accepted') toast('Installing Moments…', 'success')
    else if (r === 'unsupported') toast('Open in Chrome or Safari to install', 'info')
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={onClick}>
      {icon && <Download size={16} />} {label}
    </Button>
  )
}

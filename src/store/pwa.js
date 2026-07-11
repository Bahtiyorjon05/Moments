import { create } from 'zustand'

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream

export const usePWA = create((set, get) => ({
  deferredPrompt: null,
  canInstall: false,
  installed: isStandalone(),
  ios: isIOS(),
  iosSheetOpen: false,

  // Wire up once at app boot.
  init: () => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      set({ deferredPrompt: e, canInstall: true })
    })
    window.addEventListener('appinstalled', () => {
      set({ installed: true, canInstall: false, deferredPrompt: null })
    })
  },

  // Trigger native prompt, or open the iOS how-to sheet.
  promptInstall: async () => {
    const { deferredPrompt, ios, installed } = get()
    if (installed) return 'installed'
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      set({ deferredPrompt: null, canInstall: false })
      return outcome // 'accepted' | 'dismissed'
    }
    if (ios) {
      set({ iosSheetOpen: true })
      return 'ios'
    }
    return 'unsupported'
  },

  closeIosSheet: () => set({ iosSheetOpen: false }),
}))

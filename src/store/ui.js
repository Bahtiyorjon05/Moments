import { create } from 'zustand'

const stored = localStorage.getItem('moments_theme')
const initialTheme = stored || 'dark'
document.documentElement.setAttribute('data-theme', initialTheme)

let toastId = 0

export const useUI = create((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('moments_theme', theme)
    set({ theme })
  },

  // lightweight toast queue
  toasts: [],
  toast: (message, type = 'info') => {
    const id = ++toastId
    set({ toasts: [...get().toasts, { id, message, type }] })
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) })
    }, 3200)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  // global modals
  createOpen: false,
  setCreateOpen: (createOpen) => set({ createOpen }),
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}))

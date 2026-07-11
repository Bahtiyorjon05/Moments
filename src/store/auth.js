import { create } from 'zustand'
import { api, setToken, getToken } from '../lib/api.js'

export const useAuth = create((set, get) => ({
  user: null,
  status: 'loading', // 'loading' | 'authed' | 'guest'

  // Restore session from a stored token on boot.
  init: async () => {
    if (!getToken()) return set({ status: 'guest' })
    try {
      const { user } = await api.me()
      set({ user, status: 'authed' })
    } catch {
      setToken(null)
      set({ user: null, status: 'guest' })
    }
  },

  login: async (identifier, password) => {
    const { token, user } = await api.login({ identifier, password })
    setToken(token)
    set({ user, status: 'authed' })
    return user
  },

  register: async (payload) => {
    const { token, user } = await api.register(payload)
    setToken(token)
    set({ user, status: 'authed' })
    return user
  },

  logout: () => {
    setToken(null)
    set({ user: null, status: 'guest' })
  },

  setUser: (user) => set({ user }),
  patchUser: (patch) => set({ user: { ...get().user, ...patch } }),
}))

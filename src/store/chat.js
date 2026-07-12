import { create } from 'zustand'
import { api } from '../lib/api.js'

// Lightweight "live" chat state: polls conversations, raises toasts for new
// incoming messages, and tracks an unread badge. (Polling keeps it serverless-safe.)
export const useChat = create((set, get) => ({
  unread: 0,
  conversations: [],
  activeConvo: null,
  seen: {},        // convId -> last message ts the user has seen
  _notified: {},   // convId -> last message ts we've toasted
  _baseline: false,
  _me: null,

  setActive: (id) => {
    set({ activeConvo: id })
    if (id) get().markSeen(id)
  },

  markSeen: (id) => {
    const c = get().conversations.find((x) => x.id === id)
    const ts = c?.last_message?.created_at || new Date().toISOString()
    set((s) => ({ seen: { ...s.seen, [id]: ts } }))
    get()._recount()
  },

  _recount: () => {
    const { conversations, seen, activeConvo, _me } = get()
    const n = conversations.filter(
      (c) => c.last_message && c.last_message.sender_id !== _me &&
        c.last_message.created_at !== seen[c.id] && c.id !== activeConvo
    ).length
    set({ unread: n })
  },

  poll: async (me, toast) => {
    try {
      const conversations = await api.conversations()
      const { seen, _notified, _baseline, activeConvo } = get()
      set({ conversations, _me: me })
      const nextSeen = { ...seen }
      const nextNotified = { ..._notified }
      for (const c of conversations) {
        const last = c.last_message
        if (!last) continue
        if (!_baseline) { nextSeen[c.id] = last.created_at; nextNotified[c.id] = last.created_at; continue }
        if (last.sender_id === me || c.id === activeConvo) { nextSeen[c.id] = last.created_at; continue }
        if (last.created_at !== nextNotified[c.id] && last.created_at !== nextSeen[c.id]) {
          nextNotified[c.id] = last.created_at
          toast?.(`${c.peer?.username || 'New message'}: ${String(last.body).slice(0, 42)}`, 'info')
        }
      }
      set({ seen: nextSeen, _notified: nextNotified, _baseline: true })
      get()._recount()
    } catch { /* offline is fine */ }
  },

  reset: () => set({ unread: 0, conversations: [], activeConvo: null, seen: {}, _notified: {}, _baseline: false }),
}))

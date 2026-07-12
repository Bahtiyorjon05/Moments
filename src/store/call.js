import { create } from 'zustand'
import { api } from '../lib/api.js'

// Free public STUN + TURN (Open Relay) so calls connect across networks/NAT.
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
]

let pc = null
let pendingIce = []
let inboxTimer = null

function stopStream(s) { s?.getTracks().forEach((t) => t.stop()) }

export const useCall = create((set, get) => ({
  status: 'idle', // idle | calling | ringing | connecting | connected | ended
  kind: 'video',  // 'audio' | 'video'
  peer: null,     // the other user
  conversationId: null,
  localStream: null,
  remoteStream: null,
  incoming: null, // { from, offer, callKind, conversationId }
  muted: false,
  cameraOff: false,
  me: null,

  // ── global inbox polling (runs while logged in) ──
  startInbox: (meId) => {
    set({ me: meId })
    get().stopInbox()
    const tick = async () => {
      try {
        const signals = await api.callInbox()
        for (const s of signals) await get()._onSignal(s)
      } catch { /* ignore */ }
    }
    inboxTimer = setInterval(tick, 1500)
    tick()
  },
  stopInbox: () => { if (inboxTimer) clearInterval(inboxTimer); inboxTimer = null },

  _send: (to, type, data, callKind) =>
    api.callSignal({ conversationId: get().conversationId, to, type, data, callKind }).catch(() => {}),

  _makePc: (peerId) => {
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pc.ontrack = (e) => { set({ remoteStream: e.streams[0] }) }
    pc.onicecandidate = (e) => { if (e.candidate) get()._send(peerId, 'ice', e.candidate) }
    pc.onconnectionstatechange = () => {
      if (pc?.connectionState === 'connected') set({ status: 'connected' })
      if (['failed', 'disconnected', 'closed'].includes(pc?.connectionState)) {
        if (get().status !== 'ended') get().hangup(false)
      }
    }
    return pc
  },

  // ── caller ──
  startCall: async (peer, conversationId, kind = 'video') => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true, video: kind === 'video' ? { facingMode: 'user' } : false,
      })
      set({ status: 'calling', kind, peer, conversationId, localStream, incoming: null })
      const conn = get()._makePc(peer.id)
      localStream.getTracks().forEach((t) => conn.addTrack(t, localStream))
      const offer = await conn.createOffer()
      await conn.setLocalDescription(offer)
      get()._send(peer.id, 'offer', offer, kind)
    } catch (e) {
      set({ status: 'idle' })
      throw e
    }
  },

  // ── callee accepts ──
  accept: async () => {
    const { incoming } = get()
    if (!incoming) return
    const kind = incoming.callKind || 'video'
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true, video: kind === 'video' ? { facingMode: 'user' } : false,
      })
      set({ status: 'connecting', kind, peer: incoming.from, conversationId: incoming.conversationId, localStream, incoming: null })
      const conn = get()._makePc(incoming.from.id)
      localStream.getTracks().forEach((t) => conn.addTrack(t, localStream))
      await conn.setRemoteDescription(new RTCSessionDescription(incoming.offer))
      for (const c of pendingIce) { try { await conn.addIceCandidate(c) } catch {} }
      pendingIce = []
      const answer = await conn.createAnswer()
      await conn.setLocalDescription(answer)
      get()._send(incoming.from.id, 'answer', answer)
    } catch (e) {
      set({ status: 'idle' })
      throw e
    }
  },

  decline: () => {
    const inc = get().incoming
    if (inc) get()._send(inc.from.id, 'reject', null)
    set({ incoming: null, status: 'idle' })
  },

  toggleMute: () => {
    const s = get().localStream
    const on = !get().muted
    s?.getAudioTracks().forEach((t) => (t.enabled = !on))
    set({ muted: on })
  },
  toggleCamera: () => {
    const s = get().localStream
    const off = !get().cameraOff
    s?.getVideoTracks().forEach((t) => (t.enabled = !off))
    set({ cameraOff: off })
  },

  hangup: (notify = true) => {
    const { peer } = get()
    if (notify && peer) get()._send(peer.id, 'hangup', null)
    try { pc?.close() } catch {}
    pc = null; pendingIce = []
    stopStream(get().localStream); stopStream(get().remoteStream)
    set({ status: 'idle', peer: null, conversationId: null, localStream: null, remoteStream: null, incoming: null, muted: false, cameraOff: false })
  },

  // ── incoming signal router ──
  _onSignal: async (s) => {
    const { status } = get()
    if (s.type === 'offer') {
      if (status !== 'idle') { get()._send(s.from.id, 'reject', null); return } // busy
      set({ status: 'ringing', incoming: { from: s.from, offer: s.data, callKind: s.callKind, conversationId: s.conversationId } })
    } else if (s.type === 'answer') {
      if (pc && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(s.data))
        set({ status: 'connecting' })
      }
    } else if (s.type === 'ice') {
      if (pc && pc.remoteDescription) { try { await pc.addIceCandidate(s.data) } catch {} }
      else pendingIce.push(s.data)
    } else if (s.type === 'hangup' || s.type === 'reject') {
      get().hangup(false)
    }
  },
}))

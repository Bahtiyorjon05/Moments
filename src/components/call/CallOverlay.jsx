import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, PhoneIncoming } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import { useCall } from '../../store/call.js'
import { useUI } from '../../store/ui.js'

export default function CallOverlay() {
  const {
    status, kind, peer, incoming, localStream, remoteStream, muted, cameraOff,
    accept, decline, hangup, toggleMute, toggleCamera,
  } = useCall()
  const { toast } = useUI()
  const localRef = useRef(null)
  const remoteRef = useRef(null)

  useEffect(() => { if (localRef.current && localStream) localRef.current.srcObject = localStream }, [localStream, status])
  useEffect(() => { if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream }, [remoteStream, status])

  async function onAccept() { try { await accept() } catch { toast('Could not access camera/mic', 'error') } }

  const inCall = ['calling', 'connecting', 'connected'].includes(status)

  return createPortal(
    <AnimatePresence>
      {status === 'ringing' && incoming && (
        <motion.div key="ring" className="fixed inset-0 z-[120] grid place-items-center bg-black/70 backdrop-blur-md p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="card p-8 w-full max-w-sm text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <span className="absolute inset-0 rounded-full animate-pulse-ring" />
              <Avatar src={incoming.from.avatar_url} alt={incoming.from.username} size={96} />
            </div>
            <p className="text-xs font-semibold text-[var(--text-muted)] flex items-center justify-center gap-1.5">
              <PhoneIncoming size={13} /> Incoming {incoming.callKind === 'audio' ? 'voice' : 'video'} call
            </p>
            <h2 className="text-xl font-bold mt-1">{incoming.from.name || incoming.from.username}</h2>
            <p className="text-sm text-[var(--text-muted)]">@{incoming.from.username}</p>
            <div className="flex items-center justify-center gap-8 mt-8">
              <button onClick={decline} className="flex flex-col items-center gap-2">
                <span className="w-16 h-16 rounded-full bg-[var(--color-brand-coral)] grid place-items-center text-white shadow-lg active:scale-90 transition"><PhoneOff size={26} /></span>
                <span className="text-xs text-[var(--text-muted)]">Decline</span>
              </button>
              <button onClick={onAccept} className="flex flex-col items-center gap-2">
                <span className="w-16 h-16 rounded-full bg-emerald-500 grid place-items-center text-white shadow-lg animate-bounce active:scale-90 transition"><Phone size={26} /></span>
                <span className="text-xs text-[var(--text-muted)]">Accept</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {inCall && (
        <motion.div key="call" className="fixed inset-0 z-[120] bg-[#07070d] flex flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* remote (full) */}
          <div className="relative flex-1 overflow-hidden grid place-items-center">
            {kind === 'video' ? (
              <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : null}
            {(kind === 'audio' || status !== 'connected') && (
              <div className="absolute inset-0 grid place-items-center text-center text-white">
                <div className="flex flex-col items-center gap-3">
                  <Avatar src={peer?.avatar_url} alt={peer?.username} size={110} />
                  <h2 className="text-2xl font-bold">{peer?.name || peer?.username}</h2>
                  <p className="text-white/70 text-sm">
                    {status === 'connected' ? 'In call' : status === 'calling' ? 'Ringing…' : 'Connecting…'}
                  </p>
                </div>
              </div>
            )}

            {/* local PiP */}
            {kind === 'video' && (
              <div className="absolute top-4 right-4 w-28 sm:w-36 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-black">
                <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {cameraOff && <div className="absolute inset-0 grid place-items-center bg-black/70 text-white/70"><VideoOff size={22} /></div>}
              </div>
            )}
          </div>

          {/* controls */}
          <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex items-center justify-center gap-5">
            <CtrlBtn onClick={toggleMute} active={muted} label={muted ? 'Unmute' : 'Mute'}>
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
            </CtrlBtn>
            {kind === 'video' && (
              <CtrlBtn onClick={toggleCamera} active={cameraOff} label={cameraOff ? 'Start video' : 'Stop video'}>
                {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
              </CtrlBtn>
            )}
            <button onClick={() => hangup(true)} className="w-16 h-16 rounded-full bg-[var(--color-brand-coral)] grid place-items-center text-white shadow-lg active:scale-90 transition">
              <PhoneOff size={26} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function CtrlBtn({ children, onClick, active, label }) {
  return (
    <button onClick={onClick} title={label}
      className={`w-14 h-14 rounded-full grid place-items-center transition active:scale-90 ${active ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}`}>
      {children}
    </button>
  )
}

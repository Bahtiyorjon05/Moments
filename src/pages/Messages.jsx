import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, MessageCircle, Phone, Video, Info, Smile, X, Reply, Pencil, Trash2, Paperclip, Mic, Square, Users } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import EmojiPicker from '../components/ui/EmojiPicker.jsx'
import UserName from '../components/ui/UserName.jsx'
import Empty from '../components/ui/Empty.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import NewGroupModal from '../components/chat/NewGroupModal.jsx'
import { api } from '../lib/api.js'
import { uploadMedia } from '../lib/upload.js'
import { checkNSFW } from '../lib/nsfw.js'
import { useAuth } from '../store/auth.js'
import { useChat } from '../store/chat.js'
import { useCall } from '../store/call.js'
import { useUI } from '../store/ui.js'
import { timeAgo, clockTime, timeAgoLong } from '../lib/format.js'

export default function Messages() {
  const { id } = useParams()
  const [convos, setConvos] = useState(null)
  const [groupOpen, setGroupOpen] = useState(false)
  const setActive = useChat((s) => s.setActive)

  const load = useCallback(() => api.conversations().then(setConvos).catch(() => setConvos([])), [])
  useEffect(() => { load() }, [load])

  // Mark the open conversation active so its incoming messages don't toast.
  useEffect(() => { setActive(id || null); return () => setActive(null) }, [id, setActive])

  const active = convos?.find((c) => c.id === id)

  return (
    <div className={`${id ? 'h-[100dvh]' : 'h-[calc(100dvh-3.5rem)]'} md:h-screen flex max-w-[1100px] mx-auto border-x border-[var(--border)]`}>
      {/* list */}
      <div className={`${id ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[360px] shrink-0 border-r border-[var(--border)]`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border)]">
          <h1 className="text-lg font-bold">Messages</h1>
          <button onClick={() => setGroupOpen(true)} title="New group" className="flex items-center gap-1.5 text-sm font-semibold text-gradient">
            <Users size={17} /> New group
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convos === null ? (
            <div className="grid place-items-center py-10"><Spinner /></div>
          ) : convos.length === 0 ? (
            <Empty icon={MessageCircle} title="No messages yet" subtitle="Start a chat from someone's profile." />
          ) : (
            convos.map((c) => <ConvoRow key={c.id} c={c} active={c.id === id} />)
          )}
        </div>
      </div>

      {/* thread */}
      <div className={`${id ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
        {id && active ? (
          <Thread key={id} convo={active} onSent={load} />
        ) : (
          <div className="flex-1 grid place-items-center text-center px-6">
            <div>
              <div className="w-24 h-24 rounded-full border-2 border-[var(--border-strong)] grid place-items-center mx-auto mb-4">
                <Send size={40} strokeWidth={1.2} className="text-[var(--text-muted)]" />
              </div>
              <h2 className="text-xl font-semibold">Your messages</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">Select a conversation to start chatting.</p>
            </div>
          </div>
        )}
      </div>

      <NewGroupModal open={groupOpen} onClose={() => setGroupOpen(false)} />
    </div>
  )
}

function convoName(c) { return c.is_group ? (c.title || 'Group') : c.peer?.username }
function lastPreview(last) {
  if (!last) return 'Say hi 👋'
  if (last.media_type === 'audio') return '🎤 Voice message'
  if (last.media_type === 'video') return '🎬 Video'
  if (last.media_type === 'image') return '📷 Photo'
  return last.body
}

function ConvoRow({ c, active }) {
  const { user } = useAuth()
  const last = c.last_message
  const mine = last?.sender_id === user?.id
  return (
    <Link
      to={`/messages/${c.id}`}
      className={`flex items-center gap-3 px-4 py-3 transition ${active ? 'bg-[var(--surface-strong)]' : 'hover:bg-[var(--surface)]'}`}
    >
      {c.is_group ? (
        <span className="w-[54px] h-[54px] rounded-full brand-gradient grid place-items-center text-white shrink-0"><Users size={24} /></span>
      ) : (
        <Avatar src={c.peer?.avatar_url} alt={c.peer?.username} size={54} ring="unseen" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{convoName(c)}{c.is_group && <span className="text-[var(--text-faint)] font-normal"> · {c.members?.length || 0}</span>}</p>
        <p className="text-xs text-[var(--text-muted)] truncate">
          {last ? `${mine ? 'You: ' : ''}${lastPreview(last)}` : 'Say hi 👋'}
          {last && <span className="text-[var(--text-faint)]"> · {timeAgo(last.created_at)}</span>}
        </p>
      </div>
    </Link>
  )
}

function Thread({ convo, onSent }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const startCall = useCall((s) => s.startCall)
  const { toast } = useUI()
  const [messages, setMessages] = useState(null)
  const [emojiOpen, setEmojiOpen] = useState(false)

  async function call(kind) {
    if (!convo.peer) return
    try { await startCall(convo.peer, convo.id, kind) }
    catch { toast('Could not access your camera/microphone', 'error') }
  }
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [editing, setEditing] = useState(null) // message being edited
  const [recording, setRecording] = useState(false)
  const [sending, setSending] = useState(false)
  const recorderRef = useRef(null)
  const attachRef = useRef(null)
  const scrollRef = useRef(null)
  const endRef = useRef(null)

  const fetchMessages = useCallback(async (scroll) => {
    try {
      const msgs = await api.messages(convo.id)
      setMessages((prev) => {
        if (prev && prev.length === msgs.length) return prev
        if (scroll !== false) requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: prev ? 'smooth' : 'auto' }))
        return msgs
      })
    } catch { setMessages([]) }
  }, [convo.id])

  useEffect(() => {
    setMessages(null)
    fetchMessages()
    const t = setInterval(() => fetchMessages(false), 3500) // poll for new
    return () => clearInterval(t)
  }, [fetchMessages])

  async function send(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return

    // Editing an existing message
    if (editing) {
      const id = editing.id
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, body, edited: true } : x)))
      setEditing(null); setText('')
      try { await api.editMessage(id, body) } catch { toast('Could not edit', 'error') }
      return
    }

    setText('')
    const replyId = replyTo?.id || null
    const reply_to = replyTo ? { id: replyTo.id, body: replyTo.body, sender_id: replyTo.sender_id } : null
    setReplyTo(null)
    const optimistic = { id: `tmp-${Date.now()}`, body, sender_id: user.id, created_at: new Date().toISOString(), pending: true, reply_to }
    setMessages((m) => [...(m || []), optimistic])
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }))
    try {
      const saved = await api.sendMessage(convo.id, { body, replyToId: replyId })
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? saved : x)))
      onSent?.()
    } catch {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id))
      setText(body)
    }
  }

  async function removeMsg(id) {
    setMessages((m) => m.filter((x) => x.id !== id))
    try { await api.deleteMessage(id) } catch { toast('Could not delete', 'error') }
  }
  function startEdit(m) { setEditing(m); setText(m.body); setReplyTo(null) }
  function startReply(m) { setReplyTo(m); setEditing(null) }

  async function react(id, emoji) {
    setMessages((ms) => ms.map((m) => {
      if (m.id !== id) return m
      const others = (m.reactions || []).filter((r) => r.user_id !== user.id)
      const had = (m.reactions || []).find((r) => r.user_id === user.id && r.emoji === emoji)
      return { ...m, reactions: had ? others : [...others, { emoji, user_id: user.id }] }
    }))
    const had = messages.find((m) => m.id === id)?.reactions?.some((r) => r.user_id === user.id && r.emoji === emoji)
    try { had ? await api.unreactMessage(id) : await api.reactMessage(id, emoji) } catch { /* ignore */ }
  }

  async function sendMediaFile(file, forcedType) {
    if (!file) return
    setSending(true)
    try {
      if (await checkNSFW(file)) { toast('Explicit media blocked', 'error'); return }
      const up = await uploadMedia(file)
      const mediaType = forcedType || up.type
      const saved = await api.sendMessage(convo.id, { mediaUrl: up.url, mediaType })
      setMessages((m) => [...(m || []), saved])
      onSent?.()
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }))
    } catch (e) { toast(e.message || 'Could not send', 'error') }
    finally { setSending(false) }
  }

  async function toggleRecording() {
    if (recording) { recorderRef.current?.stop(); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks = []
      mr.ondataavailable = (e) => chunks.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        const blob = new Blob(chunks, { type: 'audio/webm' })
        if (blob.size < 800) return // too short
        await sendMediaFile(new File([blob], 'voice.webm', { type: 'audio/webm' }), 'audio')
      }
      recorderRef.current = mr
      mr.start()
      setRecording(true)
    } catch { toast('Microphone unavailable', 'error') }
  }

  return (
    <>
      {/* header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-[var(--border)] shrink-0 glass">
        <button onClick={() => navigate('/messages')} className="md:hidden p-1 -ml-1"><ArrowLeft size={22} /></button>
        {convo.is_group ? (
          <>
            <span className="w-10 h-10 rounded-full brand-gradient grid place-items-center text-white shrink-0"><Users size={20} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{convo.title || 'Group'}</p>
              <p className="text-xs text-[var(--text-faint)] truncate">{(convo.members || []).map((u) => u.username).join(', ')}</p>
            </div>
          </>
        ) : (
          <>
            <Avatar src={convo.peer?.avatar_url} alt={convo.peer?.username} size={40} to={`/u/${convo.peer?.username}`} />
            <div className="min-w-0 flex-1">
              <UserName user={convo.peer || {}} className="text-sm" />
              <p className="text-xs text-[var(--text-faint)]">{timeAgoLong(convo.last_message?.created_at || Date.now())}</p>
            </div>
            <button onClick={() => call('audio')} title="Voice call" className="p-2 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"><Phone size={20} /></button>
            <button onClick={() => call('video')} title="Video call" className="p-2 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"><Video size={20} /></button>
          </>
        )}
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
        {messages === null ? (
          <div className="grid place-items-center py-10"><Spinner /></div>
        ) : (
          <>
            <div className="flex flex-col items-center py-6 gap-2">
              {convo.is_group ? (
                <>
                  <span className="w-[72px] h-[72px] rounded-full brand-gradient grid place-items-center text-white"><Users size={30} /></span>
                  <p className="text-base font-bold">{convo.title || 'Group'}</p>
                  <p className="text-sm text-[var(--text-muted)]">{(convo.members || []).length} members</p>
                </>
              ) : (
                <>
                  <Avatar src={convo.peer?.avatar_url} alt={convo.peer?.username} size={72} />
                  <UserName user={convo.peer || {}} className="text-base" />
                  <p className="text-sm text-[var(--text-muted)]">You're connected on Moments</p>
                </>
              )}
            </div>
            {messages.map((m, i) => {
              const mine = m.sender_id === user.id
              const prev = messages[i - 1]
              const grouped = prev && prev.sender_id === m.sender_id
              return (
                <MessageBubble key={m.id} m={m} mine={mine} grouped={grouped} me={user.id} isGroup={convo.is_group}
                  onReply={() => startReply(m)} onEdit={() => startEdit(m)} onDelete={() => removeMsg(m.id)}
                  onReact={(emoji) => react(m.id, emoji)} />
              )
            })}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* composer */}
      <form onSubmit={send} className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-[var(--border)] shrink-0 relative">
        <AnimatePresence>
          {emojiOpen && (
            <div className="absolute bottom-full left-3 mb-2 z-20">
              <EmojiPicker onSelect={(e) => setText((t) => t + e)} onClose={() => setEmojiOpen(false)} />
            </div>
          )}
        </AnimatePresence>
        {(replyTo || editing) && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl surface text-sm">
            <div className="w-1 self-stretch rounded-full brand-gradient" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--color-brand-purple)]">{editing ? 'Editing message' : `Replying to ${replyTo.sender_id === user.id ? 'yourself' : convo.peer?.username}`}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{(editing || replyTo).body}</p>
            </div>
            <button type="button" onClick={() => { setReplyTo(null); setEditing(null); if (editing) setText('') }} className="p-1 rounded-full hover:bg-[var(--surface-strong)]"><X size={15} /></button>
          </div>
        )}
        <div className="flex items-center gap-1 surface rounded-full pl-2 pr-2 h-12">
          <button type="button" onClick={() => setEmojiOpen((o) => !o)}
            className={`w-9 h-9 grid place-items-center rounded-full transition shrink-0 ${emojiOpen ? 'text-[var(--color-brand-purple)] bg-[var(--surface-strong)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-strong)]'}`}>
            <Smile size={21} />
          </button>
          <button type="button" onClick={() => attachRef.current?.click()} disabled={sending || recording}
            className="w-9 h-9 grid place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-strong)] transition shrink-0">
            <Paperclip size={19} />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={recording ? 'Recording voice…' : sending ? 'Sending…' : editing ? 'Edit message…' : 'Message…'}
            disabled={recording}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm"
          />
          {text.trim() ? (
            <button type="submit" className="w-9 h-9 rounded-full grid place-items-center brand-gradient text-white transition active:scale-90 shrink-0">
              <Send size={17} />
            </button>
          ) : (
            <button type="button" onClick={toggleRecording} disabled={sending}
              className={`w-9 h-9 rounded-full grid place-items-center transition active:scale-90 shrink-0 ${recording ? 'bg-[var(--color-brand-coral)] text-white animate-pulse' : 'brand-gradient text-white'}`}>
              {recording ? <Square size={16} className="fill-white" /> : <Mic size={18} />}
            </button>
          )}
        </div>
        <input ref={attachRef} type="file" accept="image/*,video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) sendMediaFile(f) }} />
      </form>
    </>
  )
}

const QUICK = ['❤️', '😂', '👍', '😮', '😢', '🙏', '🔥']

// A chat bubble: media/text, reply-preview, reactions, timestamp, and a menu.
function MessageBubble({ m, mine, grouped, me, isGroup, onReply, onEdit, onDelete, onReact }) {
  const [open, setOpen] = useState(false)
  const isMedia = !!m.media_url

  // aggregate reactions by emoji
  const counts = {}
  for (const r of m.reactions || []) counts[r.emoji] = (counts[r.emoji] || 0) + 1
  const chips = Object.entries(counts)

  return (
    <div className={`group flex flex-col ${mine ? 'items-end' : 'items-start'} ${grouped ? 'mt-0.5' : 'mt-3'}`}>
      {isGroup && !mine && !grouped && (
        <span className="text-[11px] text-[var(--text-faint)] px-2 mb-0.5">{m.sender?.username}</span>
      )}

      <div
        onClick={() => setOpen((o) => !o)}
        className={`max-w-[80%] cursor-pointer text-sm break-words ${isMedia ? 'overflow-hidden rounded-2xl' : `px-3.5 py-2 rounded-2xl ${mine ? 'brand-gradient text-white rounded-br-md' : 'bg-[var(--surface-strong)] rounded-bl-md'}`} ${m.pending ? 'opacity-60' : ''}`}
      >
        {m.reply_to && !isMedia && (
          <span className={`block mb-1 pl-2 border-l-2 text-xs opacity-85 truncate ${mine ? 'border-white/50' : 'border-[var(--border-strong)]'}`}>
            {m.reply_to.body}
          </span>
        )}
        {m.media_type === 'image' && <img src={m.media_url} alt="" className="max-w-[240px] max-h-[300px] object-cover" />}
        {m.media_type === 'video' && <video src={m.media_url} controls playsInline className="max-w-[240px] max-h-[320px]" />}
        {m.media_type === 'audio' && <audio src={m.media_url} controls className="w-56 my-1" />}
        {m.body}
      </div>

      {chips.length > 0 && (
        <div className={`flex gap-1 -mt-1 ${mine ? 'mr-1' : 'ml-1'}`}>
          {chips.map(([e, n]) => (
            <span key={e} className="text-xs bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-full px-1.5 py-0.5 shadow-sm">{e}{n > 1 ? ` ${n}` : ''}</span>
          ))}
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center gap-0.5 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-full px-1.5 py-1">
            {QUICK.map((e) => (
              <button key={e} onClick={() => { onReact(e); setOpen(false) }} className="text-lg hover:scale-125 transition px-0.5">{e}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Act icon={Reply} onClick={() => { onReply(); setOpen(false) }}>Reply</Act>
            {mine && !isMedia && <Act icon={Pencil} onClick={() => { onEdit(); setOpen(false) }}>Edit</Act>}
            {mine && <Act icon={Trash2} danger onClick={() => { onDelete(); setOpen(false) }}>Delete</Act>}
          </div>
        </div>
      )}

      <span className="text-[10px] text-[var(--text-faint)] mt-0.5 px-1">
        {clockTime(m.created_at)}{m.edited ? ' · edited' : ''}
      </span>
    </div>
  )
}

function Act({ icon: Icon, children, onClick, danger }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1 px-2 py-1 rounded-full surface text-xs font-medium hover:bg-[var(--surface-strong)] ${danger ? 'text-[var(--color-brand-coral)]' : ''}`}>
      <Icon size={12} /> {children}
    </button>
  )
}

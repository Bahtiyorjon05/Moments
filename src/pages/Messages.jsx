import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, MessageCircle, Phone, Video, Info, Smile } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import UserName from '../components/ui/UserName.jsx'
import Empty from '../components/ui/Empty.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import { timeAgo, clockTime, timeAgoLong } from '../lib/format.js'

export default function Messages() {
  const { id } = useParams()
  const [convos, setConvos] = useState(null)

  const load = useCallback(() => api.conversations().then(setConvos).catch(() => setConvos([])), [])
  useEffect(() => { load() }, [load])

  const active = convos?.find((c) => c.id === id)

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex max-w-[1100px] mx-auto border-x border-[var(--border)]">
      {/* list */}
      <div className={`${id ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[360px] shrink-0 border-r border-[var(--border)]`}>
        <div className="h-16 flex items-center px-5 border-b border-[var(--border)]">
          <h1 className="text-lg font-bold">Messages</h1>
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
    </div>
  )
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
      <Avatar src={c.peer?.avatar_url} alt={c.peer?.username} size={54} ring="unseen" />
      <div className="min-w-0 flex-1">
        <UserName user={c.peer || {}} className="text-sm" link={false} />
        <p className="text-xs text-[var(--text-muted)] truncate">
          {last ? `${mine ? 'You: ' : ''}${last.body}` : 'Say hi 👋'}
          {last && <span className="text-[var(--text-faint)]"> · {timeAgo(last.created_at)}</span>}
        </p>
      </div>
    </Link>
  )
}

function Thread({ convo, onSent }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState(null)
  const [text, setText] = useState('')
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
    setText('')
    const optimistic = { id: `tmp-${Date.now()}`, body, sender_id: user.id, created_at: new Date().toISOString(), pending: true }
    setMessages((m) => [...(m || []), optimistic])
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }))
    try {
      const saved = await api.sendMessage(convo.id, body)
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? saved : x)))
      onSent?.()
    } catch {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id))
      setText(body)
    }
  }

  return (
    <>
      {/* header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-[var(--border)] shrink-0 glass">
        <button onClick={() => navigate('/messages')} className="md:hidden p-1 -ml-1"><ArrowLeft size={22} /></button>
        <Avatar src={convo.peer?.avatar_url} alt={convo.peer?.username} size={40} to={`/u/${convo.peer?.username}`} />
        <div className="min-w-0 flex-1">
          <UserName user={convo.peer || {}} className="text-sm" />
          <p className="text-xs text-[var(--text-faint)]">{timeAgoLong(convo.last_message?.created_at || Date.now())}</p>
        </div>
        <button className="p-2 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)]"><Phone size={20} /></button>
        <button className="p-2 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)]"><Video size={20} /></button>
        <button className="p-2 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)]"><Info size={20} /></button>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
        {messages === null ? (
          <div className="grid place-items-center py-10"><Spinner /></div>
        ) : (
          <>
            <div className="flex flex-col items-center py-6 gap-2">
              <Avatar src={convo.peer?.avatar_url} alt={convo.peer?.username} size={72} />
              <UserName user={convo.peer || {}} className="text-base" />
              <p className="text-sm text-[var(--text-muted)]">You're connected on Moments</p>
            </div>
            {messages.map((m, i) => {
              const mine = m.sender_id === user.id
              const prev = messages[i - 1]
              const grouped = prev && prev.sender_id === m.sender_id
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-0.5' : 'mt-3'}`}>
                  <div
                    className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-sm break-words ${
                      mine
                        ? 'brand-gradient text-white rounded-br-md'
                        : 'bg-[var(--surface-strong)] rounded-bl-md'
                    } ${m.pending ? 'opacity-60' : ''}`}
                    title={clockTime(m.created_at)}
                  >
                    {m.body}
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* composer */}
      <form onSubmit={send} className="p-3 border-t border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2 surface rounded-full pl-4 pr-2 h-12">
          <Smile size={22} className="text-[var(--text-muted)]" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-9 h-9 rounded-full grid place-items-center brand-gradient text-white disabled:opacity-40 disabled:grayscale transition active:scale-90"
          >
            <Send size={17} />
          </button>
        </div>
      </form>
    </>
  )
}

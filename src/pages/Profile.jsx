import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Grid3x3, Bookmark, Settings, LinkIcon, Camera, UserX, Menu, LogOut, ShieldCheck, Moon, Sun, TrendingUp, Star } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import Verified from '../components/ui/Verified.jsx'
import Button from '../components/ui/Button.jsx'
import PostGrid from '../components/feed/PostGrid.jsx'
import Empty from '../components/ui/Empty.jsx'
import FollowListModal from '../components/feed/FollowListModal.jsx'
import CloseFriendsModal from '../components/feed/CloseFriendsModal.jsx'
import { FullSpinner } from '../components/ui/Spinner.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../store/auth.js'
import { useUI } from '../store/ui.js'
import { formatCount } from '../lib/format.js'

function Stat({ value, label, onClick }) {
  const inner = (
    <>
      <span className="font-bold">{formatCount(value)}</span>{' '}
      <span className="text-[var(--text-muted)]">{label}</span>
    </>
  )
  if (onClick) return <button onClick={onClick} className="hover:opacity-70 transition">{inner}</button>
  return <div>{inner}</div>
}

function MRow({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--surface)] transition ${danger ? 'text-[var(--color-brand-coral)]' : ''}`}>
      <Icon size={18} /> {label}
    </button>
  )
}

export default function Profile() {
  const { username } = useParams()
  const { user: me, logout } = useAuth()
  const { setCreateOpen, toast, theme, toggleTheme } = useUI()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState(null)
  const [tab, setTab] = useState('posts')
  const [busy, setBusy] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [followList, setFollowList] = useState(null) // 'followers' | 'following' | null
  const [closeOpen, setCloseOpen] = useState(false)

  const isMe = me?.username === username

  useEffect(() => {
    setProfile(null); setPosts(null); setNotFound(false); setTab('posts')
    api.user(username).then(setProfile).catch(() => setNotFound(true))
    api.userPosts(username).then(setPosts).catch(() => setPosts([]))
  }, [username])

  async function toggleFollow() {
    if (!profile) return
    setBusy(true)
    const next = !profile.is_following
    setProfile((p) => ({
      ...p,
      is_following: next,
      follower_count: p.follower_count + (next ? 1 : -1),
    }))
    try { next ? await api.follow(username) : await api.unfollow(username) }
    catch { setProfile((p) => ({ ...p, is_following: !next, follower_count: p.follower_count + (next ? -1 : 1) })) }
    finally { setBusy(false) }
  }

  async function message() {
    try { const { id } = await api.startChat(username); navigate(`/messages/${id}`) }
    catch { toast('Could not open chat', 'error') }
  }

  async function loadSaved() {
    setTab('saved')
    if (!isMe) return
    setPosts(null)
    api.saved().then(setPosts).catch(() => setPosts([]))
  }
  function loadPosts() {
    setTab('posts')
    setPosts(null)
    api.userPosts(username).then(setPosts).catch(() => setPosts([]))
  }

  if (notFound)
    return (
      <div className="max-w-2xl mx-auto pt-16">
        <Empty icon={UserX} title="User not found" subtitle={`@${username} isn't on Moments.`} action={<Button as={Link} to="/">Go home</Button>} />
      </div>
    )

  if (!profile) return <FullSpinner label="Loading profile…" />

  return (
    <div className="max-w-[935px] mx-auto w-full px-4 pt-6 sm:pt-10">
      {/* header */}
      <header className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-14 pb-8 border-b border-[var(--border)]">
        <Avatar src={profile.avatar_url} alt={profile.username} size={130} ring="unseen" className="sm:ml-6" />

        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-2xl font-light flex items-center gap-2 justify-center sm:justify-start">
              {profile.username}
              {profile.is_verified && <Verified size={20} />}
            </h1>
            <div className="flex items-center gap-2 justify-center">
              {isMe ? (
                <>
                  <Button variant="soft" size="sm" as={Link} to="/settings"><Settings size={15} /> Edit profile</Button>
                  <Button variant="soft" size="sm" onClick={() => setCreateOpen(true)}><Camera size={15} /> New post</Button>
                  <div className="relative">
                    <button onClick={() => setMenuOpen((m) => !m)} className="w-9 h-9 grid place-items-center rounded-full surface hover:bg-[var(--surface-strong)]">
                      <Menu size={18} />
                    </button>
                    <AnimatePresence>
                      {menuOpen && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                            className="absolute right-0 top-full mt-2 w-52 card p-1.5 z-30 origin-top-right"
                          >
                            {me?.is_admin && <MRow icon={ShieldCheck} label="Admin dashboard" onClick={() => navigate('/admin')} />}
                            <MRow icon={TrendingUp} label="Analytics" onClick={() => navigate('/analytics')} />
                            <MRow icon={Star} label="Close friends" onClick={() => { setMenuOpen(false); setCloseOpen(true) }} />
                            <MRow icon={Bookmark} label="Saved" onClick={() => navigate('/saved')} />
                            <MRow icon={Settings} label="Settings" onClick={() => navigate('/settings')} />
                            <MRow icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggleTheme} />
                            <div className="my-1 border-t border-[var(--border)]" />
                            <MRow icon={LogOut} label="Log out" danger onClick={logout} />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Button size="sm" variant={profile.is_following ? 'soft' : 'primary'} onClick={toggleFollow} loading={busy}>
                    {profile.is_following ? 'Following' : 'Follow'}
                  </Button>
                  <Button size="sm" variant="soft" onClick={message}>Message</Button>
                </>
              )}
            </div>
          </div>

          {/* stats (desktop) */}
          <div className="hidden sm:flex gap-10 mt-6 text-[15px]">
            <Stat value={profile.post_count} label="posts" />
            <Stat value={profile.follower_count} label="followers" onClick={() => setFollowList('followers')} />
            <Stat value={profile.following_count} label="following" onClick={() => setFollowList('following')} />
          </div>

          {/* bio */}
          <div className="mt-5 text-center sm:text-left">
            <p className="font-semibold">{profile.name}</p>
            {profile.bio && <p className="text-sm whitespace-pre-line mt-1">{profile.bio}</p>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--color-brand-blue)] inline-flex items-center gap-1 mt-1">
                <LinkIcon size={13} /> {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* stats (mobile) */}
      <div className="sm:hidden flex justify-around py-4 border-b border-[var(--border)] text-sm">
        <div className="text-center"><p className="font-bold">{formatCount(profile.post_count)}</p><p className="text-[var(--text-muted)] text-xs">posts</p></div>
        <button onClick={() => setFollowList('followers')} className="text-center"><p className="font-bold">{formatCount(profile.follower_count)}</p><p className="text-[var(--text-muted)] text-xs">followers</p></button>
        <button onClick={() => setFollowList('following')} className="text-center"><p className="font-bold">{formatCount(profile.following_count)}</p><p className="text-[var(--text-muted)] text-xs">following</p></button>
      </div>

      {/* tabs */}
      <div className="flex justify-center gap-12 border-b border-[var(--border)] -mt-px">
        <TabBtn active={tab === 'posts'} onClick={loadPosts} icon={Grid3x3} label="Posts" />
        {isMe && <TabBtn active={tab === 'saved'} onClick={loadSaved} icon={Bookmark} label="Saved" />}
      </div>

      {/* grid */}
      <div className="py-4">
        {posts === null ? (
          <FullSpinner />
        ) : posts.length === 0 ? (
          <Empty
            icon={tab === 'saved' ? Bookmark : Camera}
            title={tab === 'saved' ? 'No saved posts' : isMe ? 'Share your first moment' : 'No posts yet'}
            subtitle={tab === 'saved' ? 'Save posts to find them here later.' : isMe ? 'Your posts will appear on your profile.' : ''}
            action={isMe && tab === 'posts' ? <Button onClick={() => setCreateOpen(true)}><Camera size={16} /> Create post</Button> : null}
          />
        ) : (
          <PostGrid posts={posts} />
        )}
      </div>

      <FollowListModal
        open={!!followList}
        onClose={() => setFollowList(null)}
        username={username}
        type={followList}
      />
      <CloseFriendsModal open={closeOpen} onClose={() => setCloseOpen(false)} />
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 py-3.5 -mb-px border-t-2 text-xs font-bold uppercase tracking-wider transition ${
        active ? 'border-[var(--text)] text-[var(--text)]' : 'border-transparent text-[var(--text-faint)]'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  )
}

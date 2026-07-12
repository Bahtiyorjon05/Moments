// Thin fetch client for the Moments API. Handles JSON, auth token, and errors.
// In production (Vercel) the API is same-origin at /api; in dev it's the local server.
const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')

let token = localStorage.getItem('moments_token') || null

export function setToken(t) {
  token = t
  if (t) localStorage.setItem('moments_token', t)
  else localStorage.removeItem('moments_token')
}
export const getToken = () => token

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', 0)
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status)
  return data
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

const get = (p, opts) => request(p, opts)
const post = (p, body) => request(p, { method: 'POST', body: body ?? {} })
const patch = (p, body) => request(p, { method: 'PATCH', body: body ?? {} })
const del = (p) => request(p, { method: 'DELETE' })

// ── Grouped API surface ────────────────────────────────
export const api = {
  // auth
  register: (b) => post('/auth/register', b),
  login: (b) => post('/auth/login', b),
  me: () => get('/auth/me'),

  // posts / feed
  feed: () => get('/posts/feed'),
  explore: () => get('/posts/explore'),
  reels: () => get('/posts/reels'),
  saved: () => get('/posts/saved'),
  post: (id) => get(`/posts/${id}`),
  createPost: (b) => post('/posts', b),
  editPost: (id, b) => patch(`/posts/${id}`, b),
  deletePost: (id) => del(`/posts/${id}`),
  like: (id) => post(`/posts/${id}/like`),
  unlike: (id) => del(`/posts/${id}/like`),
  save: (id) => post(`/posts/${id}/save`),
  unsave: (id) => del(`/posts/${id}/save`),
  comments: (id) => get(`/posts/${id}/comments`),
  addComment: (id, body) => post(`/posts/${id}/comments`, { body }),
  postLikes: (id) => get(`/posts/${id}/likes`),

  // users
  user: (username) => get(`/users/${username}`),
  userPosts: (username) => get(`/users/${username}/posts`),
  followers: (username) => get(`/users/${username}/followers`),
  following: (username) => get(`/users/${username}/following`),
  follow: (username) => post(`/users/${username}/follow`),
  unfollow: (username) => del(`/users/${username}/follow`),
  suggestions: () => get('/users/suggestions'),
  search: (q) => get(`/users/search?q=${encodeURIComponent(q)}`),
  updateProfile: (b) => patch('/users/me/profile', b),

  // close friends
  closeFriends: () => get('/users/me/close-friends'),
  addClose: (username) => post(`/users/${username}/close`),
  removeClose: (username) => del(`/users/${username}/close`),

  // stories
  stories: () => get('/stories'),
  addStory: (b) => post('/stories', b),
  viewStory: (id) => post(`/stories/${id}/view`),
  likeStory: (id) => post(`/stories/${id}/like`),
  unlikeStory: (id) => del(`/stories/${id}/like`),
  replyStory: (id, body) => post(`/stories/${id}/reply`, { body }),
  deleteStory: (id) => del(`/stories/${id}`),

  // chat
  conversations: () => get('/chat/conversations'),
  messages: (id) => get(`/chat/conversations/${id}/messages`),
  sendMessage: (id, payload) => post(`/chat/conversations/${id}/messages`, payload),
  editMessage: (id, body) => patch(`/chat/messages/${id}`, { body }),
  deleteMessage: (id) => del(`/chat/messages/${id}`),
  reactMessage: (id, emoji) => post(`/chat/messages/${id}/react`, { emoji }),
  unreactMessage: (id) => del(`/chat/messages/${id}/react`),
  createGroup: (b) => post('/chat/groups', b),
  startChat: (username) => post(`/chat/with/${username}`),

  // analytics
  trackView: (postId, watchMs = 0) => post('/analytics/view', { postId, watchMs }),
  analytics: () => get('/analytics'),

  // notifications
  notifications: () => get('/notifications'),
  unreadCount: () => get('/notifications/unread-count'),
  markRead: () => post('/notifications/read'),

  // calls (WebRTC signaling)
  callSignal: (b) => post('/calls/signal', b),
  callInbox: () => get('/calls/inbox'),

  // admin
  adminUsers: () => get('/admin/users'),
  adminStats: () => get('/admin/stats'),
  adminDeleteUser: (id) => del(`/admin/users/${id}`),

  health: () => get('/health'),
}

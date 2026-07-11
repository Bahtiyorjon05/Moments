import { query } from './db.js'

// Enriched post shape shared by feed / explore / profile / reels / single.
// `where` is a SQL fragment using $N placeholders that START AFTER the first
// param ($1 is always the viewer id, or null). Extra params follow in `params`.
export async function fetchPosts({ viewerId = null, where = 'TRUE', params = [], order = 'p.created_at DESC', limit = 50 }) {
  const sql = `
    SELECT
      p.id, p.kind, p.caption, p.location, p.audio, p.created_at,
      json_build_object(
        'id', u.id, 'username', u.username, 'name', u.name,
        'avatar_url', u.avatar_url, 'is_verified', u.is_verified
      ) AS author,
      (SELECT count(*)::int FROM likes l WHERE l.post_id = p.id)        AS like_count,
      (SELECT count(*)::int FROM comments cm WHERE cm.post_id = p.id)   AS comment_count,
      EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1) AS liked,
      EXISTS(SELECT 1 FROM saves s WHERE s.post_id = p.id AND s.user_id = $1) AS saved,
      COALESCE(
        (SELECT json_agg(json_build_object('url', m.url, 'poster', m.poster, 'type', m.type) ORDER BY m.position)
         FROM post_media m WHERE m.post_id = p.id),
        '[]'
      ) AS media
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE ${where}
    ORDER BY ${order}
    LIMIT ${limit}
  `
  const { rows } = await query(sql, [viewerId, ...params])
  return rows
}

export async function fetchPostById(id, viewerId) {
  const rows = await fetchPosts({ viewerId, where: 'p.id = $2', params: [id], limit: 1 })
  return rows[0] || null
}

// Public user shape with counts + follow state relative to viewer.
export async function fetchUserProfile(username, viewerId) {
  const { rows } = await query(
    `SELECT u.id, u.username, u.name, u.avatar_url, u.bio, u.website, u.is_verified, u.created_at,
       (SELECT count(*)::int FROM posts p WHERE p.user_id = u.id)               AS post_count,
       (SELECT count(*)::int FROM follows f WHERE f.following_id = u.id)        AS follower_count,
       (SELECT count(*)::int FROM follows f WHERE f.follower_id = u.id)         AS following_count,
       EXISTS(SELECT 1 FROM follows f WHERE f.following_id = u.id AND f.follower_id = $2) AS is_following
     FROM users u WHERE u.username = $1`,
    [username, viewerId]
  )
  return rows[0] || null
}

// Create a notification (skips self-notifications).
export async function notify({ userId, actorId, type, postId = null, commentId = null }) {
  if (userId === actorId) return
  await query(
    `INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id) VALUES ($1,$2,$3,$4,$5)`,
    [userId, actorId, type, postId, commentId]
  )
}

-- ============================================================
--  MOMENTS · PostgreSQL schema
--  Idempotent: safe to run repeatedly (drops & recreates).
-- ============================================================

DROP TABLE IF EXISTS notifications      CASCADE;
DROP TABLE IF EXISTS messages           CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS conversations      CASCADE;
DROP TABLE IF EXISTS story_views        CASCADE;
DROP TABLE IF EXISTS stories            CASCADE;
DROP TABLE IF EXISTS saves              CASCADE;
DROP TABLE IF EXISTS comment_likes      CASCADE;
DROP TABLE IF EXISTS comments           CASCADE;
DROP TABLE IF EXISTS likes              CASCADE;
DROP TABLE IF EXISTS post_media         CASCADE;
DROP TABLE IF EXISTS posts              CASCADE;
DROP TABLE IF EXISTS follows            CASCADE;
DROP TABLE IF EXISTS users              CASCADE;

-- ── Users ───────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_enc  TEXT NOT NULL,          -- AES-256-GCM encrypted (recoverable for admin)
  avatar_url    TEXT,                   -- NULL by default; new users have no photo
  bio           TEXT DEFAULT '',
  website       TEXT DEFAULT '',
  is_verified   BOOLEAN DEFAULT FALSE,
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Follows (directed graph) ────────────────────────────
CREATE TABLE follows (
  follower_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- ── Posts (kind = 'post' feed image/carousel, or 'reel' video) ──
CREATE TABLE posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'post' CHECK (kind IN ('post','reel')),
  caption    TEXT DEFAULT '',
  location   TEXT DEFAULT '',
  audio      TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE post_media (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id  UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url      TEXT NOT NULL,
  poster   TEXT DEFAULT '',              -- video poster frame
  type     TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image','video')),
  position INT NOT NULL DEFAULT 0
);

-- ── Engagement ──────────────────────────────────────────
CREATE TABLE likes (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE comment_likes (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE saves (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- ── Stories (ephemeral) ─────────────────────────────────
CREATE TABLE stories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url  TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image','video')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours'
);

CREATE TABLE story_views (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, user_id)
);

-- ── Direct messages ─────────────────────────────────────
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group   BOOLEAN DEFAULT FALSE,
  title      TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Notifications ───────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- recipient
  actor_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- who did it
  type       TEXT NOT NULL CHECK (type IN ('like','comment','follow','mention')),
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes for hot paths ───────────────────────────────
CREATE INDEX idx_posts_user       ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_kind       ON posts(kind, created_at DESC);
CREATE INDEX idx_media_post       ON post_media(post_id, position);
CREATE INDEX idx_likes_post       ON likes(post_id);
CREATE INDEX idx_comments_post    ON comments(post_id, created_at);
CREATE INDEX idx_saves_user       ON saves(user_id, created_at DESC);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_stories_user     ON stories(user_id, created_at DESC);
CREATE INDEX idx_messages_convo   ON messages(conversation_id, created_at);
CREATE INDEX idx_notifs_user      ON notifications(user_id, created_at DESC);

-- Migration: Social layer schema
-- Adds all social tables for agent identity, communities, posts, votes, follows, reports, moderation

-- Social Users
CREATE TABLE IF NOT EXISTS social_users (
  id              TEXT PRIMARY KEY,
  agentbot_user_id TEXT NOT NULL UNIQUE,
  username        TEXT UNIQUE,
  display_name    TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  x_handle        TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Social Agents
CREATE TABLE IF NOT EXISTS social_agents (
  id                  TEXT PRIMARY KEY,
  agentbot_agent_id   TEXT NOT NULL UNIQUE,
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  bio                 TEXT,
  avatar_url          TEXT,
  banner_url          TEXT,
  website_url         TEXT,
  status              TEXT NOT NULL DEFAULT 'active',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  trust_score         INTEGER NOT NULL DEFAULT 0,
  owner_user_id       TEXT REFERENCES social_users(id),
  primary_community_id TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Agent Claims
CREATE TABLE IF NOT EXISTS agent_claims (
  id                TEXT PRIMARY KEY,
  agent_id          TEXT NOT NULL REFERENCES social_agents(id),
  user_id           TEXT NOT NULL REFERENCES social_users(id),
  status            TEXT NOT NULL DEFAULT 'owner_linked',
  claim_token       TEXT NOT NULL UNIQUE,
  x_challenge_code  TEXT,
  claimed_via       TEXT NOT NULL DEFAULT 'x',
  verified_at       TIMESTAMP,
  expires_at        TIMESTAMP,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, user_id)
);

-- Communities
CREATE TABLE IF NOT EXISTS communities (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT,
  avatar_url        TEXT,
  banner_url        TEXT,
  visibility        TEXT NOT NULL DEFAULT 'public',
  posting_policy    TEXT NOT NULL DEFAULT 'members',
  created_by_user_id TEXT,
  member_count      INTEGER NOT NULL DEFAULT 0,
  post_count        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Community Memberships
CREATE TABLE IF NOT EXISTS community_memberships (
  id              TEXT PRIMARY KEY,
  community_id    TEXT NOT NULL REFERENCES communities(id),
  user_id         TEXT REFERENCES social_users(id),
  agent_id        TEXT REFERENCES social_agents(id),
  role            TEXT NOT NULL DEFAULT 'member',
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(community_id, user_id),
  CHECK ((user_id IS NOT NULL) <> (agent_id IS NOT NULL))
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id              TEXT PRIMARY KEY,
  author_agent_id TEXT NOT NULL REFERENCES social_agents(id),
  community_id    TEXT REFERENCES communities(id),
  kind            TEXT NOT NULL DEFAULT 'post',
  body            TEXT NOT NULL,
  body_html       TEXT,
  status          TEXT NOT NULL DEFAULT 'published',
  visibility      TEXT NOT NULL DEFAULT 'public',
  reply_count     INTEGER NOT NULL DEFAULT 0,
  vote_count      INTEGER NOT NULL DEFAULT 0,
  score           DECIMAL(12, 4) NOT NULL DEFAULT 0,
  posted_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id                TEXT PRIMARY KEY,
  post_id           TEXT NOT NULL REFERENCES posts(id),
  parent_comment_id TEXT REFERENCES comments(id),
  author_agent_id   TEXT NOT NULL REFERENCES social_agents(id),
  body              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'published',
  reply_count       INTEGER NOT NULL DEFAULT 0,
  vote_count        INTEGER NOT NULL DEFAULT 0,
  score             DECIMAL(12, 4) NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Social Votes
CREATE TABLE IF NOT EXISTS social_votes (
  id          TEXT PRIMARY KEY,
  post_id     TEXT REFERENCES posts(id),
  comment_id  TEXT REFERENCES comments(id),
  user_id     TEXT REFERENCES social_users(id),
  agent_id    TEXT REFERENCES social_agents(id),
  value       INTEGER NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id),
  UNIQUE(post_id, agent_id),
  UNIQUE(comment_id, user_id),
  UNIQUE(comment_id, agent_id),
  CHECK ((post_id IS NOT NULL) <> (comment_id IS NOT NULL)),
  CHECK ((user_id IS NOT NULL) <> (agent_id IS NOT NULL)),
  CHECK (value IN (-1, 1))
);

-- Social Follows
CREATE TABLE IF NOT EXISTS social_follows (
  id                    TEXT PRIMARY KEY,
  follower_user_id      TEXT REFERENCES social_users(id),
  follower_agent_id     TEXT REFERENCES social_agents(id),
  followed_agent_id     TEXT REFERENCES social_agents(id),
  followed_user_id      TEXT,
  followed_community_id TEXT REFERENCES communities(id),
  created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Social Reports
CREATE TABLE IF NOT EXISTS social_reports (
  id                TEXT PRIMARY KEY,
  reporter_user_id  TEXT REFERENCES social_users(id),
  reporter_agent_id TEXT REFERENCES social_agents(id),
  post_id           TEXT REFERENCES posts(id),
  comment_id        TEXT REFERENCES comments(id),
  reported_agent_id TEXT,
  reason            TEXT NOT NULL,
  details           TEXT,
  status            TEXT NOT NULL DEFAULT 'open',
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Moderation Actions
CREATE TABLE IF NOT EXISTS moderation_actions (
  id            TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL REFERENCES social_users(id),
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  action        TEXT NOT NULL,
  reason        TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activity Events
CREATE TABLE IF NOT EXISTS activity_events (
  id              TEXT PRIMARY KEY,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT NOT NULL,
  actor_agent_id  TEXT REFERENCES social_agents(id),
  actor_user_id   TEXT,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Social Notifications
CREATE TABLE IF NOT EXISTS social_notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES social_users(id),
  type        TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  read_at     TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_community_posted_at ON posts (community_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_posted_at ON posts (author_agent_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status_visibility ON posts (status, visibility, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower_user ON social_follows (follower_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_followed_agent ON social_follows (followed_agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_community ON community_memberships (community_id, role, status);
CREATE INDEX IF NOT EXISTS idx_claims_status_expires ON agent_claims (status, expires_at);

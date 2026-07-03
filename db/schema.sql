-- PostgreSQL schema for IPTV project

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- free, monthly, yearly, xtream, m3u
  m3u_source_id UUID,
  xtream_source_id UUID,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE
);

-- M3U sources
CREATE TABLE IF NOT EXISTS m3u_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  url TEXT NOT NULL,
  last_fetched_at TIMESTAMP WITH TIME ZONE
);

-- Xtream sources
CREATE TABLE IF NOT EXISTS xtream_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  host VARCHAR(255),
  port INTEGER,
  username VARCHAR(255),
  password_encrypted TEXT,
  api_token TEXT,
  last_fetched_at TIMESTAMP WITH TIME ZONE
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL
);

-- Channels
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type VARCHAR(20) NOT NULL, -- 'm3u' or 'xtream'
  source_id UUID, -- FK to m3u_sources or xtream_sources depending on source_type
  source_channel_id VARCHAR(255), -- identifier from the source
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  logo TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Streams (actual playable URLs)
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  quality VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMP WITH TIME ZONE
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_team VARCHAR(255),
  away_team VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  metadata JSONB
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

-- User statistics
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  watch_minutes INTEGER DEFAULT 0,
  last_seen_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channels_name ON channels USING gin (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_matches_start_time ON matches(start_time);

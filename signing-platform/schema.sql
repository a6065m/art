-- Signing Platform — Cloudflare D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER  PRIMARY KEY AUTOINCREMENT,
  email         TEXT     UNIQUE NOT NULL,
  password_hash TEXT     NOT NULL,
  role          TEXT     NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     INTEGER  PRIMARY KEY AUTOINCREMENT,
  user_id                INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                   TEXT     NOT NULL DEFAULT 'basic',
  status                 TEXT     NOT NULL DEFAULT 'inactive',  -- 'active' | 'inactive' | 'cancelled' | 'past_due'
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  current_period_start   DATETIME,
  current_period_end     DATETIME,
  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  udid       TEXT     UNIQUE NOT NULL,
  name       TEXT,
  model      TEXT,
  status     TEXT     NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'signed'
  notes      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  name        TEXT     NOT NULL,
  p12_key     TEXT,                          -- R2 object key
  password    TEXT,                          -- encrypted p12 password
  is_active   INTEGER  NOT NULL DEFAULT 1,
  team_id     TEXT,
  common_name TEXT,
  expires_at  DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  name        TEXT     NOT NULL,
  profile_key TEXT,                          -- R2 object key
  bundle_id   TEXT,
  team_id     TEXT,
  is_active   INTEGER  NOT NULL DEFAULT 1,
  expires_at  DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signing_requests (
  id             INTEGER  PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id      INTEGER  REFERENCES devices(id),
  certificate_id INTEGER  REFERENCES certificates(id),
  profile_id     INTEGER  REFERENCES profiles(id),
  status         TEXT     NOT NULL DEFAULT 'pending',  -- 'pending' | 'processing' | 'completed' | 'failed'
  notes          TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_name',            'Signing Platform'),
  ('registration_open',    'true'),
  ('signing_enabled',      'true'),
  ('max_devices_per_user', '3'),
  ('stripe_price_id',      ''),
  ('support_email',        '');

CREATE INDEX IF NOT EXISTS idx_devices_user_id       ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_signing_requests_user ON signing_requests(user_id);

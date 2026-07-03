-- migration 001 - create tables

-- (Same as db/schema.sql)

-- For convenience, run `psql -f migrations/001-create-tables.sql` to create schema.

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

-- (rest omitted for brevity in migration file; use db/schema.sql as source of truth)

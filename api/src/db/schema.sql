-- VerseDrop schema. Idempotent — safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ---------- Drops ----------
CREATE TABLE IF NOT EXISTS drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  verse_translation TEXT NOT NULL DEFAULT 'KJV',
  custom_message TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_count INTEGER NOT NULL DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'pending', 'rejected', 'removed')),
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Idempotent column add for upgrades from earlier schema versions
ALTER TABLE drops ADD COLUMN IF NOT EXISTS verse_translation TEXT NOT NULL DEFAULT 'KJV';

CREATE INDEX IF NOT EXISTS drops_location_idx ON drops USING GIST(location);
CREATE INDEX IF NOT EXISTS drops_user_token_idx ON drops(user_token);
CREATE INDEX IF NOT EXISTS drops_moderation_idx ON drops(moderation_status);

-- ---------- Pickups ----------
CREATE TABLE IF NOT EXISTS user_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token TEXT NOT NULL,
  drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  picked_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_token, drop_id)
);

CREATE INDEX IF NOT EXISTS user_pickups_user_idx ON user_pickups(user_token, picked_up_at DESC);

-- ---------- Reactions ----------
CREATE TABLE IF NOT EXISTS drop_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token TEXT NOT NULL,
  drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('amen', 'heart', 'pray')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_token, drop_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS drop_reactions_drop_idx ON drop_reactions(drop_id);

-- ---------- Notes ----------
CREATE TABLE IF NOT EXISTS drop_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token TEXT NOT NULL,
  drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'pending', 'rejected', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS drop_notes_drop_idx ON drop_notes(drop_id, created_at DESC);

-- ---------- Reports (UGC safety) ----------
CREATE TABLE IF NOT EXISTS drop_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_token TEXT NOT NULL,
  drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'harassment', 'inappropriate', 'other')),
  details TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reporter_token, drop_id)
);

CREATE INDEX IF NOT EXISTS drop_reports_drop_idx ON drop_reports(drop_id);
CREATE INDEX IF NOT EXISTS drop_reports_unresolved_idx ON drop_reports(resolved) WHERE resolved = false;

-- ---------- Users (optional augmentation of the anonymous token) ----------
-- Anonymous-token-keyed; rows are created lazily when we need to attach
-- push tokens, an email, or notification preferences.
CREATE TABLE IF NOT EXISTS users (
  user_token TEXT PRIMARY KEY,
  email TEXT,
  email_verified_at TIMESTAMPTZ,
  push_token TEXT,
  push_platform TEXT CHECK (push_platform IN ('ios', 'android', 'web')),
  push_updated_at TIMESTAMPTZ,
  preferred_translation TEXT NOT NULL DEFAULT 'KJV',
  notify_on_pickup BOOLEAN NOT NULL DEFAULT true,
  notify_on_reaction BOOLEAN NOT NULL DEFAULT true,
  notify_on_nearby_drop BOOLEAN NOT NULL DEFAULT false,
  notify_weekly_digest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Idempotent column adds for upgrades from earlier schema versions
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_translation TEXT NOT NULL DEFAULT 'KJV';

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_push_idx ON users(user_token) WHERE push_token IS NOT NULL;

-- Email verification tokens (short-lived; one-time use)
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token TEXT NOT NULL,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_verifications_token_idx ON email_verifications(token_hash) WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS email_verifications_expires_idx ON email_verifications(expires_at) WHERE consumed_at IS NULL;

-- ---------- User blocks (UGC safety) ----------
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_token TEXT NOT NULL,
  blocked_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_token, blocked_token),
  CHECK (blocker_token <> blocked_token)
);

CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON user_blocks(blocker_token);

-- ---------- Auto-hide drops at report threshold ----------
-- 3 unique reporters → auto-hide pending manual review.
CREATE OR REPLACE FUNCTION auto_hide_reported_drop() RETURNS TRIGGER AS $$
BEGIN
  UPDATE drops
  SET report_count = (
    SELECT COUNT(*) FROM drop_reports WHERE drop_id = NEW.drop_id
  )
  WHERE id = NEW.drop_id;

  UPDATE drops
  SET moderation_status = 'pending'
  WHERE id = NEW.drop_id
    AND moderation_status = 'approved'
    AND report_count >= 3;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_hide_reported_drop_trigger ON drop_reports;
CREATE TRIGGER auto_hide_reported_drop_trigger
AFTER INSERT ON drop_reports
FOR EACH ROW
EXECUTE FUNCTION auto_hide_reported_drop();

-- Staff can disable sign-in for an account; its sessions stop working at once.
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_reason text;
-- Email delivery monitor filters by state and date.
CREATE INDEX IF NOT EXISTS email_outbox_undelivered ON email_outbox(created_at DESC) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS audit_actor_action ON audit(actor, action, created_at DESC);

ALTER TABLE users ADD COLUMN mfa_secret text;
ALTER TABLE users ADD COLUMN mfa_pending text;
ALTER TABLE users ADD COLUMN mfa_pending_until timestamptz;
ALTER TABLE users ADD COLUMN mfa_last_counter bigint NOT NULL DEFAULT -1;
ALTER TABLE users ADD COLUMN recovery_hashes jsonb NOT NULL DEFAULT '[]';
ALTER TABLE sessions ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX sessions_id ON sessions(id);
ALTER TABLE sessions ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE sessions ADD COLUMN mfa_verified boolean NOT NULL DEFAULT false;

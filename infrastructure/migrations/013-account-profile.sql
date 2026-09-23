CREATE TABLE account_email_changes (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, email text NOT NULL,
 salt text NOT NULL, code_hash text NOT NULL, attempts integer NOT NULL DEFAULT 0,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes'
);

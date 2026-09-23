CREATE TABLE account_recovery_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), reason text NOT NULL,
 status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','cooldown','ready','completed','cancelled','rejected')),
 cancel_hash text NOT NULL, token_hash text UNIQUE, token_expires timestamptz,
 pending_secret text, ready_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz
);
CREATE UNIQUE INDEX account_recovery_active ON account_recovery_cases(user_id) WHERE status IN ('requested','cooldown','ready');
CREATE TABLE account_recovery_reviews (
 case_id uuid NOT NULL REFERENCES account_recovery_cases(id), reviewer_id uuid NOT NULL REFERENCES users(id),
 decision text NOT NULL CHECK(decision IN ('approve','reject')), evidence_note text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(case_id,reviewer_id)
);

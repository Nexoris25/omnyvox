ALTER TABLE billing ADD COLUMN payer_email text;
ALTER TABLE billing ADD COLUMN purpose text NOT NULL DEFAULT 'manual';
ALTER TABLE billing ADD COLUMN cycle_key text;
ALTER TABLE billing ADD COLUMN attempt integer NOT NULL DEFAULT 0;
ALTER TABLE billing ADD COLUMN paid_at timestamptz;
CREATE UNIQUE INDEX billing_cycle_attempt ON billing(site_id,cycle_key,attempt) WHERE cycle_key IS NOT NULL;
CREATE TABLE subscription_preferences(
 site_id uuid PRIMARY KEY REFERENCES sites(id),
 auto_renew boolean NOT NULL DEFAULT false,
 cancelled_at timestamptz,
 payment_authorization text,
 payment_label text,
 amount integer,
 currency text NOT NULL DEFAULT 'NGN',
 interval text NOT NULL DEFAULT 'monthly',
 bonus_months integer NOT NULL DEFAULT 0,
 consent_at timestamptz,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 last_error text
);
CREATE TABLE invoices(
 number bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 reference text UNIQUE NOT NULL REFERENCES billing(reference),
 site_id uuid NOT NULL REFERENCES sites(id),
 buyer jsonb NOT NULL,
 description text NOT NULL,
 amount integer NOT NULL,
 currency text NOT NULL,
 period_start timestamptz NOT NULL,
 period_end timestamptz NOT NULL,
 issued_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing_notifications(
 site_id uuid NOT NULL REFERENCES sites(id),
 event_key text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(site_id,event_key)
);

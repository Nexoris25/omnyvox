-- KYB: the registered business name comes from the CAC registry lookup.
ALTER TABLE business_verifications ALTER COLUMN business_name DROP NOT NULL;
ALTER TABLE business_verifications ADD COLUMN IF NOT EXISTS company_type text;
ALTER TABLE business_verifications ADD COLUMN IF NOT EXISTS verified_via text;
ALTER TABLE business_verifications ADD COLUMN IF NOT EXISTS registry jsonb;
-- A short-lived lookup the customer confirms; the name is never taken from the browser.
CREATE TABLE IF NOT EXISTS kyb_lookups(
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 reference text NOT NULL,
 record jsonb NOT NULL,
 expires_at timestamptz NOT NULL
);

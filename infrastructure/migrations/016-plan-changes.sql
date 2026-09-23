-- Plan changes: upgrades are charged pro rata and applied on payment;
-- downgrades are scheduled for the end of the paid period.
ALTER TABLE billing ADD COLUMN target_tier text CHECK (target_tier IN ('basic','growth','advanced'));
ALTER TABLE sites ADD COLUMN pending_tier text CHECK (pending_tier IN ('basic','growth','advanced'));
ALTER TABLE sites ADD COLUMN pending_tier_at timestamptz;
ALTER TABLE sites ADD COLUMN pending_tier_by uuid REFERENCES users(id);
ALTER TABLE sites ADD COLUMN suspended_reason text;
CREATE INDEX sites_pending_tier_due ON sites(pending_tier_at) WHERE pending_tier IS NOT NULL;
CREATE TABLE plan_changes(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 site_id uuid NOT NULL REFERENCES sites(id),
 from_tier text NOT NULL,
 to_tier text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('upgrade','downgrade','cancelled')),
 effects jsonb NOT NULL DEFAULT '[]',
 actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);

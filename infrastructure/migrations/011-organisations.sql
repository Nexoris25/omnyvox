CREATE TABLE organisations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL UNIQUE REFERENCES users(id),
 name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE organisation_members (
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('owner','administrator','editor','store_manager','analyst')),
 joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organisation_id,user_id)
);
CREATE TABLE organisation_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 email text NOT NULL, role text NOT NULL CHECK(role IN ('administrator','editor','store_manager','analyst')),
 token_hash text NOT NULL UNIQUE, invited_by uuid NOT NULL REFERENCES users(id),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days', accepted_at timestamptz, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO organisations(owner_id,name) SELECT id,name||'''s workspace' FROM users;
INSERT INTO organisation_members(organisation_id,user_id,role) SELECT id,owner_id,'owner' FROM organisations;
CREATE FUNCTION provision_organisation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE org uuid;
BEGIN
 INSERT INTO organisations(owner_id,name) VALUES(NEW.id,NEW.name||'''s workspace') RETURNING id INTO org;
 INSERT INTO organisation_members(organisation_id,user_id,role) VALUES(org,NEW.id,'owner');
 RETURN NEW;
END $$;
CREATE TRIGGER user_organisation AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION provision_organisation();
CREATE INDEX organisation_members_user ON organisation_members(user_id);
CREATE INDEX organisation_invitations_pending ON organisation_invitations(organisation_id) WHERE accepted_at IS NULL AND revoked_at IS NULL;

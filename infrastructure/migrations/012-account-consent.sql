ALTER TABLE users ADD COLUMN phone text;
CREATE TABLE platform_policy_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sequence bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 slug text NOT NULL CHECK(slug IN ('terms','privacy')), title text NOT NULL, body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO platform_policy_versions(slug,title,body) SELECT data->>'slug',data->>'title',data->>'body' FROM marketing_records WHERE kind='legal' AND data->>'status'='published' AND data->>'slug' IN ('terms','privacy');
CREATE FUNCTION snapshot_platform_policy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.kind='legal' AND NEW.data->>'status'='published' AND NEW.data->>'slug' IN ('terms','privacy') THEN
  IF TG_OP='INSERT' OR OLD.data IS DISTINCT FROM NEW.data THEN
   INSERT INTO platform_policy_versions(slug,title,body) VALUES(NEW.data->>'slug',NEW.data->>'title',NEW.data->>'body');
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER platform_policy_snapshot AFTER INSERT OR UPDATE ON marketing_records FOR EACH ROW EXECUTE FUNCTION snapshot_platform_policy();
CREATE TABLE account_consents (
 user_id uuid NOT NULL REFERENCES users(id), policy_version uuid NOT NULL REFERENCES platform_policy_versions(id),
 accepted_at timestamptz NOT NULL DEFAULT now(), purpose text NOT NULL DEFAULT 'registration', PRIMARY KEY(user_id,policy_version)
);

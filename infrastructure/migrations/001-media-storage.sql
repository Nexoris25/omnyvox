CREATE TABLE IF NOT EXISTS storage_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  endpoint text NOT NULL,
  zone text NOT NULL,
  secret text NOT NULL,
  tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS storage_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK(id),
  provider_id uuid REFERENCES storage_providers(id)
);
INSERT INTO storage_settings(id) VALUES(true) ON CONFLICT DO NOTHING;
ALTER TABLE media ALTER COLUMN bytes DROP NOT NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES storage_providers(id);
ALTER TABLE media ADD COLUMN IF NOT EXISTS object_key text;
ALTER TABLE media ADD COLUMN IF NOT EXISTS size bigint;
ALTER TABLE media ADD COLUMN IF NOT EXISTS checksum text;
ALTER TABLE media ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN IF NOT EXISTS folder text NOT NULL DEFAULT '';
UPDATE media SET size=octet_length(bytes) WHERE size IS NULL;
CREATE OR REPLACE FUNCTION media_local_size() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.bytes IS NOT NULL THEN NEW.size := octet_length(NEW.bytes); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER media_local_size_trigger BEFORE INSERT OR UPDATE ON media FOR EACH ROW EXECUTE FUNCTION media_local_size();
ALTER TABLE media ALTER COLUMN size SET NOT NULL;
ALTER TABLE media ADD CONSTRAINT media_storage_location CHECK (
  (provider_id IS NULL AND bytes IS NOT NULL AND object_key IS NULL) OR
  (provider_id IS NOT NULL AND bytes IS NULL AND object_key IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS media_provider ON media(provider_id);
CREATE TABLE IF NOT EXISTS storage_cleanup (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES storage_providers(id),
  object_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id,object_key)
);

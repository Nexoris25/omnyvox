CREATE TABLE record_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id),
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX record_versions_record ON record_versions(record_id,created_at DESC);
CREATE FUNCTION capture_record_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.data IS DISTINCT FROM NEW.data AND OLD.kind IN ('pages','articles','legal','authors','categories') THEN
    INSERT INTO record_versions(record_id,site_id,data) VALUES(OLD.id,OLD.site_id,OLD.data);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER records_history BEFORE UPDATE ON records FOR EACH ROW EXECUTE FUNCTION capture_record_version();

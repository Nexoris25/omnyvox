-- Serialize policy removal against publication and protect the live policy set.
CREATE FUNCTION protect_live_policy() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE live_status text;
BEGIN
 IF OLD.kind <> 'legal' OR OLD.data->>'status' <> 'published' THEN
   IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 SELECT status INTO live_status FROM sites WHERE id=OLD.site_id FOR UPDATE;
 IF live_status='published' AND (TG_OP='DELETE' OR NEW.data->>'status' IS DISTINCT FROM 'published' OR NEW.data->>'policyType' IS DISTINCT FROM OLD.data->>'policyType' OR NEW.data->>'policyReviewed' IS DISTINCT FROM 'true') THEN
   IF NOT EXISTS(SELECT 1 FROM records WHERE site_id=OLD.site_id AND kind='legal' AND id<>OLD.id AND data->>'status'='published' AND data->>'policyReviewed'='true' AND data->>'policyType'=OLD.data->>'policyType') THEN
     RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='Publish a reviewed replacement policy or unpublish the website before removing this live policy.';
   END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
CREATE TRIGGER protect_live_policy BEFORE UPDATE OR DELETE ON records FOR EACH ROW EXECUTE FUNCTION protect_live_policy();

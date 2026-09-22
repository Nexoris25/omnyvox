CREATE TABLE industries(id text PRIMARY KEY, label text NOT NULL, category text NOT NULL CHECK(category IN ('corporate','commerce')), collections jsonb NOT NULL DEFAULT '{}', core_pages jsonb NOT NULL DEFAULT '[]', enabled boolean NOT NULL DEFAULT true);
INSERT INTO industries(id,label,category,collections,core_pages) VALUES
('technology','Software & IT','corporate','{"offerings":"Services","projects":"Projects","people":"Team"}','["About","Services","Projects","Contact"]'),
('consulting','Consulting & accounting','corporate','{"offerings":"Services","people":"Team"}','["About","Services","Team","Contact"]'),
('legal','Law firm','corporate','{"offerings":"Practice Areas","people":"People"}','["About","Practice Areas","People","Contact"]'),
('healthcare','Clinic & diagnostics','corporate','{"offerings":"Medical Services","people":"Professionals","facilities":"Facilities"}','["About","Medical Services","Facilities","Contact"]'),
('property','Real estate','corporate','{"properties":"Properties","offerings":"Services"}','["About","Properties","Services","Contact"]'),
('construction','Construction & architecture','corporate','{"offerings":"Services","projects":"Projects"}','["About","Services","Projects","Contact"]'),
('solar','Solar & engineering','corporate','{"offerings":"Solutions","projects":"Projects"}','["About","Solutions","Projects","Contact"]'),
('logistics','Logistics & delivery','corporate','{"offerings":"Services","locations":"Coverage"}','["About","Services","Coverage","Contact"]'),
('education','School & training','corporate','{"programmes":"Programmes","people":"Faculty","facilities":"Facilities"}','["About","Programmes","Admissions","Contact"]'),
('community','NGO & community','corporate','{"programmes":"Programmes","projects":"Projects"}','["About","Programmes","Impact","Contact"]'),
('hospitality','Hotel & hospitality','corporate','{"facilities":"Rooms & Facilities","locations":"Locations"}','["About","Rooms","Gallery","Contact"]'),
('general','General services','corporate','{"offerings":"Services"}','["About","Services","FAQ","Contact"]'),
('fashion','Fashion','commerce','{}','["About","Contact","Size Guide","FAQ"]'),
('beauty','Beauty & cosmetics','commerce','{}','["About","Contact","Product Guide","FAQ"]'),
('electronics','Electronics','commerce','{}','["About","Contact","Buying Guide","FAQ"]'),
('furniture','Furniture & home','commerce','{}','["About","Contact","Measurements","FAQ"]'),
('books','Books & media','commerce','{}','["About","Contact","FAQ"]'),
('food','Food & grocery','commerce','{}','["About","Contact","FAQ"]'),
('retail','General retail','commerce','{}','["About","Contact","FAQ"]');
ALTER TABLE sites ADD COLUMN industry_id text REFERENCES industries(id);
UPDATE sites SET industry_id=CASE WHEN category='commerce' THEN 'retail' ELSE 'general' END WHERE industry_id IS NULL;
-- Keep the existing effective_sites column order for compatibility.
CREATE OR REPLACE VIEW effective_sites AS SELECT s.id,s.owner_id,s.name,s.slug,s.category,COALESCE(root.tier,s.tier) AS tier,s.status,CASE WHEN root.status='suspended' THEN 'suspended' ELSE COALESCE(root.subscription,s.subscription) END AS subscription,s.data,s.published,s.created_at,COALESCE(root.paid_until,s.paid_until) AS paid_until,s.subscription_site_id,COALESCE(root.billing_interval,s.billing_interval) AS billing_interval,COALESCE(root.paid_until,s.paid_until)+CASE WHEN COALESCE(root.billing_interval,s.billing_interval)='annual' THEN interval '7 days' ELSE interval '1 day' END AS service_until,s.industry_id FROM sites s LEFT JOIN sites root ON root.id=s.subscription_site_id AND root.owner_id=s.owner_id;
UPDATE plans SET entitlements=COALESCE(entitlements,'{}')||jsonb_build_object('storageBytes',CASE id WHEN 'corporate-basic' THEN 1073741824::bigint WHEN 'corporate-growth' THEN 5368709120::bigint WHEN 'corporate-advanced' THEN 21474836480::bigint WHEN 'commerce-basic' THEN 2147483648::bigint WHEN 'commerce-growth' THEN 10737418240::bigint ELSE 32212254720::bigint END) WHERE NOT COALESCE(entitlements,'{}') ? 'storageBytes';
CREATE TABLE site_forms(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),site_id uuid NOT NULL UNIQUE REFERENCES sites(id),active_email text,pending_email text,verification_hash text,expires_at timestamptz,attempts integer NOT NULL DEFAULT 0,sent_at timestamptz,verified_at timestamptz);
INSERT INTO site_forms(site_id) SELECT id FROM sites;
ALTER TABLE email_outbox ADD COLUMN attempts integer NOT NULL DEFAULT 0;
ALTER TABLE email_outbox ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE email_outbox ADD COLUMN last_error text;
ALTER TABLE email_outbox ADD COLUMN site_id uuid REFERENCES sites(id);
ALTER TABLE email_outbox ADD COLUMN enquiry_id uuid REFERENCES records(id) ON DELETE SET NULL;
ALTER TABLE email_outbox ADD COLUMN reply_to text;
ALTER TABLE email_outbox ADD COLUMN provider_id text;
CREATE TABLE business_profiles(site_id uuid PRIMARY KEY REFERENCES sites(id),data jsonb NOT NULL DEFAULT '{}',updated_at timestamptz NOT NULL DEFAULT now());

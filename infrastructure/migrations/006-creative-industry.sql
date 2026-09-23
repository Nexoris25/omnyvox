-- Software businesses typically build their own websites, so the industry is
-- no longer offered for new sites. Existing sites keep their industry.
UPDATE industries SET enabled=false WHERE id='technology';
INSERT INTO industries(id,label,category,collections,core_pages) VALUES
('creative','Creative & events','corporate','{"offerings":"Services","projects":"Portfolio"}','["About","Services","Portfolio","Contact"]')
ON CONFLICT (id) DO NOTHING;

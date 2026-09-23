-- Delivery zones and pickup locations per store; separate order accounting.
CREATE TABLE store_fulfilment(
 site_id uuid PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
 settings jsonb NOT NULL DEFAULT '{"zones":[],"pickup":[]}',
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ADD COLUMN subtotal integer;
ALTER TABLE orders ADD COLUMN delivery_fee integer;
ALTER TABLE orders ADD COLUMN fulfilment jsonb;
UPDATE orders o SET delivery_fee=o.amount-(SELECT COALESCE(sum((i->>'price')::int*(i->>'quantity')::int),0) FROM jsonb_array_elements(o.items) i),subtotal=(SELECT COALESCE(sum((i->>'price')::int*(i->>'quantity')::int),0) FROM jsonb_array_elements(o.items) i),fulfilment='{"method":"delivery","name":"Standard delivery"}' WHERE subtotal IS NULL;

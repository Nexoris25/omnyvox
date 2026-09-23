-- Orders whose payment cannot be confirmed automatically move to
-- 'verification_required' (stock stays reserved, automatic retries stop).
-- Late payments after release remain 'review_required'. Both need a person.
ALTER TABLE orders ADD COLUMN review_reason text;
ALTER TABLE orders ADD COLUMN review_opened_at timestamptz;
ALTER TABLE orders ADD COLUMN refund_reference text;
ALTER TABLE order_events ADD COLUMN note text;
UPDATE orders SET review_opened_at=created_at,review_reason='Payment received after the stock reservation was released.' WHERE payment_status='review_required' AND review_opened_at IS NULL;
CREATE INDEX orders_needing_review ON orders(site_id,review_opened_at) WHERE payment_status IN ('verification_required','review_required');

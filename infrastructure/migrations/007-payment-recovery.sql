ALTER TABLE orders ADD COLUMN reservation_expires_at timestamptz NOT NULL DEFAULT now()+interval '1 hour';
ALTER TABLE orders ADD COLUMN reconcile_after timestamptz NOT NULL DEFAULT now()+interval '1 hour';
ALTER TABLE orders ADD COLUMN reconcile_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN reconcile_error text;
CREATE INDEX orders_reconcile_due ON orders(reconcile_after) WHERE payment_status='pending';
CREATE TABLE order_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 order_id uuid NOT NULL REFERENCES orders(id),
 actor text NOT NULL,
 event text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);

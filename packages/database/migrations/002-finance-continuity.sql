ALTER TABLE orders ADD COLUMN IF NOT EXISTS commitment_kind text CHECK(commitment_kind IN('verified_payment','approved_credit'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount numeric(24,0) NOT NULL DEFAULT 0 CHECK(refunded_amount>=0);
UPDATE orders o SET commitment_kind=e.payload->>'commitmentKind' FROM outbox e WHERE e.aggregate_id=o.id AND e.event_type='purchase.committed.v1' AND o.commitment_kind IS NULL AND e.payload->>'commitmentKind' IN('verified_payment','approved_credit');

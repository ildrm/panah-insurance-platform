ALTER TABLE orders DROP CONSTRAINT orders_payment_state_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_state_check CHECK(payment_state IN('pending','verified','credit','wallet'));
ALTER TABLE orders DROP CONSTRAINT orders_commitment_kind_check;
ALTER TABLE orders ADD CONSTRAINT orders_commitment_kind_check CHECK(commitment_kind IN('verified_payment','approved_credit','verified_wallet_allocation'));
CREATE TABLE sandbox_finance_intents (
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL,owner_id uuid NOT NULL,
 purpose text NOT NULL CHECK(purpose IN('wallet_funding','installment_payment','invoice_payment')),
 target_reference text,amount numeric(24,0) NOT NULL CHECK(amount>0),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','confirmed')),
 idempotency_key text NOT NULL,digest text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),confirmed_at timestamptz,
 UNIQUE(tenant_id,owner_id,idempotency_key),CHECK((purpose='wallet_funding')=(target_reference IS NULL))
);
CREATE INDEX sandbox_finance_owner ON sandbox_finance_intents(tenant_id,owner_id,created_at DESC);
CREATE TABLE sandbox_finance_payouts (
 business_key text PRIMARY KEY,id uuid NOT NULL UNIQUE,tenant_id uuid NOT NULL,owner_id uuid NOT NULL,
 recipient_reference text NOT NULL,amount numeric(24,0) NOT NULL CHECK(amount>0),provider_reference text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);

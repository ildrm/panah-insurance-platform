CREATE TABLE credit_servicing (
 order_id uuid PRIMARY KEY REFERENCES orders(id),tenant_id uuid NOT NULL,owner_id uuid NOT NULL,
 total numeric(24,0) NOT NULL CHECK(total>0),paid numeric(24,0) NOT NULL DEFAULT 0 CHECK(paid>=0 AND paid<=total),
 installment_plan_id uuid UNIQUE,version int NOT NULL DEFAULT 1
);

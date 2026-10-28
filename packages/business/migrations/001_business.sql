CREATE TABLE IF NOT EXISTS business_records (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  tenant_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  carrier_id text,
  visibility text NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','organization','public')),
  state text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS business_records_scope ON business_records(tenant_id,kind,updated_at DESC,id);
CREATE INDEX IF NOT EXISTS business_records_owner ON business_records(owner_id,kind,id);
CREATE UNIQUE INDEX IF NOT EXISTS business_content_slug ON business_records((data->>'slug')) WHERE kind='content' AND state='published';
CREATE TABLE IF NOT EXISTS business_idempotency (
  tenant_id uuid NOT NULL, actor_id uuid NOT NULL, operation text NOT NULL, key text NOT NULL,
  request_hash text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL,
  PRIMARY KEY(tenant_id,actor_id,operation,key)
);
CREATE TABLE IF NOT EXISTS business_audit (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, actor_id uuid NOT NULL,
  operation text NOT NULL, resource_id uuid NOT NULL, version integer NOT NULL,
  reason text, created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS business_events (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, aggregate_id uuid NOT NULL,
  aggregate_version integer NOT NULL, event_type text NOT NULL,
  payload jsonb NOT NULL, created_at timestamptz NOT NULL,
  UNIQUE(aggregate_id,aggregate_version,event_type)
);
CREATE TABLE IF NOT EXISTS business_inventory (
  part_id uuid PRIMARY KEY REFERENCES business_records(id),
  available integer NOT NULL CHECK(available>=0),
  reserved integer NOT NULL DEFAULT 0 CHECK(reserved>=0)
);
CREATE TABLE IF NOT EXISTS business_points (
  owner_id uuid PRIMARY KEY, confirmed bigint NOT NULL DEFAULT 0 CHECK(confirmed>=0),
  reserved bigint NOT NULL DEFAULT 0 CHECK(reserved>=0)
);
CREATE TABLE IF NOT EXISTS business_point_entries (
  id uuid PRIMARY KEY, owner_id uuid NOT NULL, source_key text NOT NULL,
  amount bigint NOT NULL, state text NOT NULL CHECK(state IN('pending','confirmed','reversed','redeemed')),
  created_at timestamptz NOT NULL, UNIQUE(owner_id,source_key)
);
CREATE TABLE IF NOT EXISTS business_enrollments (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, external_id text NOT NULL,
  effective_from date NOT NULL, effective_until date,
  beneficiary_user_id uuid, name text NOT NULL, relationship text NOT NULL,
  batch_id uuid NOT NULL REFERENCES business_records(id),
  CHECK(effective_until IS NULL OR effective_until>effective_from),
  UNIQUE(tenant_id,external_id,effective_from)
);
CREATE INDEX IF NOT EXISTS business_enrollments_scope ON business_enrollments(tenant_id,external_id,effective_from);
CREATE TABLE IF NOT EXISTS business_slot_reservations (
  provider_id uuid NOT NULL, service_code text NOT NULL, slot text NOT NULL,
  booking_id uuid NOT NULL REFERENCES business_records(id),
  PRIMARY KEY(provider_id,service_code,slot)
);
CREATE TABLE IF NOT EXISTS business_documents (
  id uuid PRIMARY KEY REFERENCES business_records(id), tenant_id uuid NOT NULL, owner_id uuid NOT NULL,
  case_kind text NOT NULL, case_id uuid NOT NULL REFERENCES business_records(id),
  file_name text NOT NULL, mime_type text NOT NULL, sha256 text NOT NULL,
  storage_key text NOT NULL, size_bytes integer NOT NULL CHECK(size_bytes>0 AND size_bytes<=262144),
  scan_state text NOT NULL CHECK(scan_state IN('clean_synthetic','quarantined','rejected')),
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS business_documents_case ON business_documents(tenant_id,case_id,scan_state);

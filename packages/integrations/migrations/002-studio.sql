CREATE TABLE IF NOT EXISTS partner_connection_versions(
  id uuid PRIMARY KEY,
  carrier_id text NOT NULL CHECK(carrier_id IN('rest','soap','signed')),
  environment text NOT NULL CHECK(environment='sandbox'),
  version int NOT NULL CHECK(version>0),
  revision int NOT NULL DEFAULT 1,
  state text NOT NULL CHECK(state IN('draft','validated','enabled','disabled','degraded','suspended','superseded')),
  config jsonb NOT NULL,
  maker_id uuid NOT NULL,
  checker_id uuid,
  validation_evidence jsonb,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(carrier_id,environment,version)
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_one_enabled ON partner_connection_versions(carrier_id,environment) WHERE state='enabled';
CREATE INDEX IF NOT EXISTS partner_version_history ON partner_connection_versions(carrier_id,version DESC);

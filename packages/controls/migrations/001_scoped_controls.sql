CREATE TABLE IF NOT EXISTS scoped_control_versions(
 revision integer PRIMARY KEY CHECK(revision>0),registry_hash text NOT NULL,snapshot jsonb NOT NULL,
 maker_id uuid,checker_id uuid,reason text NOT NULL,source_revision integer,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS scoped_control_epoch(id integer PRIMARY KEY CHECK(id=1),revision integer NOT NULL REFERENCES scoped_control_versions(revision));
CREATE TABLE IF NOT EXISTS scoped_control_proposals(
 id uuid PRIMARY KEY,maker_id uuid NOT NULL,tenant_id uuid NOT NULL,expected_revision integer NOT NULL,
 kind text NOT NULL CHECK(kind IN('rules','rollback')),payload jsonb NOT NULL,digest text NOT NULL,
 state text NOT NULL DEFAULT 'proposed' CHECK(state IN('proposed','validated','approved')),
 checker_id uuid,approved_revision integer,created_at timestamptz NOT NULL DEFAULT now(),validated_at timestamptz
);
CREATE TABLE IF NOT EXISTS scoped_control_commands(
 actor_id uuid NOT NULL,tenant_id uuid NOT NULL,operation text NOT NULL,key text NOT NULL,digest text NOT NULL,response jsonb NOT NULL,
 PRIMARY KEY(actor_id,tenant_id,operation,key)
);
CREATE TABLE IF NOT EXISTS scoped_control_audit(
 id uuid PRIMARY KEY,actor_id uuid NOT NULL,tenant_id uuid NOT NULL,operation text NOT NULL,
 proposal_id uuid,revision integer,reason text NOT NULL,data jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS scoped_control_outbox(
 id uuid PRIMARY KEY,event_type text NOT NULL,revision integer NOT NULL UNIQUE,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scoped_proposals_state ON scoped_control_proposals(state,created_at,id);
CREATE INDEX IF NOT EXISTS scoped_audit_revision ON scoped_control_audit(revision,created_at,id);
CREATE OR REPLACE FUNCTION reject_scoped_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'scoped control history is append-only'; END $$;
DROP TRIGGER IF EXISTS scoped_version_immutable ON scoped_control_versions;
CREATE TRIGGER scoped_version_immutable BEFORE UPDATE OR DELETE ON scoped_control_versions FOR EACH ROW EXECUTE FUNCTION reject_scoped_history_mutation();
DROP TRIGGER IF EXISTS scoped_audit_immutable ON scoped_control_audit;
CREATE TRIGGER scoped_audit_immutable BEFORE UPDATE OR DELETE ON scoped_control_audit FOR EACH ROW EXECUTE FUNCTION reject_scoped_history_mutation();
CREATE OR REPLACE FUNCTION enforce_scoped_proposal_immutability() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.maker_id IS DISTINCT FROM OLD.maker_id OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id OR NEW.expected_revision IS DISTINCT FROM OLD.expected_revision OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.payload IS DISTINCT FROM OLD.payload OR NEW.digest IS DISTINCT FROM OLD.digest OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'scoped proposal input is immutable'; END IF;
 IF OLD.state='approved' THEN RAISE EXCEPTION 'approved scoped proposal is immutable'; END IF;
 RETURN NEW; END $$;
DROP TRIGGER IF EXISTS scoped_proposal_immutable ON scoped_control_proposals;
CREATE TRIGGER scoped_proposal_immutable BEFORE UPDATE ON scoped_control_proposals FOR EACH ROW EXECUTE FUNCTION enforce_scoped_proposal_immutability();

INSERT INTO scoped_control_versions(revision,registry_hash,snapshot,reason) VALUES(1,'6977ba5a28d32df44874f07b2700f1ff07369688c2778193c7599dd070563cac','[]'::jsonb,'Fail-closed registry baseline; no commercial operation enabled') ON CONFLICT(revision) DO NOTHING;
INSERT INTO scoped_control_epoch(id,revision) VALUES(1,1) ON CONFLICT(id) DO NOTHING;

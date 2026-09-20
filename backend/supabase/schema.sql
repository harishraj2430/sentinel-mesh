-- ====================================================================
-- SENTINEL MESH — SUPABASE POSTGRESQL FORENSIC DATABASE SCHEMA
-- Execute in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ====================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. USERS & ACCESS CONTROL (Multi-User Foundation)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'investigator' CHECK (role IN ('investigator', 'analyst', 'admin')),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. INVESTIGATION LEDGER (Append-Only Blockchain Evidence Store)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investigation_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prev_hash TEXT NOT NULL,
    hash TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only enforcement trigger: strictly prevent UPDATE or DELETE
CREATE OR REPLACE FUNCTION prevent_ledger_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'TAMPER ATTEMPT DETECTED: investigation_ledger is strictly append-only. Modification or deletion of forensic blocks is prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ledger_update_delete ON investigation_ledger;
CREATE TRIGGER trg_prevent_ledger_update_delete
    BEFORE UPDATE OR DELETE ON investigation_ledger
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_tampering();

-- --------------------------------------------------------------------
-- 3. THREAT EVENTS (Frequency Analytics & Threat Intelligence)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS threat_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id TEXT,
    threat_type TEXT NOT NULL,
    reason TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('CLEAN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_events_type ON threat_events(threat_type);
CREATE INDEX IF NOT EXISTS idx_threat_events_created_at ON threat_events(created_at);

-- --------------------------------------------------------------------
-- 4. LOGIN DEVICES & IMPOSSIBLE TRAVEL ATTRIBUTION
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_email TEXT NOT NULL,
    ip TEXT NOT NULL,
    device_type TEXT DEFAULT 'PC' CHECK (device_type IN ('PC', 'mobile', 'tablet', 'gateway', 'tor_exit', 'server')),
    model TEXT DEFAULT 'Standard Browser Node',
    city TEXT,
    country TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_account_email ON devices(account_email);

-- --------------------------------------------------------------------
-- 5. EMAIL ANALYSES (Forensic Header Repository)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id TEXT,
    parsed_headers JSONB NOT NULL,
    spf TEXT,
    dkim TEXT,
    dmarc TEXT,
    arc TEXT,
    mta_sts TEXT,
    tls_rpt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_analyses_msg_id ON email_analyses(message_id);

-- --------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Rule: The frontend NEVER receives the service-role key.
-- Only the backend API uses the service_role key to access tables.
-- --------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analyses ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically in Supabase, but explicit policies ensure safety:
DROP POLICY IF EXISTS "Service role full access on users" ON users;
CREATE POLICY "Service role full access on users" ON users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on ledger" ON investigation_ledger;
CREATE POLICY "Service role full access on ledger" ON investigation_ledger
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on threat_events" ON threat_events;
CREATE POLICY "Service role full access on threat_events" ON threat_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on devices" ON devices;
CREATE POLICY "Service role full access on devices" ON devices
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on email_analyses" ON email_analyses;
CREATE POLICY "Service role full access on email_analyses" ON email_analyses
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- End of schema

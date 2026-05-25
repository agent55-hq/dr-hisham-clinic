-- Agent55-OS SPRINT-001 Supabase Schema
-- Tenant: hisham
-- Compliance: sandbox-sprint001
-- Date: 2026-05-25
-- WARNING: This is a US-corporate-hosted sandbox instance.
-- SPRINT-002 will migrate to Hetzner Frankfurt (eu-central-1) for GDPR/DSGVO compliance.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- Patient Triage Table
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE patient_triage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  age integer,
  complaint text NOT NULL,
  tenant_id text NOT NULL DEFAULT 'hisham',
  consent_given boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- CRITICAL: RLS must be enabled BEFORE any patient data is inserted.
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE patient_triage ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts only, with tenant isolation
CREATE POLICY "anon_insert_only" ON patient_triage
  FOR INSERT TO anon
  WITH CHECK (tenant_id = 'hisham');

-- Policy: Explicitly deny SELECT to anonymous users
CREATE POLICY "no_read" ON patient_triage
  FOR SELECT TO anon USING (false);

-- Policy: Explicitly deny UPDATE to anonymous users
CREATE POLICY "no_update" ON patient_triage
  FOR UPDATE TO anon USING (false);

-- Policy: Explicitly deny DELETE to anonymous users
CREATE POLICY "no_delete" ON patient_triage
  FOR DELETE TO anon USING (false);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Comments & Documentation
-- ═══════════════════════════════════════════════════════════════════════════════
COMMENT ON TABLE patient_triage IS
  'Patient intake triage data for Agent55-OS. RLS enforced. No PHI leaves US jurisdiction in SPRINT-001. SPRINT-02 migration to Hetzner Frankfurt planned for GDPR/DSGVO compliance.';

COMMENT ON COLUMN patient_triage.consent_given IS
  'Patient explicit consent required under Jordan Personal Data Protection Law (PDPL) Law No. 21 of 2023. Must be true before any data insert is accepted by the frontend.';

COMMENT ON COLUMN patient_triage.tenant_id IS
  'Tenant isolation field. Each clinic gets a separate RLS policy. This field is hardcoded to ''hisham'' for SPRINT-001. Future sprints will parameterize this for yazeed/yousef tenants.';

COMMENT ON COLUMN patient_triage.phone IS
  'Phone number in E.164 format (e.g., +962795521527). Stored as text to preserve leading plus sign and country code.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Verification Query (run after setup)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Verify RLS is active:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'patient_triage';
-- Expected: relrowsecurity = true

-- Verify policies exist:
-- SELECT polname, polcmd, polpermissive FROM pg_policy WHERE polrelid = 'patient_triage'::regclass;
-- Expected: 4 policies (anon_insert_only, no_read, no_update, no_delete)

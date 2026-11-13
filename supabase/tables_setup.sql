-- ============================================================================
-- Dahej Support Freelancer & Developer Network - Table-Wise Database Schema
-- Run this SQL once in Supabase Dashboard -> SQL Editor if using direct client
-- access, OR configure SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.
-- ============================================================================

-- 1. Developers Table
CREATE TABLE IF NOT EXISTS public.developers (
  id TEXT PRIMARY KEY,
  developer_id TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT,
  avatar TEXT,
  primary_skill TEXT,
  experience TEXT,
  portfolio_url TEXT,
  reference_name TEXT,
  referral_code TEXT,
  reference_id TEXT,
  referral_trust_id TEXT,
  status TEXT DEFAULT 'Pending',
  availability TEXT DEFAULT 'Pending Approval',
  password TEXT,
  joining_date TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. QA Testers Table
CREATE TABLE IF NOT EXISTS public.testers (
  id TEXT PRIMARY KEY,
  tester_id TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'QA / Software Tester',
  specialization TEXT,
  testing_tools TEXT,
  experience TEXT,
  reference_name TEXT,
  referral_code TEXT,
  reference_id TEXT,
  referral_trust_id TEXT,
  status TEXT DEFAULT 'Pending',
  availability TEXT DEFAULT 'Pending Approval',
  password TEXT,
  joining_date TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT,
  developer_id TEXT,
  developer_name TEXT,
  developer_email TEXT,
  tester_id TEXT,
  tester_name TEXT,
  tester_email TEXT,
  status TEXT DEFAULT 'Pending',
  testing_status TEXT DEFAULT 'Pending',
  progress INTEGER DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Applications Intake / History Table
CREATE TABLE IF NOT EXISTS public.member_applications (
  id TEXT PRIMARY KEY,
  role_track TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  avatar TEXT,
  referral_code TEXT,
  reference_name TEXT,
  status TEXT DEFAULT 'Pending',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Deleted Members & Credential Registry Table
CREATE TABLE IF NOT EXISTS public.member_registry_meta (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row-Level Security with API access policies
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_registry_meta ENABLE ROW LEVEL SECURITY;

-- Policies for backend / serverless / portal operations
DO $$ BEGIN
  CREATE POLICY "Allow developers full access" ON public.developers FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow testers full access" ON public.testers FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow projects full access" ON public.projects FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow applications full access" ON public.member_applications FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow registry meta full access" ON public.member_registry_meta FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


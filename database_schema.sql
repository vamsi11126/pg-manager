-- =====================================================
-- PG Manager Database Schema
-- =====================================================
-- This script creates the necessary tables for the PG Manager application
-- Run this in your Supabase SQL Editor

-- =====================================================
-- PGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  rooms JSONB DEFAULT '[]'::jsonb,
  food_menu JSONB DEFAULT '[]'::jsonb,
  wifi_details JSONB DEFAULT '[]'::jsonb,
  electricity_data JSONB DEFAULT '{}'::jsonb,
  e_bill_rate NUMERIC DEFAULT 10,
  food_amount NUMERIC DEFAULT 0,
  map_link TEXT DEFAULT '',
  landing_qr TEXT DEFAULT '',
  brochure_url TEXT DEFAULT '',
  brochure_name TEXT DEFAULT '',
  facilities JSONB DEFAULT '[]'::jsonb,
  neighborhood_details TEXT DEFAULT '',
  gallery_photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GUARDIANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE NOT NULL,
  guardian_name TEXT NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  guardian_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill guardian columns for existing deployments
ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS guardian_email TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage their guardians" ON guardians;
CREATE POLICY "Admins can manage their guardians"
  ON guardians
  FOR ALL
  USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Guardian can view own assignment" ON guardians;
CREATE POLICY "Guardian can view own assignment"
  ON guardians
  FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_unique_active_pg
  ON guardians(pg_id)
  WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_unique_active_auth_user
  ON guardians(auth_user_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_guardians_admin_id ON guardians(admin_id);
CREATE INDEX IF NOT EXISTS idx_guardians_pg_id ON guardians(pg_id);
CREATE INDEX IF NOT EXISTS idx_guardians_auth_user_id ON guardians(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone);
CREATE INDEX IF NOT EXISTS idx_guardians_name ON guardians(guardian_name);

-- Enable Row Level Security
ALTER TABLE pgs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own pgs" ON pgs;

-- Policy: Users can only access their own PGs
CREATE POLICY "Users can manage their own pgs"
  ON pgs
  FOR ALL
  USING (
    admin_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM guardians g
      WHERE g.pg_id = pgs.id
        AND g.auth_user_id = auth.uid()
        AND g.is_active = true
    )
  );

-- Policy: Public can read PGs (for landing pages)
DROP POLICY IF EXISTS "Public can read pgs" ON pgs;
CREATE POLICY "Public can read pgs"
  ON pgs
  FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pgs_admin_id ON pgs(admin_id);

-- Backfill for existing deployments
ALTER TABLE pgs
ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT '';

ALTER TABLE pgs
ADD COLUMN IF NOT EXISTS landing_qr TEXT DEFAULT '';

ALTER TABLE pgs
ADD COLUMN IF NOT EXISTS brochure_url TEXT DEFAULT '';

ALTER TABLE pgs
ADD COLUMN IF NOT EXISTS brochure_name TEXT DEFAULT '';

-- =====================================================
-- TENANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  profession TEXT,
  aadhar TEXT NOT NULL,
  room_number TEXT NOT NULL,
  rent NUMERIC NOT NULL,
  advance NUMERIC NOT NULL,
  with_food BOOLEAN DEFAULT true,
  joining_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill tenant columns for existing deployments
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own tenants" ON tenants;

-- Policy: Users can only access their own tenants
CREATE POLICY "Users can manage their own tenants"
  ON tenants
  FOR ALL
  USING (
    admin_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM guardians g
      WHERE g.pg_id = tenants.pg_id
        AND g.auth_user_id = auth.uid()
        AND g.is_active = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_admin_id ON tenants(admin_id);
CREATE INDEX IF NOT EXISTS idx_tenants_pg_id ON tenants(pg_id);
CREATE INDEX IF NOT EXISTS idx_tenants_auth_user_id ON tenants(auth_user_id);

-- =====================================================
-- PROFILES TABLE (PUBLIC READ FOR LANDING PAGES)
-- =====================================================
-- NOTE: profiles table is created by Supabase auth. This section only adds policies.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
CREATE POLICY "Public can read profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- =====================================================
-- ADMIN INVITES TABLE (INVITE-ONLY ADMIN ONBOARDING)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can create invites" ON admin_invites;
CREATE POLICY "Admins can create invites"
  ON admin_invites
  FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view own invites" ON admin_invites;
CREATE POLICY "Admins can view own invites"
  ON admin_invites
  FOR SELECT
  USING (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can revoke own invites" ON admin_invites;
CREATE POLICY "Admins can revoke own invites"
  ON admin_invites
  FOR UPDATE
  USING (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON admin_invites (lower(email));
CREATE INDEX IF NOT EXISTS idx_admin_invites_invited_by ON admin_invites (invited_by);
CREATE INDEX IF NOT EXISTS idx_admin_invites_expires_at ON admin_invites (expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_invites_one_active_per_email
  ON admin_invites (lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- Allow tenants to view their own profile and roommates in the same room
DROP POLICY IF EXISTS "Tenants can view their own tenant record" ON tenants;
CREATE POLICY "Tenants can view their own tenant record"
  ON tenants
  FOR SELECT
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Tenants can view their own tenant record by email" ON tenants;
CREATE POLICY "Tenants can view their own tenant record by email"
  ON tenants
  FOR SELECT
  USING (email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Tenants can link their auth user" ON tenants;
CREATE POLICY "Tenants can link their auth user"
  ON tenants
  FOR UPDATE
  USING (email = (auth.jwt() ->> 'email'))
  WITH CHECK (email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Tenants can view roommates" ON tenants;
-- Avoid recursive RLS by using a SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION tenant_can_view_row(target_pg_id UUID, target_room_number TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenants self
    WHERE lower(trim(self.email)) = lower(trim(auth.jwt() ->> 'email'))
      AND self.pg_id = target_pg_id
      AND self.room_number = target_room_number
    LIMIT 1
  );
$$;

GRANT EXECUTE ON FUNCTION tenant_can_view_row(UUID, TEXT) TO authenticated;

CREATE POLICY "Tenants can view roommates"
  ON tenants
  FOR SELECT
  USING (tenant_can_view_row(pg_id, room_number));

-- =====================================================
-- VISIT REQUESTS TABLE (LEADS FROM LANDING PAGE)
-- =====================================================
CREATE TABLE IF NOT EXISTS visit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  visitor_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE visit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage their own visit requests" ON visit_requests;
CREATE POLICY "Admins can manage their own visit requests"
  ON visit_requests
  FOR ALL
  USING (admin_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_visit_requests_admin_id ON visit_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_pg_id ON visit_requests(pg_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_visitor_email ON visit_requests(lower(visitor_email));

-- =====================================================
-- PAYMENT REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  tenant_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Declined')),
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own payment requests" ON payment_requests;

-- Policy: Users can only access their own payment requests
CREATE POLICY "Users can manage their own payment requests"
  ON payment_requests
  FOR ALL
  USING (
    admin_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM guardians g
      WHERE g.pg_id = payment_requests.pg_id
        AND g.auth_user_id = auth.uid()
        AND g.is_active = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_admin_id ON payment_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_pg_id ON payment_requests(pg_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_tenant_id ON payment_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

-- Allow tenants to view and create their own payment requests
DROP POLICY IF EXISTS "Tenants can view their own payment requests" ON payment_requests;
CREATE POLICY "Tenants can view their own payment requests"
  ON payment_requests
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenants can create payment requests" ON payment_requests;
CREATE POLICY "Tenants can create payment requests"
  ON payment_requests
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE auth_user_id = auth.uid()
    )
  );

-- Allow tenants to view their PG details
DROP POLICY IF EXISTS "Tenants can view their PG" ON pgs;
CREATE POLICY "Tenants can view their PG"
  ON pgs
  FOR SELECT
  USING (
    id IN (
      SELECT pg_id FROM tenants WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- TENANT BILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  bill_type TEXT NOT NULL CHECK (bill_type IN ('Rent', 'Food', 'Electricity', 'Other')),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
  due_date DATE,
  month_label TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own tenant bills" ON tenant_bills;
CREATE POLICY "Users can manage their own tenant bills"
  ON tenant_bills
  FOR ALL
  USING (
    admin_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM guardians g
      WHERE g.pg_id = tenant_bills.pg_id
        AND g.auth_user_id = auth.uid()
        AND g.is_active = true
    )
  );

DROP POLICY IF EXISTS "Tenants can view their own bills" ON tenant_bills;
CREATE POLICY "Tenants can view their own bills"
  ON tenant_bills
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- TENANT BILLS (EMAIL-BASED TENANT ACCESS)
-- =====================================================
DROP POLICY IF EXISTS "Tenants can view their own tenant bills" ON tenant_bills;
CREATE POLICY "Tenants can view their own tenant bills"
  ON tenant_bills
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id
      FROM tenants
      WHERE lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

-- =====================================================
-- PAYMENT REQUESTS (EMAIL-BASED TENANT ACCESS)
-- =====================================================
DROP POLICY IF EXISTS "Tenants can create payment requests" ON payment_requests;
CREATE POLICY "Tenants can create payment requests"
  ON payment_requests
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id
      FROM tenants
      WHERE lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Tenants can view their own payment requests" ON payment_requests;
CREATE POLICY "Tenants can view their own payment requests"
  ON payment_requests
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id
      FROM tenants
      WHERE lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

CREATE INDEX IF NOT EXISTS idx_tenant_bills_admin_id ON tenant_bills(admin_id);
CREATE INDEX IF NOT EXISTS idx_tenant_bills_pg_id ON tenant_bills(pg_id);
CREATE INDEX IF NOT EXISTS idx_tenant_bills_tenant_id ON tenant_bills(tenant_id);

-- =====================================================
-- AUTOMATIC UPDATE TIMESTAMP TRIGGER
-- =====================================================
-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_pgs_updated_at ON pgs;
DROP TRIGGER IF EXISTS update_guardians_updated_at ON guardians;
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
DROP TRIGGER IF EXISTS update_tenant_bills_updated_at ON tenant_bills;
DROP TRIGGER IF EXISTS update_visit_requests_updated_at ON visit_requests;
DROP TRIGGER IF EXISTS update_admin_invites_updated_at ON admin_invites;

-- Trigger for pgs table
CREATE TRIGGER update_pgs_updated_at
    BEFORE UPDATE ON pgs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for guardians table
CREATE TRIGGER update_guardians_updated_at
    BEFORE UPDATE ON guardians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tenants table
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for payment_requests table
CREATE TRIGGER update_payment_requests_updated_at
    BEFORE UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tenant_bills table
CREATE TRIGGER update_tenant_bills_updated_at
    BEFORE UPDATE ON tenant_bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for visit_requests table
CREATE TRIGGER update_visit_requests_updated_at
    BEFORE UPDATE ON visit_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_invites table
CREATE TRIGGER update_admin_invites_updated_at
    BEFORE UPDATE ON admin_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BOOTSTRAP SINGLE SUPER ADMIN PROFILE (RUN MANUALLY)
-- =====================================================
-- 1) First create the auth user in Supabase Auth > Users
-- 2) Then replace the email below and run this block
INSERT INTO profiles (id, email, full_name, role)
SELECT id, lower(email), 'Super Admin', 'admin'
FROM auth.users
WHERE lower(email) = lower('your_email@example.com')
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- =====================================================
-- VERIFICATION QUERIES (Optional - Run after creation)
-- =====================================================
-- SELECT * FROM tenants;
-- SELECT * FROM payment_requests;

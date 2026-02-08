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
  facilities JSONB DEFAULT '[]'::jsonb,
  neighborhood_details TEXT DEFAULT '',
  gallery_photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE pgs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own pgs" ON pgs;

-- Policy: Users can only access their own PGs
CREATE POLICY "Users can manage their own pgs"
  ON pgs
  FOR ALL
  USING (admin_id = auth.uid());

-- Policy: Public can read PGs (for landing pages)
DROP POLICY IF EXISTS "Public can read pgs" ON pgs;
CREATE POLICY "Public can read pgs"
  ON pgs
  FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pgs_admin_id ON pgs(admin_id);

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

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own tenants" ON tenants;

-- Policy: Users can only access their own tenants
CREATE POLICY "Users can manage their own tenants"
  ON tenants
  FOR ALL
  USING (admin_id = auth.uid());

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
CREATE POLICY "Tenants can view roommates"
  ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM tenants t2
      WHERE t2.auth_user_id = auth.uid()
        AND t2.pg_id = tenants.pg_id
        AND t2.room_number = tenants.room_number
    )
  );

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
  USING (admin_id = auth.uid());

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
  USING (admin_id = auth.uid());

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
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
DROP TRIGGER IF EXISTS update_tenant_bills_updated_at ON tenant_bills;

-- Trigger for pgs table
CREATE TRIGGER update_pgs_updated_at
    BEFORE UPDATE ON pgs
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

-- =====================================================
-- VERIFICATION QUERIES (Optional - Run after creation)
-- =====================================================
-- SELECT * FROM tenants;
-- SELECT * FROM payment_requests;

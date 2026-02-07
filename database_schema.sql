-- =====================================================
-- PG Manager Database Schema
-- =====================================================
-- This script creates the necessary tables for the PG Manager application
-- Run this in your Supabase SQL Editor

-- =====================================================
-- TENANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;

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

-- =====================================================
-- VERIFICATION QUERIES (Optional - Run after creation)
-- =====================================================
-- SELECT * FROM tenants;
-- SELECT * FROM payment_requests;

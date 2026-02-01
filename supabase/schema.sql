-- DataFlow CRM Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CONTACTS TABLE
-- Stores synced contacts from GoHighLevel
-- =====================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghl_id TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_ghl_id ON contacts(ghl_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- =====================================================
-- OPPORTUNITIES TABLE
-- Stores synced opportunities from GoHighLevel
-- =====================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghl_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  monetary_value DECIMAL(12, 2),
  pipeline_id TEXT NOT NULL,
  pipeline_stage_id TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ghl_contact_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_ghl_id ON opportunities(ghl_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline_id ON opportunities(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);

-- =====================================================
-- ACTIVITY LOGS TABLE
-- Tracks all actions performed in the system
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sync', 'move')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'opportunity')),
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);

-- =====================================================
-- UPDATED_AT TRIGGER
-- Automatically updates the updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to contacts table
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to opportunities table
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (Optional - for production)
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
CREATE POLICY "Service role can do everything on contacts"
  ON contacts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on opportunities"
  ON opportunities FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on activity_logs"
  ON activity_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SAMPLE QUERIES (for reference)
-- =====================================================
-- Get all contacts with their opportunities:
-- SELECT c.*, o.name as opportunity_name, o.monetary_value
-- FROM contacts c
-- LEFT JOIN opportunities o ON c.id = o.contact_id;

-- Get total pipeline value by status:
-- SELECT status, SUM(monetary_value) as total_value
-- FROM opportunities
-- GROUP BY status;

-- Get recent activity:
-- SELECT * FROM activity_logs
-- ORDER BY created_at DESC
-- LIMIT 50;

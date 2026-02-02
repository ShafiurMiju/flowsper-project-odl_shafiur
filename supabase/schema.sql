-- Flowsper Database Schema - Multi-Tenant Version
-- Run this in your Supabase SQL Editor
-- ⚠️ WARNING: This will drop existing tables. Backup data first!

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES (if any) - BE CAREFUL IN PRODUCTION
-- =====================================================
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS admin_active_sub_account CASCADE;
DROP TABLE IF EXISTS sub_accounts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS conversation_type CASCADE;
DROP TYPE IF EXISTS message_direction CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;

-- =====================================================
-- CUSTOM TYPES
-- =====================================================
CREATE TYPE user_role AS ENUM ('admin', 'sub_account');
CREATE TYPE conversation_type AS ENUM ('SMS', 'Email', 'GMB', 'IG', 'FB', 'WhatsApp', 'Live_Chat', 'Custom');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_status AS ENUM ('pending', 'scheduled', 'sent', 'delivered', 'read', 'failed', 'undelivered');

-- =====================================================
-- USER PROFILES TABLE
-- Links Supabase Auth users to our app with roles
-- =====================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'sub_account',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- =====================================================
-- SUB ACCOUNTS TABLE
-- Stores GHL sub-account configurations
-- =====================================================
CREATE TABLE sub_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ghl_location_id TEXT UNIQUE NOT NULL,
  ghl_api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_sub_accounts_user_id ON sub_accounts(user_id);
CREATE INDEX idx_sub_accounts_location_id ON sub_accounts(ghl_location_id);

-- =====================================================
-- CONTACTS TABLE
-- Stores synced contacts from GoHighLevel (now per sub-account)
-- =====================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  ghl_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sub_account_id, ghl_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_contacts_sub_account_id ON contacts(sub_account_id);
CREATE INDEX idx_contacts_ghl_id ON contacts(ghl_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- =====================================================
-- OPPORTUNITIES TABLE
-- Stores synced opportunities from GoHighLevel (now per sub-account)
-- =====================================================
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  ghl_id TEXT NOT NULL,
  name TEXT NOT NULL,
  monetary_value DECIMAL(12, 2),
  pipeline_id TEXT NOT NULL,
  pipeline_stage_id TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ghl_contact_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sub_account_id, ghl_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_opportunities_sub_account_id ON opportunities(sub_account_id);
CREATE INDEX idx_opportunities_ghl_id ON opportunities(ghl_id);
CREATE INDEX idx_opportunities_pipeline_id ON opportunities(pipeline_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);

-- =====================================================
-- CONVERSATIONS TABLE
-- Stores synced conversations from GoHighLevel (per sub-account)
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  ghl_id TEXT NOT NULL,
  ghl_contact_id TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type conversation_type NOT NULL DEFAULT 'SMS',
  unread_count INTEGER DEFAULT 0,
  last_message_date TIMESTAMPTZ,
  last_message_body TEXT,
  last_message_type conversation_type,
  starred BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sub_account_id, ghl_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_conversations_sub_account_id ON conversations(sub_account_id);
CREATE INDEX idx_conversations_ghl_id ON conversations(ghl_id);
CREATE INDEX idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX idx_conversations_last_message_date ON conversations(last_message_date DESC);
CREATE INDEX idx_conversations_unread ON conversations(unread_count) WHERE unread_count > 0;

-- =====================================================
-- MESSAGES TABLE
-- Stores individual messages from conversations
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  ghl_id TEXT NOT NULL,
  ghl_contact_id TEXT NOT NULL,
  body TEXT,
  type conversation_type NOT NULL DEFAULT 'SMS',
  direction message_direction NOT NULL DEFAULT 'inbound',
  status message_status NOT NULL DEFAULT 'delivered',
  content_type TEXT,
  attachments TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES user_profiles(id),
  message_date TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sub_account_id, ghl_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_messages_sub_account_id ON messages(sub_account_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_ghl_id ON messages(ghl_id);
CREATE INDEX idx_messages_message_date ON messages(message_date DESC);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_status ON messages(status);

-- =====================================================
-- ACTIVITY LOGS TABLE
-- Tracks all actions performed in the system (now per sub-account)
-- =====================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sync', 'move', 'login', 'logout')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'opportunity', 'sub_account', 'user')),
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster time-based queries
CREATE INDEX idx_activity_logs_sub_account_id ON activity_logs(sub_account_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);

-- =====================================================
-- ADMIN ACTIVE SUB-ACCOUNT TABLE
-- Tracks which sub-account admin is currently viewing
-- =====================================================
CREATE TABLE admin_active_sub_account (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  active_sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Apply triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_accounts_updated_at
  BEFORE UPDATE ON sub_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_active_sub_account_updated_at
  BEFORE UPDATE ON admin_active_sub_account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO CREATE USER PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'sub_account')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_active_sub_account ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's sub_account_id (for sub-account users)
CREATE OR REPLACE FUNCTION get_user_sub_account_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM sub_accounts 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin's active sub-account (for switching)
CREATE OR REPLACE FUNCTION get_admin_active_sub_account()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT active_sub_account_id 
    FROM admin_active_sub_account 
    WHERE admin_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES - USER PROFILES
-- =====================================================
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can manage all profiles"
  ON user_profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - SUB ACCOUNTS
-- =====================================================
CREATE POLICY "Users can view own sub-account"
  ON sub_accounts FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admin can manage all sub-accounts"
  ON sub_accounts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- RLS POLICIES - CONTACTS
-- =====================================================
CREATE POLICY "Users can view own sub-account contacts"
  ON contacts FOR SELECT
  USING (
    sub_account_id = get_user_sub_account_id() 
    OR (is_admin() AND (sub_account_id = get_admin_active_sub_account() OR get_admin_active_sub_account() IS NULL))
  );

CREATE POLICY "Users can manage own sub-account contacts"
  ON contacts FOR ALL
  USING (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  )
  WITH CHECK (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  );

-- =====================================================
-- RLS POLICIES - OPPORTUNITIES
-- =====================================================
CREATE POLICY "Users can view own sub-account opportunities"
  ON opportunities FOR SELECT
  USING (
    sub_account_id = get_user_sub_account_id() 
    OR (is_admin() AND (sub_account_id = get_admin_active_sub_account() OR get_admin_active_sub_account() IS NULL))
  );

CREATE POLICY "Users can manage own sub-account opportunities"
  ON opportunities FOR ALL
  USING (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  )
  WITH CHECK (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  );

-- =====================================================
-- RLS POLICIES - ACTIVITY LOGS
-- =====================================================
CREATE POLICY "Users can view own sub-account activity"
  ON activity_logs FOR SELECT
  USING (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  );

CREATE POLICY "Users can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  );

-- =====================================================
-- RLS POLICIES - ADMIN ACTIVE SUB ACCOUNT
-- =====================================================
CREATE POLICY "Admin can manage own active sub-account"
  ON admin_active_sub_account FOR ALL
  USING (admin_user_id = auth.uid() AND is_admin())
  WITH CHECK (admin_user_id = auth.uid() AND is_admin());

-- =====================================================
-- SERVICE ROLE BYPASS (for API routes)
-- These policies allow server-side operations
-- =====================================================
CREATE POLICY "Service role bypass user_profiles"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role bypass sub_accounts"
  ON sub_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role bypass contacts"
  ON contacts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role bypass opportunities"
  ON opportunities FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role bypass activity_logs"
  ON activity_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role bypass admin_active_sub_account"
  ON admin_active_sub_account FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- RLS POLICIES - CONVERSATIONS
-- =====================================================
CREATE POLICY "Users can view own sub-account conversations"
  ON conversations FOR SELECT
  USING (
    sub_account_id = get_user_sub_account_id() 
    OR (is_admin() AND (sub_account_id = get_admin_active_sub_account() OR get_admin_active_sub_account() IS NULL))
  );

CREATE POLICY "Users can manage own sub-account conversations"
  ON conversations FOR ALL
  USING (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  )
  WITH CHECK (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  );

CREATE POLICY "Service role bypass conversations"
  ON conversations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- RLS POLICIES - MESSAGES
-- =====================================================
CREATE POLICY "Users can view own sub-account messages"
  ON messages FOR SELECT
  USING (
    sub_account_id = get_user_sub_account_id() 
    OR (is_admin() AND (sub_account_id = get_admin_active_sub_account() OR get_admin_active_sub_account() IS NULL))
  );

CREATE POLICY "Users can manage own sub-account messages"
  ON messages FOR ALL
  USING (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  )
  WITH CHECK (
    sub_account_id = get_user_sub_account_id() 
    OR is_admin()
  );

CREATE POLICY "Service role bypass messages"
  ON messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

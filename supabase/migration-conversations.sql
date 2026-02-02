-- =====================================================
-- SAFE MIGRATION: Add Conversations Feature
-- This script ONLY adds new tables without affecting existing data
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- ADD NEW CUSTOM TYPES
-- =====================================================
DO $$ BEGIN
  CREATE TYPE conversation_type AS ENUM ('SMS', 'Email', 'GMB', 'IG', 'FB', 'WhatsApp', 'Live_Chat', 'Custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('pending', 'scheduled', 'sent', 'delivered', 'read', 'failed', 'undelivered');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CREATE CONVERSATIONS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
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

-- Create indexes for faster lookups (only if they don't exist)
DO $$ BEGIN
  CREATE INDEX idx_conversations_sub_account_id ON conversations(sub_account_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_conversations_ghl_id ON conversations(ghl_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_conversations_contact_id ON conversations(contact_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_conversations_last_message_date ON conversations(last_message_date DESC);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_conversations_unread ON conversations(unread_count) WHERE unread_count > 0;
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- =====================================================
-- CREATE MESSAGES TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
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

-- Create indexes for faster lookups (only if they don't exist)
DO $$ BEGIN
  CREATE INDEX idx_messages_sub_account_id ON messages(sub_account_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_messages_ghl_id ON messages(ghl_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_messages_message_date ON messages(message_date DESC);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_messages_direction ON messages(direction);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_messages_status ON messages(status);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - CONVERSATIONS
-- =====================================================
DO $$ BEGIN
  CREATE POLICY "Users can view own sub-account conversations"
    ON conversations FOR SELECT
    USING (
      sub_account_id = get_user_sub_account_id() 
      OR (is_admin() AND (sub_account_id = get_admin_active_sub_account() OR get_admin_active_sub_account() IS NULL))
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role bypass conversations"
    ON conversations FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- RLS POLICIES - MESSAGES
-- =====================================================
DO $$ BEGIN
  CREATE POLICY "Users can view own sub-account messages"
    ON messages FOR SELECT
    USING (
      sub_account_id = get_user_sub_account_id() 
      OR (is_admin() AND (sub_account_id = get_admin_active_sub_account() OR get_admin_active_sub_account() IS NULL))
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role bypass messages"
    ON messages FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- DONE!
-- =====================================================
-- Your existing data is safe!
-- New tables (conversations, messages) have been created.
-- You can now use the conversations feature!
-- =====================================================

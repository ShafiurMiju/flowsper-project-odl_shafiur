-- Migration: Add Conversation AI Bots table
-- Run this in your Supabase SQL Editor

-- Create enum types for conversation AI
DO $$ BEGIN
  CREATE TYPE conversation_ai_bot_type AS ENUM ('sms', 'email', 'live_chat', 'facebook', 'instagram', 'whatsapp');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE conversation_ai_bot_status AS ENUM ('active', 'inactive', 'draft');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CONVERSATION AI BOTS TABLE
-- Stores AI bot configurations for each sub-account
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_ai_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type conversation_ai_bot_type NOT NULL DEFAULT 'sms',
  status conversation_ai_bot_status NOT NULL DEFAULT 'draft',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  system_prompt TEXT,
  welcome_message TEXT,
  fallback_message TEXT,
  handoff_message TEXT,
  knowledge_base_ids TEXT[] DEFAULT '{}',
  max_tokens INTEGER DEFAULT 1000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  enable_human_handoff BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversation_ai_bots_sub_account_id ON conversation_ai_bots(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_conversation_ai_bots_status ON conversation_ai_bots(status);
CREATE INDEX IF NOT EXISTS idx_conversation_ai_bots_type ON conversation_ai_bots(type);

-- Enable RLS
ALTER TABLE conversation_ai_bots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_ai_bots
-- Users can only see bots for their sub-accounts
CREATE POLICY "Users can view their own bots" ON conversation_ai_bots
  FOR SELECT USING (
    sub_account_id IN (
      SELECT id FROM sub_accounts WHERE user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own bots" ON conversation_ai_bots
  FOR INSERT WITH CHECK (
    sub_account_id IN (
      SELECT id FROM sub_accounts WHERE user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own bots" ON conversation_ai_bots
  FOR UPDATE USING (
    sub_account_id IN (
      SELECT id FROM sub_accounts WHERE user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete their own bots" ON conversation_ai_bots
  FOR DELETE USING (
    sub_account_id IN (
      SELECT id FROM sub_accounts WHERE user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_ai_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_conversation_ai_bots_updated_at ON conversation_ai_bots;
CREATE TRIGGER trigger_update_conversation_ai_bots_updated_at
  BEFORE UPDATE ON conversation_ai_bots
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_ai_bots_updated_at();

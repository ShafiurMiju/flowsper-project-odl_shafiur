// MongoDB Database Types - Multi-Tenant Version

// User roles
export type UserRole = 'admin' | 'sub_account';

// Conversation types
export type ConversationType = 'SMS' | 'Email' | 'GMB' | 'IG' | 'FB' | 'WhatsApp' | 'Live_Chat' | 'Custom';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'pending' | 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';

// User Profile (stored in MongoDB user_profiles collection)
export interface DBUserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Sub Account (GHL Location)
export interface DBSubAccount {
  id: string;
  user_id: string | null;
  name: string;
  ghl_location_id: string;
  ghl_api_key: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Admin's active sub-account selection
export interface DBAdminActiveSubAccount {
  id: string;
  admin_user_id: string;
  active_sub_account_id: string | null;
  updated_at: string;
}

// Contact (now with sub_account_id)
export interface DBContact {
  id: string;
  sub_account_id: string;
  ghl_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  tags: string[];
  source: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

// Opportunity (now with sub_account_id)
export interface DBOpportunity {
  id: string;
  sub_account_id: string;
  ghl_id: string;
  name: string;
  monetary_value: number | null;
  pipeline_id: string;
  pipeline_stage_id: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  contact_id: string | null;
  ghl_contact_id: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

// Activity Log (now with sub_account_id and user_id)
export interface DBActivityLog {
  id: string;
  sub_account_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Conversation
export interface DBConversation {
  id: string;
  sub_account_id: string;
  ghl_id: string;
  ghl_contact_id: string;
  contact_id: string | null;
  type: ConversationType;
  unread_count: number;
  last_message_date: string | null;
  last_message_body: string | null;
  last_message_type: ConversationType | null;
  starred: boolean;
  deleted: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

// Message
export interface DBMessage {
  id: string;
  sub_account_id: string;
  conversation_id: string;
  ghl_id: string;
  ghl_contact_id: string;
  body: string | null;
  type: ConversationType;
  direction: MessageDirection;
  status: MessageStatus;
  content_type: string | null;
  attachments: string[];
  user_id: string | null;
  message_date: string;
  synced_at: string;
  created_at: string;
}

// =====================================================
// INSERT TYPES (without auto-generated fields)
// =====================================================

export interface InsertDBUserProfile {
  id: string; // User UUID
  email: string;
  full_name?: string | null;
  role?: UserRole;
  is_active?: boolean;
}

export interface InsertDBSubAccount {
  user_id?: string | null;
  name: string;
  ghl_location_id: string;
  ghl_api_key: string;
  is_active?: boolean;
  created_by?: string | null;
}

export interface InsertDBContact {
  sub_account_id: string;
  ghl_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  tags?: string[];
  source?: string | null;
}

export interface InsertDBOpportunity {
  sub_account_id: string;
  ghl_id: string;
  name: string;
  monetary_value?: number | null;
  pipeline_id: string;
  pipeline_stage_id: string;
  status?: 'open' | 'won' | 'lost' | 'abandoned';
  contact_id?: string | null;
  ghl_contact_id?: string | null;
}

export interface InsertDBActivityLog {
  sub_account_id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string | null;
  details?: Record<string, unknown> | null;
}

export interface InsertDBConversation {
  sub_account_id: string;
  ghl_id: string;
  ghl_contact_id: string;
  contact_id?: string | null;
  type: ConversationType;
  unread_count?: number;
  last_message_date?: string | null;
  last_message_body?: string | null;
  last_message_type?: ConversationType | null;
  starred?: boolean;
  deleted?: boolean;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

export interface InsertDBMessage {
  sub_account_id: string;
  conversation_id: string;
  ghl_id: string;
  ghl_contact_id: string;
  body?: string | null;
  type: ConversationType;
  direction: MessageDirection;
  status: MessageStatus;
  content_type?: string | null;
  attachments?: string[];
  user_id?: string | null;
  message_date: string;
}

// =====================================================
// AUTH TYPES
// =====================================================

export interface AuthUser {
  id: string;
  email: string;
  profile: DBUserProfile | null;
  subAccount: DBSubAccount | null;
  activeSubAccountId: string | null;
}

export interface CreateSubAccountRequest {
  name: string;
  email: string;
  password: string;
  ghl_location_id: string;
  ghl_api_key: string;
}

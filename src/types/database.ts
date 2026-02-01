// Supabase Database Types
export interface DBContact {
  id: string;
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

export interface DBOpportunity {
  id: string;
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

export interface DBActivityLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'sync' | 'move';
  entity_type: 'contact' | 'opportunity';
  entity_id: string;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Insert types (without auto-generated fields)
export interface InsertDBContact {
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
  action: 'create' | 'update' | 'delete' | 'sync' | 'move';
  entity_type: 'contact' | 'opportunity';
  entity_id: string;
  entity_name?: string | null;
  details?: Record<string, unknown> | null;
}

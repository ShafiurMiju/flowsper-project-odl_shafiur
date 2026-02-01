import { supabaseAdmin } from './supabase';
import { InsertDBActivityLog, DBActivityLog } from '@/types';

export async function logActivity(log: InsertDBActivityLog): Promise<DBActivityLog | null> {
  const { data, error } = await supabaseAdmin
    .from('activity_logs')
    .insert(log)
    .select()
    .single();

  if (error) {
    console.error('Error logging activity:', error);
    return null;
  }

  return data;
}

export async function getActivityLogs(
  limit = 50,
  entityType?: 'contact' | 'opportunity'
): Promise<DBActivityLog[]> {
  let query = supabaseAdmin
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }

  return data || [];
}

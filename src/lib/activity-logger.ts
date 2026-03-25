import { randomUUID } from 'crypto';
import { getDb, toDoc, Doc } from './mongodb';
import { DBActivityLog } from '@/types';

// Relaxed type for activity log insertion (accepts any entity_type string)
export interface InsertActivityLog {
  sub_account_id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string | null;
  details?: Record<string, unknown> | null;
}

/**
 * Log an activity to the activity_logs collection
 */
export async function logActivity(log: InsertActivityLog): Promise<DBActivityLog | null> {
  try {
    const db = await getDb();
    const doc = {
      _id: randomUUID(),
      ...log,
      created_at: new Date().toISOString(),
    };
    await db.collection<Doc>('activity_logs').insertOne(doc);
    return toDoc<DBActivityLog>(doc);
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}

/**
 * Get activity logs, optionally filtered by entity type
 */
export async function getActivityLogs(
  limit = 50,
  entityType?: string
): Promise<DBActivityLog[]> {
  try {
    const db = await getDb();
    const filter: Record<string, any> = {};

    if (entityType) {
      filter.entity_type = entityType;
    }

    const docs = await db
      .collection<Doc>('activity_logs')
      .find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    return docs.map(doc => toDoc<DBActivityLog>(doc)!);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}

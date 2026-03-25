import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId, getGHLClientForRequest, logActivity, Doc } from '@/lib';

// POST /api/contacts/sync - Sync all contacts from GHL to MongoDB
export async function POST(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    const subAccount = clientResult.subAccount!;
    const authUser = clientResult.authUser!;

    // Fetch contacts from GHL
    const { contacts } = await ghlClient.getContacts(100);

    const db = await getDb();
    let synced = 0;
    let errors = 0;

    for (const contact of contacts) {
      try {
        // Upsert contact in MongoDB with sub_account_id
        await db.collection<Doc>('contacts').updateOne(
          { sub_account_id: subAccount.id, ghl_id: contact.id },
          {
            $set: {
              first_name: contact.firstName || null,
              last_name: contact.lastName || null,
              email: contact.email || null,
              phone: contact.phone || null,
              company_name: contact.companyName || null,
              tags: contact.tags || [],
              source: contact.source || null,
              synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            $setOnInsert: {
              _id: generateId(),
              sub_account_id: subAccount.id,
              ghl_id: contact.id,
              created_at: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
        synced++;
      } catch (err) {
        console.error('Error syncing contact:', err);
        errors++;
      }
    }

    // Log sync activity
    await logActivity({
      sub_account_id: subAccount.id,
      user_id: authUser.id,
      action: 'sync',
      entity_type: 'contact',
      entity_id: 'bulk',
      entity_name: `Synced ${synced} contacts`,
      details: { total: contacts.length, synced, errors },
    });

    return NextResponse.json({
      success: true,
      total: contacts.length,
      synced,
      errors,
    });
  } catch (error) {
    console.error('Error syncing contacts:', error);
    return NextResponse.json(
      { error: 'Failed to sync contacts', details: String(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { ghlClient, supabaseAdmin, logActivity } from '@/lib';

// POST /api/contacts/sync - Sync all contacts from GHL to Supabase
export async function POST() {
  try {
    // Fetch contacts from GHL
    const { contacts } = await ghlClient.getContacts(100, 0);

    let synced = 0;
    let errors = 0;

    for (const contact of contacts) {
      try {
        // Upsert contact in Supabase
        const { error } = await supabaseAdmin.from('contacts').upsert(
          {
            ghl_id: contact.id,
            first_name: contact.firstName || null,
            last_name: contact.lastName || null,
            email: contact.email || null,
            phone: contact.phone || null,
            company_name: contact.companyName || null,
            tags: contact.tags || [],
            source: contact.source || null,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'ghl_id' }
        );

        if (error) {
          console.error('Error syncing contact:', error);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        console.error('Error processing contact:', err);
        errors++;
      }
    }

    // Log sync activity
    await logActivity({
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

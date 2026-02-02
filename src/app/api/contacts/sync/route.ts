import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getGHLClientForRequest } from '@/lib';

// POST /api/contacts/sync - Sync all contacts from GHL to Supabase
export async function POST(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient, subAccount, authUser } = clientResult;

    // Fetch contacts from GHL
    const { contacts } = await ghlClient.getContacts(100, 0);

    let synced = 0;
    let errors = 0;

    for (const contact of contacts) {
      try {
        // Upsert contact in Supabase with sub_account_id
        const { error } = await supabaseAdmin.from('contacts').upsert(
          {
            sub_account_id: subAccount!.id,
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
          { onConflict: 'sub_account_id,ghl_id' }
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
    await supabaseAdmin.from('activity_logs').insert({
      sub_account_id: subAccount!.id,
      user_id: authUser!.id,
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

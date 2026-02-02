import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getGHLClientForRequest } from '@/lib';

// POST /api/conversations/sync - Sync all conversations from GHL to Supabase
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

    // Fetch conversations from GHL
    const { conversations } = await ghlClient!.getConversations(100);

    let synced = 0;
    let errors = 0;

    for (const conversation of conversations) {
      try {
        // Find matching contact in database
        const { data: contact } = await supabaseAdmin
          .from('contacts')
          .select('id')
          .eq('sub_account_id', subAccount!.id)
          .eq('ghl_id', conversation.contactId)
          .single();

        // Upsert conversation in Supabase
        const { error } = await supabaseAdmin.from('conversations').upsert(
          {
            sub_account_id: subAccount!.id,
            ghl_id: conversation.id,
            ghl_contact_id: conversation.contactId,
            contact_id: contact?.id || null,
            type: conversation.type,
            unread_count: conversation.unreadCount,
            last_message_date: conversation.lastMessageDate,
            last_message_body: conversation.lastMessageBody,
            last_message_type: conversation.lastMessageType || null,
            starred: conversation.starred,
            deleted: conversation.deleted,
            contact_name: conversation.contactName || conversation.fullName || null,
            contact_email: conversation.email || null,
            contact_phone: conversation.phone || null,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'sub_account_id,ghl_id' }
        );

        if (error) {
          console.error('Error syncing conversation:', error);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        console.error('Error processing conversation:', err);
        errors++;
      }
    }

    // Log sync activity
    await supabaseAdmin.from('activity_logs').insert({
      sub_account_id: subAccount!.id,
      user_id: authUser!.id,
      action: 'sync',
      entity_type: 'contact' as const,
      entity_id: 'bulk',
      entity_name: `Synced ${synced} conversations`,
      details: { total: conversations.length, synced, errors },
    });

    return NextResponse.json({
      success: true,
      total: conversations.length,
      synced,
      errors,
    });
  } catch (error) {
    console.error('Error syncing conversations:', error);
    return NextResponse.json(
      { error: 'Failed to sync conversations', details: String(error) },
      { status: 500 }
    );
  }
}

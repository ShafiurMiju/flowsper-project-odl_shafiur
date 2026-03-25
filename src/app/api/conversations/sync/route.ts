import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId, getGHLClientForRequest, logActivity, Doc } from '@/lib';

// POST /api/conversations/sync - Sync all conversations from GHL to MongoDB
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

    // Fetch conversations from GHL
    const { conversations } = await ghlClient!.getConversations(100);

    const db = await getDb();
    let synced = 0;
    let errors = 0;

    for (const conversation of conversations) {
      try {
        // Find matching contact in database
        const contact = await db.collection<Doc>('contacts').findOne({
          sub_account_id: subAccount.id,
          ghl_id: conversation.contactId,
        });

        // Upsert conversation in MongoDB
        await db.collection<Doc>('conversations').updateOne(
          { sub_account_id: subAccount.id, ghl_id: conversation.id },
          {
            $set: {
              ghl_contact_id: conversation.contactId,
              contact_id: (contact?._id as string) || null,
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
              updated_at: new Date().toISOString(),
            },
            $setOnInsert: {
              _id: generateId(),
              sub_account_id: subAccount.id,
              ghl_id: conversation.id,
              created_at: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
        synced++;
      } catch (err) {
        console.error('Error syncing conversation:', err);
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

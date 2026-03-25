import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId, getGHLClientForRequest, logActivity, Doc } from '@/lib';
import { CreateMessagePayload } from '@/types';

// POST /api/messages - Send a new message (creates or updates conversation)
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
    const body: CreateMessagePayload = await request.json();

    // Send message via GHL
    const result = await ghlClient!.sendMessage(body);

    // Sync the conversation to database
    const db = await getDb();
    const contact = await db.collection<Doc>('contacts').findOne({
      sub_account_id: subAccount.id,
      ghl_id: result.conversation.contactId,
    });

    await db.collection<Doc>('conversations').updateOne(
      { sub_account_id: subAccount.id, ghl_id: result.conversation.id },
      {
        $set: {
          ghl_contact_id: result.conversation.contactId,
          contact_id: (contact?._id as string) || null,
          type: result.conversation.type,
          unread_count: result.conversation.unreadCount,
          last_message_date: result.conversation.lastMessageDate,
          last_message_body: result.conversation.lastMessageBody,
          last_message_type: result.conversation.lastMessageType || null,
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        $setOnInsert: {
          _id: generateId(),
          sub_account_id: subAccount.id,
          ghl_id: result.conversation.id,
          created_at: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // Log activity
    await logActivity({
      sub_account_id: subAccount.id,
      user_id: authUser.id,
      action: 'create',
      entity_type: 'contact',
      entity_id: result.message.id,
      entity_name: `Message to ${result.conversation.contactName || 'contact'}`,
      details: { type: body.type, contactId: body.contactId },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: String(error) },
      { status: 500 }
    );
  }
}

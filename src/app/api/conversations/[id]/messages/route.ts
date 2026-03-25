import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId, getGHLClientForRequest, logActivity, Doc } from '@/lib';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id]/messages - Get messages in a conversation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const lastMessageId = searchParams.get('lastMessageId') || undefined;

    const result = await ghlClient!.getConversationMessages(id, limit, lastMessageId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { id } = await params;
    const body = await request.json();

    const result = await ghlClient.sendMessage({
      ...body,
      conversationId: id,
    });

    console.log('Send message result:', JSON.stringify(result, null, 2));

    if (result.conversation && result.conversation.contactId) {
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
            unread_count: result.conversation.unreadCount || 0,
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
    }

    if (result.message && result.message.id) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'contact',
        entity_id: result.message.id,
        entity_name: `Message sent`,
        details: { type: body.type, conversationId: id },
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: String(error) },
      { status: 500 }
    );
  }
}

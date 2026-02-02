import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getGHLClientForRequest } from '@/lib';

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

    const { ghlClient } = clientResult;
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const lastMessageId = searchParams.get('lastMessageId') || undefined;

    // Fetch messages from GHL
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

    const { ghlClient, subAccount, authUser } = clientResult;
    const { id } = await params;
    const body = await request.json();

    // Send message via GHL
    const result = await ghlClient!.sendMessage({
      ...body,
      conversationId: id,
    });

    console.log('Send message result:', JSON.stringify(result, null, 2));

    // Sync the conversation to database (optional - only if conversation data is returned)
    if (result.conversation && result.conversation.contactId) {
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('sub_account_id', subAccount!.id)
        .eq('ghl_id', result.conversation.contactId)
        .single();

      await supabaseAdmin.from('conversations').upsert(
        {
          sub_account_id: subAccount!.id,
          ghl_id: result.conversation.id,
          ghl_contact_id: result.conversation.contactId,
          contact_id: contact?.id || null,
          type: result.conversation.type,
          unread_count: result.conversation.unreadCount || 0,
          last_message_date: result.conversation.lastMessageDate,
          last_message_body: result.conversation.lastMessageBody,
          last_message_type: result.conversation.lastMessageType || null,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'sub_account_id,ghl_id' }
      );
    }

    // Log activity (only if message data exists)
    if (result.message && result.message.id) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount!.id,
        user_id: authUser!.id,
        action: 'create',
        entity_type: 'contact' as const,
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

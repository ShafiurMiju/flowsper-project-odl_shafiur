import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getGHLClientForRequest } from '@/lib';
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
        unread_count: result.conversation.unreadCount,
        last_message_date: result.conversation.lastMessageDate,
        last_message_body: result.conversation.lastMessageBody,
        last_message_type: result.conversation.lastMessageType || null,
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'sub_account_id,ghl_id' }
    );

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      sub_account_id: subAccount!.id,
      user_id: authUser!.id,
      action: 'create',
      entity_type: 'contact' as const,
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

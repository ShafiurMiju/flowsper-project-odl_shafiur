import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';
import { CreateMessagePayload } from '@/types';

// POST /api/messages - Send a new message via GHL
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

    const result = await ghlClient.sendMessage(body);

    await logActivity({
      sub_account_id: subAccount.id,
      user_id: authUser.id,
      action: 'create',
      entity_type: 'message',
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

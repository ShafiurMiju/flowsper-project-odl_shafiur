import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id]/messages - Get messages from GHL
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

    const result = await ghlClient.getConversationMessages(id, limit, lastMessageId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message via GHL
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

    if (result.message && result.message.id) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'message',
        entity_id: result.message.id,
        entity_name: 'Message sent',
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

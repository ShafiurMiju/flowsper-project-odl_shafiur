import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

type RouteParams = { params: Promise<{ eventId: string }> };

// PUT /api/calendars/blocked-slots/[eventId] - Update a blocked slot
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { eventId } = await params;
    const body = await request.json();

    const result = await ghlClient.updateBlockSlot(eventId, body);

    if (subAccount && authUser) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'update',
        entity_type: 'blocked_slot',
        entity_id: eventId,
        entity_name: `Block Slot: ${result.title || 'Blocked Time'}`,
        details: body,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating blocked slot:', error);
    return NextResponse.json(
      { error: 'Failed to update blocked slot', details: String(error) },
      { status: 500 }
    );
  }
}

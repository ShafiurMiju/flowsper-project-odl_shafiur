import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, supabaseAdmin } from '@/lib';

type RouteParams = { params: Promise<{ eventId: string }> };

// DELETE /api/calendars/events/[eventId] - Delete an event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    await ghlClient.deleteEvent(eventId);

    // Log activity
    if (subAccount && authUser) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'delete',
        entity_type: 'contact' as const,
        entity_id: eventId,
        entity_name: `Event: ${eventId}`,
        details: {},
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: String(error) },
      { status: 500 }
    );
  }
}

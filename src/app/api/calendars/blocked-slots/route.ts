import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, supabaseAdmin } from '@/lib';

// GET /api/calendars/blocked-slots - Get blocked slots
export async function GET(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startTime = parseInt(searchParams.get('startTime') || '0');
    const endTime = parseInt(searchParams.get('endTime') || '0');
    const calendarId = searchParams.get('calendarId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const groupId = searchParams.get('groupId') || undefined;

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'startTime and endTime are required' },
        { status: 400 }
      );
    }

    const result = await ghlClient.getBlockedSlots(startTime, endTime, {
      calendarId,
      userId,
      groupId,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching blocked slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked slots', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/calendars/blocked-slots - Create a blocked slot
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

    const body = await request.json();
    const result = await ghlClient.createBlockSlot(body);

    // Log activity
    if (subAccount && authUser && result.id) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'contact' as const,
        entity_id: result.id,
        entity_name: `Block Slot: ${result.title || 'Blocked Time'}`,
        details: body,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating blocked slot:', error);
    return NextResponse.json(
      { error: 'Failed to create blocked slot', details: String(error) },
      { status: 500 }
    );
  }
}

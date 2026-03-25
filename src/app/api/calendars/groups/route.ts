import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

// GET /api/calendars/groups - Get all calendar groups
export async function GET(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      console.error('Auth error for calendar groups:', clientResult.error);
      return NextResponse.json({ groups: [] });
    }

    const ghlClient = clientResult.ghlClient!;
    try {
      const result = await ghlClient.getCalendarGroups();
      return NextResponse.json(result);
    } catch (ghlError) {
      console.error('GHL API error for calendar groups:', ghlError);
      return NextResponse.json({ groups: [] });
    }
  } catch (error) {
    console.error('Error fetching calendar groups:', error);
    return NextResponse.json({ groups: [] });
  }
}

// POST /api/calendars/groups - Create a calendar group
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
    const result = await ghlClient.createCalendarGroup(body);

    if (subAccount && authUser && result.group?.id) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'calendar_group',
        entity_id: result.group.id,
        entity_name: `Calendar Group: ${result.group.name}`,
        details: body,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating calendar group:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar group', details: String(error) },
      { status: 500 }
    );
  }
}

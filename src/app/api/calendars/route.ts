import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

// GET /api/calendars - Get all calendars
export async function GET(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      console.error('Auth error for calendars:', clientResult.error);
      return NextResponse.json({ calendars: [] });
    }

    const ghlClient = clientResult.ghlClient!;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const showDrafted = searchParams.get('showDrafted') !== 'false';
    const groupId = searchParams.get('groupId') || undefined;

    try {
      const result = await ghlClient.getCalendars(showDrafted, groupId);
      return NextResponse.json(result);
    } catch (ghlError) {
      console.error('GHL API error for calendars:', ghlError);
      return NextResponse.json({ calendars: [] });
    }
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json({ calendars: [] });
  }
}

// POST /api/calendars - Create a new calendar
export async function POST(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: 400 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    const subAccount = clientResult.subAccount!;
    const authUser = clientResult.authUser!;

    const body = await request.json();
    
    try {
      const result = await ghlClient.createCalendar(body);

      // Log activity
      if (subAccount && authUser && result.calendar?.id) {
        await logActivity({
          sub_account_id: subAccount.id,
          user_id: authUser.id,
          action: 'create',
          entity_type: 'calendar',
          entity_id: result.calendar.id,
          entity_name: `Calendar: ${result.calendar.name}`,
          details: body,
        });
      }

      return NextResponse.json(result);
    } catch (ghlError: any) {
      console.error('GHL API error creating calendar:', ghlError);
      return NextResponse.json(
        { error: ghlError.message || 'Failed to create calendar' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create calendar' },
      { status: 400 }
    );
  }
}

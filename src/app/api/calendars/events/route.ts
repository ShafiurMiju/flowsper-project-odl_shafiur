import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

// GET /api/calendars/events - Get calendar events
export async function GET(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      // Return empty events instead of error for auth issues
      console.error('Auth error for calendar events:', clientResult.error);
      return NextResponse.json({ events: [] });
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
      return NextResponse.json({ events: [] });
    }

    try {
      const result = await ghlClient.getCalendarEvents(startTime, endTime, {
        calendarId,
        userId,
        groupId,
      });
      return NextResponse.json(result);
    } catch (ghlError) {
      // If GHL API fails, return empty events
      console.error('GHL API error for calendar events:', ghlError);
      return NextResponse.json({ events: [] });
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    // Return empty events on error to prevent UI from breaking
    return NextResponse.json({ events: [] });
  }
}

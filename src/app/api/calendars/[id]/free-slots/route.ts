import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/calendars/[id]/free-slots - Get free slots for a calendar
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = parseInt(searchParams.get('startDate') || '0');
    const endDate = parseInt(searchParams.get('endDate') || '0');
    const timezone = searchParams.get('timezone') || undefined;
    const userId = searchParams.get('userId') || undefined;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const result = await ghlClient.getFreeSlots(id, startDate, endDate, timezone, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching free slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch free slots', details: String(error) },
      { status: 500 }
    );
  }
}

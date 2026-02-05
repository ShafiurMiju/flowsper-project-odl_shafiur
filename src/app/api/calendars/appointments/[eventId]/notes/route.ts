import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

type RouteParams = { params: Promise<{ eventId: string }> };

// GET /api/calendars/appointments/[eventId]/notes - Get appointment notes
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
    const { eventId } = await params;

    const result = await ghlClient.getAppointmentNotes(eventId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching appointment notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment notes', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/calendars/appointments/[eventId]/notes - Create an appointment note
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
    const { eventId } = await params;
    const body = await request.json();

    const result = await ghlClient.createAppointmentNote(eventId, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating appointment note:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment note', details: String(error) },
      { status: 500 }
    );
  }
}

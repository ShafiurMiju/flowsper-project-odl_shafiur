import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

type RouteParams = { params: Promise<{ eventId: string; noteId: string }> };

// PUT /api/calendars/appointments/[eventId]/notes/[noteId] - Update an appointment note
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
    const { eventId, noteId } = await params;
    const body = await request.json();

    const result = await ghlClient.updateAppointmentNote(eventId, noteId, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating appointment note:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment note', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/calendars/appointments/[eventId]/notes/[noteId] - Delete an appointment note
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
    const { eventId, noteId } = await params;

    await ghlClient.deleteAppointmentNote(eventId, noteId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment note:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment note', details: String(error) },
      { status: 500 }
    );
  }
}

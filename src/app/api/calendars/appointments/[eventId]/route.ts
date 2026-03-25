import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

type RouteParams = { params: Promise<{ eventId: string }> };

// GET /api/calendars/appointments/[eventId] - Get an appointment
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

    const result = await ghlClient.getAppointment(eventId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/calendars/appointments/[eventId] - Update an appointment
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

    const result = await ghlClient.updateAppointment(eventId, body);

    if (subAccount && authUser) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'update',
        entity_type: 'appointment',
        entity_id: eventId,
        entity_name: `Appointment: ${result.title || 'Untitled'}`,
        details: body,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment', details: String(error) },
      { status: 500 }
    );
  }
}

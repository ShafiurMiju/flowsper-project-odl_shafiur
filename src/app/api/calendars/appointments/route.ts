import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

// POST /api/calendars/appointments - Create an appointment
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
    
    if (!body.calendarId) {
      return NextResponse.json({ error: 'calendarId is required' }, { status: 400 });
    }
    if (!body.contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }
    if (!body.startTime) {
      return NextResponse.json({ error: 'startTime is required' }, { status: 400 });
    }
    
    const appointmentPayload = {
      calendarId: body.calendarId,
      contactId: body.contactId,
      startTime: body.startTime,
      endTime: body.endTime,
      title: body.title,
      description: body.description,
      appointmentStatus: body.appointmentStatus,
      assignedUserId: body.assignedUserId,
      address: body.address,
      meetingLocationType: body.meetingLocationType,
      meetingLocationId: body.meetingLocationId,
      overrideLocationConfig: body.overrideLocationConfig,
      ignoreDateRange: body.ignoreDateRange ?? true,
      toNotify: body.toNotify ?? true,
      ignoreFreeSlotValidation: body.ignoreFreeSlotValidation,
    };
    
    const cleanPayload = Object.fromEntries(
      Object.entries(appointmentPayload).filter(([_, v]) => v !== undefined)
    );
    
    console.log('Creating appointment with payload:', cleanPayload);
    
    const result = await ghlClient.createAppointment(cleanPayload as any);

    if (subAccount && authUser && result.id) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'appointment',
        entity_id: result.id,
        entity_name: `Appointment: ${result.title || 'Untitled'}`,
        details: body,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment', details: String(error) },
      { status: 500 }
    );
  }
}

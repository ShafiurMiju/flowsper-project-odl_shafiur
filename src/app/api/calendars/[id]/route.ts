import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/calendars/[id] - Get a single calendar
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

    const result = await ghlClient.getCalendar(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/calendars/[id] - Update a calendar
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 400 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    const subAccount = clientResult.subAccount;
    const authUser = clientResult.authUser;
    const { id } = await params;
    const body = await request.json();

    const updatePayload: Record<string, any> = {};
    
    const validFields = [
      'name', 'description', 'slug', 'widgetSlug', 'calendarType', 'widgetType',
      'eventType', 'eventTitle', 'eventColor', 'isActive', 'groupId', 'teamMembers',
      'slotDuration', 'slotDurationUnit', 'slotInterval', 'slotIntervalUnit',
      'slotBuffer', 'slotBufferUnit', 'preBuffer', 'preBufferUnit',
      'appoinmentPerSlot', 'appoinmentPerDay', 'allowBookingAfter', 'allowBookingAfterUnit',
      'allowBookingFor', 'allowBookingForUnit', 'openHours', 'enableRecurring', 'recurring',
      'formId', 'stickyContact', 'isLivePaymentMode', 'autoConfirm',
      'shouldSendAlertEmailsToAssignedMember', 'alertEmail', 'googleInvitationEmails',
      'allowReschedule', 'allowCancellation', 'shouldAssignContactToTeamMember',
      'shouldSkipAssigningContactForExisting', 'notes', 'pixelId', 'formSubmitType',
      'formSubmitRedirectURL', 'formSubmitThanksMessage', 'availabilityType',
      'availabilities', 'guestType', 'consentLabel', 'calendarCoverImage',
      'lookBusyConfig', 'locationConfigurations'
    ];

    for (const field of validFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    try {
      const result = await ghlClient.updateCalendar(id, updatePayload);

      if (subAccount && authUser) {
        await logActivity({
          sub_account_id: subAccount.id,
          user_id: authUser.id,
          action: 'update',
          entity_type: 'calendar',
          entity_id: id,
          entity_name: `Calendar: ${result.calendar?.name || 'Unknown'}`,
          details: updatePayload,
        });
      }

      return NextResponse.json(result);
    } catch (ghlError: any) {
      console.error('GHL API error updating calendar:', ghlError);
      return NextResponse.json(
        { error: ghlError.message || 'Failed to update calendar in GHL' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating calendar:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/calendars/[id] - Delete a calendar
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
    const { id } = await params;

    await ghlClient.deleteCalendar(id);

    if (subAccount && authUser) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'delete',
        entity_type: 'calendar',
        entity_id: id,
        entity_name: `Calendar: ${id}`,
        details: {},
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar', details: String(error) },
      { status: 500 }
    );
  }
}

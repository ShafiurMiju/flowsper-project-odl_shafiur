import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, supabaseAdmin } from '@/lib';

type RouteParams = { params: Promise<{ groupId: string }> };

// PUT /api/calendars/groups/[groupId] - Update a calendar group
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
    const { groupId } = await params;
    const body = await request.json();

    const result = await ghlClient.updateCalendarGroup(groupId, body);

    // Log activity
    if (subAccount && authUser) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'update',
        entity_type: 'contact' as const,
        entity_id: groupId,
        entity_name: `Calendar Group: ${result.group?.name || 'Unknown'}`,
        details: body,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating calendar group:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar group', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/calendars/groups/[groupId] - Delete a calendar group
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
    const { groupId } = await params;

    await ghlClient.deleteCalendarGroup(groupId);

    // Log activity
    if (subAccount && authUser) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'delete',
        entity_type: 'contact' as const,
        entity_id: groupId,
        entity_name: `Calendar Group: ${groupId}`,
        details: {},
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar group:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar group', details: String(error) },
      { status: 500 }
    );
  }
}

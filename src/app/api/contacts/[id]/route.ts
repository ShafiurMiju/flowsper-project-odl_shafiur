import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';
import { CreateContactPayload } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/contacts/[id] - Get a single contact from GHL
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
    const result = await ghlClient.getContact(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Update a contact in GHL
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
    const { id } = await params;
    const body: Partial<CreateContactPayload> = await request.json();

    const result = await ghlClient.updateContact(id, body);
    const contact = result.contact;

    await logActivity({
      sub_account_id: subAccount.id,
      user_id: authUser.id,
      action: 'update',
      entity_type: 'contact',
      entity_id: id,
      entity_name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email || 'Unknown',
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete a contact from GHL
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

    let contactName = 'Unknown';
    try {
      const { contact } = await ghlClient.getContact(id);
      contactName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email || 'Unknown';
    } catch {
      // Contact might already be partially deleted
    }

    const result = await ghlClient.deleteContact(id);

    await logActivity({
      sub_account_id: subAccount.id,
      user_id: authUser.id,
      action: 'delete',
      entity_type: 'contact',
      entity_id: id,
      entity_name: contactName,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact', details: String(error) },
      { status: 500 }
    );
  }
}

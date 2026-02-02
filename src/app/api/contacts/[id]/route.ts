import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getGHLClientForRequest } from '@/lib';
import { CreateContactPayload } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/contacts/[id] - Get a single contact
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient } = clientResult;
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

// PUT /api/contacts/[id] - Update a contact
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient, subAccount, authUser } = clientResult;
    const { id } = await params;
    const body: Partial<CreateContactPayload> = await request.json();

    // Update in GHL
    const result = await ghlClient.updateContact(id, body);
    const contact = result.contact;

    // Update in Supabase
    await supabaseAdmin
      .from('contacts')
      .update({
        first_name: contact.firstName || null,
        last_name: contact.lastName || null,
        email: contact.email || null,
        phone: contact.phone || null,
        company_name: contact.companyName || null,
        tags: contact.tags || [],
        updated_at: new Date().toISOString(),
      })
      .eq('ghl_id', id)
      .eq('sub_account_id', subAccount!.id);

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      sub_account_id: subAccount!.id,
      user_id: authUser!.id,
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

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient, subAccount, authUser } = clientResult;
    const { id } = await params;

    // Get contact info before deletion for logging
    let contactName = 'Unknown';
    try {
      const { contact } = await ghlClient.getContact(id);
      contactName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email || 'Unknown';
    } catch {
      // Contact might already be partially deleted
    }

    // Delete from GHL
    const result = await ghlClient.deleteContact(id);

    // Delete from Supabase
    await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('ghl_id', id)
      .eq('sub_account_id', subAccount!.id);

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      sub_account_id: subAccount!.id,
      user_id: authUser!.id,
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

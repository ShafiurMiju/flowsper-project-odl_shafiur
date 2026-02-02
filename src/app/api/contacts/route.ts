import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getGHLClientForRequest } from '@/lib';
import { CreateContactPayload } from '@/types';

// GET /api/contacts - List contacts from GHL
export async function GET(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient, subAccount } = clientResult;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search');

    let result;
    if (search) {
      result = await ghlClient.searchContacts(search, limit);
    } else {
      result = await ghlClient.getContacts(limit);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient, subAccount } = clientResult;
    const body: CreateContactPayload = await request.json();

    // Create contact in GHL
    const result = await ghlClient.createContact(body);
    const contact = result.contact;

    // Sync to Supabase with sub_account_id
    await supabaseAdmin.from('contacts').insert({
      sub_account_id: subAccount!.id,
      ghl_id: contact.id,
      first_name: contact.firstName || null,
      last_name: contact.lastName || null,
      email: contact.email || null,
      phone: contact.phone || null,
      company_name: contact.companyName || null,
      tags: contact.tags || [],
      source: contact.source || 'dataflow-crm',
    });

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      sub_account_id: subAccount!.id,
      user_id: clientResult.authUser!.id,
      action: 'create',
      entity_type: 'contact',
      entity_id: contact.id,
      entity_name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email || 'Unknown',
      details: { email: contact.email, phone: contact.phone },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact', details: String(error) },
      { status: 500 }
    );
  }
}

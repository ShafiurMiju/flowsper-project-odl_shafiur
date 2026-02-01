import { NextRequest, NextResponse } from 'next/server';
import { ghlClient, supabaseAdmin, logActivity } from '@/lib';
import { CreateContactPayload } from '@/types';

// GET /api/contacts - List contacts from GHL
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const search = searchParams.get('search');

    let result;
    if (search) {
      result = await ghlClient.searchContacts(search, limit);
    } else {
      result = await ghlClient.getContacts(limit, skip);
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
    const body: CreateContactPayload = await request.json();

    // Create contact in GHL
    const result = await ghlClient.createContact(body);
    const contact = result.contact;

    // Sync to Supabase
    await supabaseAdmin.from('contacts').insert({
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
    await logActivity({
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

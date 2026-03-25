import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';
import { CreateContactPayload } from '@/types';

// GET /api/contacts - List contacts from GHL with pagination
export async function GET(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);

    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    if (search) {
      const result = await ghlClient.searchContacts(search, limit);
      return NextResponse.json(result);
    }

    const result = await ghlClient.getContacts(limit, page);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact in GHL
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
    const body: CreateContactPayload = await request.json();

    const result = await ghlClient.createContact(body);
    const contact = result.contact;

    await logActivity({
      sub_account_id: subAccount.id,
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

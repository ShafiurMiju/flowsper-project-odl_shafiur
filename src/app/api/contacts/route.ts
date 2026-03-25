import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId, getGHLClientForRequest, logActivity, Doc } from '@/lib';
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

    const ghlClient = clientResult.ghlClient!;
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let allContacts: any[] = [];

    if (search) {
      // For search, just return the search results
      const result = await ghlClient.searchContacts(search, 100);
      allContacts = result.contacts || [];
    } else {
      // Fetch all contacts in batches of 100 using pagination
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        try {
          const result = await ghlClient.getContacts(100, page);
          const contacts = result.contacts || [];
          
          if (contacts.length === 0) {
            hasMore = false;
          } else {
            allContacts = allContacts.concat(contacts);
            // If we got less than 100, we've reached the end
            if (contacts.length < 100) {
              hasMore = false;
            }
            page++;
          }
        } catch (error) {
          console.error(`Error fetching contacts page ${page}:`, error);
          hasMore = false;
        }
      }
    }

    return NextResponse.json({ contacts: allContacts });
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

    const ghlClient = clientResult.ghlClient!;
    const subAccount = clientResult.subAccount!;
    const body: CreateContactPayload = await request.json();

    // Create contact in GHL
    const result = await ghlClient.createContact(body);
    const contact = result.contact;

    // Sync to MongoDB with sub_account_id
    const db = await getDb();
    await db.collection<Doc>('contacts').insertOne({
      _id: generateId(),
      sub_account_id: subAccount.id,
      ghl_id: contact.id,
      first_name: contact.firstName || null,
      last_name: contact.lastName || null,
      email: contact.email || null,
      phone: contact.phone || null,
      company_name: contact.companyName || null,
      tags: contact.tags || [],
      source: contact.source || 'dataflow-crm',
      synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Log activity
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

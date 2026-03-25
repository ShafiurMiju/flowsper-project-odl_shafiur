import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId, getGHLClientForRequest, logActivity, Doc } from '@/lib';
import { CreateOpportunityPayload } from '@/types';

// GET /api/opportunities - List opportunities from GHL
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
    const pipelineId = searchParams.get('pipelineId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await ghlClient.getOpportunities(pipelineId, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/opportunities - Create a new opportunity
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
    const body: CreateOpportunityPayload = await request.json();

    // Create opportunity in GHL
    const result = await ghlClient.createOpportunity(body);
    const opportunity = result.opportunity;

    // Sync to MongoDB with sub_account_id
    const db = await getDb();
    await db.collection<Doc>('opportunities').insertOne({
      _id: generateId(),
      sub_account_id: subAccount.id,
      ghl_id: opportunity.id,
      name: opportunity.name,
      monetary_value: opportunity.monetaryValue || null,
      pipeline_id: opportunity.pipelineId,
      pipeline_stage_id: opportunity.pipelineStageId,
      status: opportunity.status || 'open',
      ghl_contact_id: opportunity.contactId || null,
      synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Log activity
    await logActivity({
      sub_account_id: subAccount.id,
      user_id: authUser.id,
      action: 'create',
      entity_type: 'opportunity',
      entity_id: opportunity.id,
      entity_name: opportunity.name,
      details: {
        monetaryValue: opportunity.monetaryValue,
        status: opportunity.status,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity', details: String(error) },
      { status: 500 }
    );
  }
}

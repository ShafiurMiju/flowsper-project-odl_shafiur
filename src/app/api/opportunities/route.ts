import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';
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

// POST /api/opportunities - Create a new opportunity in GHL
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

    const result = await ghlClient.createOpportunity(body);
    const opportunity = result.opportunity;

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

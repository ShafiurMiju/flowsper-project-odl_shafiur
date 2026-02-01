import { NextRequest, NextResponse } from 'next/server';
import { ghlClient, supabaseAdmin, logActivity } from '@/lib';
import { CreateOpportunityPayload } from '@/types';

// GET /api/opportunities - List opportunities from GHL
export async function GET(request: NextRequest) {
  try {
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
    const body: CreateOpportunityPayload = await request.json();

    // Create opportunity in GHL
    const result = await ghlClient.createOpportunity(body);
    const opportunity = result.opportunity;

    // Sync to Supabase
    await supabaseAdmin.from('opportunities').insert({
      ghl_id: opportunity.id,
      name: opportunity.name,
      monetary_value: opportunity.monetaryValue || null,
      pipeline_id: opportunity.pipelineId,
      pipeline_stage_id: opportunity.pipelineStageId,
      status: opportunity.status || 'open',
      ghl_contact_id: opportunity.contactId || null,
    });

    // Log activity
    await logActivity({
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

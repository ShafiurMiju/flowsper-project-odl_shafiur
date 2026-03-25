import { NextRequest, NextResponse } from 'next/server';
import { getDb, getGHLClientForRequest, logActivity, Doc } from '@/lib';
import { CreateOpportunityPayload } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/opportunities/[id] - Get a single opportunity
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
    const result = await ghlClient.getOpportunity(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/opportunities/[id] - Update an opportunity
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
    const body: Partial<CreateOpportunityPayload> = await request.json();

    // Check if this is a stage move
    const isMove = body.pipelineStageId !== undefined;

    // Update in GHL
    const result = await ghlClient.updateOpportunity(id, body);
    const opportunity = result.opportunity;

    // Update in MongoDB
    const db = await getDb();
    await db.collection<Doc>('opportunities').updateOne(
      { ghl_id: id, sub_account_id: subAccount.id },
      {
        $set: {
          name: opportunity.name,
          monetary_value: opportunity.monetaryValue || null,
          pipeline_id: opportunity.pipelineId,
          pipeline_stage_id: opportunity.pipelineStageId,
          status: opportunity.status,
          updated_at: new Date().toISOString(),
        },
      }
    );

    // Log activity
    await logActivity({
      sub_account_id: subAccount.id,
      user_id: authUser.id,
      action: isMove ? 'move' : 'update',
      entity_type: 'opportunity',
      entity_id: id,
      entity_name: opportunity.name,
      details: isMove
        ? { newStageId: opportunity.pipelineStageId }
        : { updatedFields: Object.keys(body) },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/opportunities/[id] - Delete an opportunity
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

    // Get opportunity info before deletion for logging
    let opportunityName = 'Unknown';
    try {
      const { opportunity } = await ghlClient.getOpportunity(id);
      opportunityName = opportunity.name;
    } catch {
      // Opportunity might already be partially deleted
    }

    // Delete from GHL
    const result = await ghlClient.deleteOpportunity(id);

    // Delete from MongoDB
    const db = await getDb();
    await db.collection<Doc>('opportunities').deleteOne({
      ghl_id: id,
      sub_account_id: subAccount.id,
    });

    // Log activity
    await logActivity({
      sub_account_id: subAccount.id,
      user_id: authUser.id,
      action: 'delete',
      entity_type: 'opportunity',
      entity_id: id,
      entity_name: opportunityName,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to delete opportunity', details: String(error) },
      { status: 500 }
    );
  }
}

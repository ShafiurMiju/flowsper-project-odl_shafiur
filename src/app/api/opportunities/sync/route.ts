import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId, getGHLClientForRequest, logActivity, Doc } from '@/lib';

// POST /api/opportunities/sync - Sync all opportunities from GHL to MongoDB
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

    // Fetch opportunities from GHL
    const { opportunities } = await ghlClient.getOpportunities(undefined, 100);

    const db = await getDb();
    let synced = 0;
    let errors = 0;

    for (const opportunity of opportunities) {
      try {
        // Upsert opportunity in MongoDB
        await db.collection<Doc>('opportunities').updateOne(
          { sub_account_id: subAccount.id, ghl_id: opportunity.id },
          {
            $set: {
              name: opportunity.name,
              monetary_value: opportunity.monetaryValue || null,
              pipeline_id: opportunity.pipelineId,
              pipeline_stage_id: opportunity.pipelineStageId,
              status: opportunity.status || 'open',
              ghl_contact_id: opportunity.contactId || null,
              synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            $setOnInsert: {
              _id: generateId(),
              sub_account_id: subAccount.id,
              ghl_id: opportunity.id,
              created_at: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
        synced++;
      } catch (err) {
        console.error('Error syncing opportunity:', err);
        errors++;
      }
    }

    // Log sync activity
    await logActivity({
      sub_account_id: subAccount.id,
      user_id: authUser.id,
      action: 'sync',
      entity_type: 'opportunity',
      entity_id: 'bulk',
      entity_name: `Synced ${synced} opportunities`,
      details: { total: opportunities.length, synced, errors },
    });

    return NextResponse.json({
      success: true,
      total: opportunities.length,
      synced,
      errors,
    });
  } catch (error) {
    console.error('Error syncing opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to sync opportunities', details: String(error) },
      { status: 500 }
    );
  }
}

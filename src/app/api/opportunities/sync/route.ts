import { NextResponse } from 'next/server';
import { ghlClient, supabaseAdmin, logActivity } from '@/lib';

// POST /api/opportunities/sync - Sync all opportunities from GHL to Supabase
export async function POST() {
  try {
    // Fetch opportunities from GHL
    const { opportunities } = await ghlClient.getOpportunities(undefined, 100);

    let synced = 0;
    let errors = 0;

    for (const opportunity of opportunities) {
      try {
        // Upsert opportunity in Supabase
        const { error } = await supabaseAdmin.from('opportunities').upsert(
          {
            ghl_id: opportunity.id,
            name: opportunity.name,
            monetary_value: opportunity.monetaryValue || null,
            pipeline_id: opportunity.pipelineId,
            pipeline_stage_id: opportunity.pipelineStageId,
            status: opportunity.status || 'open',
            ghl_contact_id: opportunity.contactId || null,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'ghl_id' }
        );

        if (error) {
          console.error('Error syncing opportunity:', error);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        console.error('Error processing opportunity:', err);
        errors++;
      }
    }

    // Log sync activity
    await logActivity({
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

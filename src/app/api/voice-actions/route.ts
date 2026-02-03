import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, supabaseAdmin } from '@/lib';

/**
 * POST /api/voice-actions
 * Create a new voice action
 * @see https://marketplace.gohighlevel.com/docs/ghl/voice-ai/create-action
 */
export async function POST(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient, subAccount, authUser } = clientResult;
    const body = await request.json();

    const result = await ghlClient.createVoiceAction(body);

    // Log activity if we have sub-account and user
    if (subAccount && authUser && result.id) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'contact' as const,
        entity_id: result.id,
        entity_name: `Voice Action: ${result.name || body.name}`,
        details: { type: result.type || body.type },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating voice action:', error);
    return NextResponse.json(
      { error: 'Failed to create voice action', details: String(error) },
      { status: 500 }
    );
  }
}

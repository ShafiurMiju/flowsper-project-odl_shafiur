import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

/**
 * POST /api/voice-actions
 * Create a new voice action
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

    const ghlClient = clientResult.ghlClient!;
    const subAccount = clientResult.subAccount!;
    const authUser = clientResult.authUser!;
    const body = await request.json();

    const result = await ghlClient.createVoiceAction(body);

    if (subAccount && authUser && result.id) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'voice_action',
        entity_id: result.id,
        entity_name: `Voice Action: ${result.name || body.name}`,
        details: { type: result.actionType || body.actionType },
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

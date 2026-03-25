import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

/**
 * GET /api/voice-actions/[id] - Get a voice action by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    const result = await ghlClient.getVoiceAction(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching voice action:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice action', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/voice-actions/[id] - Update a voice action
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const result = await ghlClient.updateVoiceAction(id, body);

    if (subAccount && authUser && result.id) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'update',
        entity_type: 'voice_action',
        entity_id: result.id,
        entity_name: `Voice Action: ${result.name || body.name}`,
        details: { type: result.actionType },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating voice action:', error);
    return NextResponse.json(
      { error: 'Failed to update voice action', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/voice-actions/[id] - Delete a voice action
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId query parameter is required' },
        { status: 400 }
      );
    }

    await ghlClient.deleteVoiceAction(id, agentId);

    if (subAccount && authUser) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'delete',
        entity_type: 'voice_action',
        entity_id: id,
        entity_name: `Voice Action`,
        details: { agentId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice action:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice action', details: String(error) },
      { status: 500 }
    );
  }
}

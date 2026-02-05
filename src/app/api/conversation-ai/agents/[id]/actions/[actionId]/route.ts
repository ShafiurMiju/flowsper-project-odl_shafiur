import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, supabaseAdmin } from '@/lib';

type RouteParams = {
  params: Promise<{ id: string; actionId: string }>;
};

// GET /api/conversation-ai/agents/[id]/actions/[actionId] - Get a single action
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
    const { id: agentId, actionId } = await params;
    
    const result = await ghlClient.getConversationAIAction(agentId, actionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching conversation AI action:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation AI action', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/conversation-ai/agents/[id]/actions/[actionId] - Update an action
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
    const { id: agentId, actionId } = await params;

    const body = await request.json();
    console.log('📥 Updating Conversation AI action:', actionId, JSON.stringify(body, null, 2));

    const result = await ghlClient.updateConversationAIAction(agentId, actionId, body);

    // Log activity
    if (subAccount && authUser) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'update',
        entity_type: 'contact' as const,
        entity_id: actionId,
        entity_name: `Conversation AI Action: ${result.data?.name || actionId}`,
        details: { actionId, agentId, updates: Object.keys(body) },
      });
    }

    console.log('✅ Conversation AI action updated:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error updating conversation AI action:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation AI action', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/conversation-ai/agents/[id]/actions/[actionId] - Delete an action
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
    const { id: agentId, actionId } = await params;

    const result = await ghlClient.deleteConversationAIAction(agentId, actionId);

    // Log activity
    if (subAccount && authUser) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'delete',
        entity_type: 'contact' as const,
        entity_id: actionId,
        entity_name: `Conversation AI Action: ${actionId}`,
        details: { actionId, agentId },
      });
    }

    console.log('✅ Conversation AI action deleted:', actionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error deleting conversation AI action:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation AI action', details: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, supabaseAdmin } from '@/lib';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/conversation-ai/agents/[id] - Get a single agent
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
    
    const result = await ghlClient.getConversationAIAgent(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching conversation AI agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation AI agent', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/conversation-ai/agents/[id] - Update an agent
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

    const body = await request.json();
    console.log('📥 Updating Conversation AI agent:', id, JSON.stringify(body, null, 2));

    const result = await ghlClient.updateConversationAIAgent(id, body);

    // Log activity
    if (subAccount && authUser) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'update',
        entity_type: 'contact' as const,
        entity_id: id,
        entity_name: `Conversation AI Agent: ${result.name}`,
        details: { agentName: result.name, updates: Object.keys(body) },
      });
    }

    console.log('✅ Conversation AI agent updated:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error updating conversation AI agent:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation AI agent', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/conversation-ai/agents/[id] - Delete an agent
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

    // Get agent info before deleting for logging
    let agentName = 'Unknown Agent';
    try {
      const agent = await ghlClient.getConversationAIAgent(id);
      agentName = agent.name;
    } catch {
      // Agent might already be deleted
    }

    const result = await ghlClient.deleteConversationAIAgent(id);

    // Log activity
    if (subAccount && authUser) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'delete',
        entity_type: 'contact' as const,
        entity_id: id,
        entity_name: `Conversation AI Agent: ${agentName}`,
        details: { agentName },
      });
    }

    console.log('✅ Conversation AI agent deleted:', id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error deleting conversation AI agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation AI agent', details: String(error) },
      { status: 500 }
    );
  }
}

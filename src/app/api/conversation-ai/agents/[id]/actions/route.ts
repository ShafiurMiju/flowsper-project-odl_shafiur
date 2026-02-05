import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, supabaseAdmin } from '@/lib';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/conversation-ai/agents/[id]/actions - List actions for an agent
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
    const { id: agentId } = await params;
    
    const result = await ghlClient.listConversationAIActions(agentId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching conversation AI actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation AI actions', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/conversation-ai/agents/[id]/actions - Create/Attach an action to an agent
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { id: agentId } = await params;

    const body = await request.json();
    console.log('📥 Creating Conversation AI action:', JSON.stringify(body, null, 2));

    const result = await ghlClient.createConversationAIAction(agentId, body);

    // Log activity
    if (subAccount && authUser && result.data?.id) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'contact' as const,
        entity_id: result.data.id,
        entity_name: `Conversation AI Action: ${result.data.name}`,
        details: { actionName: result.data.name, actionType: result.data.type, agentId },
      });
    }

    console.log('✅ Conversation AI action created:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error creating conversation AI action:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation AI action', details: String(error) },
      { status: 500 }
    );
  }
}

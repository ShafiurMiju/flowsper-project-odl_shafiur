import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, logActivity } from '@/lib';

// GET /api/conversation-ai/agents - Search/List Conversation AI agents
export async function GET(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const startAfter = searchParams.get('startAfter') || undefined;

    const result = await ghlClient.searchConversationAIAgents({ query, limit, startAfter });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching conversation AI agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation AI agents', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/conversation-ai/agents - Create a new Conversation AI agent
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
    console.log('📥 Creating Conversation AI agent:', JSON.stringify(body, null, 2));

    const result = await ghlClient.createConversationAIAgent(body);

    if (subAccount && authUser && result.id) {
      await logActivity({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'conversation_ai_agent',
        entity_id: result.id,
        entity_name: `Conversation AI Agent: ${result.name}`,
        details: { agentName: result.name, mode: result.mode },
      });
    }

    console.log('✅ Conversation AI agent created:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error creating conversation AI agent:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation AI agent', details: String(error) },
      { status: 500 }
    );
  }
}

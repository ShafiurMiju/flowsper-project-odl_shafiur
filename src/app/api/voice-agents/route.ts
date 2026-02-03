import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, supabaseAdmin } from '@/lib';

// GET /api/voice-agents - Get all voice agents
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

    if (!ghlClient) {
      return NextResponse.json(
        { error: 'GHL client not initialized' },
        { status: 500 }
      );
    }

    const result = await ghlClient.getVoiceAgents();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching voice agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice agents', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/voice-agents - Create a new voice agent
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
    console.log('📥 Received body:', JSON.stringify(body, null, 2));

    // Remove fields not accepted by GHL API during creation
    // voiceId: We're using friendly names (jessica, michael) but GHL expects actual IDs, so remove it to let GHL auto-generate
    const { knowledgeBaseId, llmModel, voiceId, ...rawPayload } = body;

    // Clean up the payload - remove empty strings and undefined values
    const createPayload: any = {};
    
    Object.keys(rawPayload).forEach(key => {
      const value = rawPayload[key];
      // Only include non-empty values
      if (value !== '' && value !== null && value !== undefined) {
        createPayload[key] = value;
      }
    });

    console.log('🚀 Sending to GHL API:', JSON.stringify(createPayload, null, 2));

    const result = await ghlClient.createVoiceAgent(createPayload);

    // Log activity if we have sub-account and user
    if (subAccount && authUser && result.id) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'create',
        entity_type: 'contact' as const,
        entity_id: result.id,
        entity_name: `Voice Agent: ${result.agentName || body.agentName}`,
        details: { agentName: result.agentName || body.agentName },
      });
    }

    console.log('✅ GHL API Response:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error creating voice agent:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to create voice agent', details: String(error) },
      { status: 500 }
    );
  }
}

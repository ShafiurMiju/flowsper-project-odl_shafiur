import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest, supabaseAdmin } from '@/lib';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/voice-agents/[id] - Get a single voice agent
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient } = clientResult;
    const { id } = await params;

    const result = await ghlClient.getVoiceAgent(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching voice agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice agent', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/voice-agents/[id] - Update a voice agent
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient, subAccount, authUser } = clientResult;
    const { id } = await params;
    const body = await request.json();

    // Remove fields not accepted by GHL API during update
    const { knowledgeBaseId, llmModel, voiceId, ...rawPayload } = body;

    // Clean up the payload - remove empty strings and undefined values
    // For phone numbers, always include inboundNumbers as array (GHL expects array, not string)
    const updatePayload: any = {};
    
    Object.keys(rawPayload).forEach(key => {
      const value = rawPayload[key];
      // Always include inboundNumbers even if empty array (to clear phone numbers)
      if (key === 'inboundNumbers') {
        updatePayload[key] = Array.isArray(value) ? value : [];
      }
      // Skip the old inboundNumber string field
      else if (key === 'inboundNumber') {
        // Don't include it - we're using inboundNumbers array instead
      }
      // Only include other non-empty values
      else if (value !== '' && value !== null && value !== undefined) {
        updatePayload[key] = value;
      }
    });

    console.log('📝 Update payload for agent:', id, JSON.stringify(updatePayload, null, 2));

    const result = await ghlClient.updateVoiceAgent(id, updatePayload);

    // Log activity if we have sub-account and user
    if (subAccount && authUser && result) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'update',
        entity_type: 'contact' as const,
        entity_id: id,
        entity_name: `Voice Agent: ${result.agentName || body.agentName || 'Unknown'}`,
        details: body,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating voice agent:', error);
    return NextResponse.json(
      { error: 'Failed to update voice agent', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/voice-agents/[id] - Delete a voice agent
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient, subAccount, authUser } = clientResult;
    const { id } = await params;

    await ghlClient.deleteVoiceAgent(id);

    // Log activity if we have sub-account and user
    if (subAccount && authUser) {
      await supabaseAdmin.from('activity_logs').insert({
        sub_account_id: subAccount.id,
        user_id: authUser.id,
        action: 'delete',
        entity_type: 'contact' as const,
        entity_id: id,
        entity_name: 'Voice Agent',
        details: {},
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice agent', details: String(error) },
      { status: 500 }
    );
  }
}

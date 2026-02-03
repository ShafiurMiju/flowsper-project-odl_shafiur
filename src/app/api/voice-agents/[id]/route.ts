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

    const result = await ghlClient.updateVoiceAgent(id, body);

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      sub_account_id: subAccount!.id,
      user_id: authUser!.id,
      action: 'update',
      entity_type: 'contact' as const,
      entity_id: id,
      entity_name: `Voice Agent: ${result.agent.name}`,
      details: body,
    });

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

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      sub_account_id: subAccount!.id,
      user_id: authUser!.id,
      action: 'delete',
      entity_type: 'contact' as const,
      entity_id: id,
      entity_name: 'Voice Agent',
      details: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice agent', details: String(error) },
      { status: 500 }
    );
  }
}

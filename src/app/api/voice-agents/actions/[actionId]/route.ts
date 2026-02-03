import { NextRequest, NextResponse } from 'next/server';
import { createGHLClient } from '@/lib/ghl';
import { UpdateVoiceActionPayload } from '@/types';

// GET /api/voice-agents/actions/[actionId] - Get single action
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionId } = await params;
    const locationId = process.env.GHL_LOCATION_ID || '';
    const client = createGHLClient(token, locationId);

    const action = await client.getVoiceAction(actionId);
    return NextResponse.json(action);
  } catch (error) {
    console.error('Error fetching action:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action' },
      { status: 500 }
    );
  }
}

// PUT /api/voice-agents/actions/[actionId] - Update action
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionId } = await params;
    const locationId = process.env.GHL_LOCATION_ID || '';
    const client = createGHLClient(token, locationId);

    const data: UpdateVoiceActionPayload = await request.json();
    
    if (!data.agentId || !data.actionType || !data.name) {
      return NextResponse.json(
        { error: 'agentId, actionType, and name are required' },
        { status: 400 }
      );
    }

    const action = await client.updateVoiceAction(actionId, data);
    return NextResponse.json(action);
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json(
      { error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

// DELETE /api/voice-agents/actions/[actionId] - Delete action
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionId } = await params;
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    const locationId = process.env.GHL_LOCATION_ID || '';
    const client = createGHLClient(token, locationId);

    await client.deleteVoiceAction(actionId, agentId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { error: 'Failed to delete action' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createGHLClient } from '@/lib/ghl';
import { CreateVoiceActionPayload } from '@/types';

// POST /api/voice-agents/actions - Create action
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locationId = process.env.GHL_LOCATION_ID || '';
    const client = createGHLClient(token, locationId);

    const data: CreateVoiceActionPayload = await request.json();
    
    if (!data.agentId || !data.actionType || !data.name) {
      return NextResponse.json(
        { error: 'agentId, actionType, and name are required' },
        { status: 400 }
      );
    }

    const action = await client.createVoiceAction(data);
    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error('Error creating action:', error);
    return NextResponse.json(
      { error: 'Failed to create action' },
      { status: 500 }
    );
  }
}

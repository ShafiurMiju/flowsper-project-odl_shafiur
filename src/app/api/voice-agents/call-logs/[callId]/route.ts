import { NextRequest, NextResponse } from 'next/server';
import { createGHLClient } from '@/lib/ghl';

// GET /api/voice-agents/call-logs/[callId] - Get single call log
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { callId } = await params;
    const locationId = process.env.GHL_LOCATION_ID || '';
    const client = createGHLClient(token, locationId);

    const callLog = await client.getVoiceCallLog(callId);
    return NextResponse.json(callLog);
  } catch (error) {
    console.error('Error fetching call log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call log' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/voice-agents/[id]/calls - Get calls for a voice agent
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

    const result = await ghlClient.getVoiceAgentCalls(agentId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching voice agent calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice agent calls', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/voice-agents/[id]/calls - Trigger a new call
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { phoneNumber, contactId } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const result = await ghlClient.triggerVoiceCall(id, phoneNumber, contactId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error triggering voice call:', error);
    return NextResponse.json(
      { error: 'Failed to trigger voice call', details: String(error) },
      { status: 500 }
    );
  }
}

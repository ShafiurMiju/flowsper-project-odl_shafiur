import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * GET /api/call-logs/[id]
 * Fetch a single voice AI call log
 * @see https://marketplace.gohighlevel.com/docs/ghl/voice-ai/get-call-log
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient } = clientResult;
    const result = await ghlClient.getVoiceCallLog(params.id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching call log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call log', details: String(error) },
      { status: 500 }
    );
  }
}

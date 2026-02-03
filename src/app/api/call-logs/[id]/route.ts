import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * GET /api/call-logs/[id]
 * Fetch a single voice AI call log
 * @see https://marketplace.gohighlevel.com/docs/ghl/voice-ai/get-call-log
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { error: 'GHL client not available' },
        { status: 500 }
      );
    }
    const result = await ghlClient.getVoiceCallLog(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching call log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call log', details: String(error) },
      { status: 500 }
    );
  }
}

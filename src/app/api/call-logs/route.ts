import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';
import { VoiceActionType } from '@/types';

/**
 * GET /api/call-logs
 * Fetch voice AI call logs
 * @see https://marketplace.gohighlevel.com/docs/ghl/voice-ai/get-call-logs
 */
export async function GET(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    // After error check, ghlClient is guaranteed to exist
    const ghlClient = clientResult.ghlClient!;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const options: any = {};
    
    if (searchParams.get('agentId')) options.agentId = searchParams.get('agentId');
    if (searchParams.get('contactId')) options.contactId = searchParams.get('contactId');
    if (searchParams.get('callType')) options.callType = searchParams.get('callType');
    if (searchParams.get('startDate')) options.startDate = parseInt(searchParams.get('startDate')!);
    if (searchParams.get('endDate')) options.endDate = parseInt(searchParams.get('endDate')!);
    if (searchParams.get('sortBy')) options.sortBy = searchParams.get('sortBy');
    if (searchParams.get('sort')) options.sort = searchParams.get('sort');
    if (searchParams.get('page')) options.page = parseInt(searchParams.get('page')!);
    if (searchParams.get('pageSize')) options.pageSize = parseInt(searchParams.get('pageSize')!);
    
    if (searchParams.get('actionType')) {
      options.actionType = searchParams.get('actionType')!.split(',') as VoiceActionType[];
    }

    const result = await ghlClient.getVoiceCallLogs(options);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call logs', details: String(error) },
      { status: 500 }
    );
  }
}

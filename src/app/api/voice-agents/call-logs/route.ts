import { NextRequest, NextResponse } from 'next/server';
import { createGHLClient } from '@/lib/ghl';
import { VoiceActionType } from '@/types';

// GET /api/voice-agents/call-logs - List call logs
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locationId = process.env.GHL_LOCATION_ID || '';
    const client = createGHLClient(token, locationId);

    const { searchParams } = new URL(request.url);
    
    const options: {
      agentId?: string;
      contactId?: string;
      callType?: 'LIVE' | 'TRIAL';
      startDate?: number;
      endDate?: number;
      actionType?: VoiceActionType[];
      sortBy?: 'duration' | 'createdAt';
      sort?: 'ascend' | 'descend';
      page?: number;
      pageSize?: number;
    } = {};

    const agentId = searchParams.get('agentId');
    if (agentId) options.agentId = agentId;

    const contactId = searchParams.get('contactId');
    if (contactId) options.contactId = contactId;

    const callType = searchParams.get('callType') as 'LIVE' | 'TRIAL' | null;
    if (callType) options.callType = callType;

    const startDate = searchParams.get('startDate');
    if (startDate) options.startDate = parseInt(startDate);

    const endDate = searchParams.get('endDate');
    if (endDate) options.endDate = parseInt(endDate);

    const actionType = searchParams.get('actionType');
    if (actionType) options.actionType = actionType.split(',') as VoiceActionType[];

    const sortBy = searchParams.get('sortBy') as 'duration' | 'createdAt' | null;
    if (sortBy) options.sortBy = sortBy;

    const sort = searchParams.get('sort') as 'ascend' | 'descend' | null;
    if (sort) options.sort = sort;

    const page = searchParams.get('page');
    if (page) options.page = parseInt(page);

    const pageSize = searchParams.get('pageSize');
    if (pageSize) options.pageSize = parseInt(pageSize);

    const response = await client.getVoiceCallLogs(options);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call logs' },
      { status: 500 }
    );
  }
}

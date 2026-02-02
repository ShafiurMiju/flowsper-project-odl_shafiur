import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id] - Get a single conversation
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
    const result = await ghlClient!.getConversation(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation', details: String(error) },
      { status: 500 }
    );
  }
}

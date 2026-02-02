import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

// GET /api/conversations - List all conversations
export async function GET(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient } = clientResult;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const query = searchParams.get('query') || undefined;

    // Fetch conversations from GHL
    const result = await ghlClient!.getConversations(limit, query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: String(error) },
      { status: 500 }
    );
  }
}

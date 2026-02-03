import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * GET /api/knowledge-bases
 * Fetch knowledge bases for the current location
 * @see https://marketplace.gohighlevel.com/docs/ghl/knowledge-base/list-all-knowledge-bases-paginated
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

    const { ghlClient } = clientResult;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await ghlClient.getKnowledgeBases(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge bases', details: String(error) },
      { status: 500 }
    );
  }
}

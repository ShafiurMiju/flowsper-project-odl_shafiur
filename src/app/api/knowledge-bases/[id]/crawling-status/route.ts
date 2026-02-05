import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * GET /api/knowledge-bases/[id]/crawling-status
 * Get crawling status for the latest operation
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
    const response = await ghlClient.getCrawlingStatus(id);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching crawling status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crawling status' },
      { status: 500 }
    );
  }
}

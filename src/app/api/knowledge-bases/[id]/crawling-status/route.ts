import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * GET /api/knowledge-bases/[id]/crawling-status?operationId=xxx
 * Get crawling status for a specific operation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return NextResponse.json(
        { error: 'operationId query parameter is required' },
        { status: 400 }
      );
    }

    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    const response = await ghlClient.getCrawlingStatus(id, operationId);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching crawling status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crawling status' },
      { status: 500 }
    );
  }
}

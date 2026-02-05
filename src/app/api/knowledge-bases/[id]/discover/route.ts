import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * POST /api/knowledge-bases/[id]/discover
 * Discover website URLs for a knowledge base
 */
export async function POST(
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

    const body = await request.json();
    const ghlClient = clientResult.ghlClient!;
    const response = await ghlClient.discoverWebsite(id, body);

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error discovering website:', error);
    return NextResponse.json(
      { error: 'Failed to discover website' },
      { status: 500 }
    );
  }
}

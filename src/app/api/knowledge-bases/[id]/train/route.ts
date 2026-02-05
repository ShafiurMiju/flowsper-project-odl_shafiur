import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * POST /api/knowledge-bases/[id]/train
 * Train discovered URLs for a knowledge base
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
    const response = await ghlClient.trainUrls(id, body);

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error training URLs:', error);
    return NextResponse.json(
      { error: 'Failed to train URLs' },
      { status: 500 }
    );
  }
}

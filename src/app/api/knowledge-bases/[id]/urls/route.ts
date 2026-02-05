import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * GET /api/knowledge-bases/[id]/urls
 * Get all website URLs for a knowledge base
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[KB URLs GET] Fetching URLs for KB:', id);
    
    const clientResult = await getGHLClientForRequest(request);
    console.log('[KB URLs GET] Client result:', clientResult.error ? `Error: ${clientResult.error}` : 'Success');
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    console.log('[KB URLs GET] Calling GHL API...');
    const response = await ghlClient.getWebsiteUrls(id);
    console.log('[KB URLs GET] GHL response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[KB URLs GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website URLs' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-bases/[id]/urls
 * Delete trained URLs from a knowledge base
 */
export async function DELETE(
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
    const response = await ghlClient.deleteUrls(id, body);

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error deleting URLs:', error);
    return NextResponse.json(
      { error: 'Failed to delete URLs' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * GET /api/knowledge-bases/[id]/faqs
 * List FAQs for a knowledge base
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[KB FAQs GET] Fetching FAQs for KB:', id);
    
    const clientResult = await getGHLClientForRequest(request);
    console.log('[KB FAQs GET] Client result:', clientResult.error ? `Error: ${clientResult.error}` : 'Success');
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    console.log('[KB FAQs GET] Calling GHL API...');
    const response = await ghlClient.getFAQs(id);
    console.log('[KB FAQs GET] GHL response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[KB FAQs GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-bases/[id]/faqs
 * Create a FAQ for a knowledge base
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
    const response = await ghlClient.createFAQ(id, body);

    return NextResponse.json({ success: true, faq: response });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}

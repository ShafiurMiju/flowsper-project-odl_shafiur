import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * PUT /api/knowledge-bases/[id]/faqs/[faqId]
 * Update a FAQ
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
  try {
    const { id, faqId } = await params;
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const body = await request.json();
    const ghlClient = clientResult.ghlClient!;
    const response = await ghlClient.updateFAQ(id, faqId, body);

    return NextResponse.json({ success: true, faq: response });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-bases/[id]/faqs/[faqId]
 * Delete a FAQ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
  try {
    const { id, faqId } = await params;
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    await ghlClient.deleteFAQ(id, faqId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}

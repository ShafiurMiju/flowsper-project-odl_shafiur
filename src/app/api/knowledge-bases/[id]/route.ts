import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * GET /api/knowledge-bases/[id]
 * Get a specific knowledge base by ID
 * @see https://marketplace.gohighlevel.com/docs/ghl/knowledge-base/get-knowledge-base-by-id
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
    const result = await ghlClient.getKnowledgeBase(id);

    return NextResponse.json({
      success: true,
      knowledgeBase: result.data,
    });
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/knowledge-bases/[id]
 * Update a knowledge base
 * @see https://marketplace.gohighlevel.com/docs/ghl/knowledge-base/update-knowledge-base
 */
export async function PUT(
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
    const body = await request.json();

    const result = await ghlClient.updateKnowledgeBase(id, {
      name: body.name,
      description: body.description,
    });

    return NextResponse.json({
      success: true,
      knowledgeBase: result.data,
    });
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge base', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-bases/[id]
 * Delete a knowledge base
 * @see https://marketplace.gohighlevel.com/docs/ghl/knowledge-base/delete-knowledge-base
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

    const ghlClient = clientResult.ghlClient!;
    await ghlClient.deleteKnowledgeBase(id);

    return NextResponse.json({
      success: true,
      message: 'Knowledge base deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge base', details: String(error) },
      { status: 500 }
    );
  }
}

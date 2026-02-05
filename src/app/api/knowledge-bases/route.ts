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

    const ghlClient = clientResult.ghlClient!;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const lastKnowledgeBaseId = searchParams.get('lastKnowledgeBaseId') || undefined;

    const result = await ghlClient.getKnowledgeBases(limit, lastKnowledgeBaseId);
    
    // Fetch full details for each KB to get description
    const knowledgeBases = result.data?.knowledgeBases || [];
    const enrichedKBs = await Promise.all(
      knowledgeBases.map(async (kb: any) => {
        try {
          const fullKB = await ghlClient.getKnowledgeBase(kb.id);
          return {
            ...kb,
            description: fullKB.data?.description || kb.description || '',
          };
        } catch (error) {
          console.error(`Error fetching KB details for ${kb.id}:`, error);
          return kb;
        }
      })
    );
    
    return NextResponse.json({
      knowledgeBases: enrichedKBs,
      hasMore: result.data?.hasMore || false,
      lastKnowledgeBaseId: result.data?.lastKnowledgeBaseId,
    });
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge bases', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-bases
 * Create a new knowledge base
 * @see https://marketplace.gohighlevel.com/docs/ghl/knowledge-base/create-knowledge-base
 */
export async function POST(request: NextRequest) {
  try {
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const ghlClient = clientResult.ghlClient!;
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await ghlClient.createKnowledgeBase({
      name: body.name,
      description: body.description,
    });

    return NextResponse.json({
      success: true,
      knowledgeBase: result.data,
    });
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge base', details: String(error) },
      { status: 500 }
    );
  }
}

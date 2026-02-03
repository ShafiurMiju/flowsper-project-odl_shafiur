import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

// GET /api/pipelines - Get all pipelines from GHL
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
    const result = await ghlClient.getPipelines();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines', details: String(error) },
      { status: 500 }
    );
  }
}

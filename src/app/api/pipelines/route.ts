import { NextResponse } from 'next/server';
import { ghlClient } from '@/lib';

// GET /api/pipelines - Get all pipelines from GHL
export async function GET() {
  try {
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

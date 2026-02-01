import { NextRequest, NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib';

// GET /api/activity - Get activity logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const entityType = searchParams.get('entityType') as 'contact' | 'opportunity' | undefined;

    const logs = await getActivityLogs(limit, entityType || undefined);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs', details: String(error) },
      { status: 500 }
    );
  }
}

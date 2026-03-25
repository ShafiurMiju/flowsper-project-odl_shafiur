import { NextRequest, NextResponse } from 'next/server';
import { getDb, Doc } from '@/lib';
import { getAuthUser } from '@/lib/auth';

// GET /api/activity - Get activity logs
export async function GET(request: NextRequest) {
  try {
    // Get access token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get user
    const authUser = await getAuthUser(token);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const db = await getDb();

    // Determine sub_account_id based on user role
    let subAccountId: string | null = null;

    if (authUser.profile?.role === 'admin') {
      // For admin, get their active sub-account
      const activeSubAccount = await db.collection<Doc>('admin_active_sub_account').findOne({
        admin_user_id: authUser.id,
      });

      if (activeSubAccount) {
        subAccountId = activeSubAccount.active_sub_account_id;
      }
    } else {
      // For regular user, get their sub-account
      const subAccount = await db.collection<Doc>('sub_accounts').findOne({
        user_id: authUser.id,
      });

      if (subAccount) {
        subAccountId = subAccount._id as string;
      }
    }

    if (!subAccountId) {
      return NextResponse.json(
        { error: 'No active sub-account found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const entityType = searchParams.get('entityType') || undefined;

    const filter: Record<string, any> = { sub_account_id: subAccountId };
    if (entityType) {
      filter.entity_type = entityType;
    }

    const docs = await db
      .collection<Doc>('activity_logs')
      .find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    // Map _id to id
    const logs = docs.map(doc => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs', details: String(error) },
      { status: 500 }
    );
  }
}

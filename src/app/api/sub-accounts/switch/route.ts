import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isAdmin, setAdminActiveSubAccount } from '@/lib/auth';

// POST /api/sub-accounts/switch - Switch active sub-account (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await getAuthUser(accessToken);

    if (!authUser || !isAdmin(authUser)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { subAccountId } = await request.json();

    // subAccountId can be null to view all accounts
    const success = await setAdminActiveSubAccount(authUser.id, subAccountId || null);

    if (!success) {
      return NextResponse.json({ error: 'Failed to switch sub-account' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      activeSubAccountId: subAccountId,
      message: subAccountId ? 'Switched to sub-account successfully' : 'Viewing all sub-accounts'
    });
  } catch (error) {
    console.error('Error switching sub-account:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthUser,
  isAdmin,
  getSubAccountById,
  updateSubAccount,
  deleteSubAccount,
} from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sub-accounts/[id] - Get a specific sub-account
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await getAuthUser(accessToken);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this sub-account
    if (!isAdmin(authUser) && authUser.subAccount?.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const subAccount = await getSubAccountById(id);

    if (!subAccount) {
      return NextResponse.json({ error: 'Sub-account not found' }, { status: 404 });
    }

    // Hide API key for non-admin users
    if (!isAdmin(authUser)) {
      subAccount.ghl_api_key = '***hidden***';
    }

    return NextResponse.json({ subAccount });
  } catch (error) {
    console.error('Error fetching sub-account:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH /api/sub-accounts/[id] - Update a sub-account (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await getAuthUser(accessToken);

    if (!authUser || !isAdmin(authUser)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.ghl_location_id !== undefined) updates.ghl_location_id = body.ghl_location_id;
    if (body.ghl_api_key !== undefined) updates.ghl_api_key = body.ghl_api_key;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const subAccount = await updateSubAccount(id, updates);

    if (!subAccount) {
      return NextResponse.json({ error: 'Failed to update sub-account' }, { status: 500 });
    }

    return NextResponse.json({ subAccount });
  } catch (error) {
    console.error('Error updating sub-account:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE /api/sub-accounts/[id] - Delete a sub-account (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await getAuthUser(accessToken);

    if (!authUser || !isAdmin(authUser)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const success = await deleteSubAccount(id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete sub-account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Sub-account deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub-account:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

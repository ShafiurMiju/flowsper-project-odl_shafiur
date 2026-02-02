import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthUser,
  isAdmin,
  createSubAccount,
  getAllSubAccounts,
} from '@/lib/auth';
import { CreateSubAccountRequest } from '@/types';

// GET /api/sub-accounts - List all sub-accounts (admin only)
export async function GET(request: NextRequest) {
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

    const subAccounts = await getAllSubAccounts();

    return NextResponse.json({ subAccounts });
  } catch (error) {
    console.error('Error fetching sub-accounts:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/sub-accounts - Create a new sub-account (admin only)
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

    const body: CreateSubAccountRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.ghl_location_id || !body.ghl_api_key) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, ghl_location_id, ghl_api_key' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const result = await createSubAccount(authUser.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      subAccount: result.subAccount,
      message: 'Sub-account created successfully. User can now login with the provided credentials.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sub-account:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib';
import { supabase } from '@/lib/supabase';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile to determine sub_account_id
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    let subAccountId: string | null = null;

    if (profile?.is_admin) {
      // For admin, get their active sub-account
      const { data: activeSubAccount } = await supabaseAdmin
        .from('admin_active_sub_account')
        .select('sub_account_id')
        .eq('admin_id', user.id)
        .single();
      
      if (activeSubAccount) {
        subAccountId = activeSubAccount.sub_account_id;
      }
    } else {
      // For regular user, get their sub-account
      const { data: subAccount } = await supabaseAdmin
        .from('sub_accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (subAccount) {
        subAccountId = subAccount.id;
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
    const entityType = searchParams.get('entityType') as 'contact' | 'opportunity' | undefined;

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('sub_account_id', subAccountId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: data || [] });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs', details: String(error) },
      { status: 500 }
    );
  }
}

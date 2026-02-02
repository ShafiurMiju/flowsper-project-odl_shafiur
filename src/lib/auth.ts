import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabase';
import { DBUserProfile, DBSubAccount, AuthUser, CreateSubAccountRequest } from '@/types';

// =====================================================
// AUTH HELPER FUNCTIONS
// =====================================================

/**
 * Get authenticated user with profile and sub-account info
 */
export async function getAuthUser(accessToken: string): Promise<AuthUser | null> {
  try {
    // Create a client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get user's sub-account (if sub-account user)
    let subAccount: DBSubAccount | null = null;
    let activeSubAccountId: string | null = null;

    if (profile?.role === 'sub_account') {
      const { data } = await supabaseAdmin
        .from('sub_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();
      subAccount = data;
      activeSubAccountId = data?.id || null;
    } else if (profile?.role === 'admin') {
      // Get admin's active sub-account
      const { data } = await supabaseAdmin
        .from('admin_active_sub_account')
        .select('active_sub_account_id')
        .eq('admin_user_id', user.id)
        .single();
      activeSubAccountId = data?.active_sub_account_id || null;
    }

    return {
      id: user.id,
      email: user.email || '',
      profile: profile as DBUserProfile | null,
      subAccount,
      activeSubAccountId,
    };
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.profile?.role === 'admin';
}

/**
 * Create a new sub-account with user login
 * Only admins can create sub-accounts
 */
export async function createSubAccount(
  adminUserId: string,
  data: CreateSubAccountRequest
): Promise<{ success: boolean; error?: string; subAccount?: DBSubAccount }> {
  try {
    // 1. Create auth user for sub-account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.name,
        role: 'sub_account',
      },
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create user' };
    }

    // 2. Create user profile (required because we removed the auto-trigger)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.name,
        role: 'sub_account',
        is_active: true,
      });

    if (profileError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: 'Failed to create user profile: ' + profileError.message };
    }

    // 3. Create sub-account linked to the new user
    const { data: subAccount, error: subAccountError } = await supabaseAdmin
      .from('sub_accounts')
      .insert({
        user_id: authData.user.id,
        name: data.name,
        ghl_location_id: data.ghl_location_id,
        ghl_api_key: data.ghl_api_key,
        created_by: adminUserId,
        is_active: true,
      })
      .select()
      .single();

    if (subAccountError) {
      // Rollback: delete the auth user and profile
      await supabaseAdmin.from('user_profiles').delete().eq('id', authData.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: subAccountError.message };
    }

    return { success: true, subAccount: subAccount as DBSubAccount };
  } catch (error) {
    console.error('Error creating sub-account:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all sub-accounts (admin only)
 */
export async function getAllSubAccounts(): Promise<DBSubAccount[]> {
  const { data, error } = await supabaseAdmin
    .from('sub_accounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sub-accounts:', error);
    return [];
  }

  return data as DBSubAccount[];
}

/**
 * Set admin's active sub-account
 */
export async function setAdminActiveSubAccount(
  adminUserId: string,
  subAccountId: string | null
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('admin_active_sub_account')
    .upsert({
      admin_user_id: adminUserId,
      active_sub_account_id: subAccountId,
    }, {
      onConflict: 'admin_user_id',
    });

  if (error) {
    console.error('Error setting active sub-account:', error);
    return false;
  }

  return true;
}

/**
 * Get sub-account by ID
 */
export async function getSubAccountById(subAccountId: string): Promise<DBSubAccount | null> {
  const { data, error } = await supabaseAdmin
    .from('sub_accounts')
    .select('*')
    .eq('id', subAccountId)
    .single();

  if (error) {
    console.error('Error fetching sub-account:', error);
    return null;
  }

  return data as DBSubAccount;
}

/**
 * Update sub-account
 */
export async function updateSubAccount(
  subAccountId: string,
  updates: Partial<Pick<DBSubAccount, 'name' | 'ghl_location_id' | 'ghl_api_key' | 'is_active'>>
): Promise<DBSubAccount | null> {
  const { data, error } = await supabaseAdmin
    .from('sub_accounts')
    .update(updates)
    .eq('id', subAccountId)
    .select()
    .single();

  if (error) {
    console.error('Error updating sub-account:', error);
    return null;
  }

  return data as DBSubAccount;
}

/**
 * Delete sub-account and associated user
 */
export async function deleteSubAccount(subAccountId: string): Promise<boolean> {
  try {
    // Get sub-account to find user_id
    const { data: subAccount } = await supabaseAdmin
      .from('sub_accounts')
      .select('user_id')
      .eq('id', subAccountId)
      .single();

    // Delete sub-account (cascade will delete contacts, opportunities, etc.)
    const { error: deleteError } = await supabaseAdmin
      .from('sub_accounts')
      .delete()
      .eq('id', subAccountId);

    if (deleteError) {
      console.error('Error deleting sub-account:', deleteError);
      return false;
    }

    // Delete auth user if exists
    if (subAccount?.user_id) {
      await supabaseAdmin.auth.admin.deleteUser(subAccount.user_id);
    }

    return true;
  } catch (error) {
    console.error('Error deleting sub-account:', error);
    return false;
  }
}

/**
 * Verify user credentials and return session
 */
export async function signIn(email: string, password: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data.session, user: data.user };
}

/**
 * Sign out user
 */
export async function signOut(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { error } = await supabase.auth.signOut();
  return { success: !error, error: error?.message };
}

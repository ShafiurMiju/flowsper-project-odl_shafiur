import { NextRequest } from 'next/server';
import { createGHLClient } from './ghl';
import { getAuthUser, getSubAccountById } from './auth';
import { DBSubAccount } from '@/types';

/**
 * Get GHL client for the authenticated user's sub-account
 */
export async function getGHLClientForRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return { error: 'Unauthorized - No access token', status: 401 };
  }

  const authUser = await getAuthUser(accessToken);
  
  if (!authUser) {
    return { error: 'Unauthorized - Invalid token', status: 401 };
  }

  // Determine which sub-account to use
  let subAccount: DBSubAccount | null = null;

  if (authUser.profile?.role === 'admin') {
    // Admin: use their active sub-account or first available
    if (authUser.activeSubAccountId) {
      subAccount = await getSubAccountById(authUser.activeSubAccountId);
    }
    // If admin has no active sub-account selected, we can't proceed
    if (!subAccount) {
      return { 
        error: 'Please select a sub-account first', 
        status: 400,
        needsSubAccountSelection: true 
      };
    }
  } else {
    // Sub-account user: use their own sub-account
    subAccount = authUser.subAccount;
  }

  if (!subAccount) {
    return { error: 'No sub-account found for user', status: 404 };
  }

  // Create GHL client with sub-account credentials
  const ghlClient = createGHLClient(subAccount.ghl_api_key, subAccount.ghl_location_id);

  return {
    ghlClient,
    subAccount,
    authUser,
    error: null,
  };
}

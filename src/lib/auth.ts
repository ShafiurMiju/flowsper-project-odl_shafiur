import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, toDoc, Doc } from './mongodb';
import { DBUserProfile, DBSubAccount, AuthUser, CreateSubAccountRequest } from '@/types';

// =====================================================
// AUTH CONFIGURATION
// =====================================================

const JWT_SECRET = process.env.JWT_SECRET || 'flowsper-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_EXPIRES_IN = '30d';
const SALT_ROUNDS = 10;

// =====================================================
// TOKEN HELPERS
// =====================================================

function generateTokens(userId: string, email: string) {
  const access_token = jwt.sign(
    { sub: userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  const refresh_token = jwt.sign(
    { sub: userId, email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
  return { access_token, refresh_token };
}

function verifyToken(token: string): { sub: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
  } catch {
    return null;
  }
}

// =====================================================
// AUTH HELPER FUNCTIONS
// =====================================================

/**
 * Get authenticated user with profile and sub-account info
 */
export async function getAuthUser(accessToken: string): Promise<AuthUser | null> {
  try {
    const decoded = verifyToken(accessToken);
    if (!decoded) return null;

    const db = await getDb();

    // Get user profile
    const profileDoc = await db.collection<Doc>('user_profiles').findOne({ _id: decoded.sub });
    if (!profileDoc) return null;

    const profile = toDoc<DBUserProfile>(profileDoc);
    if (!profile) return null;

    // Get user's sub-account (if sub-account user)
    let subAccount: DBSubAccount | null = null;
    let activeSubAccountId: string | null = null;

    if (profile.role === 'sub_account') {
      const saDoc = await db.collection<Doc>('sub_accounts').findOne({ user_id: decoded.sub });
      subAccount = toDoc<DBSubAccount>(saDoc);
      activeSubAccountId = subAccount?.id || null;
    } else if (profile.role === 'admin') {
      // Get admin's active sub-account
      const adminActive = await db.collection<Doc>('admin_active_sub_account').findOne({
        admin_user_id: decoded.sub,
      });
      activeSubAccountId = adminActive?.active_sub_account_id || null;
    }

    return {
      id: decoded.sub,
      email: profile.email,
      profile,
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
    const db = await getDb();

    // Check if email already exists
    const existing = await db.collection<Doc>('user_profiles').findOne({ email: data.email });
    if (existing) {
      return { success: false, error: 'A user with this email already exists' };
    }

    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const now = new Date().toISOString();

    // 1. Create user profile
    await db.collection<Doc>('user_profiles').insertOne({
      _id: userId,
      email: data.email,
      full_name: data.name,
      password_hash: hashedPassword,
      role: 'sub_account',
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // 2. Create sub-account linked to the new user
    const subAccountId = randomUUID();
    const subAccountDoc = {
      _id: subAccountId,
      user_id: userId,
      name: data.name,
      ghl_location_id: data.ghl_location_id,
      ghl_api_key: data.ghl_api_key,
      is_active: true,
      created_by: adminUserId,
      created_at: now,
      updated_at: now,
    };

    await db.collection<Doc>('sub_accounts').insertOne(subAccountDoc);

    const subAccount = toDoc<DBSubAccount>(subAccountDoc);
    return { success: true, subAccount: subAccount! };
  } catch (error: any) {
    console.error('Error creating sub-account:', error);

    if (error?.code === 11000) {
      return { success: false, error: 'A user with this email or location already exists' };
    }

    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all sub-accounts (admin only)
 */
export async function getAllSubAccounts(): Promise<DBSubAccount[]> {
  try {
    const db = await getDb();
    const docs = await db
      .collection<Doc>('sub_accounts')
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    return docs.map(doc => toDoc<DBSubAccount>(doc)!);
  } catch (error) {
    console.error('Error fetching sub-accounts:', error);
    return [];
  }
}

/**
 * Set admin's active sub-account
 */
export async function setAdminActiveSubAccount(
  adminUserId: string,
  subAccountId: string | null
): Promise<boolean> {
  try {
    const db = await getDb();
    await db.collection<Doc>('admin_active_sub_account').updateOne(
      { admin_user_id: adminUserId },
      {
        $set: {
          active_sub_account_id: subAccountId,
          updated_at: new Date().toISOString(),
        },
        $setOnInsert: {
          _id: randomUUID(),
          admin_user_id: adminUserId,
        },
      },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Error setting active sub-account:', error);
    return false;
  }
}

/**
 * Get sub-account by ID
 */
export async function getSubAccountById(subAccountId: string): Promise<DBSubAccount | null> {
  try {
    const db = await getDb();
    const doc = await db.collection<Doc>('sub_accounts').findOne({ _id: subAccountId });
    return toDoc<DBSubAccount>(doc);
  } catch (error) {
    console.error('Error fetching sub-account:', error);
    return null;
  }
}

/**
 * Update sub-account
 */
export async function updateSubAccount(
  subAccountId: string,
  updates: Partial<Pick<DBSubAccount, 'name' | 'ghl_location_id' | 'ghl_api_key' | 'is_active'>>
): Promise<DBSubAccount | null> {
  try {
    const db = await getDb();
    const result = await db.collection<Doc>('sub_accounts').findOneAndUpdate(
      { _id: subAccountId },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return toDoc<DBSubAccount>(result);
  } catch (error) {
    console.error('Error updating sub-account:', error);
    return null;
  }
}

/**
 * Delete sub-account and associated user
 */
export async function deleteSubAccount(subAccountId: string): Promise<boolean> {
  try {
    const db = await getDb();

    // Get sub-account to find user_id
    const subAccount = await db.collection<Doc>('sub_accounts').findOne({ _id: subAccountId });

    // Delete related data stored in MongoDB
    await db.collection('activity_logs').deleteMany({ sub_account_id: subAccountId });
    await db.collection('admin_active_sub_account').deleteMany({ active_sub_account_id: subAccountId });

    // Delete sub-account
    await db.collection<Doc>('sub_accounts').deleteOne({ _id: subAccountId });

    // Delete auth user if exists
    if (subAccount?.user_id) {
      await db.collection<Doc>('user_profiles').deleteOne({ _id: subAccount.user_id });
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
  try {
    const db = await getDb();
    const user = await db.collection<Doc>('user_profiles').findOne({ email });

    if (!user || !user.password_hash) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (!user.is_active) {
      return { success: false, error: 'Account is disabled' };
    }

    const tokens = generateTokens(user._id as string, user.email);

    return {
      success: true,
      session: tokens,
      user: {
        id: user._id,
        email: user.email,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
        },
      },
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Sign out user (JWT-based - no server-side session to invalidate)
 */
export async function signOut(_accessToken: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

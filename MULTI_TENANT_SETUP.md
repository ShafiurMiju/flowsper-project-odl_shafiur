# 🚀 Flowsper Multi-Tenant Setup Guide

This guide will help you set up the multi-tenant admin/sub-account system for Flowsper CRM.

## 📋 Prerequisites

- Supabase account (free tier works)
- Your existing Flowsper project
- Node.js 18+

---

## Step 1: Supabase Project Setup

### 1.1 Enable Email Authentication

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Ensure **Email** provider is **Enabled**
5. Go to **Authentication** → **Settings**
6. For testing, you can **disable** "Confirm email" (enable in production)

### 1.2 Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values to your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## Step 2: Run the Database Schema

### 2.1 Open SQL Editor

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**

### 2.2 Run the Schema

1. Copy the contents of `supabase/schema.sql`
2. Paste into the SQL Editor
3. Click **Run**

⚠️ **Warning**: This will DROP existing tables. Backup your data first!

### 2.3 Verify Tables Created

After running, you should see these tables in **Table Editor**:
- `user_profiles` - User accounts with roles
- `sub_accounts` - GHL sub-account configurations  
- `contacts` - Contacts per sub-account
- `opportunities` - Opportunities per sub-account
- `activity_logs` - Activity logs per sub-account
- `admin_active_sub_account` - Admin's active sub-account selection

---

## Step 3: Create Admin User

### 3.1 Create User via Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - **Email**: `admin@yourdomain.com` (your admin email)
   - **Password**: A secure password (min 6 characters)
   - Check **Auto Confirm User**
4. Click **Create user**

### 3.2 Update User Role to Admin

1. Go to **SQL Editor** → **New Query**
2. Run this SQL (replace with your admin email):

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@yourdomain.com';
```

3. Verify it worked:

```sql
SELECT * FROM user_profiles WHERE role = 'admin';
```

---

## Step 4: Start the Application

```bash
npm run dev
```

---

## Step 5: Login & Create Sub-Accounts

### 5.1 Login as Admin

1. Go to `http://localhost:3000/login`
2. Enter your admin credentials
3. You should see "Agency Mode" in the sidebar

### 5.2 Create Sub-Accounts

1. Click **Sub-Accounts** in the sidebar (Admin section)
2. Click **Add Sub-Account**
3. Fill in:
   - **Account Name**: e.g., "Acme Corp"
   - **Login Email**: The email for this sub-account user
   - **Password**: Password for the sub-account user
   - **GHL Location ID**: From GoHighLevel
   - **GHL API Key**: From GoHighLevel
4. Click **Create Sub-Account**

The sub-account user can now login with their email/password.

---

## 🔄 How It Works

### User Roles

| Role | Can See | Can Do |
|------|---------|--------|
| **Admin** | All sub-accounts | Create/edit/delete sub-accounts, switch between them |
| **Sub-Account** | Only their own data | Manage their contacts & opportunities |

### Admin Features

- **Agency Mode**: See all sub-accounts
- **Switch Sub-Account**: View data as a specific sub-account
- **Create Users**: When you create a sub-account, a login is automatically created

### Sub-Account Features

- **Single Account View**: Only see their own contacts/opportunities
- **No Admin Access**: Cannot see other sub-accounts

---

## 🔧 Environment Variables

Make sure your `.env.local` has:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GHL (Optional - for backward compatibility)
# Individual sub-accounts now store their own API keys
GHL_API_KEY=optional-default-key
GHL_LOCATION_ID=optional-default-location
```

---

## 🔒 Security Notes

1. **Service Role Key**: Never expose this in client-side code. It's only used in API routes.
2. **Row Level Security (RLS)**: The schema includes RLS policies to ensure users only see their own data.
3. **API Keys**: Sub-account API keys are stored in the database. Only admins can see them.

---

## ❓ Troubleshooting

### "User not found" after login
- Make sure the `handle_new_user` trigger is working
- Check if user exists in `user_profiles` table:
  ```sql
  SELECT * FROM user_profiles WHERE email = 'your-email';
  ```

### Can't create sub-account
- Verify you're logged in as admin
- Check browser console for errors
- Verify the email isn't already registered

### RLS Policy errors
- Make sure you're using the service role key in API routes
- Check that the schema was run completely

---

## 📁 New Files Created

```
src/
├── app/
│   ├── login/page.tsx              # Login page
│   ├── admin/
│   │   └── sub-accounts/page.tsx   # Sub-account management
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts      # Login API
│       │   ├── logout/route.ts     # Logout API
│       │   └── me/route.ts         # Get current user
│       └── sub-accounts/
│           ├── route.ts            # List/Create sub-accounts
│           ├── [id]/route.ts       # Get/Update/Delete sub-account
│           └── switch/route.ts     # Switch active sub-account
├── context/
│   ├── AuthContext.tsx             # Auth state management
│   └── index.ts
├── lib/
│   └── auth.ts                     # Auth helper functions
└── components/
    └── layout/
        └── ClientLayout.tsx        # Client-side layout wrapper

supabase/
├── schema.sql                      # Updated multi-tenant schema
└── create-admin.sql                # Admin creation helper
```

---

## 🎉 You're Done!

Your multi-tenant CRM is now set up with:
- ✅ Admin & Sub-Account roles
- ✅ Login system via Supabase Auth
- ✅ Sub-account management UI
- ✅ Data isolation per sub-account
- ✅ Admin can switch between sub-accounts

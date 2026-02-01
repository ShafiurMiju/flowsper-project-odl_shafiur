# 🚨 Setup Required - Action Items

## Critical Issues to Fix

### ❌ Issue 1: Invalid GoHighLevel API Key
**Error:** `401 Unauthorized - Invalid JWT`

**Solution:**
1. Log into GoHighLevel: https://app.gohighlevel.com
2. Navigate to: **Settings** → **Company** → **API Key**
   - OR: Click your profile icon → **Settings** → **Integrations**
3. Generate a **new API key**
4. Copy the full key (starts with `eyJ...`)
5. Update `.env.local`:
   ```bash
   GHL_API_KEY=your_new_api_key_here
   ```
6. Restart the dev server (Ctrl+C, then `npm run dev`)

---

### ❌ Issue 2: Supabase Tables Don't Exist
**Error:** `Could not find the table 'public.activity_logs'`

**Solution:**
1. Go to Supabase dashboard: https://supabase.com/dashboard
2. Open your **Dataflow** project
3. Click **SQL Editor** in left sidebar
4. **Copy the SQL from** `supabase/schema.sql` in this project
5. Paste it into the SQL Editor
6. Click **RUN** (or Ctrl+Enter)
7. You should see: ✅ Success. No rows returned
8. Verify tables exist: Go to **Table Editor** → See `contacts`, `opportunities`, `activity_logs`

---

## How to Verify It's Working

After fixing both issues above:

1. **Refresh the browser** (http://localhost:3000)
2. **Dashboard should show**:
   - Contact count
   - Opportunity count
   - Pipeline value
3. **Go to Contacts page** → Should load contacts from GHL (or show "No contacts yet")
4. **Click "Add Contact"** → Fill form → Submit
5. **Check Supabase** → Table Editor → contacts table → New row appears

---

## Quick Test Commands

```bash
# Check if .env.local has the new API key
cat .env.local | grep GHL_API_KEY

# Restart the dev server
npm run dev
```

---

## Need Help?

### Get GHL Location ID
Your Location ID from the JWT is: `VrTTgjMoHCZk4jeKOm9F`
(Already set in `.env.local`)

### Check Supabase Connection
Your Supabase URL: `https://kqaqiowyourxrgckvyde.supabase.co`
(Already configured)

### Still Having Issues?
1. Check the terminal for errors
2. Open browser console (F12) → Look for error messages
3. Verify both API keys are correct in `.env.local`

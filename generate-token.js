const jwt = require('jsonwebtoken');

// Token configuration (matches your AuthUser structure)
const payload = {
  // From AuthUser interface
  id: 'user-' + Math.random().toString(36).substr(2, 9),  // Unique user ID
  email: 'admin@example.com',
  profile: {
    id: 'profile-' + Math.random().toString(36).substr(2, 9),
    email: 'admin@example.com',
    full_name: 'Test Admin',
    role: 'admin',  // 'admin' or 'sub_account'
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  subAccount: {
    id: 'subaccount-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Sub Account',
    ghl_location_id: 'your-ghl-location-id',
    ghl_api_key: 'your-ghl-api-key',
    is_active: true,
  },
  activeSubAccountId: null,
  iat: Math.floor(Date.now() / 1000),
};

const secret = process.env.JWT_SECRET || 'your-secret-key-for-testing';

// Generate token with 24 hour expiration
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('\n✅ Test Token Generated:\n');
console.log(token);
console.log('\n📋 Token Details:');
console.log(`  - User ID: ${payload.userId}`);
console.log(`  - Email: ${payload.email}`);
console.log(`  - Role: ${payload.role}`);
console.log(`  - Expires in: 24 hours`);
console.log('\n💾 To use this token:');
console.log('  1. Open your browser console (F12)');
console.log('  2. Paste this command:');
console.log(`     localStorage.setItem('access_token', '${token}')`);
console.log('\n');

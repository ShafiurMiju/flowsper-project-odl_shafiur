// MongoDB Initialization Script for Flowsper
// Run: node mongo-init.js
//
// Prerequisites:
//   - MongoDB running locally on default port (27017)
//   - npm install (to have mongodb & bcryptjs available)
//
// This script creates:
//   1. All required collections
//   2. Indexes matching the original PostgreSQL schema
//   3. A default admin user (admin@flowsper.com / admin123)

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'flowsper';

async function init() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);

    // =====================================================
    // CREATE COLLECTIONS
    // =====================================================
    const collections = [
      'user_profiles',
      'sub_accounts',
      'contacts',
      'opportunities',
      'conversations',
      'messages',
      'activity_logs',
      'admin_active_sub_account',
      'refresh_tokens',
    ];

    const existing = (await db.listCollections().toArray()).map(c => c.name);

    for (const name of collections) {
      if (!existing.includes(name)) {
        await db.createCollection(name);
        console.log(`  📦 Created collection: ${name}`);
      } else {
        console.log(`  ✔️  Collection already exists: ${name}`);
      }
    }

    // =====================================================
    // CREATE INDEXES
    // =====================================================
    console.log('\n🔧 Creating indexes...');

    // user_profiles
    await db.collection('user_profiles').createIndex({ email: 1 }, { unique: true });
    await db.collection('user_profiles').createIndex({ role: 1 });
    console.log('  ✔️  user_profiles indexes');

    // sub_accounts
    await db.collection('sub_accounts').createIndex({ user_id: 1 });
    await db.collection('sub_accounts').createIndex({ ghl_location_id: 1 }, { unique: true });
    console.log('  ✔️  sub_accounts indexes');

    // contacts
    await db.collection('contacts').createIndex({ sub_account_id: 1 });
    await db.collection('contacts').createIndex({ ghl_id: 1 });
    await db.collection('contacts').createIndex({ email: 1 });
    await db.collection('contacts').createIndex(
      { sub_account_id: 1, ghl_id: 1 },
      { unique: true }
    );
    console.log('  ✔️  contacts indexes');

    // opportunities
    await db.collection('opportunities').createIndex({ sub_account_id: 1 });
    await db.collection('opportunities').createIndex({ ghl_id: 1 });
    await db.collection('opportunities').createIndex({ pipeline_id: 1 });
    await db.collection('opportunities').createIndex({ status: 1 });
    await db.collection('opportunities').createIndex(
      { sub_account_id: 1, ghl_id: 1 },
      { unique: true }
    );
    console.log('  ✔️  opportunities indexes');

    // conversations
    await db.collection('conversations').createIndex({ sub_account_id: 1 });
    await db.collection('conversations').createIndex({ ghl_id: 1 });
    await db.collection('conversations').createIndex({ contact_id: 1 });
    await db.collection('conversations').createIndex({ last_message_date: -1 });
    await db.collection('conversations').createIndex(
      { sub_account_id: 1, ghl_id: 1 },
      { unique: true }
    );
    console.log('  ✔️  conversations indexes');

    // messages
    await db.collection('messages').createIndex({ sub_account_id: 1 });
    await db.collection('messages').createIndex({ conversation_id: 1 });
    await db.collection('messages').createIndex({ ghl_id: 1 });
    await db.collection('messages').createIndex({ message_date: -1 });
    await db.collection('messages').createIndex({ direction: 1 });
    await db.collection('messages').createIndex({ status: 1 });
    await db.collection('messages').createIndex(
      { sub_account_id: 1, ghl_id: 1 },
      { unique: true }
    );
    console.log('  ✔️  messages indexes');

    // activity_logs
    await db.collection('activity_logs').createIndex({ sub_account_id: 1 });
    await db.collection('activity_logs').createIndex({ created_at: -1 });
    await db.collection('activity_logs').createIndex({ entity_type: 1 });
    console.log('  ✔️  activity_logs indexes');

    // admin_active_sub_account
    await db.collection('admin_active_sub_account').createIndex(
      { admin_user_id: 1 },
      { unique: true }
    );
    console.log('  ✔️  admin_active_sub_account indexes');

    // refresh_tokens
    await db.collection('refresh_tokens').createIndex({ user_id: 1 });
    await db.collection('refresh_tokens').createIndex(
      { expires_at: 1 },
      { expireAfterSeconds: 0 }  // TTL index - auto-deletes expired tokens
    );
    console.log('  ✔️  refresh_tokens indexes');

    // =====================================================
    // CREATE DEFAULT ADMIN USER
    // =====================================================
    console.log('\n👤 Creating default admin user...');

    const adminEmail = 'admin@flowsper.com';
    const adminPassword = 'admin123';

    const existingAdmin = await db.collection('user_profiles').findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`  ✔️  Admin user already exists: ${adminEmail}`);
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const adminId = randomUUID();

      await db.collection('user_profiles').insertOne({
        _id: adminId,
        email: adminEmail,
        full_name: 'Admin',
        role: 'admin',
        password_hash: passwordHash,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`  ✅ Admin user created:`);
      console.log(`     Email:    ${adminEmail}`);
      console.log(`     Password: ${adminPassword}`);
      console.log(`     ID:       ${adminId}`);
      console.log(`     ⚠️  Change password after first login!`);
    }

    // =====================================================
    // DONE
    // =====================================================
    console.log('\n🎉 MongoDB initialization complete!');
    console.log(`   Database: ${MONGODB_DB}`);
    console.log(`   URI:      ${MONGODB_URI}`);

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

init();

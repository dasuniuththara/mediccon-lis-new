const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://tzcsqkrljljlgapzqpv.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_KEY missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const db = new Database('mediccon_lis.db');

const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd).digest('hex');

async function forceSyncAuth() {
    console.log('🛰️  Initiating Manual Cloud Handshake...');

    // 1. Get local node identity
    const nodeRow = db.prepare("SELECT value FROM system_settings WHERE key = 'facility_id'").get();
    const nodeId = nodeRow ? nodeRow.value : 'NODE-MASTER';

    // 2. Extract local users
    const users = db.prepare('SELECT * FROM users').all();
    console.log(`📡 Local Users Found: ${users.length}`);

    // Data Stamping
    const stampedUsers = users.map(u => ({ ...u, node_id: nodeId }));

    // 3. Mirror to Supabase
    const { data, error } = await supabase
        .from('users')
        .upsert(stampedUsers, { onConflict: 'id, node_id' });

    if (error) {
        console.error('❌ CLOUD REJECTION:', error.message);
        if (error.message.includes('column "node_id" of relation "users" does not exist')) {
            console.error('💡 ACTION REQUIRED: You must add a "node_id" column to your "users" table in Supabase Dashboard.');
        }
    } else {
        console.log('✅ CLOUD MIRROR SUCCESSFUL: Credentials pushed to Mother Node.');
    }

    db.close();
}

forceSyncAuth();

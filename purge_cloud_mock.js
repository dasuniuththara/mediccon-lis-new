require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 🌐 Target the Live Cloud Environment
const supabaseUrl = process.env.SUPABASE_URL || 'https://tzosgkrljljlgapzqpv.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
    console.error('❌ Missing SUPABASE_KEY. Cannot purge cloud.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeCloud() {
    console.log('🚀 Initiating Cloud Purge Protocol...');
    
    const tables = [
        'results', 
        'patients', 
        'patient_tests', 
        'lab_visits', 
        'invoices', 
        'procurement_orders', 
        'pending_orders'
    ];

    for (const table of tables) {
        console.log(`🧹 Clearing table: ${table}...`);
        const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', 0); // Delete everything where id != 0 
            
        if (error) {
            // For patients, we use 'nic'
            if (table === 'patients') {
                 await supabase.from(table).delete().neq('nic', '0');
            } else {
                console.error(`⚠️ Failed to clear ${table}:`, error.message);
            }
        } else {
            console.log(`✅ ${table} Purged.`);
        }
    }

    console.log('✨ Cloud Matrix is now CLEAN and ready for Real Data.');
}

purgeCloud();

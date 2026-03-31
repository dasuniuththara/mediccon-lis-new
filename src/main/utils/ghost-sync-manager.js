const { createClient } = require('@supabase/supabase-js');
const db = require('../database/db-config');
require('dotenv').config();

class GhostSyncManager {
    constructor() {
        // Use a fixed URL to prevent DNS resolution failures
        this.supabaseUrl = process.env.SUPABASE_URL || 'https://tzosgkrljljlgapzqpv.supabase.co';
        this.supabaseKey = process.env.SUPABASE_KEY;

        console.log('[GHOST-SYNC] Connecting to Diagnostic Matrix:', this.supabaseUrl);
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
        this.isActive = false;
        this.isSyncing = false;

        // Define which tables to shadow-sync to the cloud
        this.syncTables = [
            'users',
            'patients',
            'invoices',
            'results',
            'inventory',
            'procurement_orders',
            'machines',
            'test_catalog'
        ];
    }

    initialize() {
        if (!this.supabaseUrl || !this.supabaseKey) {
            console.log('[GHOST-SYNC] Paused: Missing .env credentials (SUPABASE_URL / SUPABASE_KEY)');
            return false;
        }

        try {
            this.isActive = true;
            console.log('[GHOST-SYNC] Authenticated with Cloud Matrix.');

            // Start the infinite sync loop (run every 15 seconds so we dont DDOS our own free tier)
            setInterval(() => {
                this.executeSyncCycle();
            }, 15000);

            return true;
        } catch (e) {
            console.error('[GHOST-SYNC] Initialization Error:', e.message);
            return false;
        }
    }

    async executeSyncCycle() {
        if (!this.isActive || !this.supabase) return;

        try {
            console.log('[GHOST-SYNC] Initiating Packet Transmission...');

            for (const table of this.syncTables) {
                // In a production scenario, we'd query using an 'updated_at' timestamp 
                // to uniquely push ONLY new changed rows to save bandwidth.
                // For the immediate pilot setup, we will execute a lightweight full-table upsert 
                // (Assuming pilot data is small enough to fit in a lightning-fast JSON payload).

                const localData = db.prepare(`SELECT * FROM ${table}`).all();
                console.log(`[GHOST-SYNC] Checking Table: ${table} (${localData.length} rows found local)`);

                if (localData.length > 0) {
                    const { data, error: syncError } = await this.supabase
                        .from(table)
                        .upsert(localData, { onConflict: 'id' });

                    if (syncError) {
                        console.error(`[GHOST-WATCHDOG] CLOUD REJECTION (${table}):`, syncError.message);
                        if (syncError.message.includes('JWT') || syncError.message.includes('API key')) {
                            console.error('[GHOST-WATCHDOG] ACTION REQUIRED: Your Supabase Key is INVALID. Please use the "anon" key starting with "eyJ"');
                        }
                    } else {
                        console.log(`[GHOST-WATCHDOG] Handover Data Verified: ${table}`);
                    }
                }
            }

            console.log('[GHOST-SYNC] Packet Transmission Complete.');
        } catch (e) {
            if (e.message.includes('fetch failed')) {
                if (!this.wasOffline) {
                    console.log('[GHOST-SYNC] Node Offline: Pausing cloud transmission until internet signal returns.');
                    this.wasOffline = true;
                }
            } else {
                console.error('[GHOST-SYNC] Sync Cycle Failure:', e.message);
                this.wasOffline = false;
            }
        }
    }
}

module.exports = new GhostSyncManager();

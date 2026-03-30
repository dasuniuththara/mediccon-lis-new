const { createClient } = require('@supabase/supabase-js');
const db = require('../database/db-config');
require('dotenv').config();

class GhostSyncManager {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_KEY;
        this.supabase = null;
        this.isActive = false;

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
            this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
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

                if (localData.length > 0) {
                    const { data, error } = await this.supabase
                        .from(table)
                        .upsert(localData, { onConflict: 'id' });

                    if (error) {
                        console.error(`[GHOST-SYNC] Table Sync Error (${table}):`, error.message);
                        if (error.cause) console.error(`[GHOST-SYNC] Cause:`, error.cause);
                    }
                }
            }

            console.log('[GHOST-SYNC] Packet Transmission Complete.');
        } catch (e) {
            console.error('[GHOST-SYNC] Sync Cycle Failure:', e.message);
        }
    }
}

module.exports = new GhostSyncManager();

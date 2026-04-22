const db = require('../database/db-config');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dotenv = require('dotenv');
const { app } = require('electron');

const logFile = path.join(process.cwd(), 'debug.log');
const log = (msg) => {
    const entry = `[${new Date().toISOString()}] [GHOST-SYNC] ${msg}\n`;
    try {
        fs.appendFileSync(logFile, entry);
    } catch (e) { }
    console.log(`[MATRIX-CORE] ${msg}`);
};

// Align .env loading with main.js architecture
const envPath = (app && app.isPackaged)
    ? path.join(process.resourcesPath, '.env')
    : path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

class GhostSyncManager {
    constructor() {
        this.localAuthToken = 'Medi@123';
        this.relayUrl = 'https://web-app-jet-three.vercel.app/api/sync-relay';
        this.supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tzosgkrljlljlgapzqpv.supabase.co';
        this.supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || '';
        this.supabase = null;

        if (!this.supabaseKey) {
            log('⚠️ WARNING: SUPABASE_KEY is missing. Direct Cloud Push will be disabled.');
        }

        this.isActive = false;
        this.isSyncing = false;
        this.syncTables = [
            'users', 'patients', 'patient_tests', 'lab_visits', 'invoices',
            'results', 'referring_doctors', 'inventory', 'procurement_orders',
            'machines', 'test_catalog', 'system_settings', 'pending_orders'
        ];

        // 🧠 AUTO-DETECT LOCAL IP
        this.localIp = this.getInternalIp();
        this.localTargetUrl = `http://${this.localIp}:8080/api/sync-relay`;
        log(`AUTO-DETECT: Running on ${this.localIp}. Sync Target: ${this.localTargetUrl}`);
    }

    getInternalIp() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    }

    async initSupabase() {
        try {
            const { createClient } = require('@supabase/supabase-js');
            if (this.supabaseUrl && this.supabaseKey) {
                this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
                log('Direct Supabase Link Established.');
            }
        } catch (e) { }
    }

    initialize() {
        this.isActive = true;
        log('Automatic Sync Engine Initialized (30s Interval).');
        this.initSupabase();
        setInterval(() => this.executeSyncCycle(), 30000);
        setTimeout(() => this.executeSyncCycle(), 5000);
        return true;
    }

    async executeSyncCycle() {
        if (!this.isActive || this.isSyncing) return;
        this.isSyncing = true;

        // Refresh IP in case it changed
        this.localIp = this.getInternalIp();
        this.localTargetUrl = `http://${this.localIp}:8080/api/sync-relay`;

        try {
            log(`Initiating Transmission to ${this.localIp}...`);
            const row = db.prepare("SELECT value FROM system_settings WHERE key = 'facility_id'").get();
            const nodeId = row ? row.value : 'NODE-UNNAMED';

            for (const table of this.syncTables) {
                try {
                    const localData = db.prepare(`SELECT * FROM ${table}`).all();
                    if (localData.length === 0) continue;

                    // --- SMART DEDUPLICATION ---
                    const uniqueMap = new Map();
                    localData.forEach(item => {
                        const key = item.id || item.nic || JSON.stringify(item);
                        uniqueMap.set(key, item);
                    });
                    const deduplicatedData = Array.from(uniqueMap.values());

                    // We keep raw data for Vercel and stamped data for direct Vault
                    const stampedData = deduplicatedData.map(r => ({ ...r, node_id: nodeId }));

                    // --- ATTEMPT 0: DYNAMIC LAN PUSH ---
                    try {
                        await fetch(this.localTargetUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.localAuthToken}`
                            },
                            body: JSON.stringify({ table, data: deduplicatedData }),
                            signal: AbortSignal.timeout(5000)
                        });
                    } catch (lanErr) { }

                    // --- ATTEMPT 1: VERCEL RELAY (Cloud Dashboard) ---
                    // Splitting into small packets (50) to solve 'Status 413' and 'Status 500' timeouts
                    let relaySuccess = true;
                    const packetSize = 50;

                    for (let i = 0; i < deduplicatedData.length; i += packetSize) {
                        // Data Translation Layer: Ensure every record has a conflict-safe identifier
                        const nodeNumericPrefix = parseInt(nodeId.split('-')?.pop()?.substring(0, 3) || '1', 16);
                        const translationPacket = deduplicatedData.slice(i, i + packetSize).map(row => {
                            const newRow = { ...row, node_id: nodeId };
                            if (table === 'patients' && row.nic) newRow.id = row.nic;
                            else if (table === 'test_catalog' && row.code) newRow.id = row.code;
                            else if (table === 'system_settings' && row.key) newRow.id = row.key;
                            else if (table === 'referring_doctors' && row.code) newRow.id = row.code;

                            if (typeof row.id === 'number') {
                                newRow.id = (nodeNumericPrefix * 1000000) + row.id;
                            }
                            return newRow;
                        });

                        try {
                            const response = await fetch(this.relayUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ table, data: translationPacket }),
                                signal: AbortSignal.timeout(30000)
                            });

                            if (response.ok) {
                                log(`[CLOUD-PUSH] BATCH ${i / packetSize + 1} SUCCESS: ${table}`);
                            } else {
                                relaySuccess = false;
                                let errorData = 'Internal Node Error';
                                try {
                                    const json = await response.json();
                                    errorData = json.error || json.message || JSON.stringify(json);
                                } catch (e) { }
                                log(`[CLOUD-PUSH] BATCH ${i / packetSize + 1} REJECTED: ${table} (Status: ${response.status}) -> ${errorData}`);
                            }
                        } catch (relayErr) {
                            relaySuccess = false;
                            log(`[CLOUD-PUSH] TRANSMISSION FAILED: ${table} (${relayErr.message})`);
                        }
                    }

                    // --- ATTEMPT 2: DIRECT VAULT PUSH (Fallback) ---
                    if (!relaySuccess && this.supabase) {
                        try {
                            const conflictKey = (table === 'patients') ? 'nic' : 'id';
                            for (let i = 0; i < stampedData.length; i += 100) {
                                const batch = stampedData.slice(i, i + 100);
                                if (batch.length === 0) continue;

                                let { error } = await this.supabase.from(table).upsert(batch, { onConflict: conflictKey });

                                if (error && (error.message.includes('column') || error.message.includes('not found'))) {
                                    log(`[VAULT-HEAL] Repairing ${table} schema mismatch...`);
                                    const colMatch = error.message.match(/column "([^"]+)"/);
                                    if (colMatch && colMatch[1]) {
                                        const fixed = batch.map(r => { const nr = { ...r }; delete nr[colMatch[1]]; return nr; });
                                        const { error: e2 } = await this.supabase.from(table).upsert(fixed, { onConflict: conflictKey });
                                        error = e2;
                                    }
                                }

                                if (error) {
                                    log(`[VAULT-PUSH] REJECTED: ${table} (${error.message})`);
                                } else {
                                    log(`[VAULT-PUSH] SUCCESS: ${table} (Batch ${Math.floor(i / 100) + 1})`);
                                }
                            }
                        } catch (supErr) {
                            log(`[VAULT-PUSH] CRITICAL ERROR: ${table} (${supErr.message})`);
                        }
                    }
                } catch (tableErr) { }
            }
            log('🛰️ Global Sync Cycle Complete.');
        } catch (e) {
            log('❌ Core Sync Failure: ' + e.message);
        } finally {
            this.isSyncing = false;
        }
    }
}

module.exports = new GhostSyncManager();

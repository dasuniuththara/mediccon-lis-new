/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  MEDICCON LIS — WEB COMMAND SERVER                                      ║
 * ║  Standalone API gateway that links directly to mediccon_lis.db           ║
 * ║  and serves the web dashboard from /dist (production) or proxy (dev).   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import express from 'express';
// --- DATABASE BYPASS FOR VERCEL STABILITY ---
import cors from 'cors';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// --- CLOUD MATRIX SYNC ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://tzosgkrljljlgapzqpv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
    console.log('[WEB-CLOUD] 🌐 Cloud Matrix Link Active');
} else {
    console.warn('[WEB-CLOUD] ⚠️ Supabase Credentials incomplete.');
    console.warn('- URL:', supabaseUrl ? 'FOUND' : 'MISSING');
    console.warn('- KEY:', supabaseKey ? 'FOUND' : 'MISSING');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

console.log('[RELAY-MODE] 🌐 Neural Cloud Link Active (Vercel Node)');

let lastSyncPacket = { table: 'none', timestamp: null, count: 0 };

// ─── HELPER: SHA-256 (matches desktop login) ───────────────────────────────
const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd).digest('hex');

// ─── API: LOGIN ─────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const serverSideHash = hashPassword(password);

        // 1. Attempt Cloud Authentication (Supabase)
        if (supabase) {
            const { data: cloudUser, error: cloudError } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password', serverSideHash)
                .single();

            if (cloudUser && !cloudError) {
                const { password, ...safeUser } = cloudUser;
                return res.json({ data: safeUser, error: null });
            }
        }

        // 2. Fallback to Local SQL (Developer/Debug Mode)
        const user = db.prepare(
            'SELECT * FROM users WHERE username COLLATE NOCASE = ? AND password = ?'
        ).get(username, serverSideHash);

        if (user) {
            const { password, ...safeUser } = user;
            res.json({ data: safeUser, error: null });
        } else {
            res.json({ data: null, error: 'Invalid Credentials. Authentication Rejected.' });
        }
    } catch (e) {
        console.error('[AUTH] Login fault:', e.message);
        res.status(500).json({ error: 'Internal Security Authentication Failure' });
    }
});

// ─── API: PATIENTS ──────────────────────────────────────────────────────────
app.get('/api/patients', async (req, res) => {
    try {
        const { nic } = req.query;

        if (supabase) {
            let query = supabase.from('patients').select('*');
            if (nic) query = query.eq('nic', nic.toUpperCase()).single();
            else query = query.order('created_at', { ascending: false }).limit(100);

            const { data, error } = await query;
            if (!error && (nic ? data : data.length > 0)) {
                return res.json({ data });
            }
        }

        // Local Fallback
        if (nic) {
            const pat = db.prepare('SELECT * FROM patients WHERE nic = ?').get(nic.toUpperCase());
            return res.json({ data: pat });
        }
        res.json({ data: db.prepare('SELECT * FROM patients ORDER BY created_at DESC LIMIT 100').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/patients', async (req, res) => {
    try {
        const { nic, name, age, age_type, gender, phone, title } = req.body;

        if (supabase) {
            await supabase.from('patients').upsert({
                nic: nic.toUpperCase(),
                name, age, age_type, gender, phone, title
            });
        }

        const exists = db.prepare('SELECT * FROM patients WHERE nic = ?').get(nic.toUpperCase());
        if (exists) {
            db.prepare('UPDATE patients SET name=?, age=?, age_type=?, gender=?, phone=?, title=? WHERE nic=?')
                .run(name, age, age_type, gender, phone, title, nic.toUpperCase());
        } else {
            db.prepare('INSERT INTO patients (nic, name, age, age_type, gender, phone, title) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .run(nic.toUpperCase(), name, age, age_type, gender, phone, title);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: RESULTS ───────────────────────────────────────────────────────────
app.get('/api/results', async (req, res) => {
    try {
        const { nic } = req.query;

        if (supabase) {
            let query = supabase.from('results').select('*');
            if (nic) query = query.eq('patient_nic', nic.toUpperCase()).eq('status', 'VALIDATED');
            else query = query.order('timestamp', { ascending: false }).limit(50);

            const { data, error } = await query;
            if (!error) return res.json({ data });
        }

        if (nic) {
            return res.json({
                data: db.prepare(
                    "SELECT * FROM results WHERE patient_nic = ? AND status = 'VALIDATED' ORDER BY timestamp DESC"
                ).all(nic.toUpperCase())
            });
        }
        res.json({ data: db.prepare('SELECT * FROM results ORDER BY timestamp DESC LIMIT 50').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: INVENTORY ─────────────────────────────────────────────────────────
app.get('/api/inventory', (req, res) => {
    try {
        res.json({ data: db.prepare('SELECT * FROM inventory ORDER BY quantity ASC').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: INVOICES ──────────────────────────────────────────────────────────
app.get('/api/invoices', (req, res) => {
    try {
        res.json({ data: db.prepare('SELECT total_amount, patient_nic, visit_id, status, created_at FROM invoices').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: LAB VISITS ────────────────────────────────────────────────────────
app.get('/api/visits', (req, res) => {
    try {
        const { nic } = req.query;
        if (nic) {
            return res.json({
                data: db.prepare('SELECT * FROM lab_visits WHERE patient_nic = ? ORDER BY created_at DESC').all(nic.toUpperCase())
            });
        }
        res.json({ data: db.prepare('SELECT * FROM lab_visits ORDER BY created_at DESC LIMIT 50').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/visits', (req, res) => {
    try {
        const { patient_nic, doctor_id, total_amount, discount, net_amount, tests } = req.body;
        const visit_id = `VIS-${Date.now()}`;

        db.transaction(() => {
            db.prepare('INSERT INTO lab_visits (visit_id, patient_nic, doctor_id, total_amount, net_amount, status) VALUES (?, ?, ?, ?, ?, ?)')
                .run(visit_id, patient_nic, doctor_id, total_amount, net_amount, 'PENDING');

            db.prepare('INSERT INTO invoices (visit_id, patient_nic, total_amount, discount, net_amount, status) VALUES (?, ?, ?, ?, ?, ?)')
                .run(visit_id, patient_nic, total_amount, discount, net_amount, 'UNPAID');

            const stmt = db.prepare('INSERT INTO patient_tests (visit_id, patient_nic, test_id, test_name, category, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
            tests.forEach(t => {
                stmt.run(visit_id, patient_nic, t.id, t.name, t.category, t.price, 'PENDING');
            });
        })();

        res.json({ success: true, visit_id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: PATIENT TESTS ────────────────────────────────────────────────────
app.get('/api/patient-tests', (req, res) => {
    try {
        const { visit_id, nic } = req.query;
        if (visit_id) {
            return res.json({ data: db.prepare('SELECT * FROM patient_tests WHERE visit_id = ?').all(visit_id) });
        }
        if (nic) {
            return res.json({ data: db.prepare('SELECT * FROM patient_tests WHERE patient_nic = ? ORDER BY created_at DESC').all(nic.toUpperCase()) });
        }
        res.json({ data: db.prepare('SELECT * FROM patient_tests ORDER BY created_at DESC LIMIT 100').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: MACHINES ──────────────────────────────────────────────────────────
app.get('/api/machines', (req, res) => {
    try {
        res.json({ data: db.prepare('SELECT * FROM machines').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: TEST CATALOG ──────────────────────────────────────────────────────
app.get('/api/test-catalog', (req, res) => {
    try {
        res.json({ data: db.prepare('SELECT * FROM test_catalog').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: NODES (Facility ID) ───────────────────────────────────────────────
app.get('/api/nodes', (req, res) => {
    try {
        const node = db.prepare("SELECT value FROM system_settings WHERE key = 'facility_id'").get();
        res.json({ data: [{ node_id: node ? node.value : 'NODE-UNKNOWN' }] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: FACILITIES (Registered Labs) ──────────────────────────────────────
app.get('/api/facilities', (req, res) => {
    try {
        res.json({ data: db.prepare('SELECT * FROM facilities ORDER BY name ASC').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/facilities', (req, res) => {
    try {
        const { id, name, type, location, user, pass } = req.body;
        const stmt = db.prepare('INSERT INTO facilities (id, name, type, location, security_user, security_pass) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(id, name, type, location, user, pass);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: SYSTEM SETTINGS ───────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM system_settings').all();
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json({ data: settings });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: REFERRING DOCTORS ─────────────────────────────────────────────────
app.get('/api/doctors', (req, res) => {
    try {
        res.json({ data: db.prepare('SELECT * FROM referring_doctors ORDER BY name ASC').all() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/doctors', (req, res) => {
    try {
        const { name, code } = req.body;
        db.prepare('INSERT INTO referring_doctors (name, code) VALUES (?, ?)').run(name, code);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: PROCUREMENT ───────────────────────────────────────────────────────
app.get('/api/procurement', (req, res) => {
    try {
        res.json({
            data: db.prepare(`
                SELECT po.*, i.name as item_name, i.category 
                FROM procurement_orders po 
                LEFT JOIN inventory i ON po.item_id = i.id 
                ORDER BY po.created_at DESC
            `).all()
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: CLOUD RELAY (FOR AUTOMATIC FIREWALL BYPASS SYNC) ───────────────────
app.post('/api/sync-relay', async (req, res) => {
    try {
        const { table, data } = req.body;
        if (!supabase) return res.status(503).json({ success: false, error: 'CLOUD_LINK_INACTIVE' });

        console.log(`[RELAY] 🛰️ Inbound Sync Packet: ${table} (${data?.length || 0} rows)`);
        lastSyncPacket = { table, timestamp: new Date().toISOString(), count: data?.length || 0 };

        if (data && data.length > 0) {
            // --- DYNAMIC CONFLICT KEY DETECTION ---
            let conflictKey = 'id';
            if (table === 'patients') conflictKey = 'nic';
            else if (table === 'test_catalog') conflictKey = 'code';
            else if (table === 'system_settings') conflictKey = 'key';
            else if (table === 'test_reference_ranges') conflictKey = 'id'; // or hash
            else if (table === 'referring_doctors') conflictKey = (data[0].code) ? 'code' : 'id';

            // Upsert in batches for reliability with Self-Healing Column Filtering
            const batchSize = 100;

            for (let i = 0; i < data.length; i += batchSize) {
                let batch = data.slice(i, i + batchSize);
                let { error: cloudError } = await supabase.from(table).upsert(batch, { onConflict: conflictKey });

                // --- SELF-HEALING: Auto-strip missing columns on failure ---
                if (cloudError && (cloudError.message.includes('column') || cloudError.message.includes('not found'))) {
                    const missingColMatch = cloudError.message.match(/column "([^"]+)"/);
                    if (missingColMatch) {
                        const colToDrop = missingColMatch[1];
                        batch = batch.map(row => {
                            const newRow = { ...row };
                            delete newRow[colToDrop];
                            return newRow;
                        });
                        const secondAttempt = await supabase.from(table).upsert(batch, { onConflict: conflictKey });
                        cloudError = secondAttempt.error;
                    }
                }

                if (cloudError) {
                    console.error(`[RELAY] Supabase upsert error for ${table}:`, cloudError.message);
                }
            }
        }

        // --- BI-DIRECTIONAL SIGNALING (Optional Bridge) ---
        let signals = [];
        try {
            const node_id = data?.[0]?.node_id || 'NODE-UNKNOWN';
            const { data: signalData } = await supabase
                .from('server_signals')
                .select('*')
                .eq('target_node', node_id)
                .eq('processed', false);
            signals = signalData || [];
        } catch (signalErr) {
            console.warn('[RELAY] Signal table inactive/missing. Skipping.');
        }

        res.json({
            success: true,
            table,
            count: data?.length || 0,
            signals: signals
        });
    } catch (e) {
        console.error(`[RELAY-FAULT] ❌ ${req.body?.table}:`, e.message);
        res.status(500).json({
            success: false,
            error: e.message,
            stack: (process.env.NODE_ENV !== 'production') ? e.stack : undefined,
            fault_vector: 'Supabase/Relay Bridge Crash'
        });
    }
});

// ─── API: SYNC STATUS (Desktop Heartbeat Verification) ───────────────────────
app.get('/api/sync-status', (req, res) => {
    res.json({
        success: true,
        relay: 'ACTIVE',
        cloud: !!supabase,
        last_sync: lastSyncPacket,
        timestamp: new Date().toISOString()
    });
});

// ─── API: NEURAL DIAGNOSTICS (AI LAYER) ──────────────────────────────────────
app.get('/api/intelligence/anomalies', async (req, res) => {
    try {
        if (!supabase) throw new Error('Cloud Link Inactive');

        // AI Logic: Detect abnormally high indices across recent data
        const { data: results } = await supabase.from('results').select('*').limit(200);
        const anomalies = results?.filter(r => {
            const val = parseFloat(r.test_value);
            return val > 200 || val < 0.5; // Example logic for critical flagging
        }).map(a => ({ ...a, ai_insight: "Critical Index Detected: Immediate Validation Suggested" }));

        res.json({ data: anomalies });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API: SYSTEM STATUS (HEARTBEAT) ──────────────────────────────────────────
app.get('/api/status', (req, res) => {
    res.json({
        online: true,
        cloud: !!supabase,
        last_sync: lastSyncPacket,
        relay: 'ACTIVE',
        cloud_endpoint: 'https://tzosgkrljljlgapzqpv.supabase.co',
        timestamp: new Date().toISOString()
    });
});

// ─── API: DASHBOARD STATS ───────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
    try {
        if (!db) return res.json({ data: { patients_today: 0, results_today: 0, pending_results: 0, revenue_today: 0, low_stock_alerts: 0 } });

        const today = new Date().toISOString().split('T')[0];
        const patients = db.prepare("SELECT COUNT(*) as count FROM patients WHERE date(created_at) = ?").get(today);
        const results = db.prepare("SELECT COUNT(*) as count FROM results WHERE date(timestamp) = ?").get(today);
        const pending = db.prepare("SELECT COUNT(*) as count FROM results WHERE status = 'PENDING'").get();
        const revenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE date(created_at) = ?").get(today);
        const lowStock = db.prepare("SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_threshold").get();

        res.json({
            data: {
                patients_today: patients.count,
                results_today: results.count,
                pending_results: pending.count,
                revenue_today: revenue.total,
                low_stock_alerts: lowStock.count
            }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SERVE STATIC BUILD (PRODUCTION) ────────────────────────────────────────
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(join(distPath, 'index.html'));
        }
    });
    console.log('[WEB] 📦 Serving production build from /dist');
}

// ─── START SERVER ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  MEDICCON LIS — Web Command Server                      ║');
    console.log(`║  ✅ API Active on Port: ${PORT}                            ║`);
    console.log(`║  🔗 Deployment: Cloud Relay Active                       ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
});

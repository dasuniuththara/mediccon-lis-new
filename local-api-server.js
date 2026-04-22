const http = require('http');
const db = require('./src/main/database/db-config');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const respondInfo = (data) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    const respondError = (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || err.toString() }));
    };

    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                const user = db.prepare('SELECT * FROM users WHERE username COLLATE NOCASE = ? AND password = ?').get(username, password);
                if (user) {
                    respondInfo({ data: user, error: null });
                } else {
                    respondInfo({ data: null, error: 'Invalid Credentials.' });
                }
            } catch (e) { respondError(e); }
        });
        return;
    }

    // 🔄 PEER SYNC RELAY (Duplicate Protection Engine)
    if (req.url === '/api/sync-relay' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { table, data } = JSON.parse(body);
                if (!table || !data) return respondError("MISSING_PAYLOAD");

                const records = Array.isArray(data) ? data : [data];
                const columns = Object.keys(records[0]);
                const placeholders = columns.map(() => '?').join(', ');
                const colString = columns.join(', ');

                const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${colString}) VALUES (${placeholders})`);

                const syncTransaction = db.transaction((items) => {
                    for (const item of items) {
                        const values = columns.map(col => item[col]);
                        stmt.run(...values);
                    }
                });

                syncTransaction(records);
                console.log(`[SYNC-RELAY] Merged ${records.length} records into ${table}`);
                respondInfo({ success: true, merged: records.length });
            } catch (e) { respondError(e); }
        });
        return;
    }

    if (req.method === 'GET') {
        try {
            if (req.url.startsWith('/api/patients')) {
                const url = new URL(req.url, 'http://localhost');
                const nic = url.searchParams.get('nic');
                if (nic) {
                    const pat = db.prepare('SELECT * FROM patients WHERE nic = ?').get(nic.toUpperCase());
                    return respondInfo({ data: pat });
                }
                return respondInfo({ data: db.prepare('SELECT * FROM patients LIMIT 50').all() });
            }
            if (req.url.startsWith('/api/results')) {
                const url = new URL(req.url, 'http://localhost');
                const nic = url.searchParams.get('nic');
                if (nic) {
                    return respondInfo({ data: db.prepare("SELECT * FROM results WHERE patient_nic = ? AND status = 'VALIDATED' ORDER BY timestamp DESC").all(nic.toUpperCase()) });
                }
                return respondInfo({ data: db.prepare('SELECT * FROM results ORDER BY timestamp DESC LIMIT 20').all() });
            }
            if (req.url === '/api/inventory') return respondInfo({ data: db.prepare('SELECT * FROM inventory ORDER BY quantity ASC').all() });
            if (req.url === '/api/invoices') return respondInfo({ data: db.prepare('SELECT total_amount FROM invoices').all() });
            if (req.url === '/api/nodes') {
                const node = db.prepare("SELECT value FROM system_settings WHERE key = 'facility_id'").get();
                return respondInfo({ data: [{ node_id: node ? node.value : 'NODE-UNKNOWN' }] });
            }
            res.writeHead(404);
            return res.end();
        } catch (e) { respondError(e); }
    }
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.warn('[API] ⚠️ Port 8080 is already in use by another Ghost Node. Local Proxy Hub will wait for release.');
    } else {
        console.error('[API] ❌ Critical Transport Error:', e);
    }
});

try {
    server.listen(8080, () => {
        console.log('[API] ☁️ Local Cloud Matrix Mock active on HTTP port 8080');
    });
} catch (e) {
    console.error('[API] ❌ Severe Startup Fault:', e.message);
}

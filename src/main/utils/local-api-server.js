/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  MEDICCON LIS — LOCAL API SERVER                             ║
 * ║  Protected with Security Token: Medi@123                      ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const db = require('../database/db-config');

const PORT = 8080;
const AUTH_TOKEN = 'Medi@123'; // User-provided security credential
let server = null;

const logFile = path.join(process.cwd(), 'debug.log');
const log = (msg) => {
    const entry = `[${new Date().toISOString()}] [LOCAL-API] ${msg}\n`;
    try {
        fs.appendFileSync(logFile, entry);
    } catch (e) { }
    console.log(`[LOCAL-API] ${msg}`);
};

// Generic Upsert Engine for Inbound Sync
function upsertSyncData(table, data) {
    if (!data || !data.length) return 0;
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
    if (!tableCheck) return 0;

    const colInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const colNames = colInfo.map(c => c.name);
    const placeholders = colNames.map(() => '?').join(',');
    const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${colNames.join(',')}) VALUES (${placeholders})`);

    let count = 0;
    const transaction = db.transaction((rows) => {
        for (const row of rows) {
            // Filter row to only include columns that exist in the local table
            const rowColumns = Object.keys(row).filter(col => colNames.includes(col));
            const rowPlaceholders = rowColumns.map(() => '?').join(',');
            const rowStmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${rowColumns.join(',')}) VALUES (${rowPlaceholders})`);

            const values = rowColumns.map(col => row[col] !== undefined ? row[col] : null);
            rowStmt.run(...values);
            count++;
        }
    });

    try {
        transaction(data);
        return count;
    } catch (err) {
        log(`Upsert Failed (${table}): ${err.message}`);
        return 0;
    }
}

const jsonResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
};

const parseBody = (req) => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); }
        catch (e) { resolve({}); }
    });
});

const routes = {
    'GET /': () => ({
        status: 'ONLINE',
        node: 'LAN-GATEWAY-41',
        security: 'ACTIVE',
        endpoints: ['/api/patients', '/api/results', '/api/status']
    }),
    'GET /api/status': () => ({ online: true, node: 'LAN-GATEWAY-41', secure: true }),
    'GET /api/patients': () => ({ data: db.prepare(`SELECT * FROM patients ORDER BY created_at DESC LIMIT 200`).all() }),
    'GET /api/results': () => ({ data: db.prepare('SELECT * FROM results ORDER BY timestamp DESC LIMIT 200').all() }),
    'POST /api/sync-relay': async (req) => {
        const body = await parseBody(req);
        const { table, data } = body;
        if (!table || !data) return { success: false, error: 'Malformed payload' };
        const merged = upsertSyncData(table, data);
        log(`Peer Sync: ${table} (${merged} records merged)`);
        return { success: true, table, merged };
    }
};

function startServer() {
    if (server) return;

    server = http.createServer(async (req, res) => {
        // Allow CORS preflight always
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end();
            return;
        }

        // --- SECURITY LAYER ---
        const authHeader = req.headers['authorization'];
        const isAuthed = authHeader === `Bearer ${AUTH_TOKEN}` || authHeader === AUTH_TOKEN;

        // Root path is always public for status checks
        if (req.url !== '/' && !isAuthed) {
            log(`Blocked Unauthorized Access Attempt from ${req.socket.remoteAddress}`);
            jsonResponse(res, 401, { error: 'Unauthorized. Security Token Required.' });
            return;
        }

        const parsedUrl = url.parse(req.url, true);
        const routeKey = `${req.method} ${parsedUrl.pathname}`;

        try {
            const handler = routes[routeKey] || routes['GET /'];
            const result = await handler(req, parsedUrl);
            jsonResponse(res, 200, result);
        } catch (err) {
            log(`Server Error: ${err.message}`);
            jsonResponse(res, 500, { error: err.message });
        }
    });

    server.listen(PORT, '0.0.0.0', () => {
        log(`================================================`);
        log(`  SECURE LIS SERVER ACTIVE: http://0.0.0.0:8080`);
        log(`  Security Token: ${AUTH_TOKEN}`);
        log(`================================================`);
    });
}

function stopServer() {
    if (server) {
        server.close();
        server = null;
    }
}

module.exports = { startServer, stopServer };

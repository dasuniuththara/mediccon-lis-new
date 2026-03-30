const db = require('../database/db-config');
const mappingDict = require('../config/ms480-mapping');

function deployMS480() {
    try {
        const id = 'MCN-MS480';
        
        // 1. Inject the Machine Node
        const existing = db.prepare('SELECT id FROM machines WHERE id = ?').get(id);
        if (!existing) {
            db.prepare(`
                INSERT INTO machines (id, name, type, category, connection_type, com_port, port, baud_rate, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Offline')
            `).run(id, 'MS-480 Auto Analyzer', 'MS-480', 'Biochemistry', 'Ethernet', null, 5000, null);
            console.log('[Auto-Seed] MS-480 TCP Node successfully injected.');
        }

        // 2. Inject the Protocol Mappings
        const insertMapping = db.prepare(`
            INSERT INTO test_mappings (machine_id, machine_code, lis_name, unit) 
            VALUES (?, ?, ?, '') 
            ON CONFLICT(machine_id, machine_code) DO NOTHING
        `);

        db.transaction(() => {
            let mappedCount = 0;
            for (const [analyzerCode, lisName] of Object.entries(mappingDict)) {
                const res = insertMapping.run(id, analyzerCode, lisName);
                if (res.changes > 0) mappedCount++;
            }
            if (mappedCount > 0) {
                console.log(`[Auto-Seed] ${mappedCount} diagnostic parameters mapped for MS-480.`);
            }
        })();

    } catch (e) {
        console.error('[Auto-Seed] Failed to securely inject MS-480:', e.message);
    }
}

module.exports = { deployMS480 };

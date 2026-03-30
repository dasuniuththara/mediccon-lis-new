const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath);
    process.exit(1);
}

const db = new Database(dbPath);

async function runIntegrityCheck() {
    console.log('--- Mediccon LIS Integrity Check ---');

    // 1. Check Machines
    const machines = db.prepare('SELECT id, name, type, category FROM machines').all();
    console.log(`\n[Machines] Found ${machines.length} configured analyzers:`);
    machines.forEach(m => console.log(` - ${m.name} (${m.type}) [${m.category}]`));

    // 2. Check Test Catalog
    const catalogCount = db.prepare('SELECT COUNT(*) as count FROM test_catalog').get().count;
    const mappedCatalogCount = db.prepare('SELECT COUNT(*) as count FROM test_catalog WHERE analyzer_code IS NOT NULL').get().count;
    console.log(`\n[Catalog] ${catalogCount} total tests, ${mappedCatalogCount} mapped to analyzer codes.`);

    // 3. Verify specific mappings
    const samples = [
        { code: 'GLU ', machine: 'DIALAB-01' },
        { code: 'ALB', machine: 'MCN-SEL-01' },
        { code: '9', machine: 'MCN-MISPA-01' }
    ];

    console.log('\n[Mapping Logic Test]');
    samples.forEach(s => {
        // Simple manual implementation of getMappedTestName for verification
        const mapping = db.prepare('SELECT lis_name FROM test_mappings WHERE machine_id = ? AND machine_code = ?').get(s.machine, s.code);
        let result = mapping ? mapping.lis_name : null;

        if (!result) {
            const catalog = db.prepare('SELECT name FROM test_catalog WHERE analyzer_code = ?').get(s.code);
            result = catalog ? catalog.name : s.code;
        }

        console.log(` - Machine: ${s.machine}, Raw Code: "${s.code}" -> Resolved: "${result}"`);
    });

    // 4. Inventory Linkage
    console.log('\n[Inventory Linkage]');
    const reagents = db.prepare('SELECT * FROM inventory').all();
    console.log(` - Found ${reagents.length} inventory items.`);

    const reagentMappings = db.prepare('SELECT tm.*, catalog.name as test_name FROM test_reagents tm JOIN test_catalog catalog ON tm.test_code = catalog.code').all();
    console.log(` - Found ${reagentMappings.length} test-reagent mappings:`);
    reagentMappings.forEach(rm => {
        console.log(`   * Test [${rm.test_code}] uses ${rm.usage_amount} of Reagent [ID: ${rm.item_id}]`);
    });

    db.close();
}

runIntegrityCheck();

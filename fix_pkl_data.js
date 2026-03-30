const Database = require('better-sqlite3');
const db = new Database('./mediccon_lis.db');
const { pklMappings } = require('./src/main/config/pkl-mapping');

try {
    console.log('--- DIAGNOSTICS START ---');

    // 1. Check current counts
    const countTotal = db.prepare("SELECT COUNT(*) as c FROM test_catalog").get().c;
    const countWithAnalyzer = db.prepare("SELECT COUNT(*) as c FROM test_catalog WHERE analyzer_code IS NOT NULL").get().c;
    const countBio = db.prepare("SELECT COUNT(*) as c FROM test_catalog WHERE category = 'Biochemistry' AND analyzer_code IS NOT NULL").get().c;

    console.log(`Total Tests: ${countTotal}`);
    console.log(`Tests with analyzer_code: ${countWithAnalyzer}`);
    console.log(`Biochemistry Tests with analyzer_code: ${countBio}`);

    // 2. Dump unique categories
    const categories = db.prepare("SELECT DISTINCT category FROM test_catalog").all();
    console.log('Categories found:', categories.map(c => c.category));

    // 3. FORCE SEED
    console.log('--- FORCE SEEDING PKL ---');

    // Ensure column exists
    try {
        db.exec("ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT");
        console.log("Added analyzer_code column");
    } catch (e) { }

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO test_catalog (code, name, category, price, analyzer_code)
        VALUES (?, ?, ?, ?, ?)
    `);

    let seeded = 0;
    const updateStmt = db.prepare("UPDATE test_catalog SET analyzer_code = ? WHERE code = ?");

    Object.entries(pklMappings).forEach(([code, mapping]) => {
        // Try direct insert first
        try {
            stmt.run(code, mapping.name, mapping.category, 0, mapping.analyzerCode);
            seeded++;
        } catch (e) {
            console.error(`Failed to insert ${code}:`, e.message);
        }
    });

    console.log(`Seeded ${seeded} tests.`);

    // 4. Verify again
    const newCountBio = db.prepare("SELECT COUNT(*) as c FROM test_catalog WHERE category = 'Biochemistry' AND analyzer_code IS NOT NULL").get().c;
    console.log(`New Biochemistry count: ${newCountBio}`);

    if (newCountBio > 0) {
        // Test the exact query used in MachineConfigManager
        const verifyQuery = "SELECT code as id, analyzer_code as machine_code, name as lis_name, unit, 'global' as source FROM test_catalog WHERE analyzer_code IS NOT NULL AND category = 'Biochemistry'";
        const results = db.prepare(verifyQuery).all();
        console.log(`Verification Query returned ${results.length} rows.`);
        if (results.length > 0) {
            console.log('Sample row:', results[0]);
        }
    }

    console.log('--- DIAGNOSTICS END ---');

} catch (e) {
    console.error('CRITICAL ERROR:', e);
}

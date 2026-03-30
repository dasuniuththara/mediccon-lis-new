/**
 * iFlash 1200 Setup Script
 * Seeds test catalog with iFlash test mappings
 */

const db = require('./src/main/database/db-config');
const { seedIFlashTests } = require('./src/main/config/iflash-test-mapping');

console.log('='.repeat(60));
console.log('iFlash 1200 Setup - Test Catalog Seeding');
console.log('='.repeat(60));

try {
    // Ensure test_catalog table has analyzer_code column
    try {
        db.exec(`ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT`);
        console.log('✓ Added analyzer_code column to test_catalog');
    } catch (e) {
        // Column might already exist
        console.log('✓ analyzer_code column already exists');
    }

    // Seed iFlash tests
    seedIFlashTests(db);
    console.log('✓ Successfully seeded iFlash 1200 test mappings');

    // Display sample tests
    console.log('\n' + '='.repeat(60));
    console.log('Sample Test Mappings:');
    console.log('='.repeat(60));

    const sampleTests = db.prepare(`
        SELECT code, name, category, analyzer_code 
        FROM test_catalog 
        WHERE category = 'Hormone'
        LIMIT 10
    `).all();

    sampleTests.forEach(test => {
        console.log(`${test.code.padEnd(15)} → ${test.analyzer_code.padEnd(15)} | ${test.name}`);
    });

    console.log('\n✅ iFlash 1200 setup complete!');
    console.log('Total tests configured:', db.prepare('SELECT COUNT(*) as count FROM test_catalog WHERE category = "Hormone"').get().count);

} catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
}

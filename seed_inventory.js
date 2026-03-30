const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('database.sqlite');

try {
    console.log('[Seeding] Starting Inventory & Reagent Seeding...');

    // 1. Seed Inventory Items
    const insertInventory = db.prepare(`INSERT OR IGNORE INTO inventory (name, category, unit, quantity, min_threshold, machine_id) VALUES (?, ?, ?, ?, ?, ?)`);

    const defaultInventory = [
        { name: 'Glucose Reagent (Bioc)', category: 'Biochemistry', unit: 'ml', qty: 500, min: 100, machine: 'DIALAB-01' },
        { name: 'Cholesterol Reagent', category: 'Biochemistry', unit: 'ml', qty: 250, min: 50, machine: 'DIALAB-01' },
        { name: 'Hematology Diluent (20L)', category: 'Hematology', unit: 'Bottle', qty: 2, min: 1, machine: 'MCN-MISPA-01' },
        { name: 'Hematology Lyse (500ml)', category: 'Hematology', unit: 'Bottle', qty: 5, min: 2, machine: 'MCN-MISPA-01' },
        { name: 'ISE Na Calibrator', category: 'Electrolyte', unit: 'ml', qty: 100, min: 20, machine: 'MCN-ELE-01' },
        { name: 'ISE K Calibrator', category: 'Electrolyte', unit: 'ml', qty: 100, min: 20, machine: 'MCN-ELE-01' }
    ];

    defaultInventory.forEach(item => insertInventory.run(item.name, item.category, item.unit, item.qty, item.min, item.machine));
    console.log(' - Inventory items seeded.');

    // 2. Seed Reagent Usage (Usage amounts per test)
    const insertUsage = db.prepare(`INSERT OR IGNORE INTO test_reagents (test_code, item_id, usage_amount) VALUES (?, ?, ?)`);

    // Get IDs
    const glucoseId = db.prepare("SELECT id FROM inventory WHERE name LIKE 'Glucose%'").get().id;
    const cholesterolId = db.prepare("SELECT id FROM inventory WHERE name LIKE 'Cholesterol%'").get().id;
    const diluentId = db.prepare("SELECT id FROM inventory WHERE name LIKE '%Diluent%'").get().id;
    const lyseId = db.prepare("SELECT id FROM inventory WHERE name LIKE '%Lyse%'").get().id;

    // Biochemistry Mappings (Link to LIS Code)
    insertUsage.run('FBS', glucoseId, 1.0);
    insertUsage.run('GLU', glucoseId, 1.0);
    insertUsage.run('CHOL', cholesterolId, 1.0);

    // Hematology Mappings (Full Blood Count)
    insertUsage.run('FBC', diluentId, 0.05);
    insertUsage.run('FBC', lyseId, 0.02);

    // Also link common machine codes just in case
    insertUsage.run('9', diluentId, 0.05); // WBC for Mispa
    insertUsage.run('10', diluentId, 0.01); // RBC
    insertUsage.run('11', diluentId, 0.01); // PLT

    console.log(' - Reagent usage mappings seeded.');
    console.log('[Success] Seeding complete.');

} catch (e) {
    console.error('[Error] Seeding failed:', e.message);
} finally {
    db.close();
}

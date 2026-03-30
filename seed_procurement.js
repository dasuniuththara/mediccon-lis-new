const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'mediccon-lis', 'mediccon_v2.db');
const db = new Database(dbPath);

console.log('Seeding Procurement & Supply Chain Data...');

// 1. Ensure some inventory items exist
const items = [
    { name: 'Roche Cobas c501 Reagent Pack', category: 'Reagent', unit: 'Pack', qty: 5, threshold: 10, machine: 'ROCHE-C501', barcode: 'RCH-001' },
    { name: 'Sysmex XN-1000 Cellpack DCL', category: 'Reagent', unit: 'Litre', qty: 2, threshold: 5, machine: 'SYSMEX-XN1000', barcode: 'SYX-001' },
    { name: 'Mindray BC-6800 Diluent', category: 'Reagent', unit: 'Crate', qty: 15, threshold: 5, machine: 'MINDRAY-BC6800', barcode: 'MND-001' },
    { name: 'Vitros 5600 MicroSlide', category: 'Reagent', unit: 'Cartridge', qty: 1, threshold: 3, machine: 'VITROS-5600', barcode: 'VTR-001' },
    { name: 'Mispa Count X Lyse', category: 'Reagent', unit: 'Bottle', qty: 8, threshold: 10, machine: 'MISPA-CX', barcode: 'MSP-001' }
];

const insertItem = db.prepare(`
    INSERT OR REPLACE INTO inventory (name, category, unit, quantity, min_threshold, machine_id, barcode)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

items.forEach(i => insertItem.run(i.name, i.category, i.unit, i.qty, i.threshold, i.machine, i.barcode));

// 2. Clear old orders and add fresh ones
db.prepare('DELETE FROM procurement_orders').run();

const insertOrder = db.prepare(`
    INSERT INTO procurement_orders (item_id, quantity, unit, priority, status, generated_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const inventory = db.prepare('SELECT id, name, unit FROM inventory').all();

// Add pending/ordered data
inventory.forEach((item, idx) => {
    const status = idx === 0 ? 'PENDING' : idx === 1 ? 'ORDERED' : 'RECEIVED';
    const priority = idx === 0 ? 'CRITICAL' : 'NORMAL';
    const date = new Date();
    date.setDate(date.getDate() - (idx * 2));

    insertOrder.run(
        item.id,
        idx === 0 ? 50 : 20,
        item.unit,
        priority,
        status,
        idx % 2 === 0 ? 'AI_AUTO_PILOT' : 'DEVELOPER',
        date.toISOString()
    );

    // If received, add a transaction
    if (status === 'RECEIVED') {
        db.prepare(`
            INSERT INTO inventory_transactions (item_id, type, quantity, reason, processed_by, timestamp)
            VALUES (?, 'IN', 20, 'Procurement Restock', 'System', ?)
        `).run(item.id, date.toISOString());
    }
});

console.log('Supply Chain Matrix Synchronized Successfully.');
db.close();

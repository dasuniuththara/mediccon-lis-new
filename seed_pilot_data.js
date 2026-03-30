const Database = require('better-sqlite3');
const db = new Database('mediccon_lis.db');

const machineIds = [
    'MCN-ROCHE-01', 'MCN-SYSMEX-01', 'MCN-MINDRAY-01', 'MCN-ORTHO-01',
    'MCN-SEL-01', 'MCN-MISPA-01', 'MCN-IFLASH-01'
];

const insertResult = db.prepare(`
    INSERT INTO results (patient_nic, visit_id, machine_id, test_code, test_name, test_value, unit, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'VALIDATED', ?)
`);

// Mock 50 results across different machines and dates
for (let i = 0; i < 50; i++) {
    const mId = machineIds[Math.floor(Math.random() * machineIds.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 5)); // past 5 days
    const ts = date.toISOString();

    insertResult.run(
        'V' + Math.floor(Math.random() * 900000 + 100000),
        Math.floor(Math.random() * 100),
        mId,
        'GLU',
        'Glucose',
        (Math.random() * 100 + 70).toFixed(1),
        'mg/dL',
        ts
    );
}

console.log("Seeded 50 mock results across the pilot fleet.");
db.close();

const Database = require('better-sqlite3');
const db = new Database('mediccon_lis.db');

const nic = 'STRESS-MAX-777';
const testName = 'Glucose Fasting (FBS)';
const testCode = 'FBS';

console.log(`[STRESS-TEST] Starting clinical trajectory simulation for ${nic}...`);

// 1. Cleanup existing nodes
db.prepare('DELETE FROM results WHERE patient_nic = ?').run(nic);
db.prepare('DELETE FROM patient_tests WHERE patient_nic = ?').run(nic);
db.prepare('DELETE FROM lab_visits WHERE patient_nic = ?').run(nic);
db.prepare('DELETE FROM patients WHERE nic = ?').run(nic);

// 2. Initialize Master Subject Identity
db.prepare(`
    INSERT INTO patients (nic, name, age, gender, phone, registered_by)
    VALUES (?, 'Stress Test Subject Omega', 45, 'Male', '0770000000', 'AI_STRESS_NODE')
`).run(nic);

// 3. Generate Sequential Visit Clusters (10 iterations)
for (let i = 1; i <= 10; i++) {
    const offsetDays = i - 10; // Generate data points over the last 10 days
    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() + offsetDays);
    const dateStr = visitDate.toISOString().split('T')[0];
    const timeStr = visitDate.toISOString();

    // Create Visit Node
    const visitResult = db.prepare(`
        INSERT INTO lab_visits (patient_nic, registered_by, visit_date, created_at)
        VALUES (?, 'AI_STRESS_NODE', ?, ?)
    `).run(nic, dateStr, timeStr);
    
    const visitId = visitResult.lastInsertRowid;

    // Create Order Node
    db.prepare(`
        INSERT INTO patient_tests (patient_nic, visit_id, test_code, test_name, status)
        VALUES (?, ?, 'FBS', ?, 'VALIDATED')
    `).run(nic, visitId, testName);

    // Create Result Node (Simulating varying clinical trajectory)
    // Value starts high (Diabetic range) and gradually stabilizes
    const baseValue = 180 - (i * 8); 
    const testValue = (baseValue + Math.random() * 5).toFixed(1);

    db.prepare(`
        INSERT INTO results (patient_nic, visit_id, machine_id, test_name, test_code, test_value, unit, ref_range, status, timestamp)
        VALUES (?, ?, 'MCN-SEL-01', ?, 'FBS', ?, 'mg/dL', '70 - 110', 'VALIDATED', ?)
    `).run(nic, visitId, testName, testValue, timeStr);

    console.log(`[STRESS-TEST] Visit Node ${i} initialized: Value=${testValue} mg/dL [Date: ${dateStr}]`);
}

console.log(`[STRESS-TEST] Trajectory simulation satisfied. 10 visit-sequential data points injected.`);
db.close();

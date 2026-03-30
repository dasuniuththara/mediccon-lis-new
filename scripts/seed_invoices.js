// Seed script to create sample invoices for testing
// Run with: node scripts/seed_invoices.js
const path = require('path');
const { app } = require('electron');
// Use the same DB connection as PatientRepo
const dbPath = path.resolve(__dirname, '../src/main/database/mediccon.db');
const Database = require('better-sqlite3');
const db = new Database(dbPath);

function createSampleInvoice(data) {
  const stmt = db.prepare(`INSERT INTO invoices (patient_nic, visit_id, total_amount, discount, paid_amount, status)
    VALUES (?, ?, ?, ?, ?, ?)`);
  stmt.run(data.patient_nic, data.visit_id, data.total_amount, data.discount, data.paid_amount, data.status);
}

// Sample data
const sampleInvoices = [
  { patient_nic: '123456789V', visit_id: 1, total_amount: 5000, discount: 0, paid_amount: 0, status: 'PENDING' },
  { patient_nic: '987654321V', visit_id: 2, total_amount: 12000, discount: 500, paid_amount: 12000, status: 'PAID' },
  { patient_nic: '555555555V', visit_id: 3, total_amount: 8000, discount: 0, paid_amount: 4000, status: 'PARTIAL' },
];

console.log('Seeding sample invoices...');
sampleInvoices.forEach(inv => createSampleInvoice(inv));
console.log('Done.');

const fs = require('fs');
const path = 'c:\\Users\\Dasuni Work\\OneDrive\\Desktop\\mediccon-lis\\src\\main\\database\\db-config.js';
let content = fs.readFileSync(path, 'utf8');

// Add fixTable for invoices if not present
if (!content.includes("fixTable('invoices'")) {
    const invoiceFix = `
fixTable('invoices', \`
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_nic TEXT,
  visit_id INTEGER,
  total_amount REAL,
  discount REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
\`);
addCol('invoices', 'visit_id', 'INTEGER');
`;
    content = content.replace("addCol('test_catalog', 'analyzer_code', 'TEXT');", invoiceFix + "addCol('test_catalog', 'analyzer_code', 'TEXT');");
}

fs.writeFileSync(path, content);
console.log('Fixed db-config.js to include invoices visit_id fix');

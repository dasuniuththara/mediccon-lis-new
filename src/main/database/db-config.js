const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('mediccon_lis.db');

// --- DATABASE PERFORMANCE DRIVER ---
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');
db.pragma('cache_size = -16000'); // 16MB Cache

// Initialize Tables
const tables = [
  `CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nic TEXT UNIQUE,
    name TEXT,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    barcode TEXT,
    registered_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT, -- Hospital, Independent Lab, Clinic
    location TEXT,
    security_user TEXT,
    security_pass TEXT,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, PILOT, SUSPENDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    category TEXT,
    facility_id TEXT, -- Link to facility
    security_key TEXT,
    status TEXT,
    connection_type TEXT DEFAULT 'Serial',
    com_port TEXT,
    baud_rate INTEGER,
    host TEXT,
    port INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS test_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT,
    machine_code TEXT,
    lis_name TEXT,
    unit TEXT,
    UNIQUE(machine_id, machine_code)
  )`,
  `CREATE TABLE IF NOT EXISTS lab_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_nic TEXT,
    doctor_id INTEGER,
    registered_by TEXT,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, ARCHIVED
    visit_date DATE DEFAULT (date('now')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS patient_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_nic TEXT,
    visit_id INTEGER,
    test_code TEXT,
    test_name TEXT,
    price REAL DEFAULT 0.0,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    authorized_machines TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS test_catalog (
    code TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    price REAL DEFAULT 0.0,
    cost REAL DEFAULT 0.0
  )`,
  `CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_nic TEXT,
    visit_id INTEGER,
    machine_id TEXT,
    test_code TEXT,
    test_name TEXT,
    test_value TEXT,
    unit TEXT,
    ref_range TEXT,
    report_status TEXT DEFAULT 'PRELIMINARY', -- PRELIMINARY, VERIFIED, PRINTED
    user_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_nic TEXT,
    visit_id INTEGER,
    total_amount REAL,
    discount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    quantity REAL DEFAULT 0,
    unit_cost REAL DEFAULT 0,
    min_threshold REAL DEFAULT 10,
    machine_id TEXT,
    barcode TEXT UNIQUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    type TEXT, -- 'IN' or 'OUT'
    quantity REAL,
    reason TEXT,
    processed_by TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS test_reagents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_code TEXT,
    item_id INTEGER,
    usage_amount REAL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS referring_doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    code TEXT UNIQUE,
    contact TEXT,
    commission_rate REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS procurement_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    quantity REAL,
    unit TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, ORDERED, RECEIVED, CANCELLED
    priority TEXT DEFAULT 'NORMAL', -- NORMAL, URGENT, CRITICAL
    generated_by TEXT DEFAULT 'AI_CORE',
    ordered_at TIMESTAMP,
    received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS test_reference_ranges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_code TEXT,
    gender TEXT, -- Male, Female, Both
    age_min INTEGER DEFAULT 0,
    age_max INTEGER DEFAULT 150,
    ref_range TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

tables.forEach(sql => {
  try {
    db.exec(sql);
  } catch (err) {
    console.error('[DB Error] Table Init:', err.message);
  }
});

// Performance Tuning & Intelligence Matrix
try {
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 536870912'); // 512MB mmap (30GB was too large for most systems)

  // Core Operational Indices
  db.exec(`CREATE INDEX IF NOT EXISTS idx_results_nic ON results(patient_nic)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_results_status ON results(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_results_timestamp ON results(timestamp)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patient_tests_nic ON patient_tests(patient_nic)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_doctor ON patients(doctor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_patients_reg_by ON patients(registered_by)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_inventory_machine ON inventory(machine_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_lab_visits_date ON lab_visits(visit_date)`);

  console.log('[DB] Optimization Matrix Applied (WAL Mode + Performance Indices)');
} catch (e) {
  console.error('[DB Optimization Error]:', e.message);
}

console.log('[DB] Core Tables Initialized');

// PC Licensing logic (Hardware Lock)
const getSerial = () => {
  try {
    const { execSync } = require('child_process');
    const output = execSync('wmic bios get serialnumber').toString();
    return output.split('\n')[1].trim();
  } catch (e) { return 'UNKNOWN-HWID'; }
};

try {
  const currentHwid = getSerial();
  const existingHwid = db.prepare("SELECT value FROM system_settings WHERE key = 'authorized_hwid'").get();

  if (!existingHwid) {
    db.prepare("INSERT INTO system_settings (key, value) VALUES ('authorized_hwid', ?)").run(currentHwid);
    console.log('[Licensing] Initial PC Registered:', currentHwid);
  } else {
    console.log('[Licensing] Authorized PC:', existingHwid.value);
  }
} catch (err) {
  console.error('[Licensing Error]:', err.message);
}

// Insert default users
const insertUser = db.prepare(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`);
insertUser.run('developer', 'dev123', 'Developer');
insertUser.run('user', 'user123', 'User');
insertUser.run('unique', 'unique123', 'User');

// Migration Helper: Add column if not exists
const addCol = (table, col, def) => {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.find(c => c.name === col)) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`).run();
      console.log(`[DB Migration] Added column ${col} to ${table}`);
    }
  } catch (e) {
  }
};

// Migration Helper: Rebuild table if structure is mismatched
const fixTable = (tableName, expectedColumns) => {
  try {
    const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const existingColNames = info.map(c => c.name);

    if (existingColNames.length === 0) return; // Table newly created

    const expectedColNames = expectedColumns.trim().split('\n')
      .map(line => line.trim().replace(/,$/, '').split(/\s+/)[0])
      .filter(name => name && !name.startsWith('--'));

    const isMissingCol = expectedColNames.some(name => !existingColNames.includes(name));

    // Check for specific constraint fixes (e.g. NOT NULL changes)
    const rogueUserId = info.find(c => c.name === 'user_id' && c.notnull === 1);

    if (isMissingCol || rogueUserId) {
      console.log(`[DB Migration] Syncing ${tableName} structure...`);
      db.transaction(() => {
        db.prepare(`CREATE TABLE ${tableName}_new (${expectedColumns})`).run();
        const intersection = existingColNames.filter(name => expectedColNames.includes(name));
        const colList = intersection.join(', ');
        if (colList) {
          db.prepare(`INSERT INTO ${tableName}_new (${colList}) SELECT ${colList} FROM ${tableName}`).run();
        }
        db.prepare(`DROP TABLE ${tableName}`).run();
        db.prepare(`ALTER TABLE ${tableName}_new RENAME TO ${tableName}`).run();
      })();
      console.log(`[DB Migration] ${tableName} synchronized`);
    }
  } catch (e) {
    console.error(`[DB Migration Error] ${tableName}:`, e.message);
  }
};

// Apply Final Synchronized Schema
addCol('test_catalog', 'analyzer_code', 'TEXT');
addCol('test_catalog', 'unit', 'TEXT');
addCol('test_catalog', 'ref_range', 'TEXT');
addCol('results', 'status', "TEXT DEFAULT 'PENDING'");
addCol('results', 'test_code', 'TEXT');
addCol('results', 'ref_range', 'TEXT');
addCol('inventory', 'barcode', 'TEXT UNIQUE');

fixTable('patients', `  
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nic TEXT UNIQUE,
  title TEXT,
  name TEXT,
  age INTEGER,
  age_type TEXT DEFAULT 'Years',
  gender TEXT,
  phone TEXT,
  barcode TEXT,
  registered_by TEXT,
  doctor_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
`);

fixTable('results', `
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_nic TEXT,
    visit_id INTEGER,
    machine_id TEXT,
    test_name TEXT,
    test_value TEXT,
    unit TEXT,
    user_id INTEGER,
    test_code TEXT,
    ref_range TEXT,
    status TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
`);

// Seed default machines
const insertMachine = db.prepare(`
  INSERT OR IGNORE INTO machines (id, name, type, category, security_key, status) 
  VALUES (?, ?, ?, ?, ?, 'Offline')
`);
const updateCategory = db.prepare(`UPDATE machines SET category = ? WHERE id = ?`);

// Seed default Facilities (Labs / Hospitals) with Security Credentials
const insertFacility = db.prepare(`INSERT OR REPLACE INTO facilities (id, name, type, location, security_user, security_pass, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const defaultFacilities = [
  { id: 'FAC-CENTRAL', name: 'Mediccon Central Hub', type: 'Independent Lab', loc: 'Colombo 07', user: 'admin', pass: 'fac123', status: 'ACTIVE' },
  { id: 'FAC-ASIRI', name: 'Asiri Health (Lab Pilot)', type: 'Hospital', loc: 'Colombo 05', user: 'asiri', pass: 'pilot1', status: 'PILOT' },
  { id: 'FAC-NAWAL', name: 'Nawaloka Regional Lab', type: 'Independent Lab', loc: 'Negombo', user: 'nawal', pass: 'pilot2', status: 'PILOT' },
  { id: 'FAC-DURDANS', name: 'Durdans Hospital Diagnostic', type: 'Hospital', loc: 'Colombo 03', user: 'durdans', pass: 'fac456', status: 'ACTIVE' }
];
defaultFacilities.forEach(f => insertFacility.run(f.id, f.name, f.type, f.loc, f.user, f.pass, f.status));

const defaultMachines = [
  { id: 'MCN-SEL-01', name: 'Selectra Pro M', type: 'LIS2-A', category: 'Biochemistry', key: 'MCN-5501', port: 'COM1', facility: 'FAC-CENTRAL' },
  { id: 'MCN-ROCHE-01', name: 'Roche Cobas c501', type: 'HL7', category: 'Biochemistry', key: 'MCN-RCH-501', host: '127.0.0.1', tcpPort: 7001, facility: 'FAC-ASIRI' },
  { id: 'MCN-SYSMEX-01', name: 'Sysmex XN-1000', type: 'LIS2-A', category: 'Hematology', key: 'MCN-SYX-1000', port: 'COM8', facility: 'FAC-NAWAL' },
  { id: 'MCN-MINDRAY-01', name: 'Mindray BC-6800', type: 'HL7', category: 'Hematology', key: 'MCN-MIN-6800', port: 'COM9', facility: 'FAC-DURDANS' },
  { id: 'MCN-ORTHO-01', name: 'Vitros 5600', type: 'HL7', category: 'Biochemistry', key: 'MCN-ORT-5600', host: '127.0.0.1', tcpPort: 8001, facility: 'FAC-CENTRAL' },
  { id: 'MCN-MISPA-01', name: 'Mispa Count X', type: 'Mispa Count X', category: 'Hematology', key: 'MCN-MISP-01', port: 'COM2', facility: 'FAC-ASIRI' },
  { id: 'MCN-MISPAC-01', name: 'Mispa Count', type: 'Mispa Count', category: 'Hematology', key: 'MCN-MISPC-01', port: 'COM3', facility: 'FAC-ASIRI' },
  { id: 'MCN-ELE-01', name: 'Electrolyte Pack', type: 'HL7', category: 'Electrolyte', key: 'MCN-3310', port: 'COM4', facility: 'FAC-NAWAL' },
  { id: 'MCN-HOR-01', name: 'Immunoassay System', type: 'HL7', category: 'Hormone', key: 'MCN-9921', port: 'COM5', facility: 'FAC-NAWAL' },
  { id: 'MCN-IFLASH-01', name: 'iFlash 1200', type: 'HL7', category: 'Hormone', key: 'MCN-IFLASH-1200', port: 'COM6', host: '127.0.0.1', tcpPort: 6000, facility: 'FAC-CENTRAL' },
  { id: 'MCN-STAT-01', name: 'Statlyte C', type: 'Statlyte C', category: 'Electrolyte', key: 'MCN-STAT-19200', port: 'COM7', baud_rate: 19200, facility: 'FAC-DURDANS' }
];

defaultMachines.forEach(m => {
  const existing = db.prepare("SELECT id FROM machines WHERE id = ?").get(m.id);
  if (!existing) {
    db.prepare(`
      INSERT INTO machines (id, name, type, category, facility_id, security_key, status, com_port, baud_rate, host, port) 
      VALUES (?, ?, ?, ?, ?, ?, 'Offline', ?, 9600, ?, ?)
    `).run(m.id, m.name, m.type, m.category, m.facility, m.key, m.port, m.host || null, m.tcpPort || null);
  } else {
    // Force Link for existing machines
    db.prepare("UPDATE machines SET facility_id = ? WHERE id = ?").run(m.facility, m.id);
  }
});

// Auto-Authorize 'user' for the requested machines
try {
  const requestedMachines = ['MCN-SEL-01', 'MCN-MISPA-01', 'MCN-MISPAC-01'].join(',');
  db.prepare("UPDATE users SET authorized_machines = ? WHERE username = 'user'").run(requestedMachines);
  console.log('[Security] Auto-Authorized Selectra and Mispa for user account');
} catch (e) { }

// Seed Catalog
const insertTestCatalog = db.prepare(`INSERT OR IGNORE INTO test_catalog (code, name, category, price) VALUES (?, ?, ?, ?)`);
const defaultTests = [
  { code: 'FBS', name: 'Glucose Fasting (FBS)', category: 'Biochemistry', price: 350.00 },
  { code: 'HbA1c', name: 'HbA1c (Glycated Hb)', category: 'Biochemistry', price: 1850.00 },
  { code: 'ALT', name: 'ALT (SGPT)', category: 'Biochemistry', price: 650.00 },
  { code: 'AST', name: 'AST (SGOT)', category: 'Biochemistry', price: 650.00 },
  { code: 'UREA', name: 'Blood Urea', category: 'Biochemistry', price: 550.00 },
  { code: 'CREAT', name: 'Serum Creatinine', category: 'Biochemistry', price: 650.00 },
  { code: 'CHOL', name: 'Total Cholesterol', category: 'Biochemistry', price: 650.00 },
  { code: 'FBC', name: 'Full Blood Count', category: 'Hematology', price: 400.00 },
  { code: 'ESR', name: 'ESR (1st Hr)', category: 'Hematology', price: 350.00 },
  { code: 'TSH', name: 'Thyroid Estimulating (TSH)', category: 'Hormone', price: 1850.00 },
  { code: 'ELCT', name: 'Na+ / K+ / Cl- Full Pack', category: 'Electrolyte', price: 1550.00 },
  { code: 'CRP', name: 'C-Reactive Protein', category: 'Immunology', price: 1250.00 }
];
defaultTests.forEach(t => insertTestCatalog.run(t.code, t.name, t.category, t.price));

// Seed test_mappings
const insertMapping = db.prepare(`INSERT OR IGNORE INTO test_mappings (machine_id, machine_code, lis_name, unit) VALUES (?, ?, ?, ?)`);

// COMPREHENSIVE Mappings for SELECTRA PRO M
const selectraMappings = [
  { code: 'GLU', name: 'Glucose', unit: 'mg/dL' },
  { code: 'CHO', name: 'Total Cholesterol', unit: 'mg/dL' },
  { code: 'TRI', name: 'Triglycerides', unit: 'mg/dL' },
  { code: 'URE', name: 'Blood Urea', unit: 'mg/dL' },
  { code: 'CRE', name: 'Serum Creatinine', unit: 'mg/dL' },
  { code: 'SGOT', name: 'AST (SGOT)', unit: 'U/L' },
  { code: 'SGPT', name: 'ALT (SGPT)', unit: 'U/L' },
  { code: 'BIL-T', name: 'Bilirubin Total', unit: 'mg/dL' },
  { code: 'BIL-D', name: 'Bilirubin Direct', unit: 'mg/dL' },
  { code: 'TP', name: 'Total Protein', unit: 'g/dL' },
  { code: 'ALB', name: 'Albumin', unit: 'g/dL' },
  { code: 'UA', name: 'Uric Acid', unit: 'mg/dL' },
  { code: 'CAL', name: 'Calcium', unit: 'mg/dL' },
  { code: 'PHO', name: 'Phosphorus', unit: 'mg/dL' },
  { code: 'ALP', name: 'Alkaline Phosphatase', unit: 'U/L' },
  { code: 'GGT', name: 'Gamma GT', unit: 'U/L' }
];

// COMPREHENSIVE Mappings for MISPA COUNT X
const mispaMappings = [
  { code: '9', name: 'WBC', unit: 'x 10³/uL' },
  { code: '10', name: 'RBC', unit: 'x 10⁶/uL' },
  { code: '11', name: 'PLT', unit: 'x 10³/uL' },
  { code: '12', name: 'HGB', unit: 'g/dL' },
  { code: '13', name: 'HCT', unit: '%' },
  { code: '14', name: 'MCV', unit: 'fL' },
  { code: '15', name: 'MCH', unit: 'pg' },
  { code: '16', name: 'MCHC', unit: 'g/dL' },
  { code: '17', name: 'RDW-SD', unit: 'fL' },
  { code: '18', name: 'RDW-CV', unit: '%' },
  { code: '19', name: 'MPV', unit: 'fL' },
  { code: '20', name: 'LYMPH%', unit: '%' },
  { code: '21', name: 'MID%', unit: '%' },
  { code: '22', name: 'GRAN%', unit: '%' },
  { code: '23', name: 'LYMPH#', unit: 'x 10³/uL' },
  { code: '24', name: 'MID#', unit: 'x 10³/uL' },
  { code: '25', name: 'GRAN#', unit: 'x 10³/uL' },
  { code: '26', name: 'PCT', unit: '%' },
  { code: '27', name: 'PDW', unit: '%' },
  { code: '28', name: 'PLCR', unit: '%' },
  { code: '29', name: 'PLCC', unit: 'x 10³/uL' }
];

selectraMappings.forEach(m => insertMapping.run('MCN-SEL-01', m.code, m.name, m.unit));
mispaMappings.forEach(m => {
  insertMapping.run('MCN-MISPA-01', m.code, m.name, m.unit);
  insertMapping.run('MCN-MISPAC-01', m.code, m.name, m.unit);
});

// Seed Inventory
const insertInventory = db.prepare(`INSERT OR IGNORE INTO inventory (name, category, unit, quantity, min_threshold, machine_id) VALUES (?, ?, ?, ?, ?, ?)`);
const defaultInventory = [
  { name: 'Glucose Reagent (Bioc)', category: 'Biochemistry', unit: 'ml', qty: 500, min: 100, machine: 'DIALAB-01' },
  { name: 'Cholesterol Reagent', category: 'Biochemistry', unit: 'ml', qty: 250, min: 50, machine: 'DIALAB-01' },
  { name: 'Hematology Diluent (20L)', category: 'Hematology', unit: 'Bottle', qty: 2, min: 1, machine: 'MCN-MISPA-01' },
  { name: 'Hematology Lyse (500ml)', category: 'Hematology', unit: 'Bottle', qty: 5, min: 2, machine: 'MCN-MISPA-01' }
];
defaultInventory.forEach(item => insertInventory.run(item.name, item.category, item.unit, item.qty, item.min, item.machine));

// --- DATABASE INDEX ARCHITECTURE ---
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_patients_nic ON patients(nic);
  CREATE INDEX IF NOT EXISTS idx_lab_visits_nic ON lab_visits(patient_nic);
  CREATE INDEX IF NOT EXISTS idx_patient_tests_visit ON patient_tests(visit_id);
  CREATE INDEX IF NOT EXISTS idx_results_nic ON results(patient_nic);
  CREATE INDEX IF NOT EXISTS idx_results_visit ON results(visit_id);
  CREATE INDEX IF NOT EXISTS idx_results_machine ON results(machine_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_nic ON invoices(patient_nic);
  CREATE INDEX IF NOT EXISTS idx_invoices_visit ON invoices(visit_id);
`);

// --- AUTO SEED PROCUREMENT ---
try {
  const invCount = db.prepare("SELECT COUNT(*) as count FROM inventory").get().count;
  if (invCount === 0) {
    const reagents = [
      ['Roche Cobas Reagent', 'Reagent', 'Pack', 5, 10, 'ROCHE-C501', 'RCH-001'],
      ['Sysmex Cellpack DCL', 'Reagent', 'Litre', 3, 5, 'SYSMEX-XN1000', 'SYX-001'],
      ['Mindray BC Diluent', 'Reagent', 'Bottle', 12, 10, 'MINDRAY-BC6800', 'MND-001']
    ];
    reagents.forEach(r => {
      db.prepare("INSERT INTO inventory (name, category, unit, quantity, min_threshold, machine_id, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)").run(...r);
    });
  }

  const orderCount = db.prepare("SELECT COUNT(*) as count FROM procurement_orders").get().count;
  if (orderCount === 0) {
    const items = db.prepare("SELECT id, name, unit FROM inventory LIMIT 5").all();
    items.forEach((item, idx) => {
      const status = idx % 2 === 0 ? 'PENDING' : 'RECEIVED';
      db.prepare(`
        INSERT INTO procurement_orders (item_id, quantity, unit, priority, status, generated_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(item.id, 50, item.unit, idx === 0 ? 'CRITICAL' : 'NORMAL', status, idx % 2 === 0 ? 'AI_AUTO_PILOT' : 'DEVELOPER');
    });
  }
} catch (e) {
  console.log('[Auto-Seed] Procurement skip: ' + e.message);
}

try {
  const transCount = db.prepare("SELECT COUNT(*) as count FROM inventory_transactions").get().count;
  if (transCount < 20) {
    const items = db.prepare("SELECT id, name, machine_id FROM inventory").all();
    items.forEach(item => {
      // Add 10-15 "OUT" transactions per item to simulate historical tests
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        db.prepare(`
          INSERT INTO inventory_transactions (item_id, type, quantity, reason, processed_by, timestamp)
          VALUES (?, 'OUT', 1, ?, 'System', ?)
        `).run(item.id, `Diagnostic Burn: ${item.machine_id}`, date.toISOString());
      }
    });
  }
} catch (e) {
  console.log('[Auto-Seed] Transactions skip: ' + e.message);
}

// ==========================================
// UNIQUE ANURADHAPURA - MS 480 SETUP SCRIPT
// ==========================================
try {
  const facId = 'FAC-UNIQUE-ANP';
  const machineId = 'MCN-MS480';

  // 1. Register Facility
  db.prepare(`INSERT OR REPLACE INTO facilities (id, name, type, location, security_user, security_pass, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    facId, 'Unique Anuradhapura', 'Independent Lab', 'Anuradhapura', 'unique', 'unique123', 'ACTIVE'
  );

  // 2. Map MS-480
  const mappingDict = require('../config/ms480-mapping');
  const existingMs480 = db.prepare('SELECT id FROM machines WHERE id = ?').get(machineId);
  if (!existingMs480) {
    db.prepare(`
          INSERT INTO machines (id, name, type, category, connection_type, com_port, port, baud_rate, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Offline')
      `).run(machineId, 'MS-480 Auto Analyzer', 'MS-480', 'Biochemistry', 'Ethernet', null, 5000, null);
  }

  const insertMapping = db.prepare(`
      INSERT INTO test_mappings (machine_id, machine_code, lis_name, unit) 
      VALUES (?, ?, ?, '') 
      ON CONFLICT(machine_id, machine_code) DO NOTHING
  `);

  for (const [analyzerCode, lisName] of Object.entries(mappingDict)) {
    insertMapping.run(machineId, analyzerCode, lisName);
  }

  // 3. Link facility & settings specifically for Unique Anuradhapura host link
  db.prepare('UPDATE machines SET facility_id = ?, connection_type = ?, host = ?, port = ? WHERE id = ?').run(
    facId, 'Ethernet', '0.0.0.0', 5000, machineId
  );

  // 4. Update access for 'user', 'developer', and 'unique'
  ['user', 'developer', 'unique'].forEach(usr => {
    const uRow = db.prepare("SELECT authorized_machines FROM users WHERE username = ?").get(usr);
    if (uRow) {
      let auths = uRow.authorized_machines ? uRow.authorized_machines.split(',') : [];
      if (!auths.includes(machineId)) {
        auths.push(machineId);
        db.prepare("UPDATE users SET authorized_machines = ? WHERE username = ?").run(auths.join(','), usr);
      }
    }
  });

  console.log('[DB] Unique Anuradhapura & MS-480 Host Link Injected Successfully.');
} catch (e) {
  console.log('[DB] Final Unique Setup skip: ' + e.message);
}

module.exports = db;
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

// --- LOGGING ---
const logFile = path.join(process.cwd(), 'debug.log');
const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    try {
        fs.appendFileSync(logFile, entry);
    } catch (e) { }
    console.log(msg);
};

log('[DEBUG] Starting Main Process');

const MachineConfigManager = require('./managers/machine-config-manager');
const BackupManager = require('./utils/backup-manager');
const GhostSyncManager = require('./utils/ghost-sync-manager');

let mainWindow;
let db;
try {
    db = require('./database/db-config');
    log('[DEBUG] Database Loaded');
} catch (e) {
    log('[DEBUG] Database Load Failed: ' + e.message);
}

const getHardwareInfo = () => {
    try {
        const output = execSync('wmic bios get serialnumber', { timeout: 2000 }).toString();
        return output.split('\n')[1].trim();
    } catch (e) { return 'UNKNOWN-HWID'; }
};

let cachedHwidResult = null;
const isHardwareAuthorized = () => {
    if (cachedHwidResult !== null) return cachedHwidResult;
    try {
        const current = getHardwareInfo();
        const authorized = db.prepare("SELECT value FROM system_settings WHERE key = 'authorized_hwid'").get();
        cachedHwidResult = !!(authorized && authorized.value === current);
        return cachedHwidResult;
    } catch (e) {
        return false;
    }
};

function createWindow() {
    log('[DEBUG] Creating Window...');
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1000,
        backgroundColor: '#020617',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            nativeWindowOpen: true,
            sandbox: false
        }
    });

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        log(`[RENDERER] ${message}`);
    });

    // mainWindow.webContents.openDevTools();

    const indexPath = path.join(__dirname, '../renderer/index.html');
    log('[DEBUG] Loading: ' + indexPath);

    mainWindow.loadFile(indexPath).then(() => {
        log('[DEBUG] Success: Index Loaded');
    }).catch(err => {
        log('[DEBUG] Error: Loading Failed ' + err);
    });
}


const secureHandle = (channel, handler) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, async (event, ...args) => {
        log(`[IPC] Call: ${channel}`);
        const bypassChannels = [
            'check-hardware', 'login', 'get-serial-ports', 'get-test-mappings',
            'get-test-catalog', 'get-patient-tests', 'get-patients',
            'get-invoice', 'get-invoice-by-visit', 'get-all-invoices', 'get-system-settings',
            'register-patient', 'create-invoice', 'update-patient', 'update-invoice',
            'authorize-hardware', 'get-machines', 'get-quick-stats', 'get-visits', 'get-visits-by-nic',
            'get-latest-activity', 'get-inventory', 'search-global',
            'get-inventory-logs', 'get-item-by-barcode', 'get-pending-results',
            'get-patient-results', 'get-security-stats', 'get-users',
            'get-test-reagents', 'get-machine-logs', 'get-machine-config',
            'get-referring-doctors', 'add-referring-doctor', 'update-referring-doctor', 'delete-referring-doctor',
            'save-barcode', 'update-result-test-name', 'get-deep-analytics', 'delete-patient', 'get-patient-trends'
        ];
        if (!isHardwareAuthorized() && !bypassChannels.includes(channel)) {
            throw new Error('UNAUTHORIZED_HARDWARE');
        }
        return handler(event, ...args);
    });
};

function setupIPC() {
    log('[DEBUG] Setting up IPC...');
    const PatientRepo = require('./database/patient-repo');
    const SystemRepo = require('./database/system-repo');
    const BidirectionalManager = require('./managers/bidirectional-manager');
    const backupManager = new BackupManager(db);

    secureHandle('get-backups', async () => backupManager.getBackupList());
    secureHandle('back-up-now', async () => backupManager.performBackup());

    // START MOTHER UI CLOUD SYNC PROTOCOL
    log('[DEBUG] Initiating GhostSyncManager for Cloud Backup...');
    GhostSyncManager.initialize();

    secureHandle('check-hardware', async () => ({ isAuthorized: isHardwareAuthorized(), hwid: getHardwareInfo() }));

    secureHandle('get-security-stats', async () => ({
        hwid: getHardwareInfo(),
        isAuthorized: isHardwareAuthorized()
    }));

    secureHandle('authorize-hardware', async () => {
        const hwid = getHardwareInfo();
        cachedHwidResult = null;
        return db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('authorized_hwid', ?)").run(hwid);
    });

    secureHandle('get-system-settings', async () => SystemRepo.getSettings());
    secureHandle('save-system-setting', async (event, { key, value }) => SystemRepo.saveSetting(key, value));

    secureHandle('get-users', async () => SystemRepo.getUsers());
    secureHandle('register-user', async (event, userData) => SystemRepo.registerUser(userData));
    secureHandle('delete-user', async (event, id) => SystemRepo.deleteUser(id));
    secureHandle('update-user-permissions', async (event, { userId, machineIds }) => SystemRepo.updateUserPermissions(userId, machineIds));

    secureHandle('add-catalog-item', async (event, item) => SystemRepo.addCatalogItem(item));
    secureHandle('update-catalog-item', async (event, item) => SystemRepo.updateCatalogItem(item));
    secureHandle('get-test-reference-ranges', async (event, testCode) => SystemRepo.getTestReferenceRanges(testCode));
    secureHandle('save-test-reference-range', async (event, range) => SystemRepo.saveTestReferenceRange(range));
    secureHandle('delete-test-reference-range', async (event, id) => SystemRepo.deleteTestReferenceRange(id));

    secureHandle('save-barcode', async (event, { dataUrl, filename }) => {
        try {
            const { dialog } = require('electron');
            const fs = require('fs');
            const path = require('path');

            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");

            const { filePath } = await dialog.showSaveDialog({
                title: 'Archive Clinical Barcode Asset',
                defaultPath: path.join(os.homedir(), 'Downloads', filename),
                filters: [{ name: 'Image Files', extensions: ['png'] }]
            });

            if (filePath) {
                fs.writeFileSync(filePath, base64Data, 'base64');
                return { success: true, path: filePath };
            }
            return { success: false, error: 'User cancelled' };
        } catch (error) {
            console.error("Barcode Save Protocol Error:", error);
            return { success: false, error: error.message };
        }
    });


    // --- INVENTORY HANDLERS ---
    const InventoryRepo = require('./database/inventory-repo');
    secureHandle('get-inventory', async () => InventoryRepo.getInventory());
    secureHandle('get-item-by-barcode', async (e, barcode) => InventoryRepo.getItemByBarcode(barcode));
    secureHandle('update-stock', async (event, data) => InventoryRepo.updateStock(data.itemId, data.delta, data.type, data.reason, data.processedBy));
    secureHandle('add-inventory-item', async (event, item) => InventoryRepo.addItem(item));
    secureHandle('delete-inventory-item', async (event, id) => InventoryRepo.deleteItem(id));
    secureHandle('get-inventory-logs', async (event, itemId) => InventoryRepo.getTransactions(itemId));
    secureHandle('get-test-reagents', async (event, testCode) => InventoryRepo.getTestMappings(testCode));
    secureHandle('save-test-reagent', async (event, mapping) => InventoryRepo.saveTestMapping(mapping));
    secureHandle('delete-test-reagent', async (event, id) => InventoryRepo.deleteTestMapping(id));

    // Auto-Run Backup Sequence
    setTimeout(() => {
        log('[AUTO-BACKUP] Triggering post-init snapshot...');
        backupManager.performBackup();
    }, 5000);

    // Seed iFlash 1200 test mappings
    secureHandle('seed-iflash-tests', async () => {
        try {
            const { seedIFlashTests } = require('./config/iflash-test-mapping');

            // Add analyzer_code column if it doesn't exist
            try {
                db.exec(`ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT`);
                log('[iFlash] Added analyzer_code column');
            } catch (e) {
                log('[iFlash] analyzer_code column already exists');
            }

            seedIFlashTests(db);
            log('[iFlash] Successfully seeded test mappings');

            const count = db.prepare("SELECT COUNT(*) as count FROM test_catalog WHERE category = 'Hormone'").get().count;
            return { success: true, count };
        } catch (error) {
            log('[iFlash] Seed error: ' + error.message);
            return { success: false, error: error.message };
        }
    });

    // Seed Statlyte C mappings
    secureHandle('seed-statlyte-tests', async () => {
        try {
            const { statlyteMappings } = require('./config/statlyte-mapping');

            // Add analyzer_code column if needed (already handled by iFlash setup, but good to be safe)
            try { db.exec(`ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT`); } catch (e) { }

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO test_catalog (code, name, category, price, analyzer_code)
                VALUES (?, ?, ?, ?, ?)
            `);

            Object.entries(statlyteMappings).forEach(([code, mapping]) => {
                stmt.run(code, mapping.name, mapping.category, 0, mapping.analyzerCode);
            });

            log('[Statlyte] Successfully seeded test mappings');
            return { success: true, count: Object.keys(statlyteMappings).length };
        } catch (error) {
            log('[Statlyte] Seed error: ' + error.message);
            return { success: false, error: error.message };
        }
    });

    // Seed Selectra Pro S mappings
    secureHandle('seed-selectra-tests', async () => {
        try {
            const { selectraMappings } = require('./config/selectra-mapping');

            try { db.exec(`ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT`); } catch (e) { }

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO test_catalog (code, name, category, price, analyzer_code)
                VALUES (?, ?, ?, ?, ?)
            `);

            Object.entries(selectraMappings).forEach(([code, mapping]) => {
                stmt.run(code, mapping.name, mapping.category, 0, mapping.analyzerCode);
            });

            log('[Selectra] Successfully seeded test mappings');
            return { success: true, count: Object.keys(selectraMappings).length };
        } catch (error) {
            log('[Selectra] Seed error: ' + error.message);
            return { success: false, error: error.message };
        }
    });

    // Seed PKL PPC mappings
    secureHandle('seed-pkl-tests', async () => {
        try {
            const { seedPKLTests, pklMappings } = require('./config/pkl-mapping');
            try { db.exec(`ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT`); } catch (e) { }
            seedPKLTests(db);
            log('[PKL] Successfully seeded test mappings');
            return { success: true, count: Object.keys(pklMappings).length };
        } catch (error) {
            log('[PKL] Seed error: ' + error.message);
            return { success: false, error: error.message };
        }
    });

    // Seed DIALAB Autolyser mappings
    secureHandle('seed-dialab-tests', async () => {
        try {
            const { seedDialabTests, dialabMappings } = require('./config/dialab-mapping');
            try { db.exec(`ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT`); } catch (e) { }
            seedDialabTests(db);
            log('[DIALAB] Successfully seeded test mappings');
            return { success: true, count: Object.keys(dialabMappings).length };
        } catch (error) {
            log('[DIALAB] Seed error: ' + error.message);
            return { success: false, error: error.message };
        }
    });

    // Seed Mispa Count X mappings
    secureHandle('seed-mispa-tests', async () => {
        try {
            const { seedMispaTests, mispaMappings } = require('./config/mispa-mapping');
            try { db.exec(`ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT`); } catch (e) { }
            seedMispaTests(db);
            log('[MISPA] Successfully seeded test mappings');
            return { success: true, count: Object.keys(mispaMappings).length };
        } catch (error) {
            log('[MISPA] Seed error: ' + error.message);
            return { success: false, error: error.message };
        }
    });

    // DYNAMIC SIMULATION: Trigger results matching patient orders
    secureHandle('simulate-patient-results', async (event, nic) => {
        log(`[SIMULATION] Triggering dynamic hardware telemetry for ${nic}`);
        try {
            const PatientRepo = require('./database/patient-repo');

            // 1. Get patient's ordered tests
            const orderedTests = db.prepare(`
                SELECT pt.test_name, tc.category, tc.unit, tc.analyzer_code 
                FROM patient_tests pt
                LEFT JOIN test_catalog tc ON pt.test_name = tc.name
                WHERE pt.patient_nic = ?
            `).all(nic);

            if (!orderedTests || orderedTests.length === 0) {
                log(`[SIMULATION] No orders found for ${nic}`);
                return { success: false, error: 'No ordered tests found for this subject.' };
            }

            log(`[SIMULATION] Found ${orderedTests.length} orders for ${nic}: ${orderedTests.map(t => t.test_name).join(', ')}`);

            // 2. Group and Expand by category to simulate machine output
            const resultsByMachine = {};

            orderedTests.forEach(test => {
                const category = test.category || 'Biochemistry';
                if (!resultsByMachine[category]) resultsByMachine[category] = [];

                // HEMATOLOGY EXPANSION: If FBC is ordered, provide the full 21 parameters
                if (category === 'Hematology' && (test.test_name === 'Full Blood Count' || test.test_name === 'FBC')) {
                    const hParams = [
                        { n: 'WBC', v: (Math.random() * 6 + 4), u: '10³/uL' },
                        { n: 'LYMPH#', v: (Math.random() * 2 + 1), u: '10³/uL' },
                        { n: 'MID#', v: (Math.random() * 0.5 + 0.1), u: '10³/uL' },
                        { n: 'GRAN#', v: (Math.random() * 4 + 2), u: '10³/uL' },
                        { n: 'LYMPH%', v: (Math.random() * 20 + 20), u: '%' },
                        { n: 'MID%', v: (Math.random() * 5 + 3), u: '%' },
                        { n: 'GRAN%', v: (Math.random() * 30 + 40), u: '%' },
                        { n: 'RBC', v: (Math.random() * 1.5 + 4), u: '10⁶/uL' },
                        { n: 'HGB', v: (Math.random() * 4 + 12), u: 'g/dL' },
                        { n: 'HCT', v: (Math.random() * 10 + 35), u: '%' },
                        { n: 'MCV', v: (Math.random() * 15 + 80), u: 'fL' },
                        { n: 'MCH', v: (Math.random() * 5 + 27), u: 'pg' },
                        { n: 'MCHC', v: (Math.random() * 3 + 32), u: 'g/dL' },
                        { n: 'RDW-CV', v: (Math.random() * 2 + 12), u: '%' },
                        { n: 'RDW-SD', v: (Math.random() * 10 + 35), u: 'fL' },
                        { n: 'PLT', v: (Math.random() * 200 + 150), u: '10³/uL' },
                        { n: 'MPV', v: (Math.random() * 3 + 7), u: 'fL' },
                        { n: 'PDW', v: (Math.random() * 4 + 15), u: '' },
                        { n: 'PCT', v: (Math.random() * 0.2 + 0.1), u: '%' },
                        { n: 'PLCR', v: (Math.random() * 10 + 20), u: '%' },
                        { n: 'PLCC', v: (Math.random() * 50 + 50), u: '10³/uL' }
                    ];

                    hParams.forEach(p => {
                        resultsByMachine[category].push({
                            name: p.n,
                            value: p.v.toFixed(p.n.includes('%') ? 1 : 2),
                            unit: p.u
                        });
                    });
                } else {
                    // Clinical Simulation Authority: 30% chance of Abnormal/Panic state for testing
                    const isAbnormal = Math.random() > 0.7;
                    let value = (Math.random() * 10).toFixed(2);

                    if (test.test_name.includes('Glucose') || test.test_name.includes('FBS')) {
                        value = isAbnormal ? (Math.random() * 200 + 420).toFixed(0) : (Math.random() * 40 + 85).toFixed(0);
                    } else if (test.test_name.includes('ALT') || test.test_name.includes('AST') || test.test_name.includes('SGPT')) {
                        value = isAbnormal ? (Math.random() * 500 + 300).toFixed(0) : (Math.random() * 20 + 20).toFixed(0);
                    } else if (isAbnormal) {
                        value = (Math.random() * 100 + 50).toFixed(2);
                    }

                    resultsByMachine[category].push({
                        name: test.analyzer_code || test.test_name,
                        value: value,
                        unit: test.unit || ''
                    });
                }
            });

            // 3. Dispatch to appropriate machine handlers
            for (const [category, tests] of Object.entries(resultsByMachine)) {
                const machines = MachineConfigManager.getAllMachines().filter(m => m.category === category);
                const machine = machines[0] || { id: `MOCK-${category}`, name: `Mock ${category} Node`, type: 'Simulation', category: category };

                log(`[SIMULATION] Dispatching ${tests.length} ${category} results to ${machine.name}`);

                const simResult = {
                    patient: { id: nic },
                    tests: tests
                };

                // Use handleIncomingData as a protocol-aware entry point
                MachineConfigManager.handleIncomingData(machine, simResult);
            }

            return { success: true };
        } catch (e) {
            log('[SIMULATION] Fatal Error: ' + e.message);
            return { success: false, error: e.message };
        }
    });

    secureHandle('get-middleware-stats', async () => {
        const MachineLogger = require('./utils/machine-logger');
        return MachineLogger.getGlobalStats();
    });

    secureHandle('simulate-analyzer-query', async (event, { nic, machineId }) => {
        const BidirectionalManager = require('./managers/bidirectional-manager');
        return await BidirectionalManager.handleAnalyzerQuery(nic, machineId);
    });

    secureHandle('get-pending-orders', async () => {
        try {
            return db.prepare("SELECT * FROM pending_orders WHERE status = 'pending' ORDER BY created_at DESC").all();
        } catch (e) {
            return [];
        }
    });

    secureHandle('get-patient-trends', async (event, nic) => {
        return PatientRepo.getPatientTrends(nic);
    });

    secureHandle('delete-patient', async (event, nic) => {
        return PatientRepo.deletePatient(nic);
    });

    // MOCK SIMULATION: Trigger a fake Mispa result with 21 parameters
    secureHandle('simulate-mispa-result', async (event, nic) => {
        log(`[SIMULATION] Triggering comprehensive Mispa results for ${nic}`);

        const result = {
            patient: { id: nic },
            tests: [
                // WBC System (7)
                { name: 'WBC', value: (Math.random() > 0.8) ? (Math.random() * 50 + 30).toFixed(2) : (Math.random() * 5 + 4).toFixed(2), unit: '10³/µL' },
                { name: 'LYM%', value: (Math.random() * 20 + 20).toFixed(1), unit: '%' },
                { name: 'MID%', value: (Math.random() * 5 + 3).toFixed(1), unit: '%' },
                { name: 'GRA%', value: (Math.random() * 30 + 40).toFixed(1), unit: '%' },
                { name: 'LYM#', value: (Math.random() * 2 + 1).toFixed(2), unit: '10³/µL' },
                { name: 'MID#', value: (Math.random() * 0.5 + 0.2).toFixed(2), unit: '10³/µL' },
                { name: 'GRA#', value: (Math.random() * 5 + 2).toFixed(2), unit: '10³/µL' },

                // RBC System (8)
                { name: 'RBC', value: (Math.random() * 1.5 + 4.5).toFixed(2), unit: '10⁶/µL' },
                { name: 'HGB', value: (Math.random() > 0.8) ? (Math.random() * 2 + 3.5).toFixed(1) : (Math.random() * 4 + 12).toFixed(1), unit: 'g/dL' },
                { name: 'HCT', value: (Math.random() * 10 + 35).toFixed(1), unit: '%' },
                { name: 'MCV', value: (Math.random() * 10 + 85).toFixed(1), unit: 'fL' },
                { name: 'MCH', value: (Math.random() * 5 + 28).toFixed(1), unit: 'pg' },
                { name: 'MCHC', value: (Math.random() * 2 + 32).toFixed(1), unit: 'g/dL' },
                { name: 'RDW-CV', value: (Math.random() * 2 + 12).toFixed(1), unit: '%' },
                { name: 'RDW-SD', value: (Math.random() * 5 + 40).toFixed(1), unit: 'fL' },

                // PLT System (6)
                { name: 'PLT', value: (Math.random() * 200 + 150).toFixed(0), unit: '10³/µL' },
                { name: 'MPV', value: (Math.random() * 2 + 8).toFixed(1), unit: 'fL' },
                { name: 'PDW', value: (Math.random() * 5 + 10).toFixed(1), unit: 'fL' },
                { name: 'PCT', value: (Math.random() * 0.2 + 0.1).toFixed(3), unit: '%' },
                { name: 'P-LCR', value: (Math.random() * 10 + 20).toFixed(1), unit: '%' },
                { name: 'P-LCC', value: (Math.random() * 40 + 30).toFixed(0), unit: '10³/µL' }
            ]
        };

        try {
            const machineId = 'MISPA-CX';
            log('[SIMULATION] Calling MachineConfigManager.handleMispaData');
            MachineConfigManager.handleMispaData({ id: machineId, name: 'Mispa Simulation Node', type: 'Mispa Count X', category: 'Hematology' }, result);
            return { success: true };
        } catch (e) {
            log('[SIMULATION] Error: ' + e.message);
            return { success: false, error: e.message };
        }
    });

    // Auto-Run Seeding on Startup (Robust Check)
    try {
        // 1. Ensure DIALAB exists and is seeded with correct security state
        const { seedDialabTests } = require('./config/dialab-mapping');
        const dialab = db.prepare("SELECT id, security_key FROM machines WHERE id = 'DIALAB-01'").get();
        const dialabMappingCount = db.prepare("SELECT count(*) as c FROM test_mappings WHERE machine_id = 'DIALAB-01'").get().c;

        // Force reset if legacy 'VERIFIED' status is found
        if (dialab && dialab.security_key === 'VERIFIED') {
            log('[Auto-Fix] Resetting DIALAB security status to NOT LINKED');
            db.prepare("UPDATE machines SET security_key = 'NOT LINKED' WHERE id = 'DIALAB-01'").run();
        }

        if (!dialab || dialabMappingCount < 10) {
            log('[Auto-Seed] DIALAB machine or mappings missing. Provisioning...');
            seedDialabTests(db);
        }

        // 2. Generic Biochemistry check (PKL fallback)
        const biochemicalCount = db.prepare("SELECT count(*) as c FROM test_catalog WHERE analyzer_code IS NOT NULL AND category = 'Biochemistry'").get().c;
        if (biochemicalCount < 35) {
            log(`[Auto-Seed] Found only ${biochemicalCount} mapped tests. Seeding PKL defaults...`);
            const { seedPKLTests } = require('./config/pkl-mapping');
            seedPKLTests(db);
        } else {
            log(`[Auto-Seed] System healthy. Found ${biochemicalCount} total mapped tests.`);
        }

        // 3. Mispa Count X check
        const mispaCount = db.prepare("SELECT count(*) as c FROM test_mappings WHERE machine_id = 'MISPA-CX'").get().c;
        if (mispaCount < 20) {
            log('[Auto-Seed] Mispa Count X mappings missing. Provisioning...');
            const { seedMispaTests } = require('./config/mispa-mapping');
            seedMispaTests(db);
        }
    } catch (e) {
        log('[Auto-Seed] Error: ' + e.message);
    }

    log('[DEBUG] Registering get-machine-logs handler');
    secureHandle('get-machine-logs', async (event, machineId) => {
        try {
            const MachineLogger = require('./utils/machine-logger');
            const logger = new MachineLogger(machineId);
            return { success: true, logs: logger.getRecentLogs(200) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    secureHandle('login', async (event, credentials) => {
        try {
            const user = db.prepare('SELECT id, username, role, authorized_machines FROM users WHERE username = ? AND password = ?').get(credentials.username, credentials.password);
            if (user) {
                return { success: true, user: { id: user.id, username: user.username, role: user.role, authorized_machines: user.authorized_machines } };
            }
            return { success: false, message: 'Invalid Credentials' };
        } catch (e) {
            console.error("Login Error:", e);
            return { success: false, message: 'Database Authentication Failure' };
        }
    });

    secureHandle('get-quick-stats', async () => PatientRepo.getQuickStats());
    secureHandle('get-deep-analytics', async (event, days) => PatientRepo.getDeepAnalytics(days));
    secureHandle('export-analytics', async () => {
        try {
            const csv = PatientRepo.exportAnalyticsCSV();
            if (csv.startsWith('ERROR')) return { success: false, error: csv };

            const { dialog } = require('electron');
            const fs = require('fs');
            const path = require('path');

            const { filePath } = await dialog.showSaveDialog({
                title: 'Export Lab Analytics Node',
                defaultPath: path.join(os.homedir(), `Mediccon_Analytics_${new Date().toISOString().split('T')[0]}.csv`),
                filters: [{ name: 'CSV Files', extensions: ['csv'] }]
            });

            if (filePath) {
                fs.writeFileSync(filePath, csv);
                return { success: true, path: filePath };
            }
            return { success: false, error: 'User cancelled' };
        } catch (error) {
            console.error("Export Analytics Error:", error);
            return { success: false, error: error.message };
        }
    });
    secureHandle('get-inventory-ai', async () => InventoryRepo.getPredictiveInsights());
    secureHandle('get-procurement-orders', async () => InventoryRepo.getProcurementOrders());
    secureHandle('create-procurement-order', async (event, order) => InventoryRepo.createProcurementOrder(order));
    secureHandle('update-procurement-status', async (event, { id, status, qtyReceived }) => InventoryRepo.updateProcurementStatus(id, status, qtyReceived));
    secureHandle('trigger-auto-procurement', async () => InventoryRepo.triggerAutoProcurement());

    // Core Inventory Handlers
    secureHandle('get-inventory', async () => InventoryRepo.getInventory());
    secureHandle('add-inventory-item', async (event, item) => InventoryRepo.addItem(item));
    secureHandle('delete-inventory-item', async (event, id) => InventoryRepo.deleteItem(id));
    secureHandle('update-stock', async (event, { id, quantity, type, reason, processedBy }) => InventoryRepo.updateStock(id, quantity, type, reason, processedBy));
    secureHandle('get-inventory-logs', async (event, itemId) => InventoryRepo.getTransactions(itemId));

    // Test Reagent Mapping Handlers
    secureHandle('get-test-reagents', async (event, testCode) => InventoryRepo.getTestMappings(testCode));
    secureHandle('save-test-reagent', async (event, mapping) => InventoryRepo.saveTestMapping(mapping));
    secureHandle('delete-test-reagent', async (event, id) => InventoryRepo.deleteTestMapping(id));
    secureHandle('get-item-by-barcode', async (event, barcode) => InventoryRepo.getItemByBarcode(barcode));
    secureHandle('get-latest-activity', async () => PatientRepo.getLatestActivity());
    secureHandle('get-test-catalog', async () => PatientRepo.getTestCatalog());
    secureHandle('update-test-price', async (event, { code, price }) => PatientRepo.updateTestPrice(code, price));
    secureHandle('get-patients', async (event, user) => PatientRepo.getAllPatients(user));
    secureHandle('get-all-invoices', async () => PatientRepo.getAllInvoices());
    secureHandle('get-invoice', async (event, nic) => PatientRepo.getInvoiceByNic(nic));
    secureHandle('get-invoice-by-visit', async (event, visitId) => PatientRepo.getInvoiceByVisitId(visitId));
    secureHandle('update-invoice', async (event, { id, data }) => PatientRepo.updateInvoice(id, data));
    secureHandle('get-patient-tests', async (event, nic) => PatientRepo.getPatientTests(nic));
    secureHandle('get-visits', async (event, nic) => PatientRepo.getVisitsByNic(nic));
    secureHandle('get-doctor-stats', async (event, id) => PatientRepo.getDoctorStats(id));
    secureHandle('get-patient-results', async (event, { nic, visitId }) => PatientRepo.getPatientResults(nic, visitId));
    secureHandle('update-patient', async (event, { oldNic, newNic, name }) => PatientRepo.updatePatient(oldNic, newNic, name));
    secureHandle('get-historical-test-results', async (event, { nic, testName }) => PatientRepo.getHistoricalTestResults(nic, testName));

    secureHandle('search-global', async (event, term) => {
        if (!term) return { patients: [], inventory: [] };
        try {
            const patients = PatientRepo.searchPatients(term);
            const inventory = InventoryRepo.search(term);
            return { patients, inventory };
        } catch (e) {
            console.error("Global Search Fault:", e);
            return { patients: [], inventory: [] };
        }
    });

    secureHandle('login-facility', async (event, { facilityId, username, password }) => {
        const facility = db.prepare("SELECT * FROM facilities WHERE id = ?").get(facilityId);
        if (facility &&
            facility.security_user.toLowerCase() === username.toLowerCase() &&
            facility.security_pass.toLowerCase() === password.toLowerCase()) {
            return { success: true };
        }
        return { success: false, msg: 'Invalid Pipeline Credentials' };
    });

    secureHandle('get-machines', async (event, user) => {
        const machines = MachineConfigManager.getAllMachines();
        const isDeveloper = user && ['developer', 'master access', 'admin'].includes(user.role?.toLowerCase());
        if (isDeveloper) return machines;

        // Middleware: Fetch fresh permissions from DB for this user
        try {
            const dbUser = db.prepare('SELECT authorized_machines FROM users WHERE username = ?').get(user.username);
            if (!dbUser || !dbUser.authorized_machines) return [];

            const allowedIds = dbUser.authorized_machines.split(',').filter(Boolean);
            return machines.filter(m => allowedIds.includes(m.id));
        } catch (e) {
            console.error("Machine Authorization Middleware Failure:", e);
            return [];
        }
    });

    secureHandle('register-patient', async (event, patient) => {
        try {
            const result = PatientRepo.registerPatient(patient, patient.user_id || patient.registered_by);

            // Register the test order with bidirectional manager
            if (result.success && patient.tests && patient.tests.length > 0) {
                BidirectionalManager.registerPatientOrder(patient.nic, patient.tests);
                const codes = patient.tests.map(t => typeof t === 'object' ? t.code : t).join(', ');
                log(`[Bidirectional] Registered order for ${patient.nic}: ${codes}`);

                // Automated Worklist Hook: Dispatch to all relevant analyzers
                try {
                    MachineConfigManager.broadcastOrderToMachines(patient.nic, patient.tests, patient.name);
                } catch (de) {
                    log(`[Worklist] Dispatch fault: ${de.message}`);
                }
            }

            return result;
        } catch (e) {
            log('[ERROR] Patient registration failed: ' + e.message);
            return { success: false, message: e.message };
        }
    });
    secureHandle('create-invoice', async (event, data) => {
        return PatientRepo.createInvoice(data);
    });

    secureHandle('verify-machine-key', async (event, { machineId, key }) => {
        const MachineAuth = require('./security/machine-auth');
        return MachineAuth.verifyKey(machineId, key);
    });

    // Bidirectional Communication Handlers
    secureHandle('get-worklist', async () => BidirectionalManager.getPendingOrders());
    secureHandle('get-pending-orders', async () => BidirectionalManager.getPendingOrders());
    secureHandle('manual-push-order', async (event, { nic, machineId }) => BidirectionalManager.manualPushOrder(nic, machineId));

    secureHandle('analyzer-query', async (event, { nic, machineId }) => {
        log(`[IPC] Analyzer query: ${machineId} requesting data for ${nic}`);
        return await BidirectionalManager.handleAnalyzerQuery(nic, machineId);
    });

    secureHandle('simulate-analyzer-query', async (event, { nic, machineId }) => {
        log(`[IPC] SIMULATION: ${machineId} querying for ${nic}`);
        return await BidirectionalManager.handleAnalyzerQuery(nic, machineId);
    });

    secureHandle('analyzer-results', async (event, resultData) => {
        log(`[IPC] Analyzer results received for patient: ${resultData.patient?.id}`);
        return await BidirectionalManager.handleAnalyzerResults(resultData);
    });

    secureHandle('get-middleware-stats', async () => {
        try {
            const orders = BidirectionalManager.getPendingOrders();
            const machines = MachineConfigManager.getAllMachines();
            return {
                pendingOrders: orders.length,
                onlineNodes: machines.filter(m => m.status === 'Online').length,
                totalNodes: machines.length,
                throughput: 0 // Placeholder or calculate from results table
            };
        } catch (e) {
            return { pendingOrders: 0, onlineNodes: 0, totalNodes: 0, throughput: 0 };
        }
    });
    secureHandle('get-mother-ui-stats', async () => PatientRepo.getMotherUIStats());

    secureHandle('get-serial-ports', async () => {
        try {
            const { SerialPort } = require('serialport');
            return await SerialPort.list();
        } catch (e) {
            return [];
        }
    });

    secureHandle('save-machine-config', async (event, config) => {
        return MachineConfigManager.saveMachineConfig(config);
    });

    secureHandle('get-machine-config', async (event, id) => {
        return MachineConfigManager.getMachine(id);
    });

    secureHandle('get-test-mappings', async (event, machineId) => {
        return MachineConfigManager.getMappings(machineId);
    });

    secureHandle('delete-machine', async (event, id) => {
        return MachineConfigManager.deleteMachine(id);
    });

    secureHandle('save-test-mapping', async (event, mapping) => {
        return MachineConfigManager.saveMapping(mapping);
    });

    secureHandle('delete-test-mapping', async (event, id) => {
        return MachineConfigManager.deleteMapping(id);
    });

    secureHandle('get-pending-results', async () => PatientRepo.getPendingResults());
    secureHandle('validate-result', async (event, { id, userId }) => PatientRepo.validateResult(id, userId));
    secureHandle('update-result', async (event, { id, value, userId }) => PatientRepo.updateResult(id, value, userId));
    secureHandle('update-result-test-name', async (event, { id, testName, userId }) => PatientRepo.updateResultTestName(id, testName, userId));
    secureHandle('reject-result', async (event, id) => PatientRepo.rejectResult(id));

    // Referring Doctor IPCs
    secureHandle('get-referring-doctors', async () => PatientRepo.getReferringDoctors());
    secureHandle('add-referring-doctor', async (event, doctor) => PatientRepo.addReferringDoctor(doctor));
    secureHandle('update-referring-doctor', async (event, { id, doctor }) => PatientRepo.updateReferringDoctor(id, doctor));
    secureHandle('delete-referring-doctor', async (event, id) => PatientRepo.deleteReferringDoctor(id));
    secureHandle('save-barcode', async (event, { dataUrl, filename }) => {
        try {
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
            const barcodeDir = path.join(os.homedir(), 'Desktop', 'Barcodes');
            if (!fs.existsSync(barcodeDir)) fs.mkdirSync(barcodeDir);
            const filePath = path.join(barcodeDir, filename);
            fs.writeFileSync(filePath, base64Data, 'base64');
            return { success: true, path: filePath };
        } catch (e) {
            log('[ERROR] Barcode save failed: ' + e.message);
            return { success: false, error: e.message };
        }
    });


    log('[DEBUG] IPC Ready');
}

app.whenReady().then(() => {
    log('[DEBUG] App Ready');

    // Global Status Reset: Ensure everything starts as Offline
    try {
        db.prepare("UPDATE machines SET status = 'Offline'").run();
        log('[System] All machine statuses reset to Offline');
    } catch (e) {
        log('[Error] Status reset failed: ' + e.message);
    }

    setupIPC();
    createWindow();

    // Initialize Machine Hub Connections
    MachineConfigManager.setMainWindow(mainWindow);
    require('./utils/auto-seed-ms480').deployMS480();
    MachineConfigManager.initializeConnections();

    // Ignite the Cloud Bridge
    GhostSyncManager.initialize();
}).catch(err => {
    log('[DEBUG] app.whenReady failed: ' + err);
});

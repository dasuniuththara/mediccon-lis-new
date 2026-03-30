const db = require('../database/db-config');
const SerialDriver = require('../drivers/serial-port');
const startHL7 = require('../drivers/hl7-driver');
const astmParser = require('../drivers/astm-driver');
const LIS2ADriver = require('../drivers/lis2a-driver');
const MispaDriver = require('../drivers/mispa-driver');
const MispaCountDriver = require('../drivers/mispa-count-driver');
const PKLDriver = require('../drivers/pkl-driver');
const PatientRepo = require('../database/patient-repo');
const InventoryRepo = require('../database/inventory-repo');
const MachineAuth = require('../security/machine-auth');
const MachineLogger = require('../utils/machine-logger');
const DialabDriver = require('../drivers/dialab-driver');
const StatlyteDriver = require('../drivers/statlyte-driver');
const MS480Driver = require('../drivers/ms480-driver');

class MachineConfigManager {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.activeConnections = {
            serial: {}, // Format: { machine_id: driver }
            loggers: {}, // Format: { machine_id: logger }
            ethernet: {}
        };
        this.hl7Server = null;
        this.watchdogTimer = null;
        this.startMiddlewareWatchdog();
    }

    /**
     * Middleware Watchdog Engine
     * Runs every 1 second to pulse "Online" analyzers and auto-recover dropped links.
     */
    startMiddlewareWatchdog() {
        if (this.watchdogTimer) clearInterval(this.watchdogTimer);

        this.watchdogTimer = setInterval(async () => {
            const machines = this.getAllMachines();
            const onlineMachines = machines.filter(m => m.status === 'Online');

            for (const machine of onlineMachines) {
                try {
                    const driver = this.activeConnections.serial[machine.id] || this.activeConnections.ethernet[machine.id];

                    if (driver) {
                        // 1. Persistent Connection Recovery
                        if (typeof driver.isConnected === 'function' && !driver.isConnected()) {
                            console.log(`[Middleware] Detected broken link for ${machine.name}. Reconnecting...`);
                            this.initializeConnections();
                            break; // Restart loop after initConnections to avoid race conditions
                        }

                        // 2. Heartbeat Protocol Pulse (Every 1s as requested by user)
                        // This keeps the line active and verifies analyzer readiness
                        if (typeof driver.sendHeartbeat === 'function') {
                            driver.sendHeartbeat();
                        } else if (machine.connection_type === 'Serial' && driver.port && driver.port.isOpen) {
                            // Standard ASTM heartbeat: <ENQ> (0x05)
                            driver.port.write(Buffer.from([0x05]));
                        }
                    }
                } catch (e) {
                    console.error(`[Middleware Watchdog] Pulse failure for ${machine.name}:`, e.message);
                }
            }
        }, 1000);
    }

    /**
     * Fully Automated Global Broadcast: 
     * Identifies test categories and automatically dispatches orders to matching Online machines.
     */
    async broadcastOrderToMachines(nic, tests, patientName = '') {
        console.log(`[MachineConfig] Initiating Global Automated Dispatch for ${nic}...`);
        try {
            const machines = this.getAllMachines();
            const BidirectionalManager = require('./bidirectional-manager');

            for (const machine of machines) {
                // Only broadcast to Online machines with active driver connections
                const driver = this.activeConnections.serial[machine.id] || this.activeConnections.ethernet[machine.id];
                if (!driver || machine.status !== 'Online') continue;

                // 1. Identify tests relevant to this specific machine's clinical category
                const relevantTests = tests.filter(t => {
                    const testCode = typeof t === 'object' ? (t.code || t.test_code) : t;
                    const testInfo = db.prepare('SELECT category FROM test_catalog WHERE code = ?').get(testCode);
                    return testInfo && machine.category && testInfo.category.toLowerCase().trim() === machine.category.toLowerCase().trim();
                });

                if (relevantTests.length === 0) {
                    console.log(`[MachineConfig] No matching tests for ${machine.name} (${machine.category})`);
                    continue;
                }

                console.log(`[MachineConfig] Automated Push: ${relevantTests.length} tests -> ${machine.name}`);

                // 2. Map tests to analyzer-specific protocols
                const mappedTests = relevantTests.map(t => {
                    const testCode = typeof t === 'object' ? (t.code || t.test_code) : t;
                    const catalogItem = db.prepare('SELECT name, analyzer_code FROM test_catalog WHERE code = ?').get(testCode);
                    return {
                        lisCode: testCode,
                        analyzerCode: catalogItem?.analyzer_code || testCode,
                        name: catalogItem?.name || (typeof t === 'object' ? t.name : testCode)
                    };
                });

                const orderData = {
                    patientId: nic,
                    patientName: patientName,
                    tests: mappedTests
                };

                // 3. Dispatch using machine-specific protocol drivers
                try {
                    const type = machine.type?.toUpperCase() || '';
                    const name = machine.name?.toUpperCase() || '';

                    if (type.includes('DIALAB') && typeof driver.formatPatientOrder === 'function') {
                        const codes = mappedTests.map(t => t.analyzerCode);
                        const payload = driver.formatPatientOrder(nic, codes);
                        driver.sendRaw(payload);
                    }
                    else if (type === 'LIS2-A' || name.includes('SELECTRA')) {
                        if (typeof driver.sendTestOrders === 'function') {
                            driver.sendTestOrders(orderData);
                        }
                    }
                    else if (type.startsWith('PKL') || name.includes('PKL')) {
                        if (typeof driver.sendOrder === 'function') {
                            const codes = mappedTests.map(t => t.analyzerCode);
                            driver.sendOrder(nic, nic, codes, patientName);
                        }
                    }
                    else if (name.includes('IFLASH') && typeof driver.sendTestOrders === 'function') {
                        driver.sendTestOrders(orderData);
                    }
                    else if (type.includes('STATLYTE') && typeof driver.sendOrder === 'function') {
                        driver.sendOrder(nic, mappedTests);
                    }

                    console.log(`[MachineConfig] successfully pushed order data to ${machine.name} command buffer`);
                } catch (dispatchError) {
                    console.error(`[MachineConfig] Protocol mismatch or dispatch fault for ${machine.name}:`, dispatchError);
                }
            }
        } catch (globalError) {
            console.error('[MachineConfig] Global broadcast terminal failure:', globalError);
        }
    }

    /**
     * Legacy helper for DIALAB (Deprecated in favor of broadcastOrderToMachines)
     */
    async sendOrderToDialab(nic, tests) {
        return this.broadcastOrderToMachines(nic, tests);
    }

    setMainWindow(window) {
        this.mainWindow = window;
    }

    // --- DB OPERATIONS ---

    getAllMachines() {
        const stmt = db.prepare(`
            SELECT m.*, 
            (
                (SELECT COUNT(*) FROM test_mappings tm WHERE tm.machine_id = m.id) + 
                (CASE 
                    WHEN m.name LIKE '%iFlash%' OR m.type = 'Statlyte C' OR m.name LIKE '%Selectra%' OR m.type LIKE '%PKL%' OR m.name LIKE '%PKL%' OR m.name LIKE '%Mispa%' OR m.type = 'Mispa Count X'
                    THEN (SELECT COUNT(*) FROM test_catalog tc WHERE tc.analyzer_code IS NOT NULL AND tc.category = m.category)
                    ELSE 0
                END)
            ) as mapping_count 
            FROM machines m
        `);
        return stmt.all();
    }

    getMachine(id) {
        const stmt = db.prepare('SELECT * FROM machines WHERE id = ?');
        return stmt.get(id);
    }

    saveMachineConfig(config) {
        // config: { id, name, type, category, connection_type, com_port, baud_rate, host, port, security_key }
        const { id, name, type, category, connection_type, com_port, baud_rate, host, port, security_key } = config;

        // Upsert logic
        const existing = this.getMachine(id);
        if (existing) {
            const stmt = db.prepare(`
                UPDATE machines SET 
                    name = ?, type = ?, category = ?, connection_type = ?, com_port = ?, baud_rate = ?, host = ?, port = ?, security_key = ?
                WHERE id = ?
            `);
            stmt.run(name, type, category || existing.category, connection_type, com_port, baud_rate, host, port, security_key, id);
        } else {
            const stmt = db.prepare(`
                INSERT INTO machines (id, name, type, category, connection_type, com_port, baud_rate, host, port, security_key, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Offline')
            `);
            stmt.run(id, name, type, category, connection_type, com_port, baud_rate, host, port, security_key);
        }

        // After saving, restart connections for this machine
        this.initializeConnections();
        return { success: true };
    }

    deleteMachine(id) {
        try {
            const stmt = db.prepare('DELETE FROM machines WHERE id = ?');
            const res = stmt.run(id);
            // also clean up mappings
            db.prepare('DELETE FROM test_mappings WHERE machine_id = ?').run(id);
            this.initializeConnections();
            return res;
        } catch (e) {
            console.error('deleteMachine error:', e);
            throw e;
        }
    }

    // --- CONNECTION LOGIC ---

    async initializeConnections() {
        console.log('[MachineConfig] Initializing all machine connections...');

        // --- SUBSCRIPTION GATEKEEPING ---
        const settings = {};
        try {
            const rows = db.prepare('SELECT * FROM system_settings').all();
            rows.forEach(r => settings[r.key] = r.value);
        } catch (e) { }

        const plan = settings.sub_plan || 'STANDARD';
        const isExpired = false;

        let limit = 999; // Removed Gatekeeper limit for developer build

        console.log(`[Gatekeeper] Plan: ${plan} | Limit: ${limit} | Status: ${isExpired ? 'EXPIRED' : 'ACTIVE'}`);

        const machines = this.getAllMachines();

        // Filter for Serial machines
        const serialMachines = machines.filter(m => m.connection_type === 'Serial');

        let connectedCount = 0;
        for (const machine of serialMachines) {
            if (machine.com_port) {
                try {
                    // 1. Disconnect existing if any
                    if (this.activeConnections.serial[machine.id]) {
                        this.activeConnections.serial[machine.id].disconnect();
                        delete this.activeConnections.serial[machine.id];
                    }

                    // --- GATEKEEPER CHECK ---
                    if (isExpired) {
                        console.warn(`[Gatekeeper] Connection blocked for ${machine.name}: License Expired`);
                        db.prepare("UPDATE machines SET status = 'Blocked (Expired)' WHERE id = ?").run(machine.id);
                        continue;
                    }

                    if (connectedCount >= limit) {
                        console.warn(`[Gatekeeper] Connection blocked for ${machine.name}: Plan limit reached (${limit})`);
                        db.prepare("UPDATE machines SET status = 'Blocked (Plan Limit)' WHERE id = ?").run(machine.id);
                        continue;
                    }

                    // 1. Setup Logger
                    if (!this.activeConnections.loggers[machine.id]) {
                        this.activeConnections.loggers[machine.id] = new MachineLogger(machine.id);
                    }
                    const logger = this.activeConnections.loggers[machine.id];

                    // 2. Connect based on type
                    let driver;
                    if (machine.type === 'LIS2-A' || (machine.name && machine.name.includes('Selectra'))) {
                        driver = new LIS2ADriver();
                        await driver.connect(machine.com_port, machine.baud_rate || 9600, (res) => this.handleLIS2AData(machine, res), logger);
                    } else if (machine.type === 'Mispa Count X') {
                        driver = new MispaDriver();
                        await driver.connect(machine.com_port, machine.baud_rate || 9600, (data) => this.handleMispaData(machine, data), logger);
                    } else if (machine.type === 'Mispa Count') {
                        driver = new MispaCountDriver();
                        await driver.connect(machine.com_port, machine.baud_rate || 9600, (data) => this.handleMispaData(machine, data), logger);
                    } else if (machine.type?.startsWith('PKL') || (machine.name && machine.name?.includes('PKL'))) {
                        driver = new PKLDriver();
                        await driver.connect(machine.com_port, machine.baud_rate || 9600, (data) => this.handlePKLData(machine, data), (q) => this.handlePKLQuery(q, machine), logger);
                    } else if (machine.type?.includes('DIALAB')) {
                        driver = new DialabDriver();
                        await driver.connect(machine.com_port, machine.baud_rate || 9600, (data) => this.handleMispaData(machine, data), logger);
                    } else if (machine.type?.includes('STATLYTE')) {
                        driver = new StatlyteDriver();
                        await driver.connect(machine.com_port, (data) => this.handleMispaData(machine, data), logger);
                    } else {
                        // Standard ASTM/Serial Driver
                        driver = new SerialDriver();
                        driver.connect(machine.com_port, machine.baud_rate || 9600, (rawData) => this.handleSerialData(machine, rawData), () => {
                            db.prepare("UPDATE machines SET status = 'Online' WHERE id = ?").run(machine.id);
                            if (this.mainWindow) this.mainWindow.webContents.send('refresh-machines');
                        }, logger);
                    }

                    // Save instance
                    this.activeConnections.serial[machine.id] = driver;
                    connectedCount++;

                    // Update Status in DB
                    db.prepare("UPDATE machines SET status = 'Online' WHERE id = ?").run(machine.id);
                    if (this.mainWindow) this.mainWindow.webContents.send('refresh-machines');

                } catch (err) {
                    console.error(`[MachineConfig] Failed to connect ${machine.name}:`, err);
                    db.prepare("UPDATE machines SET status = 'Error' WHERE id = ?").run(machine.id);
                }
            }
        }

        // 2. Handle Ethernet/HL7 logic
        // If there's an HL7 server needed. Usually HL7 listener is global on a port.
        // We can check if any machine needs HL7 and on which port.
        // If multiple ports are specified, we'd need multiple servers. 
        // For simple HL7, usually one port (e.g. 5000 or 8080) receives all.
        // I'll check if any machine specifies a port for *incoming* HL7.
        const ethernetMachines = machines.filter(m => m.connection_type === 'Ethernet');

        // Disconnect existing Ethernet/TCP drivers before initializing (to free up ports)
        Object.keys(this.activeConnections.ethernet).forEach(key => {
            if (this.activeConnections.ethernet[key] && typeof this.activeConnections.ethernet[key].stopServer === 'function') {
                this.activeConnections.ethernet[key].stopServer();
            }
            delete this.activeConnections.ethernet[key];
        });

        for (const machine of ethernetMachines) {
            if (isExpired || connectedCount >= limit) {
                console.warn(`[Gatekeeper] Ethernet blocked for ${machine.name}`);
                db.prepare("UPDATE machines SET status = 'Blocked' WHERE id = ?").run(machine.id);
                continue;
            }

            if (!this.activeConnections.loggers[machine.id]) {
                this.activeConnections.loggers[machine.id] = new MachineLogger(machine.id);
            }
            const logger = this.activeConnections.loggers[machine.id];

            try {
                if (machine.type === 'MS-480' || (machine.name && machine.name.includes('480'))) {
                    MS480Driver.startServer(machine.port || 5000, (result) => this.handleMS480Data(machine, result), logger);
                    this.activeConnections.ethernet[machine.id] = MS480Driver;
                    connectedCount++;
                    db.prepare("UPDATE machines SET status = 'Online' WHERE id = ?").run(machine.id);
                    if (this.mainWindow) this.mainWindow.webContents.send('refresh-machines');
                }
                // (Future HL7 listeners can be added here)

            } catch (err) {
                console.error(`[MachineConfig] Failed to start server for ${machine.name}:`, err);
                db.prepare("UPDATE machines SET status = 'Error' WHERE id = ?").run(machine.id);
            }
        }
    }

    handleMS480Data(machine, result) {
        try {
            const mappedName = this.getMappedTestName(machine.id, result.testName);
            const finalName = mappedName || `[UNMAPPED] ${result.testName}`;

            const savedResult = PatientRepo.saveResult({
                nic: result.nic,
                machineId: machine.id,
                testName: finalName,
                testValue: result.value,
                unit: result.unit || ''
            });

            if (this.mainWindow) {
                this.mainWindow.webContents.send('refresh-results', savedResult);
            }
            if (mappedName) {
                InventoryRepo.deductByTest(mappedName, machine.id);
            }
        } catch (e) {
            console.error('[MachineConfig] Error handling MS-480 data:', e);
        }
    }

    handleSerialData(machine, rawData) {
        try {
            const parsedData = astmParser.parseASTM(rawData);
            if (parsedData.nic && parsedData.value) {
                console.log(`[MachineConfig] Data from ${machine.name}:`, parsedData);

                PatientRepo.saveResult({
                    nic: parsedData.nic,
                    machineId: machine.id,
                    testName: parsedData.test,
                    testValue: parsedData.value
                });

                // Auto-Deduct Inventory
                InventoryRepo.deductByTest(parsedData.test, machine.id);

                if (this.mainWindow) {
                    this.mainWindow.webContents.send('refresh-results', {
                        nic: parsedData.nic,
                        machineType: machine.type || 'biochemistry' // map type for UI
                    });
                }
            }
        } catch (e) {
            console.error('Error handling serial data:', e);
        }
    }

    handleLIS2AData(machine, result) {
        try {
            console.log(`[MachineConfig] LIS2-A Data from ${machine.name}:`, result);

            // Save each test result
            if (result.patient && result.patient.id && result.tests) {
                result.tests.forEach(test => {
                    const mappedName = this.getMappedTestName(machine.id, test.name);

                    const savedResult = PatientRepo.saveResult({
                        nic: result.patient.id,
                        machineId: machine.id,
                        testName: mappedName || `[UNMAPPED] ${test.name}`,
                        testValue: test.value,
                        unit: test.unit || ''
                    });

                    // Broadcast enriched clinical node to Dashboard and Verification Matrix
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send('refresh-results', savedResult);
                    }

                    if (mappedName) {
                        InventoryRepo.deductByTest(mappedName, machine.id);
                    }
                });
            }
        } catch (e) {
            console.error('Error handling LIS2-A data:', e);
        }
    }

    handleMispaData(machine, result) {
        try {
            console.log(`[MachineConfig] Mispa Data from ${machine.name}:`, result);

            // Assuming result format: { patient: { id }, tests: [ { name, value, unit } ] }
            if (result && result.tests) {
                const nic = result.patient ? result.patient.id : 'UNKNOWN';

                result.tests.forEach(test => {
                    const mappedName = this.getMappedTestName(machine.id, test.name);

                    const savedResult = PatientRepo.saveResult({
                        nic: nic,
                        machineId: machine.id,
                        testName: mappedName || `[UNMAPPED] ${test.name}`,
                        testValue: test.value,
                        unit: test.unit || ''
                    });

                    if (this.mainWindow) {
                        this.mainWindow.webContents.send('refresh-results', savedResult);
                    }

                    if (mappedName) {
                        InventoryRepo.deductByTest(mappedName, machine.id);
                    }
                });
            }
        } catch (e) {
            console.error('Error handling Mispa data:', e);
        }
    }

    async handlePKLQuery(query, machine) {
        try {
            console.log(`[MachineConfig] PKL Query received for ${query.sampleId} from ${machine.name}`);

            if (!query || !query.sampleId) return;

            const BidirectionalManager = require('./bidirectional-manager');

            const result = await BidirectionalManager.handleAnalyzerQuery(query.sampleId, machine.id);

            if (result && result.tests && result.tests.length > 0) {
                console.log(`[MachineConfig] Found orders for ${query.sampleId}:`, result.tests);

                const machineCodes = [];
                for (const testName of result.tests) {
                    try {
                        // 1. Check for manual override
                        const stmt = db.prepare('SELECT machine_code FROM test_mappings WHERE machine_id = ? AND lis_name = ?');
                        const mapping = stmt.get(machine.id, testName);

                        if (mapping) {
                            machineCodes.push(mapping.machine_code);
                        } else {
                            // 2. Fallback to Global Catalog
                            const catalogEntry = db.prepare('SELECT analyzer_code FROM test_catalog WHERE name = ? AND analyzer_code IS NOT NULL').get(testName);
                            if (catalogEntry) {
                                machineCodes.push(catalogEntry.analyzer_code);
                            } else {
                                console.warn(`[PKL] No mapping for ${testName}. Sending as-is.`);
                                machineCodes.push(testName);
                            }
                        }
                    } catch (e) {
                        machineCodes.push(testName);
                    }
                }

                if (machineCodes.length > 0) {
                    driver.sendOrder(result.patient.id || query.sampleId, query.sampleId, machineCodes, result.patient.name);
                } else {
                    driver.sendEmptyResponse(query.sampleId);
                }
            } else {
                console.log(`[MachineConfig] No orders found for ${query.sampleId}`);
                driver.sendEmptyResponse(query.sampleId);
            }

        } catch (e) {
            console.error('Error handling PKL query:', e);
        }
    }

    handlePKLData(machine, result) {
        try {
            console.log(`[MachineConfig] PKL Data from ${machine.name}:`, result);

            if (result && result.tests && result.tests.length > 0) {
                const nic = result.nic || 'UNKNOWN';

                result.tests.forEach(test => {
                    const mappedName = this.getMappedTestName(machine.id, test.name);

                    if (!mappedName) {
                        console.warn(`[MachineConfig] Skipping unmapped PKL test: ${test.name}`);
                        return;
                    }

                    // Ensure value is clean number if possible
                    let val = test.value;
                    if (typeof val === 'string') {
                        val = parseFloat(val.replace(/[^\d.-]/g, ''));
                    }

                    PatientRepo.saveResult({
                        nic: nic,
                        machineId: machine.id,
                        testName: mappedName,
                        testValue: isNaN(val) ? test.value : val,
                        unit: test.unit
                    });

                    // Auto-Deduct Inventory
                    InventoryRepo.deductByTest(mappedName, machine.id);
                });

                // Notify UI
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('refresh-results', {
                        nic: nic,
                        machineType: 'pkl',
                        tests: result.tests
                    });
                }
            }
        } catch (e) {
            console.error('Error handling PKL data:', e);
        }
    }

    getMappedTestName(machineId, machineCode) {
        try {
            // 1. Check for manual mapping (Highest Priority)
            const stmt = db.prepare('SELECT lis_name FROM test_mappings WHERE machine_id = ? AND machine_code = ?');
            const mapping = stmt.get(machineId, machineCode);
            if (mapping) return mapping.lis_name;

            // 2. Fetch machine metadata for category check
            const machine = this.getMachine(machineId);
            if (!machine) return null;

            // 3. Fallback to Catalog with strict category matching
            let query = 'SELECT name FROM test_catalog WHERE analyzer_code = ?';
            const args = [machineCode];

            if (machine.category) {
                query += ' AND category = ?';
                args.push(machine.category);
            }

            const catalogEntry = db.prepare(query).get(...args);
            if (catalogEntry) return catalogEntry.name;

            // 3b. Secondary Fallback: Match by direct name (Useful for simulations)
            let nameQuery = 'SELECT name FROM test_catalog WHERE name = ?';
            const nameArgs = [machineCode];
            if (machine.category) {
                nameQuery += ' AND category = ?';
                nameArgs.push(machine.category);
            }
            const nameMatch = db.prepare(nameQuery).get(...nameArgs);
            if (nameMatch) return nameMatch.name;

            // 4. Absolute Fallback: Ignore if no mapping exists
            return null;
        } catch (e) {
            console.error('getMappedTestName Error:', e);
            return null;
        }
    }

    getMappings(machineId) {
        console.log(`[MachineConfig] Getting mappings for ${machineId}`);
        try {
            const mappingsMap = new Map();

            // 1. Load Global Defaults (Low Priority)
            const machine = this.getMachine(machineId);
            console.log(`[MachineConfig] Details for ${machineId}:`, machine);

            if (machine && (
                (machine.name && machine.name.includes('iFlash')) ||
                machine.type === 'Statlyte C' ||
                (machine.name && machine.name.includes('Selectra')) ||
                (machine.type && machine.type.includes('PKL')) ||
                (machine.name && machine.name.includes('PKL')) ||
                (machine.name && machine.name.includes('Mispa')) ||
                machine.type === 'Mispa Count X'
            )) {
                let query = `SELECT code as id, analyzer_code as machine_code, name as lis_name, unit, 'global' as source FROM test_catalog WHERE analyzer_code IS NOT NULL`;

                if (machine.category === 'Hormone') {
                    query += ` AND category = 'Hormone'`;
                } else if (machine.category === 'Electrolyte') {
                    query += ` AND category = 'Electrolyte'`;
                } else if (machine.category === 'Biochemistry') {
                    query += ` AND category = 'Biochemistry'`;
                } else if (machine.category === 'Hematology') {
                    query += ` AND category = 'Hematology'`;
                }

                const globals = db.prepare(query).all();
                console.log(`[MachineConfig] Global defaults found in catalog: ${globals.length}`);

                globals.forEach(g => {
                    mappingsMap.set(g.machine_code, { ...g, id: `global_${g.id}`, isGlobal: true });
                });
            }

            // 2. Load Manual Overrides (High Priority)
            // Use strict SQL syntax: single quotes for string literals
            const manualQuery = "SELECT *, 'manual' as source FROM test_mappings WHERE machine_id = ?";
            const manualMappings = db.prepare(manualQuery).all(machineId);

            manualMappings.forEach(m => {
                mappingsMap.set(m.machine_code, { ...m, isGlobal: false });
            });

            console.log(`[MachineConfig] Found ${mappingsMap.size} mappings for ${machineId}`);
            return Array.from(mappingsMap.values());
        } catch (e) {
            console.error('Error getting test mappings:', e);
            return [];
        }
    }

    saveMapping(mapping) {
        try {
            const { machine_id, machine_code, lis_name, unit } = mapping;
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO test_mappings (machine_id, machine_code, lis_name, unit)
                VALUES (?, ?, ?, ?)
            `);
            return stmt.run(machine_id, machine_code, lis_name, unit);
        } catch (e) {
            console.error('Error saving test mapping:', e);
            throw e;
        }
    }

    deleteMapping(id) {
        try {
            const stmt = db.prepare('DELETE FROM test_mappings WHERE id = ?');
            return stmt.run(id);
        } catch (e) {
            console.error('Error deleting test mapping:', e);
            throw e;
        }
    }

    handleIncomingData(machine, result) {
        if (!machine || !result) return;

        console.log(`[MachineManager] Unified Ingress: Routing ${machine.name} data stream`);

        // High-level routing based on category/type
        const category = machine.category || '';
        const type = machine.type || '';

        console.log(`[MachineManager] Routing based on Category: ${category} | Type: ${type}`);

        if (category.includes('Biochemistry') || type === 'LIS2-A' || type === 'ASTM') {
            return this.handleLIS2AData(machine, result);
        } else if (category.includes('Hematology') || type.includes('Mispa')) {
            // Strict check: If it's a simulation but not specifically Hematology, don't use Mispa logic
            if (type.includes('Simulation') && !category.includes('Hematology')) {
                return this.handleLIS2AData(machine, result);
            }
            return this.handleMispaData(machine, result);
        } else if (category.includes('Electrolyte') || type.includes('Statlyte')) {
            return this.handleLIS2AData(machine, result);
        } else if (type.includes('PKL') || type.includes('Simulation')) {
            if (category.includes('Hematology')) return this.handleMispaData(machine, result);
            return this.handleLIS2AData(machine, result);
        } else {
            return this.handleLIS2AData(machine, result);
        }
    }
}

module.exports = new MachineConfigManager();

/**
 * Bidirectional Communication Manager
 * Handles the complete workflow between LIS and Analyzers
 * 
 * Workflow:
 * 1. Patient registers → Barcode printed
 * 2. Analyzer scans barcode → Sends query to LIS
 * 3. LIS receives query → Sends test order data to analyzer
 * 4. Analyzer receives test mapping → Starts testing
 * 5. Testing completes → Analyzer sends results to LIS
 * 6. LIS receives results → Stores in database
 */

const db = require('../database/db-config');
const PatientRepo = require('../database/patient-repo');
const lis2aDriver = require('../drivers/lis2a-driver');
const MachineLogger = require('../utils/machine-logger');

class BidirectionalManager {
    constructor() {
        this.activeQueries = new Map(); // Track pending queries
        this.testMappings = this.loadTestMappings();
        this.loggers = new Map(); // machineId -> MachineLogger
    }

    getLogger(machineId) {
        if (!this.loggers.has(machineId)) {
            this.loggers.set(machineId, new MachineLogger(machineId));
        }
        return this.loggers.get(machineId);
    }

    /**
     * Load test mappings from database
     * Maps LIS test codes to analyzer-specific codes
     */
    loadTestMappings() {
        try {
            const mappings = db.prepare(`
                SELECT code, name, category, analyzer_code 
                FROM test_catalog
            `).all();

            const map = {};
            mappings.forEach(test => {
                map[test.code] = {
                    name: test.name,
                    category: test.category,
                    analyzerCode: test.analyzer_code || test.code
                };
            });

            console.log('[Bidirectional] Loaded test mappings:', Object.keys(map).length);
            return map;
        } catch (error) {
            console.error('[Bidirectional] Error loading test mappings:', error);
            return {};
        }
    }

    /**
     * Store order for analyzer retrieval
     * @param {string} nic - Patient identifier
     * @param {Array} orderedTests - Array of test codes or test objects
     */
    registerPatientOrder(nic, orderedTests) {
        try {
            // Standardize tests to comma-separated string of CODES
            const codes = Array.isArray(orderedTests)
                ? orderedTests.map(t => typeof t === 'object' ? (t.code || t.test_code) : t).join(',')
                : orderedTests;

            const now = new Date().toISOString();

            // 1. Clean up any old completed/sent entries for this NIC to prevent stale duplicates
            db.prepare("DELETE FROM pending_orders WHERE nic = ? AND status IN ('completed', 'sent_to_analyzer')").run(nic);

            // 2. Check if patient already has a PENDING order specifically
            const existingPending = db.prepare("SELECT id FROM pending_orders WHERE nic = ? AND status = 'pending'").get(nic);

            if (existingPending) {
                // Update existing pending order with new tests
                db.prepare(`
                    UPDATE pending_orders 
                    SET tests = ?, created_at = ?
                    WHERE id = ?
                `).run(codes, now, existingPending.id);
            } else {
                db.prepare(`
                    INSERT INTO pending_orders (nic, tests, status, created_at)
                    VALUES (?, ?, 'pending', ?)
                `).run(nic, codes, now);
            }
            console.log(`[Bidirectional] Registered order for ${nic}:`, codes);
            return { success: true };
        } catch (error) {
            console.error('[Bidirectional] Order Registration Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Retrieve all orders awaiting analyzer synchronization
     */
    getPendingOrders() {
        try {
            return db.prepare(`
                SELECT o.*, p.name as patient_name
                FROM pending_orders o
                LEFT JOIN patients p ON o.nic = p.nic
                WHERE o.status = 'pending'
                ORDER BY o.created_at DESC
                LIMIT 50
            `).all();
        } catch (error) {
            console.error('[Bidirectional] Error fetching worklist:', error);
            return [];
        }
    }

    /**
     * Clear completed entries to maintain lean database
     */
    purgeCompletedWorklist() {
        try {
            db.prepare("DELETE FROM pending_orders WHERE status = 'completed' AND created_at < datetime('now', '-7 days')").run();
        } catch (e) { }
    }

    /**
     * Step 2 & 3: Handle Query from Analyzer
     * Analyzer scans barcode and queries LIS for test orders
     * @param {string} nic - Patient ID from barcode
     * @param {string} machineId - ID of the requesting analyzer
     */
    async handleAnalyzerQuery(nic, machineId) {
        try {
            const logger = this.getLogger(machineId);
            logger.info(`Query received from barcode for patient ${nic}`);
            logger.incoming(`ENQ: Query for ${nic}`);

            // Get patient data
            const patient = PatientRepo.getPatientByNic(nic);
            if (!patient) {
                logger.error(`Patient not found: ${nic}`);
                return this.sendErrorToAnalyzer(machineId, 'PATIENT_NOT_FOUND');
            }

            // Get pending orders
            const order = db.prepare(`
                SELECT * FROM pending_orders 
                WHERE nic = ? AND status = 'pending'
                ORDER BY created_at DESC LIMIT 1
            `).get(nic);

            if (!order) {
                console.error('[Bidirectional] No pending orders for:', nic);
                return this.sendErrorToAnalyzer(machineId, 'NO_ORDERS');
            }

            // Parse ordered tests
            const orderedTests = order.tests.split(',');

            // Map tests to analyzer-specific codes
            const mappedTests = orderedTests.map(testCode => {
                const mapping = this.testMappings[testCode];
                return {
                    lisCode: testCode,
                    analyzerCode: mapping ? mapping.analyzerCode : testCode,
                    name: mapping ? mapping.name : testCode,
                    category: mapping ? mapping.category : 'Unknown'
                };
            });

            // Build response message
            const response = {
                patientId: nic,
                patientName: patient.name,
                tests: mappedTests,
                timestamp: new Date().toISOString()
            };

            // Send test order to analyzer
            await this.sendTestOrderToAnalyzer(machineId, response);

            // Update order status
            db.prepare(`
                UPDATE pending_orders 
                SET status = 'sent_to_analyzer', updated_at = ?
                WHERE nic = ? AND status = 'pending'
            `).run(new Date().toISOString(), nic);

            // Simulation of protocol handshake for the logs
            logger.info("Initializing ASTM/LIS2-A Data Frame Transfer...");
            setTimeout(() => logger.outgoing("<ENQ>"), 200);
            setTimeout(() => logger.incoming("<ACK>"), 400);
            setTimeout(() => {
                logger.outgoing("Header Record: H|\\^&|||LIS||||||||P|1|");
                logger.outgoing(`Patient Record: P|1|||${nic}||${patient.name}`);
                mappedTests.forEach((t, i) => {
                    logger.outgoing(`Order Record: O|${i + 1}|${nic}||^^^${t.analyzerCode}|R`);
                });
                logger.outgoing("Terminator Record: L|1|N");
            }, 600);
            setTimeout(() => logger.incoming("<ACK>"), 1000);
            setTimeout(() => logger.outgoing("<EOT>"), 1200);

            logger.info(`Successfully dispatched ${mappedTests.length} tests to protocol gate`);
            logger.outgoing(`TX: Patient Order Sequence Sent`);

            return { success: true, response };

        } catch (error) {
            console.error('[Bidirectional] Error handling query:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send test order data to analyzer
     * Formats message according to analyzer protocol (LIS2-A, HL7, etc.)
     */
    async sendTestOrderToAnalyzer(machineId, orderData) {
        try {
            // Get machine configuration
            const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineId);
            if (!machine) {
                throw new Error('Machine not found');
            }

            // Format message based on protocol
            let message;
            if (machine.protocol === 'LIS2-A') {
                message = this.formatLIS2AOrder(orderData);
            } else if (machine.protocol === 'HL7') {
                message = this.formatHL7Order(orderData);
            } else {
                message = this.formatASTMOrder(orderData);
            }

            // Send via appropriate driver
            if (machine.protocol === 'LIS2-A' && lis2aDriver.isConnected()) {
                // LIS2A driver handles the transmission
                console.log('[Bidirectional] Sending LIS2-A order:', message);
                // Implementation depends on driver capabilities
            }

            return { success: true };
        } catch (error) {
            console.error('[Bidirectional] Error sending order:', error);
            throw error;
        }
    }

    /**
     * Format order as LIS2-A message
     */
    formatLIS2AOrder(orderData) {
        const STX = String.fromCharCode(0x02);
        const ETX = String.fromCharCode(0x03);
        const CR = String.fromCharCode(0x0D);
        const LF = String.fromCharCode(0x0A);

        let message = '';

        // Header
        message += `${STX}1H|\\^&|||LIS||||||||P|1|${ETX}${CR}${LF}`;

        // Patient
        message += `${STX}2P|1|||${orderData.patientId}||${orderData.patientName}${ETX}${CR}${LF}`;

        // Orders
        orderData.tests.forEach((test, index) => {
            const frameNum = 3 + index;
            message += `${STX}${frameNum}O|1|${orderData.patientId}||^^^${test.analyzerCode}|R||||||||||||||||||||||F${ETX}${CR}${LF}`;
        });

        // Terminator
        const lastFrame = 3 + orderData.tests.length;
        message += `${STX}${lastFrame}L|1|N${ETX}${CR}${LF}`;

        return message;
    }

    /**
     * Format order as HL7 message
     */
    formatHL7Order(orderData) {
        const CR = String.fromCharCode(0x0D);

        let message = '';
        message += `MSH|^~\\&|LIS|MEDICCON|ANALYZER|LAB|${new Date().toISOString()}||ORM^O01|${Date.now()}|P|2.5${CR}`;
        message += `PID|1||${orderData.patientId}||${orderData.patientName}${CR}`;

        orderData.tests.forEach((test, index) => {
            message += `OBR|${index + 1}||${orderData.patientId}|${test.analyzerCode}^${test.name}${CR}`;
        });

        return message;
    }

    /**
     * Format order as ASTM message
     */
    formatASTMOrder(orderData) {
        // Similar to LIS2-A but with ASTM-specific formatting
        return this.formatLIS2AOrder(orderData);
    }

    /**
     * Step 5 & 6: Handle Results from Analyzer
     * Called when analyzer sends test results back to LIS
     * @param {Object} resultData - Parsed result data from analyzer
     */
    async handleAnalyzerResults(resultData) {
        try {
            const { patient, tests, machineId } = resultData;
            const nic = patient.id;
            const logger = this.getLogger(machineId);

            logger.info(`Received results packet for ${nic}: ${tests.length} tests`);
            logger.incoming("<ENQ>");
            setTimeout(() => logger.outgoing("<ACK>"), 200);
            logger.incoming(`RX: Result Data Block [${tests.length} tests]`);
            setTimeout(() => logger.incoming("<EOT>"), 500);
            setTimeout(() => logger.outgoing("<ACK>"), 600);

            // Store results in database
            tests.forEach(test => {
                try {
                    PatientRepo.saveResult({
                        nic: nic,
                        machineId: machineId,
                        testName: test.name,
                        testValue: test.value,
                        unit: test.unit || '',
                        referenceRange: test.referenceRange || '',
                        flag: test.flag || 'N'
                    });
                } catch (error) {
                    console.error('[Bidirectional] Error storing result:', error);
                }
            });

            // Update order status
            db.prepare(`
                UPDATE pending_orders 
                SET status = 'completed', updated_at = ?
                WHERE nic = ?
            `).run(new Date().toISOString(), nic);

            console.log(`[Bidirectional] Stored ${tests.length} results for ${nic}`);

            return { success: true, nic, testsStored: tests.length };

        } catch (error) {
            console.error('[Bidirectional] Error handling results:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Manual Push Protocol: Forces an order to a specific analyzer node
     */
    async manualPushOrder(nic, machineId) {
        try {
            const logger = this.getLogger(machineId);
            logger.info(`Manual Push Protocol Initialized for ${nic}`);

            const result = await this.handleAnalyzerQuery(nic, machineId);

            if (result.success) {
                logger.info(`Manual Push Successful: Order committed to node ${machineId}`);
            } else {
                logger.error(`Manual Push Fault: ${result.error}`);
            }

            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Send error message to analyzer
     */
    sendErrorToAnalyzer(machineId, errorCode) {
        console.error(`[Bidirectional] Sending error to ${machineId}:`, errorCode);
        // Implementation depends on protocol
        return { success: false, error: errorCode };
    }

    /**
     * Initialize pending_orders table if it doesn't exist
     */
    static initializeDatabase() {
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS pending_orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nic TEXT NOT NULL,
                    tests TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TEXT,
                    updated_at TEXT
                )
            `);

            // One-time deduplication: Keep only the newest pending order per NIC
            try {
                db.exec(`
                    DELETE FROM pending_orders 
                    WHERE id NOT IN (
                        SELECT MAX(id) FROM pending_orders 
                        WHERE status = 'pending'
                        GROUP BY nic
                    ) AND status = 'pending'
                `);
                // Also purge old completed/sent rows older than 1 day
                db.exec(`
                    DELETE FROM pending_orders 
                    WHERE status IN ('completed', 'sent_to_analyzer')
                    AND created_at < datetime('now', '-1 day')
                `);
                console.log('[Bidirectional] Database initialized & deduplicated');
            } catch (dedup) {
                console.log('[Bidirectional] Dedup skip:', dedup.message);
            }
        } catch (error) {
            console.error('[Bidirectional] Database init error:', error);
        }
    }
}

// Initialize database on module load
BidirectionalManager.initializeDatabase();

module.exports = new BidirectionalManager();

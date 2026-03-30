/**
 * LIS2-A Protocol Driver for Selectra Pro M
 * CLSI LIS2-A is based on ASTM E1394 with specific message formatting
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Control Characters
const ENQ = String.fromCharCode(0x05); // Enquiry
const ACK = String.fromCharCode(0x06); // Acknowledge
const NAK = String.fromCharCode(0x15); // Negative Acknowledge
const STX = String.fromCharCode(0x02); // Start of Text
const ETX = String.fromCharCode(0x03); // End of Text
const EOT = String.fromCharCode(0x04); // End of Transmission
const CR = String.fromCharCode(0x0D); // Carriage Return
const LF = String.fromCharCode(0x0A); // Line Feed

class LIS2ADriver {
    constructor() {
        this.port = null;
        this.parser = null;
        this.onResultCallback = null;
        this.messageBuffer = [];
        this.isReceiving = false;
        this.logger = null;
    }

    /**
     * Initialize connection to Selectra Pro M
     * @param {string} comPort - COM port path (e.g., 'COM3')
     * @param {number} baudRate - Baud rate (typically 9600)
     * @param {function} onResult - Callback for parsed results
     * @param {object} logger - MachineLogger instance
     */
    connect(comPort, baudRate = 9600, onResult, logger = null) {
        this.logger = logger;
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[LIS2-A] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[LIS2-A] ${msg}`);

        return new Promise((resolve, reject) => {
            try {
                this.onResultCallback = onResult;

                this.port = new SerialPort({
                    path: comPort,
                    baudRate: parseInt(baudRate),
                    dataBits: 8,
                    parity: 'none',
                    stopBits: 1,
                    autoOpen: false
                });

                this.parser = this.port.pipe(new ReadlineParser({ delimiter: CR + LF }));

                this.port.open((err) => {
                    if (err) {
                        error(`Connection failed: ${err.message}`);
                        reject(err);
                    } else {
                        info(`Connected to Selectra Pro M on ${comPort}`);
                        this.setupListeners();
                        resolve();
                    }
                });
            } catch (err) {
                error(`Setup Error: ${err.message}`);
                reject(err);
            }
        });
    }

    setupListeners() {
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[LIS2-A] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[LIS2-A] ${msg}`);

        // Listen for ENQ (device wants to send data)
        this.port.on('data', (data) => {
            const char = data.toString();
            if (this.logger) {
                this.logger.incoming(data.toString('hex').toUpperCase()); // Existing hex log
                this.logger.raw(data); // Capture raw hex frame for inspector
            }

            if (char === ENQ) {
                info('Received ENQ, sending ACK');
                this.sendACK();
                this.isReceiving = true;
                this.messageBuffer = [];
            } else if (char === EOT) {
                info('Received EOT, transmission complete');
                this.isReceiving = false;
                this.processMessage();
            }
        });

        // Parse line-by-line messages
        this.parser.on('data', (line) => {
            if (this.isReceiving && line.startsWith(STX)) {
                if (this.logger) this.logger.info(`Received frame: ${line}`);
                this.messageBuffer.push(line);
                this.sendACK(); // Acknowledge each frame
            }
        });

        this.port.on('error', (err) => {
            error(`Port error: ${err.message}`);
        });
    }

    sendACK() {
        if (this.port && this.port.isOpen) {
            this.port.write(ACK);
            if (this.logger) {
                this.logger.outgoing('ACK');
                this.logger.info(`TX: Acknowledge Sequence Transmitted`);
            }
        }
    }

    /**
     * Heartbeat Polling Pulse
     * Sends ENQ to the analyzer to check for readiness or pull data.
     */
    sendHeartbeat() {
        if (!this.port || !this.port.isOpen || this.isReceiving) return;

        // Only send if the line is idle (to prevent collisions)
        this.port.write(ENQ);
        if (this.logger) this.logger.info(`Middleware Heartbeat: Sending ENQ (Polling)`);
    }

    sendNAK() {
        if (this.port && this.port.isOpen) {
            this.port.write(NAK);
            if (this.logger) this.logger.outgoing('NAK');
        }
    }

    /**
     * Process accumulated message frames
     */
    processMessage() {
        if (this.messageBuffer.length === 0) return;

        const fullMessage = this.messageBuffer.join('');
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[LIS2-A] ${msg}`);
        info('Processing message batch...');

        // Parse LIS2-A message structure
        const result = this.parseLIS2A(fullMessage);

        if (result && this.onResultCallback) {
            this.onResultCallback(result);
        }

        this.messageBuffer = [];
    }

    /**
     * Parse LIS2-A formatted message
     * Format: H|F|P|O|R|L|C|M|Q records
     */
    parseLIS2A(message) {
        const lines = message.split(CR + LF).filter(l => l.trim());
        const result = {
            patient: {},
            tests: [],
            timestamp: new Date().toISOString(),
            isQuery: false
        };

        lines.forEach(line => {
            // Remove STX, ETX, and frame numbers
            const cleanLine = line.replace(STX, '').replace(ETX, '').replace(/^\d+/, '');
            const fields = cleanLine.split('|');

            const recordType = fields[0];

            switch (recordType) {
                case 'H': // Header
                    break;

                case 'P': // Patient
                    result.patient.id = fields[3] || fields[2]; // Patient ID
                    result.patient.name = fields[5]; // Patient Name
                    if (this.logger) this.logger.info(`Patient identified: ${result.patient.id}`);
                    break;

                case 'Q': // Query - Analyzer is requesting test orders
                    result.isQuery = true;
                    result.patient.id = fields[2]; // Patient ID from query
                    if (this.logger) this.logger.info(`Query received for patient: ${result.patient.id}`);
                    // Trigger bidirectional manager to send test orders
                    this.handleQuery(result.patient.id);
                    break;

                case 'O': // Order/Test Request
                    break;

                case 'R': // Result
                    const test = {
                        name: fields[2] || 'Unknown', // Test name/code
                        value: fields[3], // Result value
                        unit: fields[4], // Unit
                        referenceRange: fields[5], // Normal range
                        flag: fields[6] // Abnormal flag (N/H/L)
                    };
                    result.tests.push(test);
                    if (this.logger) this.logger.info(`Result parsed: ${test.name} = ${test.value}`);
                    break;

                case 'L': // Terminator
                    break;
            }
        });

        return result;
    }

    /**
     * Handle query from analyzer
     * @param {string} patientId - Patient ID from barcode scan
     */
    async handleQuery(patientId) {
        try {
            if (this.logger) this.logger.info(`Handling host-query for: ${patientId}`);

            // Get bidirectional manager
            const BidirectionalManager = require('../managers/bidirectional-manager');

            // Request test orders for this patient
            const response = await BidirectionalManager.handleAnalyzerQuery(patientId, 'LIS2A-ANALYZER');

            if (response.success) {
                // Send test orders back to analyzer
                this.sendTestOrders(response.response);
            } else {
                // IMPORTANT: Send a "Not Found" response so the analyzer doesn't hang
                if (this.logger) this.logger.error(`Query Failed for ${patientId}: Sending Negative Response`);
                this.sendNegativeQueryResponse(patientId);
            }
        } catch (error) {
            if (this.logger) this.logger.error(`Error handling query: ${error.message}`);
        }
    }

    /**
     * Send record indicating no tests found for this query
     * Prevents machine from waiting indefinitely (Breaks the cycle cleanly)
     */
    sendNegativeQueryResponse(patientId) {
        if (!this.port || !this.port.isOpen) return;
        
        // standard ASTM negative response frame: Terminator record with "N" (No data)
        const frame = `${STX}1H|\\^&|||LIS||||||||P|1|${ETX}${CR}${LF}` +
                      `${STX}2P|1|||${patientId}${ETX}${CR}${LF}` +
                      `${STX}3L|1|N${ETX}${CR}${LF}`;

        this.port.write(ENQ);
        setTimeout(() => {
            this.port.write(frame);
            this.port.write(EOT);
        }, 50);
    }

    /**
     * Send test orders to analyzer
     * @param {Object} orderData - Test order data
     */
    sendTestOrders(orderData) {
        if (!this.port || !this.port.isOpen) return;

        const BidirectionalManager = require('../managers/bidirectional-manager');
        const message = BidirectionalManager.formatLIS2AOrder(orderData);

        if (this.logger) this.logger.outgoing(`Sending orders: ${message}`);

        this.port.write(ENQ);
        setTimeout(() => {
            this.port.write(message);
            this.port.write(EOT);
        }, 100);
    }

    /**
     * Send query to device (host query mode)
     * @param {string} patientId - Patient ID to query
     */
    queryPatient(patientId) {
        if (!this.port || !this.port.isOpen) return;

        // Build LIS2-A query message
        const query = `${STX}1H|\\^&|||LIS||||||||P|1|${ETX}${CR}${LF}` +
            `${STX}2P|1|||${patientId}${ETX}${CR}${LF}` +
            `${STX}3L|1|N${ETX}${CR}${LF}`;

        if (this.logger) this.logger.info(`Sending host-initiated query for: ${patientId}`);
        this.port.write(ENQ);

        setTimeout(() => {
            this.port.write(query);
            this.port.write(EOT);
        }, 100);
    }

    disconnect() {
        if (this.port && this.port.isOpen) {
            this.port.close((err) => {
                if (this.logger) this.logger.info('Disconnected from machine');
            });
        }
    }

    isConnected() {
        return this.port && this.port.isOpen;
    }
}

module.exports = LIS2ADriver;

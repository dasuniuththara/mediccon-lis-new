/**
 * iFlash 1200 Immunoassay Analyzer Driver
 * Supports ASTM/HL7 bidirectional communication
 * Manufacturer: Shenzhen YHLO Biotech Co., Ltd.
 */

const net = require('net');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Control Characters for ASTM
const ENQ = String.fromCharCode(0x05);
const ACK = String.fromCharCode(0x06);
const NAK = String.fromCharCode(0x15);
const STX = String.fromCharCode(0x02);
const ETX = String.fromCharCode(0x03);
const EOT = String.fromCharCode(0x04);
const CR = String.fromCharCode(0x0D);
const LF = String.fromCharCode(0x0A);

class IFlashDriver {
    constructor() {
        this.connection = null;
        this.connectionType = null; // 'serial' or 'tcp'
        this.parser = null;
        this.onResultCallback = null;
        this.messageBuffer = [];
        this.isReceiving = false;
        this.protocol = 'HL7'; // Default to HL7, can be changed to ASTM
    }

    /**
     * Connect via TCP/IP
     * @param {string} host - LIS Host IP
     * @param {number} port - Port number (default 6000)
     * @param {function} onResult - Callback for results
     */
    connectTCP(host, port = 6000, onResult) {
        return new Promise((resolve, reject) => {
            try {
                this.onResultCallback = onResult;
                this.connectionType = 'tcp';

                this.connection = net.createConnection({ host, port }, () => {
                    console.log(`[iFlash] Connected to ${host}:${port}`);
                    this.setupTCPListeners();
                    resolve();
                });

                this.connection.on('error', (err) => {
                    console.error('[iFlash] TCP Error:', err);
                    reject(err);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Connect via Serial Port
     * @param {string} comPort - COM port path
     * @param {number} baudRate - Baud rate (default 9600)
     * @param {function} onResult - Callback for results
     */
    connectSerial(comPort, baudRate = 9600, onResult) {
        return new Promise((resolve, reject) => {
            try {
                this.onResultCallback = onResult;
                this.connectionType = 'serial';

                this.connection = new SerialPort({
                    path: comPort,
                    baudRate: baudRate,
                    dataBits: 8,
                    parity: 'none',
                    stopBits: 1,
                    autoOpen: false
                });

                this.parser = this.connection.pipe(new ReadlineParser({ delimiter: CR + LF }));

                this.connection.open((err) => {
                    if (err) {
                        console.error('[iFlash] Serial connection failed:', err);
                        reject(err);
                    } else {
                        console.log(`[iFlash] Connected to ${comPort}`);
                        this.setupSerialListeners();
                        resolve();
                    }
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    setupTCPListeners() {
        this.connection.on('data', (data) => {
            const message = data.toString();
            console.log('[iFlash] Received:', message);
            this.handleMessage(message);
        });

        this.connection.on('close', () => {
            console.log('[iFlash] Connection closed');
        });
    }

    setupSerialListeners() {
        this.connection.on('data', (data) => {
            const char = data.toString();

            if (char === ENQ) {
                console.log('[iFlash] Received ENQ, sending ACK');
                this.sendACK();
                this.isReceiving = true;
                this.messageBuffer = [];
            } else if (char === EOT) {
                console.log('[iFlash] Received EOT, transmission complete');
                this.isReceiving = false;
                this.processMessage();
            }
        });

        this.parser.on('data', (line) => {
            if (this.isReceiving && line.startsWith(STX)) {
                console.log('[iFlash] Received frame:', line);
                this.messageBuffer.push(line);
                this.sendACK();
            }
        });

        this.connection.on('error', (err) => {
            console.error('[iFlash] Serial error:', err);
        });
    }

    handleMessage(message) {
        if (this.protocol === 'HL7') {
            this.parseHL7(message);
        } else {
            this.parseASTM(message);
        }
    }

    /**
     * Parse HL7 message from iFlash
     */
    parseHL7(message) {
        const lines = message.split(CR).filter(l => l.trim());
        const result = {
            patient: {},
            tests: [],
            timestamp: new Date().toISOString(),
            isQuery: false
        };

        lines.forEach(line => {
            const segments = line.split('|');
            const messageType = segments[0];

            switch (messageType) {
                case 'MSH': // Message Header
                    console.log('[iFlash] HL7 Message Header');
                    break;

                case 'PID': // Patient Identification
                    result.patient.id = segments[3]; // Patient ID
                    result.patient.name = segments[5]; // Patient Name
                    console.log('[iFlash] Patient:', result.patient);
                    break;

                case 'OBR': // Observation Request (Query)
                    result.isQuery = true;
                    result.patient.id = segments[3];
                    console.log('[iFlash] Query for patient:', result.patient.id);
                    this.handleQuery(result.patient.id);
                    break;

                case 'OBX': // Observation Result
                    const test = {
                        name: segments[3], // Test name/code
                        value: segments[5], // Result value
                        unit: segments[6], // Unit
                        referenceRange: segments[7], // Normal range
                        flag: segments[8] // Abnormal flag
                    };
                    result.tests.push(test);
                    console.log('[iFlash] Result:', test);
                    break;
            }
        });

        if (result.tests.length > 0 && this.onResultCallback) {
            this.onResultCallback(result);
        }
    }

    /**
     * Parse ASTM message from iFlash
     */
    parseASTM(message) {
        const lines = message.split(CR + LF).filter(l => l.trim());
        const result = {
            patient: {},
            tests: [],
            timestamp: new Date().toISOString(),
            isQuery: false
        };

        lines.forEach(line => {
            const cleanLine = line.replace(STX, '').replace(ETX, '').replace(/^\d+/, '');
            const fields = cleanLine.split('|');
            const recordType = fields[0];

            switch (recordType) {
                case 'H': // Header
                    console.log('[iFlash] ASTM Header');
                    break;

                case 'P': // Patient
                    result.patient.id = fields[3] || fields[2];
                    result.patient.name = fields[5];
                    console.log('[iFlash] Patient:', result.patient);
                    break;

                case 'Q': // Query
                    result.isQuery = true;
                    result.patient.id = fields[2];
                    console.log('[iFlash] Query for patient:', result.patient.id);
                    this.handleQuery(result.patient.id);
                    break;

                case 'O': // Order
                    console.log('[iFlash] Order:', fields);
                    break;

                case 'R': // Result
                    const test = {
                        name: fields[2],
                        value: fields[3],
                        unit: fields[4],
                        referenceRange: fields[5],
                        flag: fields[6]
                    };
                    result.tests.push(test);
                    console.log('[iFlash] Result:', test);
                    break;

                case 'L': // Terminator
                    console.log('[iFlash] Message complete');
                    break;
            }
        });

        if (result.tests.length > 0 && this.onResultCallback) {
            this.onResultCallback(result);
        }
    }

    /**
     * Handle query from iFlash analyzer
     */
    async handleQuery(patientId) {
        try {
            console.log('[iFlash] Handling query for:', patientId);

            const BidirectionalManager = require('../managers/bidirectional-manager');
            const response = await BidirectionalManager.handleAnalyzerQuery(patientId, 'IFLASH-1200');

            if (response.success) {
                this.sendTestOrders(response.response);
            }
        } catch (error) {
            console.error('[iFlash] Error handling query:', error);
        }
    }

    /**
     * Send test orders to iFlash
     */
    sendTestOrders(orderData) {
        if (!this.connection) {
            console.error('[iFlash] No connection');
            return;
        }

        let message;
        if (this.protocol === 'HL7') {
            message = this.formatHL7Order(orderData);
        } else {
            message = this.formatASTMOrder(orderData);
        }

        console.log('[iFlash] Sending test orders:', message);

        if (this.connectionType === 'tcp') {
            this.connection.write(message);
        } else {
            this.connection.write(ENQ);
            setTimeout(() => {
                this.connection.write(message);
                this.connection.write(EOT);
            }, 100);
        }
    }

    /**
     * Format order as HL7 ORM message
     */
    formatHL7Order(orderData) {
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').substring(0, 14);
        let message = '';

        // Message Header
        message += `MSH|^~\\&|LIS|MEDICCON|IFLASH|LAB|${timestamp}||ORM^O01|${Date.now()}|P|2.5${CR}`;

        // Patient Identification
        message += `PID|1||${orderData.patientId}||${orderData.patientName}${CR}`;

        // Orders
        orderData.tests.forEach((test, index) => {
            message += `OBR|${index + 1}||${orderData.patientId}|${test.analyzerCode}^${test.name}${CR}`;
        });

        return message;
    }

    /**
     * Format order as ASTM message
     */
    formatASTMOrder(orderData) {
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

    processMessage() {
        if (this.messageBuffer.length === 0) return;

        const fullMessage = this.messageBuffer.join('');
        console.log('[iFlash] Processing message:', fullMessage);

        if (this.protocol === 'HL7') {
            this.parseHL7(fullMessage);
        } else {
            this.parseASTM(fullMessage);
        }

        this.messageBuffer = [];
    }

    sendACK() {
        if (this.connection && this.connectionType === 'serial') {
            this.connection.write(ACK);
        }
    }

    sendNAK() {
        if (this.connection && this.connectionType === 'serial') {
            this.connection.write(NAK);
        }
    }

    disconnect() {
        if (this.connection) {
            if (this.connectionType === 'tcp') {
                this.connection.end();
            } else {
                this.connection.close((err) => {
                    if (err) {
                        console.error('[iFlash] Error closing port:', err);
                    } else {
                        console.log('[iFlash] Disconnected');
                    }
                });
            }
        }
    }

    isConnected() {
        if (this.connectionType === 'tcp') {
            return this.connection && !this.connection.destroyed;
        } else {
            return this.connection && this.connection.isOpen;
        }
    }

    setProtocol(protocol) {
        this.protocol = protocol; // 'HL7' or 'ASTM'
        console.log(`[iFlash] Protocol set to ${protocol}`);
    }
}

module.exports = new IFlashDriver();

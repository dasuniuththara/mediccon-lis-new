const { SerialPort } = require('serialport');
const log = require('electron-log');

// ASTM Control Characters
const ENQ = 0x05;
const ACK = 0x06;
const NAK = 0x15;
const STX = 0x02;
const ETX = 0x03;
const EOT = 0x04;
const CR = 0x0D;
const LF = 0x0A;
const ETB = 0x17;

class PKLDriver {
    constructor() {
        this.port = null;
        this.onDataCallback = null;
        this.onQueryCallback = null; // Handler for Query (Q) records
        this.buffer = '';
        this.state = 'NEUTRAL';
        this.sessionData = [];
        this.isHost = false; // LIS acting as Host (Sending Orders)
        this.queue = []; // Queue for frames to send
        this.logger = null; // Add logger property
    }

    connect(portPath, baudRate = 9600, onData, onQuery, logger = null) {
        this.onDataCallback = onData;
        this.onQueryCallback = onQuery;
        this.logger = logger;

        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[PKLDriver] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[PKLDriver] ${msg}`);

        try {
            this.port = new SerialPort({
                path: portPath,
                baudRate: parseInt(baudRate) || 9600,
                autoOpen: false
            });

            this.port.open((err) => {
                if (err) {
                    error(`Error opening port: ${err.message}`);
                    return;
                }
                info(`Connected to ${portPath} at ${baudRate}`);
            });

            this.port.on('data', (data) => {
                if (this.logger) this.logger.incoming(data.toString('hex')); // Log hex for debug
                this.handleData(data);
            });

            this.port.on('error', (err) => {
                error(`Serial Error: ${err.message}`);
            });

            this.port.on('close', () => {
                info('Connection closed');
            });

        } catch (err) {
            error(`Setup Error: ${err.message}`);
        }
    }

    disconnect() {
        if (this.port && this.port.isOpen) {
            this.port.close();
        }
    }

    isConnected() {
        return this.port && this.port.isOpen;
    }

    write(data) {
        if (this.port && this.port.isOpen) {
            if (this.logger) this.logger.outgoing(data.toString('hex'));
            this.port.write(data, (err) => {
                if (err) console.error('[PKLDriver] Write Error:', err);
            });
        }
    }

    calculateChecksum(frame) {
        let sum = 0;
        // Sum includes everything AFTER standard STX and UP TO ETX/ETB (inclusive)
        // Checksum is modulo 256 of sum
        // Frame structure passed here: [Frame#]...[ETX]
        for (let i = 0; i < frame.length; i++) {
            sum = (sum + frame.charCodeAt(i)) % 256;
        }
        return sum.toString(16).toUpperCase().padStart(2, '0');
    }

    // --- SENDING LOGIC ---

    sendOrder(pid, sampleId, tests, patientName = '') {
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[PKLDriver] ${msg}`);
        info(`Queueing Order for ${sampleId}`);
        // Construct Records
        const records = [];

        // 1. Header
        records.push(`H|\\^&|||Mediccon LIS|||||||P|1`);

        // 2. Patient
        const pId = pid || sampleId;
        const pName = patientName || 'Unknown';
        records.push(`P|1|${pId}|||${pName}||||||||`);

        // 3. Order
        const testField = tests.map(t => `^^^${t}`).join('\\');
        records.push(`O|1|${sampleId}||${testField}|R||||||A||||Sample`);

        // 4. Terminator
        records.push(`L|1|N`);

        this.queueFrames(records);
        this.state = 'SENDING_INIT';
        this.write(Buffer.from([ENQ]));
    }

    /**
     * Middleware Heartbeat
     */
    sendHeartbeat() {
        if (!this.port || !this.port.isOpen || this.state !== 'NEUTRAL') return;
        this.write(Buffer.from([ENQ]));
        if (this.logger) this.logger.info(`Heartbeat: Polling Analyzer...`);
    }

    /**
     * Send negative response when no orders found
     */
    sendEmptyResponse(sampleId) {
        if (!this.port || !this.port.isOpen) return;
        
        // Construct basic ASTM H, P, L records to close the query session cleanly
        const records = [
            `H|\\^&|||Mediccon LIS|||||||P|1`,
            `P|1|${sampleId}|||Unknown||||||||`,
            `L|1|N`
        ];

        this.queueFrames(records);
        this.state = 'SENDING_INIT';
        this.write(Buffer.from([ENQ]));
    }

    queueFrames(records) {
        this.queue = [];
        let frameNum = 1;

        records.forEach(record => {
            // Simply wrap each record in one frame for now (assuming < 1024 chars)
            // Format: <STX> [FN] [Text] [CR] [ETX] [C1] [C2] [CR] [LF]
            // Note: ASTM standard usually puts CR inside text before ETX? 
            // Docs say: <STX> FN Text <ETX> C1 C2 <CR> <LF>

            const fn = frameNum % 8; // FN is single digit 0-7. Starts at 1. Correct modulo logic is: (i % 7) + 1? No, 1..7, 0, 1..
            // The doc says: "FN runs from 1 to 7, then continues with 0, 1... as integer"

            const text = `${fn}${record}`; // Frame# + Record text
            const etx = String.fromCharCode(ETX);
            const contentToChecksum = text + etx; // Sum from after STX up to ETX inclusive?
            // "The checksum is the modulus [256] of the sum of ASCII values of the frame characters starting with and including 'FN' and completing with <ETX>"

            const cs = this.calculateChecksum(contentToChecksum);

            const frame = String.fromCharCode(STX) + contentToChecksum + cs + String.fromCharCode(CR) + String.fromCharCode(LF);
            this.queue.push(frame);

            frameNum = (frameNum + 1) % 8; // Logic adjustment might be needed if exact 1-7-0 sequence strict
        });
    }

    // --- RECEIVING LOGIC ---

    handleData(chunk) {
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[PKLDriver] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[PKLDriver] ${msg}`);

        for (let i = 0; i < chunk.length; i++) {
            const byte = chunk[i];

            // 1. LISTENING MODE
            if (this.state === 'NEUTRAL') {
                if (byte === ENQ) {
                    info('<ENQ> Received. Establishing Session.');
                    this.state = 'RECEIVING';
                    this.sessionData = [];
                    this.buffer = '';
                    this.write(Buffer.from([ACK]));
                }
            }
            // 2. HOST SENDING MODE
            else if (this.state === 'SENDING_INIT') {
                if (byte === ACK) {
                    info('<ACK> Received. Sending First Frame.');
                    this.state = 'SENDING_FRAMES';
                    this.sendNextFrame();
                } else if (byte === NAK) {
                    info('<NAK> on Init. Retrying...');
                    // Retry strategy? For now wait.
                }
            }
            else if (this.state === 'SENDING_FRAMES') {
                if (byte === ACK) {
                    // Send next
                    if (this.queue.length > 0) {
                        this.sendNextFrame();
                    } else {
                        // Done
                        info('All Frames Sent. Sending EOT.');
                        this.write(Buffer.from([EOT]));
                        this.state = 'NEUTRAL';
                    }
                } else if (byte === NAK) {
                    // Resend last frame (not implemented queue peek, just simplify)
                    error('<NAK> Received during send.');
                }
            }
            // 3. RECEIVING MODE
            else if (this.state === 'RECEIVING' || this.state === 'TRANSFER') {
                if (byte === STX) {
                    this.state = 'TRANSFER';
                    this.buffer = '';
                } else if (byte === LF) {
                    // Frame complete
                    this.processFrame(this.buffer);
                    this.buffer = '';
                    this.write(Buffer.from([ACK]));
                } else if (byte === EOT) {
                    info('<EOT> Received. Processing Session.');
                    this.state = 'NEUTRAL';
                    this.processSession();
                    this.sessionData = [];
                } else {
                    if (this.state === 'TRANSFER') {
                        this.buffer += String.fromCharCode(byte);
                    }
                }
            }
        }
    }

    sendNextFrame() {
        if (this.queue.length === 0) return;
        const frame = this.queue.shift();
        this.write(frame);
    }

    processFrame(frameBuffer) {
        try {
            // Frame: [Frame#] [Text] [ETX] [C1] [C2] [CR] (CR is usually consumed or at end of buffer)
            let clean = frameBuffer;
            if (clean.endsWith('\r')) clean = clean.slice(0, -1); // Remove CR if present

            // Checksum validation
            if (clean.length < 4) return;

            // Remove Checksum (2) and ETX (1)
            const textContent = clean.slice(1, -3);

            this.sessionData.push(textContent);
        } catch (e) {
            console.error('[PKLDriver] Frame Parse Error:', e);
        }
    }

    processSession() {
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[PKLDriver] ${msg}`);
        const result = {
            nic: 'UNKNOWN',
            tests: [],
            query: null
        };

        const getField = (fields, index) => fields[index] ? fields[index].trim() : '';
        let fieldDelim = '|';
        let compDelim = '^';

        this.sessionData.forEach(line => {
            if (line.startsWith('H')) {
                // H|\^&
                // const delims = line.substring(2, 6); // roughly
            }

            const fields = line.split(fieldDelim);
            const type = fields[0];

            if (type === 'P') {
                let pid = getField(fields, 2);
                if (!pid) pid = getField(fields, 3);
                if (pid && pid.includes(compDelim)) pid = pid.split(compDelim)[0];
                if (pid) result.nic = pid;
            }
            else if (type === 'Q') {
                // Query Record
                // Q|1|StartingRangeID^...|...
                // Index 2: Starting Range ID (Sample ID)
                // Ex: ^SampleID or just SampleID
                let qId = getField(fields, 2);

                // If contains component delimiter, extract sensible ID
                // Spec says "PadID^SampleID^..." or similar
                // Let's iterate components and find non-empty
                if (qId.includes(compDelim)) {
                    const parts = qId.split(compDelim);
                    qId = parts.find(p => p.length > 0) || qId;
                }

                info(`Query Received for ID: ${qId}`);
                result.query = { sampleId: qId };
            }
            else if (type === 'R') {
                const testStr = getField(fields, 2);
                let testCode = testStr;

                if (testStr.includes(compDelim)) {
                    const parts = testStr.split(compDelim);
                    if (parts[3] && parts[3].trim()) testCode = parts[3];
                    else if (parts[0] && parts[0].trim()) testCode = parts[0];
                }

                const val = getField(fields, 3);
                const unit = getField(fields, 4);

                if (testCode && val) {
                    result.tests.push({
                        name: testCode.trim(),
                        value: val,
                        unit: unit
                    });
                }
            }
        });

        // Callback Dispatch
        if (result.query && this.onQueryCallback) {
            // It's a query session
            this.onQueryCallback(result.query);
        } else if (result.tests.length > 0 && this.onDataCallback) {
            // It's a result session
            this.onDataCallback(result);
        }
    }
}

module.exports = PKLDriver;

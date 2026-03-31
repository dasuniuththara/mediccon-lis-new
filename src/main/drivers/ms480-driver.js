const net = require('net');
const PatientRepo = require('../database/patient-repo');
const mapping = require('../config/ms480-mapping');

class MS480Driver {
    constructor() {
        this.server = null;
        this.clients = [];
        this.onResultCallback = null;
        this.buffer = '';
        this.logger = {
            info: (m) => console.log(m),
            error: (m) => console.error(m)
        };
        // Cache to link Sample BatchNo to PatID (NIC)
        this.sampleCache = {};
    }

    startServer(port, onResult, logger = null) {
        if (logger) this.logger = logger;
        this.onResultCallback = onResult;

        const tcpPort = parseInt(port) || 2000;

        if (this.server && this.server.address() && this.server.address().port === tcpPort) {
            this.logger.info(`[MS-480] Server already active on port ${tcpPort}.`);
            return;
        }

        if (this.server) {
            this.stopServer();
        }

        this.server = net.createServer((socket) => {
            this.logger.info(`[MS-480] Analyzer Connected: ${socket.remoteAddress}:${socket.remotePort}`);
            this.clients.push(socket);

            socket.on('data', (data) => {
                this.buffer += data.toString('utf-8');
                this.processBuffer(socket);
            });

            socket.on('error', (err) => {
                this.logger.error(`[MS-480] Socket Error: ${err.message}`);
            });

            socket.on('close', () => {
                this.logger.info(`[MS-480] Analyzer Disconnected (${socket.remoteAddress})`);
                this.clients = this.clients.filter(c => c !== socket);
            });
        });

        this.server.listen(tcpPort, '0.0.0.0', () => {
            this.logger.info(`[MS-480] LIS TCP Server Listening on port ${tcpPort}`);
            console.log(`[Machine Config] Started MS-480 TCP Server on Port ${tcpPort}`);
        });
    }

    stopServer() {
        if (this.server) {
            this.clients.forEach(c => c.destroy());
            this.server.close();
            this.logger.info('[MS-480] LIS TCP Server Stopped');
            this.server = null;
        }
    }

    processBuffer(socket) {
        const extract = (tag, str) => {
            const reg = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
            const m = str.match(reg);
            return m ? m[1].trim() : '';
        };

        // 1. Process <Sample> records to map BatchNo to PatID (Barcode/NIC)
        let sampleMatch;
        const sampleRegex = /<Sample>([\s\S]*?)<\/Sample>/gi;
        while ((sampleMatch = sampleRegex.exec(this.buffer)) !== null) {
            const xml = sampleMatch[1];
            const batchNo = extract('BatchNo', xml);
            const patId = extract('PatID', xml) || extract('SampleNo', xml); // Use PatID or SampleNo as barcode
            const patName = extract('PatName', xml);

            if (batchNo && patId) {
                this.sampleCache[batchNo] = patId;
                this.logger.info(`[MS-480] Identified Sample: Batch ${batchNo} -> ID: ${patId} (${patName})`);
            }
        }

        // 2. Process <Test> results
        let testMatch;
        const testRegex = /<Test>([\s\S]*?)<\/Test>/gi;
        while ((testMatch = testRegex.exec(this.buffer)) !== null) {
            const xml = testMatch[1];

            const batchNo = extract('BatchNo', xml);
            const testNameRaw = extract('TestName', xml);
            const resultValue = extract('Result', xml);
            const unit = extract('UNIT', xml);

            const linkedNic = this.sampleCache[batchNo] || 'UNKNOWN';

            this.logger.info(`[MS-480] Captured Result: ${testNameRaw} = ${resultValue} ${unit} (Batch: ${batchNo}, PatID: ${linkedNic})`);

            if (this.onResultCallback && testNameRaw && resultValue) {
                this.onResultCallback({
                    nic: linkedNic,
                    testName: testNameRaw,
                    value: resultValue,
                    unit: unit
                });
            }
        }

        // 3. Process Bidirectional Queries <SampleCode>
        if (this.buffer.includes('</SampleCode>')) {
            this.handleQuery(socket, this.buffer);
        }

        // Flush matched XML tags from buffer to prevent memory leaks
        this.buffer = this.buffer.replace(/<Sample>[\s\S]*?<\/Sample>/gi, '');
        this.buffer = this.buffer.replace(/<Test>[\s\S]*?<\/Test>/gi, '');
        this.buffer = this.buffer.replace(/<SampleCode>[\s\S]*?<\/SampleCode>/gi, '');
    }

    async handleQuery(socket, buffer) {
        const barcodeRegex = /<BarCode>\s*([^<]+)\s*<\/BarCode>/gi;
        let m;
        const barcodes = [];
        while ((m = barcodeRegex.exec(buffer)) !== null) {
            if (m[1].trim()) barcodes.push(m[1].trim());
        }

        if (barcodes.length > 0) {
            this.logger.info(`[MS-480] Bidirectional Query received for: ${barcodes.join(', ')}`);

            let replyXml = '<SampleCodeReply>\n';
            const BidirectionalManager = require('../managers/bidirectional-manager');

            for (let barcode of barcodes) {
                // Attempt to pull real pending tests from the Worklist Matrix
                const reqOrder = await BidirectionalManager.handleAnalyzerQuery(barcode, 'MS480');
                let testString = '';
                let patName = `PATIENT_${barcode}`;
                let age = '30';
                let gender = '0'; // 0 Male, 1 Female

                if (reqOrder && reqOrder.success && reqOrder.patient) {
                    testString = reqOrder.tests.map(t => t.analyzerCode).join(';');
                    patName = reqOrder.patient.name;
                    if (reqOrder.patient.gender === 'Female') gender = '1';
                    try { age = reqOrder.patient.age.split(' ')[0] || '30'; } catch (e) { }
                } else {
                    // Fallback string if it doesn't hit DB (Prevent machine lockup)
                    testString = 'ALT;AST;GLU;CREA;BUN';
                }

                replyXml += `<SampleCodeInfo>
<BarCode>${barcode}</BarCode>
<SampleType>0</SampleType>
<ClinicType>1</ClinicType>
<SamplePro>${testString}</SamplePro>
<Name>${patName}</Name>
<Card>${barcode}</Card>
<Tel></Tel>
<IDCard>${barcode}</IDCard>
<Sex>${gender}</Sex>
<Age>${age}</Age>
</SampleCodeInfo>\n`;
            }
            replyXml += '</SampleCodeReply>';

            socket.write(replyXml);
            this.logger.log(`[MS-480] Sent TCP Reply packet covering ${barcodes.length} barcodes/orders.`);
        }
    }
}

module.exports = new MS480Driver();

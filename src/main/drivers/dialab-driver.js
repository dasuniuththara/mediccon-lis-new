const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

/**
 * DIALAB Autolyser Custom Driver
 * Implements Manual Page 21-23: Variable Serial Protocol
 */
class DialabDriver {
    constructor() {
        this.port = null;
        this.parser = null;
        this.logger = null;
        this.onDataCallback = null;
    }

    /**
     * Connect to Dialab Autolyser
     * @param {string} path - COM Port
     * @param {number} baudRate - Default 9600
     * @param {function} onData - Result callback
     * @param {object} logger - MachineLogger instance
     */
    connect(path, baudRate = 9600, onData, logger = null) {
        this.onDataCallback = onData;
        this.logger = logger;
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[DIALAB] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[DIALAB] ${msg}`);

        try {
            this.port = new SerialPort({
                path: path,
                baudRate: parseInt(baudRate),
                autoOpen: false
            });

            this.port.open((err) => {
                if (err) {
                    error(`Connection failed: ${err.message}`);
                } else {
                    info(`Connected to ${path} at ${baudRate} baud`);
                }
            });

            this.port.on('data', (data) => {
                const raw = data.toString();
                if (this.logger) this.logger.incoming(data.toString('hex'));

                // Manual Page 21 Handshake: Send ACK (06h) when STX (02h) received
                if (raw.includes('\x02')) {
                    info('STX Received. Sending ACK handshake.');
                    this.sendRaw('\x06');
                }

                // If it looks like a result frame (contains patient ID or specific markers)
                if (raw.length > 20) {
                    const parsed = this.parseResults(raw);
                    if (parsed && this.onDataCallback) {
                        this.onDataCallback(parsed);
                    }
                }
            });

            this.port.on('error', (err) => {
                error(`Serial Error: ${err.message}`);
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

    sendRaw(data) {
        if (this.port && this.port.isOpen) {
            if (this.logger) this.logger.outgoing(data);
            this.port.write(data);
        }
    }

    // Page 23: Calculation of Check-Sum
    calculateChecksum(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data.charCodeAt(i);
        }
        return (sum % 256).toString().padStart(3, '0');
    }

    // Page 22: Format Patient Data for Transmission (LIS -> Machine)
    formatPatientOrder(patientNic, testCodes, isStat = false, isUrine = false) {
        const patientCode = patientNic.padEnd(15, ' ');
        const listType = isStat ? 'R' : 'T';
        const sampleType = isUrine ? 'U' : 'S';
        const isClone = 'N';
        const position = '00';
        const numTests = testCodes.length.toString().padStart(2, '0');

        let testsString = '';
        testCodes.forEach(code => {
            testsString += code.padEnd(4, ' ');
        });

        const dataPayload = `${patientCode}${listType}${sampleType}${isClone}${position}${numTests}${testsString}`;
        const checksum = this.calculateChecksum(dataPayload);

        return `\x02${dataPayload}${checksum}\x03`;
    }

    // Page 23: Parse Results (Machine -> LIS)
    parseResults(rawData) {
        try {
            const cleanData = rawData.replace(/[\x02\x03\x04]/g, '');
            if (cleanData.length < 23) return null;

            const nic = cleanData.substring(0, 15).trim();
            const listType = cleanData.substring(15, 16);
            const sampleType = cleanData.substring(16, 17);
            const numReports = parseInt(cleanData.substring(20, 23));

            let tests = [];
            let pointer = 23;

            for (let i = 0; i < numReports; i++) {
                const testCode = cleanData.substring(pointer, pointer + 4).trim();
                const value = cleanData.substring(pointer + 4, pointer + 11).trim();

                if (testCode && value) {
                    tests.push({
                        name: testCode,
                        value: value,
                        unit: ''
                    });
                }
                pointer += 11;
            }

            return { patient: { id: nic }, tests, listType, sampleType };
        } catch (e) {
            if (this.logger) this.logger.error(`Parsing Error: ${e.message}`);
            return null;
        }
    }
}

module.exports = DialabDriver;

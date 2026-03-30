/**
 * Statlyte C Electrolyte Analyzer Driver
 * Protocol: RS-232 Text Based (Space Separated)
 * Baud Rate: 19200
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class StatlyteDriver {
    constructor() {
        this.port = null;
        this.parser = null;
        this.onResultCallback = null;
        this.logger = null;
    }

    /**
     * Connect to Statlyte C
     * @param {string} comPort - COM Port (e.g. COM1)
     * @param {function} onResult - Callback function for results
     * @param {object} logger - MachineLogger instance
     */
    connect(comPort, onResult, logger = null) {
        this.logger = logger;
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[Statlyte] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[Statlyte] ${msg}`);

        return new Promise((resolve, reject) => {
            try {
                this.onResultCallback = onResult;

                this.port = new SerialPort({
                    path: comPort,
                    baudRate: 19200, // Specific for Statlyte C
                    dataBits: 8,
                    stopBits: 1,
                    parity: 'none',
                    autoOpen: false
                });

                // The manual doesn't specify a terminator, but typically results end with CR/LF
                this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

                this.port.open((err) => {
                    if (err) {
                        error(`Connection failed: ${err.message}`);
                        reject(err);
                    } else {
                        info(`Connected to ${comPort} at 19200 baud`);
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
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[Statlyte] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[Statlyte] ${msg}`);

        // Listen for data lines
        this.parser.on('data', (line) => {
            const raw = line.toString().trim();
            if (this.logger) {
                this.logger.incoming(raw);
                this.logger.raw(raw); // Capture for frame inspector
            }
            info(`Received Raw: ${raw}`);
            this.parseData(raw);
        });

        this.port.on('error', (err) => {
            error(`Serial Error: ${err.message}`);
        });
    }

    /**
     * Parse Data Line based on Appendix 4 of Manual
     * Format: SN ID Flag K Na Cl/Li Ca pH
     */
    parseData(line) {
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[Statlyte] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[Statlyte] ${msg}`);

        try {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 8) {
                error(`Incomplete data line: ${line}`);
                return;
            }

            const patientID = parts[1];
            const flagStr = parts[2];
            const valK = parts[3];
            const valNa = parts[4];
            const valMid = parts[5];
            const valCa = parts[6];
            const valPH = parts[7];

            const flag = parseInt(flagStr, 10);
            const isLi = (flag & (1 << 6)) !== 0;

            info(`Processing record for Patient: ${patientID} (Flag: ${flagStr}, Bit 6: ${isLi ? 'Li' : 'Cl'})`);

            const result = {
                machineId: 'STATLYTE-C',
                patient: {
                    id: patientID === '0000000000000000' ? 'Unknown' : patientID
                },
                tests: [],
                timestamp: new Date().toISOString()
            };

            const addTest = (code, value, unit) => {
                if (value && !isNaN(parseFloat(value))) {
                    result.tests.push({ name: code, value: value, unit: unit, flag: 'N' });
                }
            };

            addTest('K', valK, 'mmol/L');
            addTest('Na', valNa, 'mmol/L');
            if (isLi) addTest('Li', valMid, 'mmol/L');
            else addTest('Cl', valMid, 'mmol/L');
            addTest('iCa', valCa, 'mmol/L');
            addTest('pH', valPH, '');

            if (result.tests.length > 0 && this.onResultCallback) {
                info(`Parsed successfully: ${result.tests.length} tests`);
                this.onResultCallback(result);
            }

        } catch (e) {
            error(`Parsing Error: ${e.message}`);
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
}

module.exports = StatlyteDriver;

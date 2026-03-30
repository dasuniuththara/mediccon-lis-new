const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const log = require('electron-log');

class MispaDriver {
    constructor() {
        this.port = null;
        this.parser = null;
        this.onDataCallback = null;
        this.logger = null;
    }

    /**
     * Connect to Mispa Count machine
     * @param {string} portPath - COM port (e.g. COM4)
     * @param {number} baudRate - Baud rate (default 115200)
     * @param {function} onData - Callback function(result)
     * @param {object} logger - MachineLogger instance
     */
    connect(portPath, baudRate = 115200, onData, logger = null) {
        this.onDataCallback = onData;
        this.logger = logger;
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[Mispa] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[Mispa] ${msg}`);

        try {
            this.port = new SerialPort({
                path: portPath,
                baudRate: parseInt(baudRate) || 115200,
                autoOpen: false
            });

            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

            this.port.open((err) => {
                if (err) {
                    error(`Error opening port: ${err.message}`);
                    return;
                }
                info(`Connected to ${portPath} at ${baudRate}`);
            });

            this.parser.on('data', (data) => {
                const line = data.toString().trim();
                if (this.logger) {
                    this.logger.incoming(line);
                    this.logger.raw(data); // Capture for frame inspector
                }
                if (line.includes('$$$')) {
                    info(`Valid Packet detected (${line.length} bytes)`);
                    this.parseData(line);
                }
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

    /**
     * Parse the raw Mispa string
     */
    parseData(dataString) {
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[Mispa] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[Mispa] ${msg}`);

        try {
            const segments = dataString.trim().split('$');
            info(`Segments count: ${segments.length}`);

            if (segments.length > 30) {
                const results = {
                    patient: { id: segments[4] || segments[6] || 'UNKNOWN' },
                    tests: []
                };

                const addTest = (code, name, unit) => {
                    const index = parseInt(code);
                    if (segments[index] !== undefined) {
                        const rawVal = segments[index];
                        const cleanVal = rawVal.replace(/[^\d.-]/g, '');
                        const val = parseFloat(cleanVal);

                        results.tests.push({
                            name: code, // Pass the code for mapping
                            value: isNaN(val) ? 0.0 : val,
                            unit: unit
                        });
                    }
                };

                addTest("9", "WBC", "x 10³/uL");
                addTest("10", "RBC", "x 10⁶/uL");
                addTest("11", "PLT", "x 10³/uL");
                addTest("12", "HGB", "g/dL");
                addTest("13", "HCT", "%");
                addTest("14", "MCV", "fL");
                addTest("15", "MCH", "pg");
                addTest("16", "MCHC", "g/dL");
                addTest("17", "RDW-SD", "fL");
                addTest("18", "RDW-CV", "%");
                addTest("19", "MPV", "fL");
                addTest("20", "LYMPH%", "%");
                addTest("21", "MID%", "%");
                addTest("22", "GRAN%", "%");
                addTest("23", "LYMPH#", "x 10³/uL");
                addTest("24", "MID#", "x 10³/uL");
                addTest("25", "GRAN#", "x 10³/uL");
                addTest("26", "PCT", "%");
                addTest("27", "PDW", "%");
                addTest("28", "PLCR", "%");
                addTest("29", "PLCC", "x 10³/uL");

                info(`Parsed successfully: ${results.tests.length} parameters`);

                if (this.onDataCallback) {
                    this.onDataCallback(results);
                }
            }
        } catch (e) {
            error(`Parsing Error: ${e.message}`);
        }
    }
}

module.exports = MispaDriver;

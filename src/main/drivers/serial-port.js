const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const log = require('electron-log');

/**
 * Serial Port Driver for Mediccon LIS
 * Handles RS232/Serial communication for Biochemistry & Hematology analyzers.
 */
class MedicconSerialDriver {
    constructor() {
        this.port = null;
        this.parser = null;
        this.logger = null;
    }

    // 1. List all available COM ports (to show in Machine Hub UI)
    async listAvailablePorts() {
        try {
            const ports = await SerialPort.list();
            return ports;
        } catch (error) {
            log.error('Error listing serial ports:', error);
            return [];
        }
    }

    // 2. Connect to a specific machine
    connect(path, baudRate = 9600, onDataReceived, onSuccess, logger = null) {
        this.logger = logger;
        const info = (msg) => this.logger ? this.logger.info(msg) : console.log(`[Serial] ${msg}`);
        const error = (msg) => this.logger ? this.logger.error(msg) : console.error(`[Serial] ${msg}`);

        try {
            this.port = new SerialPort({
                path: path,
                baudRate: parseInt(baudRate),
                autoOpen: false,
            });

            // Standard ASTM line parser (looks for carriage returns / line feeds)
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r' }));

            this.port.open((err) => {
                if (err) {
                    error(`Failed to open port ${path}: ${err.message}`);
                    return;
                }
                info(`Connected to Mediccon Analyzer on ${path} (${baudRate})`);
                if (onSuccess) onSuccess();
            });

            // Listen for incoming data from the machine
            this.parser.on('data', (data) => {
                const rawData = data.toString().trim();
                if (rawData) {
                    if (this.logger) {
                        this.logger.incoming(rawData);
                        this.logger.raw(data); // Capture raw hex frame
                    }
                    else console.log('Raw Serial Data:', rawData);

                    // Pass data to the ASTM parser
                    onDataReceived(rawData);
                }
            });

            this.port.on('error', (err) => {
                error(`Serial Port Error: ${err.message}`);
            });

            this.port.on('close', () => {
                info('Analyzer Connection Closed.');
            });

        } catch (err) {
            error(`Connection Setup Error: ${err.message}`);
        }
    }

    // 3. Send a command to the machine (e.g., Query or Handshake)
    sendCommand(command) {
        if (this.port && this.port.isOpen) {
            // ASTM frames often need <STX> and <ETX> which are hex 0x02 and 0x03
            const STX = '\x02';
            const ETX = '\x03';
            const payload = `${STX}${command}${ETX}\r`;
            if (this.logger) this.logger.outgoing(payload);
            this.port.write(payload);
        } else {
            log.warn('Attempted to send command but port is closed.');
        }
    }

    // 3b. Send raw data without ASTM wrapping
    sendRaw(data) {
        if (this.port && this.port.isOpen) {
            if (this.logger) {
                this.logger.outgoing(data.toString('hex').toUpperCase());
            }
            this.port.write(data);
        } else {
            log.warn('Attempted to send raw data but port is closed.');
        }
    }

    /**
     * Heartbeat Pulse
     * Sends the ASTM <ENQ> (0x05) byte to keep the analyzer responsive
     */
    sendHeartbeat() {
        if (this.port && this.port.isOpen) {
            this.port.write(Buffer.from([0x05]));
            if (this.logger) this.logger.info(`Middleware Pulse: Sent ENQ Heartbeat`);
        }
    }

    // 4. Close connection
    disconnect() {
        if (this.port && this.port.isOpen) {
            this.port.close();
        }
    }

    isConnected() {
        return this.port && this.port.isOpen;
    }
}

// Export the class for multi-instance support
module.exports = MedicconSerialDriver;

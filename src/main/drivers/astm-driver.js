// Simplified ASTM logic for RS232
const { SerialPort } = require('serialport');

const astmDriver = {
    initASTM: (path, baud, onData) => {
        const port = new SerialPort({ path, baudRate: baud });

        port.on('data', (data) => {
            const frame = data.toString();
            // ASTM uses <STX>, <ETX> and checksums
            // This is a simplified listener for raw data
            if (frame.includes('P|')) { // Patient Record
                onData(frame);
            }
        });
    },

    parseASTM: (data) => {
        const result = { nic: '', test: '', value: '' };
        const lines = data.split(/\r|\n/);
        lines.forEach(line => {
            const f = line.split('|');
            if (f[0].includes('P')) result.nic = f[2] || f[3];
            if (f[0].includes('R')) {
                result.test = f[2];
                result.value = f[3];
            }
        });
        return result;
    }
};

module.exports = astmDriver;
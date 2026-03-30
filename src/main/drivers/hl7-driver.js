const net = require('net');

function startHL7Server(port, onDataReceived) {
    const server = net.createServer((socket) => {
        socket.on('data', (data) => {
            const msg = data.toString();
            // Basic HL7 Parsing (PID and OBX segments)
            const lines = msg.split('\r');
            let result = { nic: '', tests: [] };

            lines.forEach(line => {
                const f = line.split('|');
                if (f[0] === 'PID') result.nic = f[3];
                if (f[0] === 'OBX') {
                    result.tests.push({ name: f[3], value: f[5], unit: f[6] });
                }
            });
            onDataReceived(result);
        });
    });
    server.listen(port);
}

module.exports = startHL7Server;
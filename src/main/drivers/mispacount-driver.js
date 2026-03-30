const net = require('net');
const { spawn } = require('child_process');

/**
 * Flexible Mispacount driver.
 * Supports two modes:
 * - TCP: connect to an external software TCP server and receive JSON lines
 * - EXEC: spawn an external executable which writes JSON lines to stdout
 *
 * Expected incoming message (JSON per line):
 * { "nic": "123456789V", "machineId": "MISP-01", "securityKey": "abc", "tests": [{"name":"Glucose","value":"5.6"}] }
 */

function startMispacount(config = {}, onData) {
    let client = null;
    let proc = null;

    const parseAndForward = (chunk) => {
        const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
        lines.forEach(line => {
            try {
                const msg = JSON.parse(line);
                onData(msg);
            } catch (err) {
                // ignore non-JSON lines for now
                console.warn('Mispacount driver: failed to parse line', line);
            }
        });
    };

    if (config.mode === 'tcp') {
        client = new net.Socket();
        client.connect(config.port || 9000, config.host || '127.0.0.1', () => {
            console.log('Mispacount driver connected to', config.host + ':' + (config.port || 9000));
        });

        client.on('data', parseAndForward);
        client.on('error', (err) => console.error('Mispacount TCP error', err));
    } else if (config.mode === 'exec' && config.execPath) {
        proc = spawn(config.execPath, config.args || []);

        proc.stdout.on('data', parseAndForward);
        proc.stderr.on('data', (d) => console.error('Mispacount exec stderr:', d.toString()));
        proc.on('exit', (code) => console.log('Mispacount exec exited:', code));
    } else {
        console.warn('Mispacount driver started with no valid mode (tcp|exec).');
    }

    return {
        stop: () => {
            if (client) {
                try { client.destroy(); } catch(e){}
                client = null;
            }
            if (proc) {
                try { proc.kill(); } catch(e){}
                proc = null;
            }
        }
    };
}

module.exports = startMispacount;

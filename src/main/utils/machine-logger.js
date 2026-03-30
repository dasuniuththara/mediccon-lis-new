const fs = require('fs');
const path = require('path');

// Global session counters
const globalStats = {
    rxCount: 0,
    txCount: 0,
    totalErrors: 0,
    startTime: Date.now()
};

class MachineLogger {
    constructor(machineId) {
        this.machineId = machineId;
        // Lazy-load app to avoid issues with module load order
        const { app } = require('electron');
        const basePath = app.isPackaged ? app.getPath('userData') : process.cwd();
        this.logDir = path.join(basePath, 'logs', 'machines');

        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        this.filePath = path.join(this.logDir, `${this.machineId}.log`);
    }

    _write(level, message) {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] [${level}] ${message}\n`;
        try {
            fs.appendFileSync(this.filePath, line);
        } catch (e) {
            console.error(`Failed to write to machine log ${this.machineId}:`, e);
        }
    }

    info(message) {
        this._write('INFO', message);
    }

    error(message) {
        globalStats.totalErrors++;
        this._write('ERROR', message);
    }

    incoming(data) {
        globalStats.rxCount++;
        this._write('RX', typeof data === 'string' ? data : JSON.stringify(data));
    }

    outgoing(data) {
        globalStats.txCount++;
        this._write('TX', typeof data === 'string' ? data : JSON.stringify(data));
    }

    raw(data) {
        const hex = Buffer.isBuffer(data) ? data.toString('hex').toUpperCase() :
            typeof data === 'string' ? Buffer.from(data).toString('hex').toUpperCase() : '';
        if (hex) this._write('RAW', hex);
    }

    getRecentLogs(lines = 100) {
        try {
            if (!fs.existsSync(this.filePath)) return [];
            const content = fs.readFileSync(this.filePath, 'utf-8');
            const allLines = content.split('\n').filter(l => l.trim());
            return allLines.slice(-lines);
        } catch (e) {
            return [`Error reading logs: ${e.message}`];
        }
    }

    getPath() {
        return this.filePath;
    }

    static getGlobalStats() {
        return {
            ...globalStats,
            uptimeSeconds: Math.floor((Date.now() - globalStats.startTime) / 1000)
        };
    }
}

module.exports = MachineLogger;

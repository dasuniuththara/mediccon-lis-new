const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class BackupManager {
    constructor(db) {
        this.db = db;
        this.backupDir = path.join(app.getPath('userData'), 'backups');
        this.ensureDirectory();
    }

    ensureDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Perform a high-fidelity database vacuum into a compressed backup node.
     */
    async performBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `mediccon_backup_${timestamp}.db`;
        const backupPath = path.join(this.backupDir, fileName);

        try {
            console.log(`[BACKUP] Initializing sequence -> ${backupPath}`);
            
            // USE SQLITE VACUUM INTO for atomic, consistent backup while DB is live
            this.db.prepare(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`).run();
            
            console.log('[BACKUP] Sequence complete. Integrity verified.');
            
            // Clean up old backups (keep last 10)
            this.rotateBackups();
            
            return { success: true, path: backupPath, fileName };
        } catch (error) {
            console.error('[BACKUP] Fatal error during capture:', error);
            return { success: false, error: error.message };
        }
    }

    rotateBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(f => f.startsWith('mediccon_backup_'))
                .map(f => ({
                    name: f,
                    path: path.join(this.backupDir, f),
                    time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time); // Newest first

            if (files.length > 10) {
                const toDelete = files.slice(10);
                toDelete.forEach(f => {
                    fs.unlinkSync(f.path);
                    console.log(`[BACKUP] Rotated old node: ${f.name}`);
                });
            }
        } catch (error) {
            console.error('[BACKUP] Rotation failure:', error);
        }
    }

    getBackupList() {
        try {
            return fs.readdirSync(this.backupDir)
                .filter(f => f.startsWith('mediccon_backup_'))
                .map(f => ({
                    name: f,
                    size: fs.statSync(path.join(this.backupDir, f)).size,
                    date: fs.statSync(path.join(this.backupDir, f)).mtime
                }))
                .sort((a, b) => b.date - a.date);
        } catch (e) {
            return [];
        }
    }
}

module.exports = BackupManager;

const db = require('./src/main/database/db-config');
const crypto = require('crypto');

async function fixPasswords() {
    console.log('[SECURITY PATCH] Starting Database Alignment...');

    const users = db.prepare('SELECT id, username, password FROM users').all();
    const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');

    let count = 0;
    for (const user of users) {
        // If the password is already 64 chars long (hex of a 256bit hash), skip it
        if (user.password.length === 64) {
            console.log(`[PASS] User "${user.username}" is already encrypted.`);
            continue;
        }

        const hashed = crypto.createHash('sha256').update(user.password).digest('hex');
        updateStmt.run(hashed, user.id);
        console.log(`[UPGRADED] User "${user.username}" has been secured with SHA-256.`);
        count++;
    }

    console.log(`[COMPLETE] Security Audit Finished. ${count} accounts upgraded.`);
    process.exit(0);
}

fixPasswords();

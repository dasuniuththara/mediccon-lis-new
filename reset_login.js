const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database('mediccon_lis.db');

const hash = crypto.createHash('sha256').update('dev123').digest('hex');
db.prepare("UPDATE users SET password = ? WHERE username = 'developer'").run(hash);

console.log('[SECURITY] Reset developer account to baseline credential.');
db.close();

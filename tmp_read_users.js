const Database = require('better-sqlite3');
const db = new Database('mediccon_lis.db');
const users = db.prepare('SELECT id, username, role FROM users').all();
console.log('--- USERS IN DATABASE ---');
users.forEach(u => console.log(`ID: ${u.id} | USER: ${u.username} | ROLE: ${u.role}`));
db.close();

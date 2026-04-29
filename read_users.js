const Database = require('better-sqlite3');
const db = new Database('mediccon_lis.db');

const users = db.prepare("SELECT username, password, role FROM users").all();
console.log(JSON.stringify(users, null, 2));
db.close();

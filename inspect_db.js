const Database = require('better-sqlite3');
const db = new Database('mediccon_lis.db');

try {
    const facilities = db.prepare("SELECT * FROM facilities").all();
    console.log("Facilities in DB:", JSON.stringify(facilities, null, 2));
} catch (e) {
    console.error("Error reading facilities:", e.message);
}
db.close();

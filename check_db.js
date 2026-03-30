const Database = require('better-sqlite3');
const db = new Database('mediccon_lis.db');
const info = db.prepare("PRAGMA table_info(patients)").all();
console.log("PATIENTS TABLE INFO:");
console.log(JSON.stringify(info, null, 2));

const resultsInfo = db.prepare("PRAGMA table_info(results)").all();
console.log("RESULTS TABLE INFO:");
console.log(JSON.stringify(resultsInfo, null, 2));

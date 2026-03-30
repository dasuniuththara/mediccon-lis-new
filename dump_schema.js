const db = require('better-sqlite3')('mediccon_lis.db');
const tables = ['patients', 'invoices', 'results', 'inventory', 'procurement_orders', 'machines'];
for (const t of tables) {
    const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(t);
    if (row && row.sql) {
        console.log(row.sql + ';\n');
    }
}

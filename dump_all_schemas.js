const fs = require('fs');
const Database = require('better-sqlite3');
const db = new Database('mediccon_lis.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
const schemas = tables.map(t => {
    return {
        table: t.name,
        info: db.prepare(`PRAGMA table_info(${t.name})`).all()
    };
});
fs.writeFileSync('all_schemas.json', JSON.stringify(schemas, null, 2));
db.close();

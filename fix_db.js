const fs = require('fs');
const path = 'c:\\Users\\Dasuni Work\\OneDrive\\Desktop\\mediccon-lis\\src\\main\\database\\db-config.js';
let content = fs.readFileSync(path, 'utf8');

// Fix patients table in fixTable call
const patientsRegex = /fixTable\('patients',\s*`([\s\S]*?)`\);/g;
content = content.replace(patientsRegex, (match, p1) => {
    if (p1.includes('title')) return match; // already fixed
    let newColumns = p1;
    newColumns = newColumns.replace('nic TEXT UNIQUE,', 'nic TEXT UNIQUE,\n  title TEXT,');
    newColumns = newColumns.replace('age INTEGER,', 'age INTEGER,\n  age_type TEXT DEFAULT \'Years\',');
    return `fixTable('patients', \` ${newColumns}\`);\n\naddCol('patients', 'title', 'TEXT');\naddCol('patients', 'age_type', "TEXT DEFAULT 'Years'");`;
});

fs.writeFileSync(path, content);
console.log('Fixed db-config.js');

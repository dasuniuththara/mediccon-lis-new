const fs = require('fs');
const path = 'c:\\Users\\Dasuni Work\\OneDrive\\Desktop\\mediccon-lis\\src\\main\\database\\db-config.js';
let content = fs.readFileSync(path, 'utf8');

// Update patients table structure to include phone
const patientsRegex = /fixTable\('patients',\s*`([\s\S]*?)`\);/g;
content = content.replace(patientsRegex, (match, p1) => {
    if (p1.includes('phone')) return match; // already fixed
    let newColumns = p1;
    // Add phone column after gender or another appropriate spot
    newColumns = newColumns.replace('gender TEXT,', 'gender TEXT,\n  phone TEXT,');
    return `fixTable('patients', \` ${newColumns}\`);\n\naddCol('patients', 'phone', 'TEXT');`;
});

fs.writeFileSync(path, content);
console.log('Fixed db-config.js to include phone column');

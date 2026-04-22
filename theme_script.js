const fs = require('fs');
let code = fs.readFileSync('web-app/src/Dashboard.jsx', 'utf8');

// Global Backgrounds
code = code.replace(/bg-\[\#07090d\]/g, 'bg-slate-50');
code = code.replace(/bg-\[\#0d1117\]/g, 'bg-white');

// Brand Accents
code = code.replace(/text-orange-500/g, 'text-teal-600');
code = code.replace(/text-orange-400/g, 'text-teal-500');
code = code.replace(/bg-orange-500/g, 'bg-teal-600');
code = code.replace(/bg-orange-400/g, 'bg-teal-500');
code = code.replace(/from-orange-500/g, 'from-teal-500');
code = code.replace(/to-orange-700/g, 'to-teal-700');
code = code.replace(/ring-orange-500/g, 'ring-teal-500');
code = code.replace(/shadow-orange-950\/40/g, 'shadow-teal-900/10');
code = code.replace(/shadow-orange-500/g, 'shadow-teal-500');

// Text Colors
// General text-white to text-slate-900 
code = code.replace(/text-white/g, 'text-slate-900');
code = code.replace(/text-slate-200/g, 'text-slate-700');
code = code.replace(/text-slate-400/g, 'text-slate-500');

// Borders
code = code.replace(/border-white\/5/g, 'border-slate-100');
code = code.replace(/border-white\/10/g, 'border-slate-200');
code = code.replace(/bg-white\/5/g, 'bg-slate-50');
code = code.replace(/bg-white\/10/g, 'bg-slate-100');
code = code.replace(/hover:bg-white\/10/g, 'hover:bg-slate-100');
code = code.replace(/hover:text-white/g, 'hover:text-slate-900');

// Fix explicit text-slate-900 on colored backgrounds back to text-white
code = code.replace(/bg-teal-600 text-slate-900/g, 'bg-teal-600 text-white');
code = code.replace(/bg-rose-500 text-slate-900/g, 'bg-rose-500 text-white');
code = code.replace(/hover:text-slate-900/g, 'hover:text-teal-700');

fs.writeFileSync('web-app/src/Dashboard.jsx', code);
console.log('Done');

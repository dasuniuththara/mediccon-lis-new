const fs = require('fs');
const path = require('path');
const { transform } = require('sucrase');

const srcDir = path.join(__dirname, 'src', 'renderer', 'src');
const distDir = path.join(__dirname, 'src', 'renderer', 'dist');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

const interopHeader = `
function _interop(obj) {
    return (obj && obj.__esModule) ? (obj.default || obj) : obj;
}
`;

function processDir(currentSrc, currentDist) {
    const items = fs.readdirSync(currentSrc);
    items.forEach(item => {
        const srcPath = path.join(currentSrc, item);
        const distBase = item.replace(/\.jsx$/, '.js');
        const distPath = path.join(currentDist, distBase);

        if (fs.statSync(srcPath).isDirectory()) {
            if (!fs.existsSync(distPath)) fs.mkdirSync(distPath);
            processDir(srcPath, distPath);
        } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
            console.log('Compiling:', srcPath);
            let code = fs.readFileSync(srcPath, 'utf8');
            try {
                // First, transpile JSX
                let result = transform(code, {
                    transforms: ['jsx', 'imports'],
                    production: true
                });

                let finalCode = result.code;

                // Replace: require('./Y') with _interop(require('./Y'))
                // This covers:
                // const Sidebar = require('./Sidebar') -> const Sidebar = _interop(require('./Sidebar'))
                // const { X } = require('./Y') -> const { X } = _interop(require('./Y'))
                finalCode = finalCode.replace(/require\(['"](\.\.?\/[^'"]+)['"]\)/g, '_interop(require("$1"))');

                if (finalCode.includes('_interop')) {
                    finalCode = interopHeader + finalCode;
                }

                fs.writeFileSync(distPath, finalCode);
            } catch (err) {
                console.error('Error compiling:', srcPath, err.message);
            }
        }
    });
}

processDir(srcDir, distDir);
console.log('Compilation Complete!');

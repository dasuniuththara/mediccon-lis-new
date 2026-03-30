/**
 * Statlyte C Test Mappings
 * Code: LIS Test Code (Internal)
 * Name: Display Name
 * Category: Electrolyte
 * Analyzer Code: What the driver extracts
 */

const statlyteMappings = {
    'K': { analyzerCode: 'K', name: 'Potassium (K+)', unit: 'mmol/L', category: 'Electrolyte' },
    'NA': { analyzerCode: 'Na', name: 'Sodium (Na+)', unit: 'mmol/L', category: 'Electrolyte' },
    'CL': { analyzerCode: 'Cl', name: 'Chloride (Cl-)', unit: 'mmol/L', category: 'Electrolyte' },
    'LI': { analyzerCode: 'Li', name: 'Lithium (Li+)', unit: 'mmol/L', category: 'Electrolyte' },
    'ICA': { analyzerCode: 'iCa', name: 'Ionized Calcium (iCa)', unit: 'mmol/L', category: 'Electrolyte' }, // Assuming iCa results
    'PH': { analyzerCode: 'pH', name: 'pH', unit: '', category: 'Electrolyte' }
};

module.exports = { statlyteMappings };

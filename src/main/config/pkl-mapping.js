/**
 * PKL PCC 125 Test Mappings
 * Map machine codes to LIS test names.
 * These are standard biochemistry codes.
 */

const pklMappings = {
    'ALB': { name: 'Albumin', category: 'Biochemistry', analyzerCode: 'ALB' },
    'ALP': { name: 'Alkaline Phosphatase', category: 'Biochemistry', analyzerCode: 'ALP' },
    'ALT': { name: 'Alanine Aminotransferase', category: 'Biochemistry', analyzerCode: 'AL' },
    'AMY': { name: 'Amylase', category: 'Biochemistry', analyzerCode: 'AMY' },
    'AST': { name: 'Aspartate Aminotransferase', category: 'Biochemistry', analyzerCode: 'AS' },
    'BIL-D': { name: 'Bilirubin Direct', category: 'Biochemistry', analyzerCode: 'BIL-D' },
    'BIL-T': { name: 'Bilirubin Total', category: 'Biochemistry', analyzerCode: 'BIL-T' },
    'Ca': { name: 'Calcium', category: 'Biochemistry', analyzerCode: 'Ca' },
    'CHOL': { name: 'Cholesterol Total', category: 'Biochemistry', analyzerCode: 'CHOL' },
    'CK-MB': { name: 'CK-MB', category: 'Biochemistry', analyzerCode: 'CK-M' },
    'CREA': { name: 'Creatinine', category: 'Biochemistry', analyzerCode: 'CREA' },
    'GGT': { name: 'Gamma GT', category: 'Biochemistry', analyzerCode: 'GGT' },
    'GLU': { name: 'Glucose', category: 'Biochemistry', analyzerCode: 'GLU' },
    'HDL': { name: 'HDL Cholesterol', category: 'Biochemistry', analyzerCode: 'HDL' },
    'LDL': { name: 'LDL Cholesterol', category: 'Biochemistry', analyzerCode: 'LDL' },
    'TRIG': { name: 'Triglycerides', category: 'Biochemistry', analyzerCode: 'TRIG' },
    'UA': { name: 'Uric Acid', category: 'Biochemistry', analyzerCode: 'UA' },
    'UREA': { name: 'Urea', category: 'Biochemistry', analyzerCode: 'UREA' },
    'TP': { name: 'Total Protein', category: 'Biochemistry', analyzerCode: 'TP' },
    // Expanded Tests
    'Mg': { name: 'Magnesium', category: 'Biochemistry', analyzerCode: 'Mg' },
    'PHOS': { name: 'Phosphorus', category: 'Biochemistry', analyzerCode: 'PHOS' },
    'Fe': { name: 'Iron', category: 'Biochemistry', analyzerCode: 'Fe' },
    'TIBC': { name: 'Total Iron Binding Capacity', category: 'Biochemistry', analyzerCode: 'TIBC' },
    'LIP': { name: 'Lipase', category: 'Biochemistry', analyzerCode: 'LIP' },
    'LDH': { name: 'Lactate Dehydrogenase', category: 'Biochemistry', analyzerCode: 'LDH' },
    'CK': { name: 'Creatine Kinase (Total)', category: 'Biochemistry', analyzerCode: 'CK' },
    'HBA1C': { name: 'Hemoglobin A1c', category: 'Biochemistry', analyzerCode: 'HBA1C' },
    'CRP': { name: 'C-Reactive Protein', category: 'Biochemistry', analyzerCode: 'CRP' },
    'RF': { name: 'Rheumatoid Factor', category: 'Biochemistry', analyzerCode: 'RF' },
    'ASO': { name: 'Antistreptolysin O', category: 'Biochemistry', analyzerCode: 'ASO' },
    'IgA': { name: 'Immunoglobulin A', category: 'Biochemistry', analyzerCode: 'IgA' },
    'IgG': { name: 'Immunoglobulin G', category: 'Biochemistry', analyzerCode: 'IgG' },
    'IgM': { name: 'Immunoglobulin M', category: 'Biochemistry', analyzerCode: 'IgM' },
    'C3': { name: 'Complement C3', category: 'Biochemistry', analyzerCode: 'C3' },
    'C4': { name: 'Complement C4', category: 'Biochemistry', analyzerCode: 'C4' },
    'FER': { name: 'Ferritin', category: 'Biochemistry', analyzerCode: 'FER' },
    'TRF': { name: 'Transferrin', category: 'Biochemistry', analyzerCode: 'TRF' },
    'MALB': { name: 'Microalbumin', category: 'Biochemistry', analyzerCode: 'MALB' }
};

const seedPKLTests = (db) => {
    try {
        // Ensure analyzer_code column exists
        try {
            db.exec("ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT");
        } catch (e) {
            // Column likely exists
        }

        // Use INSERT OR IGNORE so user-set prices are never overwritten
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO test_catalog (code, name, category, price, analyzer_code)
            VALUES (?, ?, ?, ?, ?)
        `);

        Object.entries(pklMappings).forEach(([code, mapping]) => {
            // Using Code as ID (e.g. ALB)
            stmt.run(code, mapping.name, mapping.category, 650, mapping.analyzerCode);
        });

        console.log(`Seeded ${Object.keys(pklMappings).length} PKL tests.`);
    } catch (e) {
        console.error('Error seeding PKL tests:', e);
    }
};

module.exports = { pklMappings, seedPKLTests };

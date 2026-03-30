/**
 * Selectra Pro S & Pro M Test Mappings
 * Standard Biochemistry Panel
 */

const selectraMappings = {
    // Renal Function Test
    'GLU': { analyzerCode: 'GLU', name: 'Glucose (Fasting/Random)', unit: 'mg/dL', category: 'Biochemistry' },
    'UREA': { analyzerCode: 'UREA', name: 'Blood Urea', unit: 'mg/dL', category: 'Biochemistry' },
    'CREAT': { analyzerCode: 'CREA', name: 'Serum Creatinine', unit: 'mg/dL', category: 'Biochemistry' },
    'UA': { analyzerCode: 'UA', name: 'Uric Acid', unit: 'mg/dL', category: 'Biochemistry' },

    // Liver Function Test
    'TBIL': { analyzerCode: 'TBIL', name: 'Total Bilirubin', unit: 'mg/dL', category: 'Biochemistry' },
    'DBIL': { analyzerCode: 'DBIL', name: 'Direct Bilirubin', unit: 'mg/dL', category: 'Biochemistry' },
    'SGOT': { analyzerCode: 'AST', name: 'SGOT (AST)', unit: 'U/L', category: 'Biochemistry' },
    'SGPT': { analyzerCode: 'ALT', name: 'SGPT (ALT)', unit: 'U/L', category: 'Biochemistry' },
    'ALP': { analyzerCode: 'ALP', name: 'Alkaline Phosphatase', unit: 'U/L', category: 'Biochemistry' },
    'TP': { analyzerCode: 'TP', name: 'Total Protein', unit: 'g/dL', category: 'Biochemistry' },
    'ALB': { analyzerCode: 'ALB', name: 'Albumin', unit: 'g/dL', category: 'Biochemistry' },
    'GGT': { analyzerCode: 'GGT', name: 'Gamma GT', unit: 'U/L', category: 'Biochemistry' },

    // Lipid Profile
    'CHOL': { analyzerCode: 'CHOL', name: 'Total Cholesterol', unit: 'mg/dL', category: 'Biochemistry' },
    'TRIG': { analyzerCode: 'TRIG', name: 'Triglycerides', unit: 'mg/dL', category: 'Biochemistry' },
    'HDL': { analyzerCode: 'HDL', name: 'HDL Cholesterol', unit: 'mg/dL', category: 'Biochemistry' },
    'LDL': { analyzerCode: 'LDL', name: 'LDL Cholesterol', unit: 'mg/dL', category: 'Biochemistry' },

    // Electrolytes (if ISE module present) & Others
    'CA': { analyzerCode: 'CA', name: 'Calcium', unit: 'mg/dL', category: 'Biochemistry' },
    'PHOS': { analyzerCode: 'PHOS', name: 'Phosphorus', unit: 'mg/dL', category: 'Biochemistry' },
    'AMYL': { analyzerCode: 'AMYL', name: 'Amylase', unit: 'U/L', category: 'Biochemistry' },
    'CK': { analyzerCode: 'CK', name: 'CPK (Total)', unit: 'U/L', category: 'Biochemistry' },
    'CKMB': { analyzerCode: 'CK-MB', name: 'CK-MB', unit: 'U/L', category: 'Biochemistry' },
    'LDH': { analyzerCode: 'LDH', name: 'LDH', unit: 'U/L', category: 'Biochemistry' },
    'CRP': { analyzerCode: 'CRP', name: 'C-Reactive Protein', unit: 'mg/L', category: 'Biochemistry' },
    'RF': { analyzerCode: 'RF', name: 'Rheumatoid Factor', unit: 'IU/mL', category: 'Biochemistry' },
    'ASO': { analyzerCode: 'ASO', name: 'ASO Titer', unit: 'IU/mL', category: 'Biochemistry' },
    'HBA1C': { analyzerCode: 'HbA1c', name: 'HbA1c', unit: '%', category: 'Biochemistry' }
};

module.exports = { selectraMappings };

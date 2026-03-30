/**
 * DIALAB Autolyser Test Code Mapping
 * Rule: All codes from machine are 4 chars (padded with spaces)
 * Reference: Section IV / Manual Page 21
 */

const dialabMappings = {
    // 1. Common Biochemistry Test Codes
    "GLU ": { name: "Glucose", category: "Biochemistry", unit: "mg/dL", range: "70 - 105", analyzerCode: "GLU " },
    "BUN ": { name: "Blood Urea Nitrogen", category: "Biochemistry", unit: "mg/dL", range: "7 - 20", analyzerCode: "BUN " },
    "CREA": { name: "Creatinine", category: "Biochemistry", unit: "mg/dL", range: "0.6 - 1.2", analyzerCode: "CREA" },
    "CHO ": { name: "Total Cholesterol", category: "Biochemistry", unit: "mg/dL", range: "< 200", analyzerCode: "CHO " },
    "TRIG": { name: "Triglycerides", category: "Biochemistry", unit: "mg/dL", range: "< 150", analyzerCode: "TRIG" },
    "UA  ": { name: "Uric Acid", category: "Biochemistry", unit: "mg/dL", range: "2.4 - 6.0", analyzerCode: "UA  " },
    "ALB ": { name: "Albumin", category: "Biochemistry", unit: "g/dL", range: "3.4 - 5.4", analyzerCode: "ALB " },
    "PROT": { name: "Total Protein", category: "Biochemistry", unit: "g/dL", range: "6.0 - 8.3", analyzerCode: "PROT" },
    "BILT": { name: "Bilirubin Total", category: "Biochemistry", unit: "mg/dL", range: "0.1 - 1.2", analyzerCode: "BILT" },
    "BILD": { name: "Bilirubin Direct", category: "Biochemistry", unit: "mg/dL", range: "< 0.3", analyzerCode: "BILD" },
    "AST ": { name: "Aspartate Aminotransferase (AST/SGOT)", category: "Biochemistry", unit: "U/L", range: "10 - 40", analyzerCode: "AST " },
    "ALT ": { name: "Alanine Aminotransferase (ALT/SGPT)", category: "Biochemistry", unit: "U/L", range: "7 - 56", analyzerCode: "ALT " },
    "ALP ": { name: "Alkaline Phosphatase", category: "Biochemistry", unit: "U/L", range: "44 - 147", analyzerCode: "ALP " },
    "CA  ": { name: "Calcium", category: "Biochemistry", unit: "mg/dL", range: "8.5 - 10.2", analyzerCode: "CA  " },
    "MG  ": { name: "Magnesium", category: "Biochemistry", unit: "mg/dL", range: "1.7 - 2.2", analyzerCode: "MG  " },

    // 2. Electrolyte & Special Codes
    "NA  ": { name: "Sodium (Na+)", category: "Electrolyte", unit: "mmol/L", range: "135 - 145", analyzerCode: "NA  " },
    "K   ": { name: "Potassium (K+)", category: "Electrolyte", unit: "mmol/L", range: "3.5 - 5.1", analyzerCode: "K   " },
    "CL  ": { name: "Chloride (Cl-)", category: "Electrolyte", unit: "mmol/L", range: "98 - 107", analyzerCode: "CL  " },
    "A1C ": { name: "Hemoglobin A1C", category: "Biochemistry", unit: "%", range: "4.0 - 5.6", analyzerCode: "A1C " }
};

/**
 * Seed DIALAB Test Data into LIS 
 * Ensures all machine codes and metadata are correctly provisioned
 */
const seedDialabTests = (db) => {
    try {
        // 1. Ensure columns exist
        try {
            db.exec("ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT");
        } catch (e) { }
        try {
            db.exec("ALTER TABLE test_catalog ADD COLUMN unit TEXT");
        } catch (e) { }

        // 2. Insert into machines (For Dashboard & Configuration)
        db.prepare(`
            INSERT OR REPLACE INTO machines (id, name, type, category, connection_type, com_port, baud_rate, status, security_key)
            VALUES ('DIALAB-01', 'DIALAB Autolyser', 'Dialab Variable Serial', 'Biochemistry', 'Serial', 'COM1', 9600, 'Offline', 'NOT LINKED')
        `).run();

        // 3. Preparation statements
        // Use INSERT OR IGNORE so user-set prices are never overwritten
        const catalogStmt = db.prepare(`
            INSERT OR IGNORE INTO test_catalog (code, name, category, price, analyzer_code, unit)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const mappingStmt = db.prepare(`
            INSERT OR REPLACE INTO test_mappings (machine_id, machine_code, lis_name, unit)
            VALUES ('DIALAB-01', ?, ?, ?)
        `);

        // 4. Batch processing
        Object.entries(dialabMappings).forEach(([code, mapping]) => {
            const catalogCode = mapping.analyzerCode.trim();
            catalogStmt.run(catalogCode, mapping.name, mapping.category, 650, mapping.analyzerCode, mapping.unit);
            mappingStmt.run(mapping.analyzerCode, mapping.name, mapping.unit);
        });

        console.log(`[DIALAB] Successfully seeded ${Object.keys(dialabMappings).length} analyzer mappings.`);
    } catch (e) {
        console.error('[DIALAB] Seeding Failure:', e);
    }
};

/**
 * Translates machine code to display details
 */
const getTestDetails = (rawCode) => {
    const formattedCode = rawCode.padEnd(4, ' ');
    return dialabMappings[formattedCode] || { name: rawCode, unit: "N/A", range: "N/A" };
};

module.exports = { dialabMappings, seedDialabTests, getTestDetails };

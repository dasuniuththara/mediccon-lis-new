/**
 * Mispa Count X Test Code Mapping
 * Rule: Serial protocol segments 9-29
 */

const mispaMappings = {
    "9": { name: "WBC", category: "Hematology", unit: "x 10³/uL", range: "4.0 - 10.0", analyzerCode: "9" },
    "10": { name: "RBC", category: "Hematology", unit: "x 10⁶/uL", range: "3.5 - 5.5", analyzerCode: "10" },
    "11": { name: "PLT", category: "Hematology", unit: "x 10³/uL", range: "150 - 450", analyzerCode: "11" },
    "12": { name: "HGB", category: "Hematology", unit: "g/dL", range: "11.0 - 16.0", analyzerCode: "12" },
    "13": { name: "HCT", category: "Hematology", unit: "%", range: "35 - 50", analyzerCode: "13" },
    "14": { name: "MCV", category: "Hematology", unit: "fL", range: "80 - 100", analyzerCode: "14" },
    "15": { name: "MCH", category: "Hematology", unit: "pg", range: "27 - 32", analyzerCode: "15" },
    "16": { name: "MCHC", category: "Hematology", unit: "g/dL", range: "32 - 36", analyzerCode: "16" },
    "17": { name: "RDW-SD", category: "Hematology", unit: "fL", range: "35 - 56", analyzerCode: "17" },
    "18": { name: "RDW-CV", category: "Hematology", unit: "%", range: "11.5 - 14.5", analyzerCode: "18" },
    "19": { name: "MPV", category: "Hematology", unit: "fL", range: "7.0 - 11.0", analyzerCode: "19" },
    "20": { name: "LYMPH%", category: "Hematology", unit: "%", range: "20 - 40", analyzerCode: "20" },
    "21": { name: "MID%", category: "Hematology", unit: "%", range: "1 - 15", analyzerCode: "21" },
    "22": { name: "GRAN%", category: "Hematology", unit: "%", range: "50 - 70", analyzerCode: "22" },
    "23": { name: "LYMPH#", category: "Hematology", unit: "x 10³/uL", range: "1.0 - 3.7", analyzerCode: "23" },
    "24": { name: "MID#", category: "Hematology", unit: "x 10³/uL", range: "0.1 - 1.2", analyzerCode: "24" },
    "25": { name: "GRAN#", category: "Hematology", unit: "x 10³/uL", range: "1.2 - 6.8", analyzerCode: "25" },
    "26": { name: "PCT", category: "Hematology", unit: "%", range: "0.1 - 0.5", analyzerCode: "26" },
    "27": { name: "PDW", category: "Hematology", unit: "%", range: "9 - 17", analyzerCode: "27" },
    "28": { name: "PLCR", category: "Hematology", unit: "%", range: "13 - 43", analyzerCode: "28" },
    "29": { name: "PLCC", category: "Hematology", unit: "x 10³/uL", range: "30 - 90", analyzerCode: "29" }
};

/**
 * Seed Mispa Count X Test Data into LIS 
 */
const seedMispaTests = (db) => {
    try {
        // 1. Ensure columns exist
        try { db.exec("ALTER TABLE test_catalog ADD COLUMN analyzer_code TEXT"); } catch (e) { }
        try { db.exec("ALTER TABLE test_catalog ADD COLUMN unit TEXT"); } catch (e) { }

        // 2. Insert into machines
        db.prepare(`
            INSERT OR REPLACE INTO machines (id, name, type, category, connection_type, com_port, baud_rate, status, security_key)
            VALUES ('MISPA-CX', 'Mispa Count X', 'Serial', 'Hematology', 'Serial', 'COM4', 115200, 'Offline', 'NOT LINKED')
        `).run();

        // 3. Preparation statements
        // Use INSERT OR IGNORE so user-set prices are never overwritten on restart
        const catalogStmt = db.prepare(`
            INSERT OR IGNORE INTO test_catalog (code, name, category, price, analyzer_code, unit, ref_range)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const mappingStmt = db.prepare(`
            INSERT OR REPLACE INTO test_mappings (machine_id, machine_code, lis_name, unit)
            VALUES ('MISPA-CX', ?, ?, ?)
        `);

        // 4. Batch processing — individual parameters stored as 'Hematology-Parameter' 
        // so they DON'T appear in Protocol Selection Matrix.
        // Only FBC (Full Blood Count) should be selectable at LKR 400.
        Object.entries(mispaMappings).forEach(([code, mapping]) => {
            catalogStmt.run(code, mapping.name, 'Hematology-Parameter', 0, mapping.analyzerCode, mapping.unit, mapping.range);
            mappingStmt.run(mapping.analyzerCode, mapping.name, mapping.unit);
        });

        console.log(`[MISPA] Successfully seeded ${Object.keys(mispaMappings).length} analyzer mappings.`);
    } catch (e) {
        console.error('[MISPA] Seeding Failure:', e);
    }
};

module.exports = { mispaMappings, seedMispaTests };

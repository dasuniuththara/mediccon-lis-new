/**
 * iFlash 1200 Test Mapping Configuration
 * Maps LIS test codes to iFlash analyzer codes
 * Based on iFlash 1200 Assay & Channel configuration
 */

const iFlashTestMapping = {
    // Autoimmune Tests
    'ANA': {
        analyzerCode: 'ANA',
        channelNo: 1,
        name: 'Antinuclear Antibodies',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<20'
    },
    'DSDNA': {
        analyzerCode: 'dsDNA IgG',
        channelNo: 2,
        name: 'Anti-dsDNA IgG',
        category: 'Hormone',
        unit: 'IU/mL',
        referenceRange: '<100'
    },
    'SSA': {
        analyzerCode: 'SS-A IgG',
        channelNo: 3,
        name: 'Anti-SS-A IgG',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<20'
    },
    'SSB': {
        analyzerCode: 'SS-B IgG',
        channelNo: 4,
        name: 'Anti-SS-B IgG',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<20'
    },
    'SM': {
        analyzerCode: 'Sm IgG',
        channelNo: 5,
        name: 'Anti-Sm IgG',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<20'
    },
    'RNP70': {
        analyzerCode: 'RNP70 IgG',
        channelNo: 6,
        name: 'Anti-RNP70 IgG',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<20'
    },
    'JO1': {
        analyzerCode: 'Jo-1 IgG',
        channelNo: 7,
        name: 'Anti-Jo-1 IgG',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<20'
    },
    'SCL70': {
        analyzerCode: 'Scl-70 IgG',
        channelNo: 8,
        name: 'Anti-Scl-70 IgG',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<20'
    },
    'RFIGG': {
        analyzerCode: 'RF IgG',
        channelNo: 9,
        name: 'Rheumatoid Factor IgG',
        category: 'Hormone',
        unit: 'IU/mL',
        referenceRange: '<20'
    },
    'RFIGM': {
        analyzerCode: 'RF IgM',
        channelNo: 10,
        name: 'Rheumatoid Factor IgM',
        category: 'Hormone',
        unit: 'IU/mL',
        referenceRange: '<20'
    },
    'RF': {
        analyzerCode: 'RF',
        channelNo: 11,
        name: 'Rheumatoid Factor',
        category: 'Hormone',
        unit: 'IU/mL',
        referenceRange: '<15'
    },

    // Additional Hormone Tests (Common on iFlash)
    'TSH': {
        analyzerCode: 'TSH',
        channelNo: 12,
        name: 'Thyroid Stimulating Hormone',
        category: 'Hormone',
        unit: 'μIU/mL',
        referenceRange: '0.27-4.2'
    },
    'FT3': {
        analyzerCode: 'FT3',
        channelNo: 13,
        name: 'Free Triiodothyronine',
        category: 'Hormone',
        unit: 'pg/mL',
        referenceRange: '2.0-4.4'
    },
    'FT4': {
        analyzerCode: 'FT4',
        channelNo: 14,
        name: 'Free Thyroxine',
        category: 'Hormone',
        unit: 'ng/dL',
        referenceRange: '0.93-1.7'
    },
    'T3': {
        analyzerCode: 'T3',
        channelNo: 15,
        name: 'Total Triiodothyronine',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: '0.8-2.0'
    },
    'T4': {
        analyzerCode: 'T4',
        channelNo: 16,
        name: 'Total Thyroxine',
        category: 'Hormone',
        unit: 'μg/dL',
        referenceRange: '5.1-14.1'
    },
    'TGAB': {
        analyzerCode: 'TgAb',
        channelNo: 17,
        name: 'Thyroglobulin Antibody',
        category: 'Hormone',
        unit: 'IU/mL',
        referenceRange: '<115'
    },
    'TPOAB': {
        analyzerCode: 'TPOAb',
        channelNo: 18,
        name: 'Thyroid Peroxidase Antibody',
        category: 'Hormone',
        unit: 'IU/mL',
        referenceRange: '<34'
    },
    'CORTISOL': {
        analyzerCode: 'CORT',
        channelNo: 19,
        name: 'Cortisol',
        category: 'Hormone',
        unit: 'μg/dL',
        referenceRange: '6.2-19.4'
    },
    'TESTOSTERONE': {
        analyzerCode: 'TESTO',
        channelNo: 20,
        name: 'Testosterone',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: 'M: 2.49-8.36, F: 0.14-0.76'
    },
    'PROLACTIN': {
        analyzerCode: 'PRL',
        channelNo: 21,
        name: 'Prolactin',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: 'M: 4.04-15.2, F: 4.79-23.3'
    },
    'LH': {
        analyzerCode: 'LH',
        channelNo: 22,
        name: 'Luteinizing Hormone',
        category: 'Hormone',
        unit: 'mIU/mL',
        referenceRange: 'M: 1.7-8.6, F: Follicular 2.4-12.6'
    },
    'FSH': {
        analyzerCode: 'FSH',
        channelNo: 23,
        name: 'Follicle Stimulating Hormone',
        category: 'Hormone',
        unit: 'mIU/mL',
        referenceRange: 'M: 1.5-12.4, F: Follicular 3.5-12.5'
    },
    'ESTRADIOL': {
        analyzerCode: 'E2',
        channelNo: 24,
        name: 'Estradiol',
        category: 'Hormone',
        unit: 'pg/mL',
        referenceRange: 'M: 7.63-42.6, F: Follicular 12.5-166'
    },
    'PROGESTERONE': {
        analyzerCode: 'PROG',
        channelNo: 25,
        name: 'Progesterone',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: 'F: Follicular 0.2-1.5, Luteal 1.7-27.0'
    },
    'BHCG': {
        analyzerCode: 'β-HCG',
        channelNo: 26,
        name: 'Beta Human Chorionic Gonadotropin',
        category: 'Hormone',
        unit: 'mIU/mL',
        referenceRange: 'Non-pregnant: <5'
    },
    'AFP': {
        analyzerCode: 'AFP',
        channelNo: 27,
        name: 'Alpha-Fetoprotein',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: '<10'
    },
    'CEA': {
        analyzerCode: 'CEA',
        channelNo: 28,
        name: 'Carcinoembryonic Antigen',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: '<5'
    },
    'CA125': {
        analyzerCode: 'CA125',
        channelNo: 29,
        name: 'Cancer Antigen 125',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<35'
    },
    'CA199': {
        analyzerCode: 'CA19-9',
        channelNo: 30,
        name: 'Cancer Antigen 19-9',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<37'
    },
    'CA153': {
        analyzerCode: 'CA15-3',
        channelNo: 31,
        name: 'Cancer Antigen 15-3',
        category: 'Hormone',
        unit: 'U/mL',
        referenceRange: '<25'
    },
    'PSA': {
        analyzerCode: 'PSA',
        channelNo: 32,
        name: 'Prostate Specific Antigen',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: '<4'
    },
    'FPSA': {
        analyzerCode: 'fPSA',
        channelNo: 33,
        name: 'Free PSA',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: 'Ratio >0.25'
    },
    'FERRITIN': {
        analyzerCode: 'FERR',
        channelNo: 34,
        name: 'Ferritin',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: 'M: 24-336, F: 11-307'
    },
    'VIT_B12': {
        analyzerCode: 'VB12',
        channelNo: 35,
        name: 'Vitamin B12',
        category: 'Hormone',
        unit: 'pg/mL',
        referenceRange: '197-771'
    },
    'FOLATE': {
        analyzerCode: 'FOLA',
        channelNo: 36,
        name: 'Folate',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: '>3.0'
    },
    'VIT_D': {
        analyzerCode: '25-OH-VD',
        channelNo: 37,
        name: 'Vitamin D (25-OH)',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: '30-100'
    },
    'INSULIN': {
        analyzerCode: 'INS',
        channelNo: 38,
        name: 'Insulin',
        category: 'Hormone',
        unit: 'μIU/mL',
        referenceRange: '2.6-24.9'
    },
    'C_PEPTIDE': {
        analyzerCode: 'C-PEP',
        channelNo: 39,
        name: 'C-Peptide',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: '1.1-4.4'
    },
    'TROPONIN_I': {
        analyzerCode: 'cTnI',
        channelNo: 40,
        name: 'Cardiac Troponin I',
        category: 'Hormone',
        unit: 'ng/mL',
        referenceRange: '<0.04'
    }
};

/**
 * Get analyzer code for a given LIS test code
 */
function getAnalyzerCode(lisCode) {
    const mapping = iFlashTestMapping[lisCode.toUpperCase()];
    return mapping ? mapping.analyzerCode : lisCode;
}

/**
 * Get full test mapping details
 */
function getTestMapping(lisCode) {
    return iFlashTestMapping[lisCode.toUpperCase()] || null;
}

/**
 * Get all available tests
 */
function getAllTests() {
    return Object.keys(iFlashTestMapping).map(code => ({
        code,
        ...iFlashTestMapping[code]
    }));
}

/**
 * Insert iFlash test mappings into database
 */
function seedIFlashTests(db) {
    // Use INSERT OR IGNORE so user-set prices are never overwritten
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO test_catalog (code, name, category, price, analyzer_code)
        VALUES (?, ?, ?, ?, ?)
    `);

    Object.entries(iFlashTestMapping).forEach(([code, test]) => {
        stmt.run(code, test.name, test.category, 1850, test.analyzerCode);
    });

    console.log('[iFlash] Seeded', Object.keys(iFlashTestMapping).length, 'test mappings');
}

module.exports = {
    iFlashTestMapping,
    getAnalyzerCode,
    getTestMapping,
    getAllTests,
    seedIFlashTests
};

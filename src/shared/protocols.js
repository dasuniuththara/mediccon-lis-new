/**
 * Mediccon LIS Protocol Definitions
 * Definitions for HL7 (Health Level 7) and ASTM E1381 standards.
 */

const PROTOCOLS = {
    // 1. Common ASCII Control Characters for Hardware Communication
    ASCII: {
        STX: '\x02', // Start of Text
        ETX: '\x03', // End of Text
        EOT: '\x04', // End of Transmission
        ENQ: '\x05', // Enquiry
        ACK: '\x06', // Acknowledge
        NAK: '\x15', // Negative Acknowledge
        CR:  '\x0d', // Carriage Return
        LF:  '\x0a', // Line Feed
        VT:  '\x0b', // Vertical Tab (MLLP Start)
        FS:  '\x1c', // File Separator (MLLP End)
    },

    // 2. HL7 Protocol Mapping (Usually for Hormone/Electrolyte)
    // Based on HL7 v2.x Standards
    HL7: {
        DELIMITERS: {
            FIELD: '|',
            COMPONENT: '^',
            REPETITION: '~',
            ESCAPE: '\\',
            SUBCOMPONENT: '&'
        },
        SEGMENTS: {
            MSH: 'MSH', // Message Header (Contains Security Key/Machine ID)
            PID: 'PID', // Patient Identification (Contains NIC Number)
            OBR: 'OBR', // Observation Request
            OBX: 'OBX'  // Observation Result (Actual Test Values)
        },
        FIELDS: {
            PID_NIC: 3,         // PID|1||NIC_NUMBER...
            PID_NAME: 5,        // PID|1||NIC|^NAME...
            OBX_TEST_NAME: 3,   // OBX|1|ST|GLUCOSE...
            OBX_VALUE: 5,       // OBX|1|ST|GLUCOSE||110...
            OBX_UNIT: 6         // OBX|1|ST|GLUCOSE||110|mg/dL...
        }
    },

    // 3. ASTM Protocol Mapping (Usually for Biochemistry/Hematology)
    // Based on ASTM E1381/E1394 Standards
    ASTM: {
        RECORD_TYPES: {
            H: 'H', // Header (Machine ID)
            P: 'P', // Patient (NIC, Name, Age, Gender)
            O: 'O', // Order (Test Requested)
            R: 'R', // Result (The Value)
            L: 'L', // Terminator (End of Message)
            E: 'E'  // Error
        },
        FIELDS: {
            P_NIC: 3,           // P|1|NIC|...
            P_NAME: 5,          // P|1|NIC||NAME...
            P_AGE: 7,           // P|1|NIC||NAME||AGE...
            P_GENDER: 8,        // P|1|NIC||NAME||AGE|GENDER...
            R_TEST_NAME: 2,     // R|1|TEST_CODE|VALUE|...
            R_VALUE: 3,         // R|1|TEST_CODE|110|...
            R_UNIT: 4           // R|1|TEST_CODE|110|mg/dL|...
        }
    },

    /**
     * Helper to detect if a message is HL7 or ASTM
     * @param {string} data 
     */
    detectProtocol: (data) => {
        if (data.includes('MSH|')) return 'HL7';
        if (data.startsWith('H|') || data.includes('\x02H|')) return 'ASTM';
        return 'UNKNOWN';
    }
};

module.exports = PROTOCOLS;
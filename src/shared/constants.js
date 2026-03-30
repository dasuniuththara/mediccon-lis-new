/**
 * Mediccon LIS Global Constants
 * Shared between Main (Backend) and Renderer (Frontend) processes.
 */

const CONSTANTS = {
    // 1. Machine Categories (As per Boss's requirement)
    MACHINE_TYPES: {
        BIOCHEMISTRY: 'Biochemistry',
        HEMATOLOGY: 'Hematology',
        ELECTROLYTE: 'Electrolyte',
        HORMONE: 'Hormone'
    },

    // 2. Interface Protocols
    PROTOCOLS: {
        HL7: 'HL7 v2.x (TCP/IP)',
        ASTM: 'ASTM E1381 (RS232/Serial)',
        MLLP: 'MLLP'
    },

    // 3. Connection Status
    STATUS: {
        ONLINE: 'Online',
        OFFLINE: 'Offline',
        STANDBY: 'Standby',
        ERROR: 'Error',
        UNAUTHORIZED: 'Unauthorized'
    },

    // 4. IPC Channels (Communication Bridge Names)
    // Using constants prevents typos in window.api calls
    CHANNELS: {
        REGISTER_PATIENT: 'save-patient',
        GET_PATIENT_RESULTS: 'get-patient-results',
        VERIFY_MACHINE: 'verify-machine-key',
        REFRESH_RESULTS: 'refresh-results',
        LOG_EVENT: 'log-system-event'
    },

    // 5. Patient Demographics
    GENDERS: ['Male', 'Female', 'Other'],

    // 6. Security Constants
    SECURITY: {
        KEY_LENGTH: 16,
        ENCRYPTION_ALGO: 'aes-256-cbc'
    }
};

// Export for Node.js (Main) and React (Renderer)
module.exports = CONSTANTS;
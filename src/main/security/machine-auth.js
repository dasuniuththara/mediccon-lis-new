const crypto = require('crypto');

const MEDICCON_SECRET = "MEDICCON_PRO_SECURE_2024";

const MachineAuth = {
    // Generate a unique key for your boss to give to customers
    generateKey: (machineSerial) => {
        return crypto.createHmac('sha256', MEDICCON_SECRET)
            .update(machineSerial)
            .digest('hex').slice(0, 12).toUpperCase();
    },

    // Verify when machine sends data
    verify: (providedKey, machineSerial) => {
        const expected = MachineAuth.generateKey(machineSerial);
        return providedKey === expected;
    }
};

module.exports = MachineAuth;
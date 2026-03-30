const { log } = require('../utils/machine-logger');
const SystemRepo = require('../database/system-repo');

/**
 * Mediccon Dispatch Manager (Neural Communication Node)
 * Handles automated delivery of diagnostic reports via WhatsApp, Email, and SMS.
 */
const DispatchManager = {

    // 1. Core Dispatch Protocol
    sendDiagnosticReport: async (patient, resultType = 'LINK') => {
        const settings = SystemRepo.getSettings();

        // Safety Interlock: Check if Autopilot is enabled
        if (settings.comm_auto_dispatch !== 'true') {
            log(`[DISPATCH] Standing by. Autopilot node is currently inactive.`);
            return { success: false, error: 'DISPATCH_INACTIVE' };
        }

        log(`[DISPATCH] Initializing communication vector for patient: ${patient.name} (${patient.nic})`);

        const phone = patient.phone;
        if (!phone) {
            log(`[DISPATCH] Error: Missing contact node for patient ${patient.nic}`);
            return { success: false, error: 'MISSING_CONTACT' };
        }

        // Generate the secure report link (Mock for now)
        const reportLink = `https://portal.mediccon.lk/reports/${patient.nic}/v${Date.now()}`;

        try {
            // WHATSAPP VECTOR
            if (settings.comm_whatsapp_enabled === 'true') {
                await DispatchManager.dispatchWhatsApp(phone, patient.name, reportLink);
            }

            // EMAIL VECTOR (Optional)
            if (patient.email && settings.comm_email_enabled === 'true') {
                await DispatchManager.dispatchEmail(patient.email, patient.name, reportLink);
            }

            return { success: true, timestamp: new Date().toISOString() };
        } catch (error) {
            log(`[DISPATCH] Critical Failure: ${error.message}`);
            return { success: false, error: error.message };
        }
    },

    // 2. WhatsApp Delivery Node (Mock/Placeholder API)
    dispatchWhatsApp: async (phone, name, link) => {
        log(`[WHATSAPP] Sending report vector to ${phone}...`);

        // --- PRO-FORM TEXT ---
        const message = `
*MEDICCON CLINICAL LABORATORIES*
        
Dear *${name}*,
Your diagnostic report is now ready and has been authorized by our clinical team.
        
🔗 *SECURE REPORT LINK:*
${link}
        
_This is an automated diagnostic node. Please do not reply._
        `.trim();

        // SIMULATION DELAY (Realistic throughput)
        return new Promise((resolve) => {
            setTimeout(() => {
                log(`[WHATSAPP] Delivered successfully to ${phone}`);
                resolve(true);
            }, 1500);
        });
    },

    // 3. Email Delivery Node
    dispatchEmail: async (email, name, link) => {
        log(`[EMAIL] Dispatching secure link to ${email}`);
        // Integration with SMTP/SendGrid/Resend would go here
        return true;
    }
};

module.exports = DispatchManager;

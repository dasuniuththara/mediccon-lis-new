const { contextBridge, ipcRenderer } = require('electron');

const api = {
    // --- SYSTEM ---
    checkHardware: () => ipcRenderer.invoke('check-hardware'),
    login: (credentials) => ipcRenderer.invoke('login', credentials),
    getSecurityStats: () => ipcRenderer.invoke('get-security-stats'),
    getSystemSettings: () => ipcRenderer.invoke('get-system-settings'),
    saveSystemSetting: (key, value) => ipcRenderer.invoke('save-system-setting', { key, value }),
    addCatalogItem: (item) => ipcRenderer.invoke('add-catalog-item', item),
    getQuickStats: () => ipcRenderer.invoke('get-quick-stats'),
    getDeepAnalytics: (days) => ipcRenderer.invoke('get-deep-analytics', days),
    exportAnalytics: () => ipcRenderer.invoke('export-analytics'),
    getInventoryAI: () => ipcRenderer.invoke('get-inventory-ai'),
    getProcurementOrders: () => ipcRenderer.invoke('get-procurement-orders'),
    createProcurementOrder: (order) => ipcRenderer.invoke('create-procurement-order', order),
    updateProcurementStatus: (data) => ipcRenderer.invoke('update-procurement-status', data),
    triggerAutoProcurement: () => ipcRenderer.invoke('trigger-auto-procurement'),
    getLatestActivity: () => ipcRenderer.invoke('get-latest-activity'),
    updateUserPermissions: (userId, machineIds) => ipcRenderer.invoke('update-user-permissions', { userId, machineIds }),
    authorizeHardware: () => ipcRenderer.invoke('authorize-hardware'),
    getBackups: () => ipcRenderer.invoke('get-backups'),
    backupNow: () => ipcRenderer.invoke('back-up-now'),
    getTestReferenceRanges: (testCode) => ipcRenderer.invoke('get-test-reference-ranges', testCode),
    saveTestReferenceRange: (range) => ipcRenderer.invoke('save-test-reference-range', range),
    deleteTestReferenceRange: (id) => ipcRenderer.invoke('delete-test-reference-range', id),

    // --- PATIENTS ---
    registerPatient: (patientData) => ipcRenderer.invoke('register-patient', patientData),
    getPatientResults: (data) => ipcRenderer.invoke('get-patient-results', data), // expects { nic, visitId }
    getVisits: (nic) => ipcRenderer.invoke('get-visits', nic),
    getPatientTests: (nic) => ipcRenderer.invoke('get-patient-tests', nic),
    getPatients: () => ipcRenderer.invoke('get-patients'),
    updatePatient: (oldNic, newNic, name) => ipcRenderer.invoke('update-patient', { oldNic, newNic, name }),
    getHistoricalTestResults: (data) => ipcRenderer.invoke('get-historical-test-results', data),
    getPatientTrends: (nic) => ipcRenderer.invoke('get-patient-trends', nic),
    deletePatient: (nic) => ipcRenderer.invoke('delete-patient', nic),

    // --- DOCTORS ---
    getReferringDoctors: () => ipcRenderer.invoke('get-referring-doctors'),
    addReferringDoctor: (doctor) => ipcRenderer.invoke('add-referring-doctor', doctor),
    updateReferringDoctor: (id, doctor) => ipcRenderer.invoke('update-referring-doctor', { id, doctor }),
    deleteReferringDoctor: (id) => ipcRenderer.invoke('delete-referring-doctor', id),
    getDoctorStats: (id) => ipcRenderer.invoke('get-doctor-stats', id),

    // --- BILLING & CATALOG ---
    getTestCatalog: () => ipcRenderer.invoke('get-test-catalog'),
    updateTestPrice: (code, price) => ipcRenderer.invoke('update-test-price', { code, price }),
    updateCatalogItem: (item) => ipcRenderer.invoke('update-catalog-item', item),
    createInvoice: (data) => ipcRenderer.invoke('create-invoice', data),
    getInvoice: (nic) => ipcRenderer.invoke('get-invoice', nic),
    getInvoiceByVisit: (visitId) => ipcRenderer.invoke('get-invoice-by-visit', visitId),
    updateInvoice: (id, data) => ipcRenderer.invoke('update-invoice', { id, data }),
    getAllInvoices: () => ipcRenderer.invoke('get-all-invoices'),

    // --- MACHINES ---
    getMachines: (userData) => ipcRenderer.invoke('get-machines', userData),
    getFacilityId: () => ipcRenderer.invoke('get-facility-id'),
    getMachineConfig: (machineId) => ipcRenderer.invoke('get-machine-config', machineId),
    saveMachineConfig: (config) => ipcRenderer.invoke('save-machine-config', config),
    // --- Inventory System ---
    getInventory: () => ipcRenderer.invoke('get-inventory'),
    getInventoryItems: () => ipcRenderer.invoke('get-inventory'),
    updateStock: (data) => ipcRenderer.invoke('update-stock', data),
    updateInventoryStock: (data) => ipcRenderer.invoke('update-stock', data),
    addInventoryItem: (item) => ipcRenderer.invoke('add-inventory-item', item),
    deleteInventoryItem: (id) => ipcRenderer.invoke('delete-inventory-item', id),
    getItemByBarcode: (barcode) => ipcRenderer.invoke('get-item-by-barcode', barcode),
    getInventoryLogs: (itemId) => ipcRenderer.invoke('get-inventory-logs', itemId),
    getTestReagents: (testCode) => ipcRenderer.invoke('get-test-reagents', testCode),
    addTestReagent: (mapping) => ipcRenderer.invoke('save-test-reagent', mapping),
    saveTestReagent: (mapping) => ipcRenderer.invoke('save-test-reagent', mapping),
    deleteTestReagent: (id) => ipcRenderer.invoke('delete-test-reagent', id),
    getSerialPorts: () => ipcRenderer.invoke('get-serial-ports'),
    verifyMachineKey: (machineId, key) => ipcRenderer.invoke('verify-machine-key', { machineId, key }),
    deleteMachine: (id) => ipcRenderer.invoke('delete-machine', id),

    // --- SECURITY & AUTH ---
    getSecurityKey: (machineId) => ipcRenderer.invoke('get-security-key', machineId),
    authorizeMachine: (username, machineId) => ipcRenderer.invoke('authorize-machine', { username, machineId }),

    // --- MAPPINGS ---
    getTestMappings: (machineId) => ipcRenderer.invoke('get-test-mappings', machineId),
    saveTestMapping: (mapping) => ipcRenderer.invoke('save-test-mapping', mapping),
    deleteTestMapping: (id) => ipcRenderer.invoke('delete-test-mapping', id),

    // --- USER MANAGEMENT ---
    getUsers: () => ipcRenderer.invoke('get-users'),
    registerUser: (userData) => ipcRenderer.invoke('register-user', userData),
    deleteUser: (id) => ipcRenderer.invoke('delete-user', id),

    // --- INTEGRATIONS ---
    seedIFlashTests: () => ipcRenderer.invoke('seed-iflash-tests'),
    seedStatlyteTests: () => ipcRenderer.invoke('seed-statlyte-tests'),
    seedSelectraTests: () => ipcRenderer.invoke('seed-selectra-tests'),
    seedPKLTests: () => ipcRenderer.invoke('seed-pkl-tests'),
    seedDialabTests: () => ipcRenderer.invoke('seed-dialab-tests'),
    seedMispaTests: () => ipcRenderer.invoke('seed-mispa-tests'),
    simulateMispaResult: (nic) => ipcRenderer.invoke('simulate-mispa-result', nic),
    simulatePatientResults: (nic) => ipcRenderer.invoke('simulate-patient-results', nic),

    getMachineLogs: (machineId) => ipcRenderer.invoke('get-machine-logs', machineId),
    getMiddlewareStats: () => ipcRenderer.invoke('get-middleware-stats'),
    getMotherUIStats: () => ipcRenderer.invoke('get-mother-ui-stats'),
    getPendingOrders: () => ipcRenderer.invoke('get-pending-orders'),
    simulateAnalyzerQuery: (nic, machineId) => ipcRenderer.invoke('simulate-analyzer-query', { nic, machineId }),
    getWorklist: () => ipcRenderer.invoke('get-worklist'),
    manualPushOrder: (data) => ipcRenderer.invoke('manual-push-order', data), // { nic, machineId }

    // --- RESULT VALIDATION ---
    getPendingResults: () => ipcRenderer.invoke('get-pending-results'),
    validateResult: (id, userId) => ipcRenderer.invoke('validate-result', { id, userId }),
    updateResult: (id, value, userId) => ipcRenderer.invoke('update-result', { id, value, userId }),
    updateResultTestName: (data) => ipcRenderer.invoke('update-result-test-name', data),
    rejectResult: (id) => ipcRenderer.invoke('reject-result', id),
    saveBarcode: (data) => ipcRenderer.invoke('save-barcode', data),

    // --- LISTENERS ---
    onNewResultReceived: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('refresh-results', listener);
        return () => ipcRenderer.removeListener('refresh-results', listener);
    },

    onMachineStatusUpdate: (callback) => {
        const listener = () => callback();
        ipcRenderer.on('refresh-machines', listener);
        return () => ipcRenderer.removeListener('refresh-machines', listener);
    },
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
};

if (contextBridge) {
    try { contextBridge.exposeInMainWorld('api', api); } catch (e) { window.api = api; }
} else {
    window.api = api;
}

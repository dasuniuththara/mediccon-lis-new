import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Mediccon Global Context
const MedicconContext = createContext();

/**
 * Mediccon Global Store Provider
 * Purpose: Manages application-wide state including navigation, 
 * machine connectivity, and current session data.
 */
export const MedicconProvider = ({ children }) => {
  // 1. Navigation State
  const [activePage, setActivePage] = useState('dashboard');
  const pages = ['dashboard', 'registration', 'doctors', 'billing', 'machinehub', 'middleware', 'results', 'inventory', 'security', 'settings'];

  const navigateNext = () => {
    const currentIndex = pages.indexOf(activePage);
    if (currentIndex < pages.length - 1) {
      setActivePage(pages[currentIndex + 1]);
    }
  };

  const navigateBack = () => {
    const currentIndex = pages.indexOf(activePage);
    if (currentIndex > 0) {
      setActivePage(pages[currentIndex - 1]);
    } else {
      setActivePage('dashboard');
    }
  };

  // 2. User/Session State
  const [user, setUser] = useState(null); // Default to logged out

  const login = (userData) => {
    setUser(userData);
    setActivePage('dashboard');
  };

  const logout = () => {
    setUser(null);
    // No need to set active page, app will redirect to login automatically
  };

  // 3. Machine Fleet State (Biochemistry, Hematology, Electrolyte, Hormone)
  const [machines, setMachines] = useState([
    { id: 'BIO-01', name: 'Biochemistry Analyzer', category: 'Biochemistry', status: 'Online', protocol: 'ASTM', key: 'MCN-BIO-X9' },
    { id: 'HEM-01', name: 'Hematology Pro', category: 'Hematology', status: 'Online', protocol: 'HL7', key: 'MCN-HEM-Z1' },
    { id: 'ELE-01', name: 'Electrolyte Hub', category: 'Electrolyte', status: 'Offline', protocol: 'HL7', key: 'MCN-ELE-A5' },
    { id: 'HOR-01', name: 'Hormone Analyzer', category: 'Hormone', status: 'Online', protocol: 'HL7', key: 'MCN-HOR-K2' }
  ]);

  // 4. Global Notifications / Alerts (e.g., Security Key Mismatch)
  const [alerts, setAlerts] = useState([]);

  // 5. Current Patient Context (shared between Registration and Results)
  const [selectedPatient, setSelectedPatient] = useState(null);

  // 6. Global Laboratory Branding (Lab Name, Address, etc.)
  const [labProfile, setLabProfile] = useState({
    lab_name: 'Mediccon LIS',
    lab_tagline: 'Advanced Clinical Intelligence',
    lab_phone: '',
    lab_address: '',
    lab_email: '',
    lab_logo: '',
    lab_accent_color: '#0d9488'
  });

  // 7. Global Search Buffer (Cross-page optimization)
  const [billingSearch, setBillingSearch] = useState('');
  const [machineSearch, setMachineSearch] = useState('');

  const loadLabProfile = async () => {
    try {
      const settings = await window.api.getSystemSettings();
      if (settings) {
        setLabProfile({
          lab_name: settings.lab_name || 'Mediccon LIS',
          lab_tagline: settings.lab_tagline || 'Advanced Clinical Intelligence',
          lab_phone: settings.lab_phone || '',
          lab_address: settings.lab_address || '',
          lab_email: settings.lab_email || '',
          lab_logo: settings.lab_logo || '',
          lab_accent_color: settings.lab_accent_color || '#0d9488'
        });
      }
    } catch (e) {
      console.error('[GlobalStore] Failed to load lab profile:', e);
    }
  };

  useEffect(() => {
    loadLabProfile();
  }, []);

  /**
   * Action: Update a machine's status globally when an HL7/ASTM 
   * handshake is received in the backend.
   */
  const updateMachineStatus = (machineId, newStatus) => {
    setMachines(prev => prev.map(m =>
      m.id === machineId ? { ...m, status: newStatus } : m
    ));
  };

  /**
   * Action: Add a system alert (e.g., "Unauthorized Machine Attempt")
   */
  const addAlert = (message, type = 'info') => {
    const newAlert = { id: Date.now(), message, type, time: new Date() };
    setAlerts(prev => [newAlert, ...prev]);
  };

  // Listen for real-time hardware events from the Electron Bridge
  useEffect(() => {
    if (window.api && window.api.onNewResultReceived) {
      window.api.onNewResultReceived((data) => {
        if (data && data.nic) {
          addAlert(`New result received for NIC: ${data.nic}`, 'success');
        }
        if (data && data.machineId) {
          updateMachineStatus(data.machineId, 'Online');
        }
      });
    }
  }, []);

  const value = {
    activePage,
    setActivePage,
    navigateNext,
    navigateBack,
    user,
    login,
    logout,
    machines,
    selectedPatient,
    setSelectedPatient,
    alerts,
    addAlert,
    updateMachineStatus,
    labProfile,
    loadLabProfile,
    billingSearch,
    setBillingSearch,
    machineSearch,
    setMachineSearch
  };

  return (
    <MedicconContext.Provider value={value}>
      {children}
    </MedicconContext.Provider>
  );
};

// Custom hook for easy access to the store
export const useGlobalStore = () => {
  const context = useContext(MedicconContext);
  if (!context) {
    throw new Error('useGlobalStore must be used within a MedicconProvider');
  }
  return context;
};
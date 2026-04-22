import React from 'react';
import { MedicconProvider, useGlobalStore } from './store/globalStore';
import { toast, Toaster } from 'react-hot-toast';

// Import Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Import Pages
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import MachineHub from './pages/MachineHub';
import LabResults from './pages/LabResults';
import SystemSettings from './pages/SystemSettings';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import BillingMatrix from './pages/BillingMatrix';
import SecuritySettings from './pages/SecuritySettings';
import DoctorMatrix from './pages/DoctorMatrix';
import MiddlewareHub from './pages/MiddlewareHub';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Procurement from './pages/Procurement';
import MotherUI from './pages/MotherUI';
import AmbientMatrix from './components/AmbientMatrix';

/**
 * Mediccon LIS Main Application Architecture
 * High-fidelity control layout managing multi-node synchronization and workspace rendering.
 */
const AppContent = () => {
  const { activePage, setActivePage, user, logout, labProfile } = useGlobalStore();

  React.useEffect(() => {
    const pageTitles = {
      dashboard: 'Command Center',
      registration: 'Patient Registry',
      results: 'Report Matrix',
      machinehub: 'Analyzer Hub',
      middleware: 'Integration Hub',
      inventory: 'Asset Matrix',
      analytics: 'Lab Intelligence',
      motherui: 'Global Matrix'
    };
    document.title = `MedicconLIS - ${pageTitles[activePage] || 'Advanced'}`;
  }, [activePage]);

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'registration':
        return <Registration user={user} />;
      case 'billing':
        return <BillingMatrix />;
      case 'machinehub':
        return <MachineHub />;
      case 'middleware':
        return user?.role?.toLowerCase() === 'developer' ? <MiddlewareHub /> : <Dashboard />;
      case 'results':
        return <LabResults />;
      case 'inventory':
        return user?.role?.toLowerCase() === 'developer' ? <Inventory /> : <Dashboard />;
      case 'security':
        return user?.role?.toLowerCase() === 'developer' ? <SecuritySettings /> : <Dashboard />;
      case 'doctors':
        return user?.role?.toLowerCase() === 'developer' ? <DoctorMatrix /> : <Dashboard />;
      case 'analytics':
        return user?.role?.toLowerCase() === 'developer' ? <AnalyticsDashboard /> : <Dashboard />;
      case 'motherui':
        return user?.role?.toLowerCase() === 'developer' ? <MotherUI /> : <Dashboard />;
      case 'procurement':
        return user?.role?.toLowerCase() === 'developer' ? <Procurement /> : <Dashboard />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] font-sans text-slate-100 overflow-hidden selection:bg-teal-500/30 selection:text-white">

      {/* 1. Primary Command Pipeline (Sidebar) */}
      <div className="print:hidden">
        <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={logout} user={user} />
      </div>

      {/* 2. Primary Data Matrix (Right side of Sidebar) */}
      <div className="flex-1 ml-[340px] flex flex-col h-full overflow-hidden relative bg-[#020617]">

        {/* Ambient Matrix Background */}
        <AmbientMatrix />

        {/* Technical Grid Overlay (Subtle) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none z-0"></div>

        {/* Dynamic Workspace Rendering Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 transition-all duration-700">
          <div className="min-h-full">
            {renderPage()}
          </div>
        </main>

        {/* 3. Global System Telemetry (Footer) */}
        <footer className="h-14 bg-slate-950 border-t border-white/5 px-12 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] print:hidden">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
              © {new Date().getFullYear()} {labProfile.lab_name.toUpperCase()} <span className="text-white opacity-40 italic">LIS COMMAND</span>
            </span>
            <div className="h-6 w-px bg-white/5" />
            <div className="flex items-center gap-4">
              <span className="text-slate-500 hover:text-teal-500 cursor-pointer transition-colors uppercase tracking-[0.3em]">Documentation</span>
              <div className="h-1 w-1 bg-slate-800 rounded-full"></div>
              <span className="text-slate-500 hover:text-teal-500 cursor-pointer transition-colors uppercase tracking-[0.3em]">Node Status</span>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1.5 opacity-30">
                <div className="h-1 w-1.5 bg-slate-400 rounded-full"></div>
                <div className="h-1 w-3 bg-slate-400 rounded-full"></div>
                <div className="h-1 w-2 bg-slate-400 rounded-full"></div>
              </div>
              DB CLUSTER: STABLE / WAL_SYNC
            </div>

            <div className="flex items-center gap-4 bg-teal-900/20 px-5 py-2 rounded-2xl border border-teal-500/10 shadow-sm">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-500 blur-md opacity-30 animate-pulse"></div>
                <div className="h-2 w-2 rounded-full bg-teal-500 relative z-10"></div>
              </div>
              <span className="text-teal-400 font-black tracking-widest text-[9px]">ENCRYPTED HL7 TUNNEL ACTIVE</span>
            </div>
          </div>
        </footer>

      </div>
    </div>

  );
};

const App = () => {
  return (
    <MedicconProvider>
      <AppContent />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName="p-8"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px 24px',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxWidth: '400px'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#fff',
            },
          },
        }}
      />
    </MedicconProvider>
  );
};

export default App;
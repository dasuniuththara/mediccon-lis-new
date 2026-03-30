import React from 'react';
import {
  BarChart3,
  LayoutDashboard,
  UserPlus,
  Cpu,
  Database,
  ShieldCheck,
  Settings,
  LogOut,
  Microscope,
  ShoppingCart,
  Truck,
  Zap,
  ChevronRight,
  Fingerprint,
  Activity,
  Network,
  Terminal,
  Wallet,
  Stethoscope,
  Globe
} from 'lucide-react';

import { useGlobalStore } from '../store/globalStore';

/**
 * Mediccon LIS Side Navigation Engine
 * High-fidelity command conduit for multi-module switching and security authority.
 */
const Sidebar = ({ activePage, setActivePage, onLogout, user }) => {
  const { labProfile } = useGlobalStore();
  const isDeveloper = user && ['developer', 'master access', 'admin'].includes(user.role?.toLowerCase());

  const menuItems = [
    { id: 'dashboard', name: 'Command Center', icon: <LayoutDashboard size={22} />, desc: 'Node Telemetry' },
    { id: 'motherui', name: 'Global Command', icon: <Globe size={22} />, desc: 'Mother Node Systems', developerOnly: true },
    { id: 'analytics', name: 'Lab Intelligence', icon: <BarChart3 size={22} />, desc: 'Deep Data Matrix', developerOnly: true },
    { id: 'registration', name: 'Patient Registry', icon: <UserPlus size={22} />, desc: 'Ingress & Orders' },
    { id: 'doctors', name: 'Clinical Sources', icon: <Stethoscope size={22} />, desc: 'Referring Doctors', developerOnly: true },
    { id: 'billing', name: 'Financial Matrix', icon: <Wallet size={22} />, desc: 'Revenue & Audit' },
    { id: 'machinehub', name: 'Analyzer Hub', icon: <Cpu size={22} />, desc: 'Fleet Matrix' },
    { id: 'middleware', name: 'Middleware Hub', icon: <Terminal size={22} />, desc: 'Protocol Ingress', developerOnly: true },
    { id: 'results', name: 'Lab Reports', icon: <Database size={22} />, desc: 'Audit & Dispatch' },
    { id: 'inventory', name: 'Asset Supply', icon: <ShoppingCart size={22} />, desc: 'Resource Log', developerOnly: true },
    { id: 'procurement', name: 'Procurement', icon: <Truck size={22} />, desc: 'Supply Chain', developerOnly: true },
    { id: 'security', name: 'Security Command', icon: <ShieldCheck size={22} />, desc: 'Authority & Keys', developerOnly: true },
    { id: 'settings', name: 'System Core', icon: <Settings size={22} />, desc: 'Global Config' },
  ].filter(item => !item.developerOnly || isDeveloper);

  return (
    <div className="w-[340px] h-screen glass-dark text-slate-400 flex flex-col fixed left-0 top-0 shadow-[40px_0_100px_rgba(0,0,0,0.4)] z-[110] border-r border-white/5 overflow-hidden font-sans">

      {/* 1. Technical Background Architecture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-teal-600/10 via-transparent to-transparent pointer-events-none"></div>

      {/* 2. Global Brand Signature */}
      <div className="p-10 pb-12 relative z-10">
        <div className="flex items-center gap-6 group cursor-pointer" onClick={() => setActivePage('dashboard')}>
          <div className="relative">
            <div className="absolute inset-0 bg-teal-600 blur-3xl opacity-20 group-hover:opacity-60 transition-all duration-1000"></div>
            <div className="relative glass-dark p-4 rounded-[1.5rem] border border-white/10 shadow-3xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-700">
              <Microscope size={36} className="text-teal-400 group-hover:text-white transition-colors" />
            </div>
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-teal-500 rounded-full border-4 border-[#020617] node-pulse"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white font-black text-3xl tracking-tighter leading-none italic uppercase truncate max-w-[180px] brand-font">{labProfile.lab_name || 'MEDICCON'}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-px w-6 bg-teal-600/50"></div>
              <span className="text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase">V2.0 Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Terminal Navigation Matrix */}
      <nav className="flex-1 px-8 space-y-3 relative z-10 overflow-y-auto custom-scrollbar-dark pb-10">
        <div className="flex items-center gap-4 px-4 mb-8">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.6em] whitespace-nowrap">Integrated Operations Hub</p>
          <div className="h-px bg-white/5 flex-1"></div>
        </div>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full group relative flex items-center gap-5 px-7 py-5 rounded-[2rem] transition-all duration-700 ${activePage === item.id
              ? 'bg-teal-600 text-white shadow-[0_20px_60px_rgba(20,184,166,0.3)] -translate-y-1'
              : 'hover:bg-white/5 hover:text-white hover:translate-x-2'
              }`}
          >
            {activePage === item.id && (
              <div className="absolute inset-x-0 -bottom-2 h-10 bg-teal-600/30 blur-3xl rounded-full"></div>
            )}

            <div className={`transition-all duration-700 ${activePage === item.id ? 'text-white scale-125' : 'text-slate-500 group-hover:text-teal-400 group-hover:scale-110'
              }`}>
              {React.cloneElement(item.icon, { size: 24 })}
            </div>

            <div className="flex flex-col items-start min-w-0">
              <span className={`text-[15px] font-black tracking-tight uppercase leading-none mb-1.5 brand-font ${activePage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}>{item.name}</span>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${activePage === item.id ? 'text-teal-100/60' : 'text-slate-600 group-hover:text-teal-300/40'}`}>
                {item.desc}
              </span>
            </div>

            {activePage === item.id && (
              <div className="ml-auto">
                <ChevronRight size={18} className="text-white/60 animate-pulse" />
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* 4. Authority & Ingress Security */}
      <div className="p-10 relative z-10 mt-auto">
        <div className="glass-dark rounded-[3.5rem] p-8 border border-white/5 shadow-4xl relative overflow-hidden group/profile group-hover:border-white/10 transition-colors duration-700">
          <div className="absolute -top-10 -right-10 h-40 w-40 bg-teal-600/10 rounded-full blur-[60px] pointer-events-none"></div>

          <div className="flex items-center gap-5 mb-8 relative z-10">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl glass flex items-center justify-center border border-white/10 font-black text-teal-400 text-2xl shadow-2xl group-hover/profile:scale-110 group-hover/profile:rotate-12 transition-all duration-700">
                {user?.username ? user.username[0].toUpperCase() : 'G'}
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-4 border-slate-950 node-pulse shadow-lg"></div>
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-[16px] tracking-tight truncate uppercase leading-none mb-2 brand-font">{user ? user.username : 'GUEST_IO'}</p>
              <div className="flex items-center gap-2">
                <Fingerprint size={12} className="text-teal-500" />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] truncate">{user ? user.role : 'READ_ONLY'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-4 py-5 glass-dark hover:bg-rose-600 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-white/5 hover:border-transparent active:scale-95 group/logout shadow-2xl"
          >
            <LogOut size={20} className="group-hover/logout:-translate-x-1 transition-transform duration-500" /> Terminal Logout
          </button>
        </div>

        <div className="mt-8 flex justify-center items-center gap-4 px-2">
          <div className="h-1 w-1 rounded-full bg-teal-800"></div>
          <span className="text-[8px] font-black text-teal-700/50 uppercase tracking-[0.6em]">EcoTech Protocol Matrix</span>
          <div className="h-1 w-1 rounded-full bg-teal-800"></div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
import React, { useState, useEffect } from 'react';
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
  Globe,
  Server,
  Layers
} from 'lucide-react';

import { useGlobalStore } from '../store/globalStore';

/**
 * Mediccon LIS Side Navigation Engine
 * High-fidelity command conduit for multi-module switching and security authority.
 */
const Sidebar = ({ activePage, setActivePage, onLogout, user }) => {
  const { labProfile } = useGlobalStore();
  const [nodeId, setNodeId] = useState('...');

  useEffect(() => {
    window.api.getFacilityId().then(setNodeId);
  }, []);

  const isDeveloper = user && ['developer', 'master access', 'admin'].includes(user.role?.toLowerCase());

  const menuItems = [
    { id: 'dashboard', name: 'Command Hub', icon: <LayoutDashboard size={22} />, desc: 'Node Telemetry' },
    { id: 'motherui', name: 'Global Command', icon: <Globe size={22} />, desc: 'Mother Node Systems', developerOnly: true },
    { id: 'analytics', name: 'Intelligence', icon: <BarChart3 size={22} />, desc: 'Deep Data Matrix', developerOnly: true },
    { id: 'registration', name: 'Matrix', icon: <Layers size={22} />, desc: 'Patient Ingress' },
    { id: 'billing', name: 'Finance Matrix', icon: <Wallet size={22} />, desc: 'Receipts & Ledger' },
    { id: 'machinehub', name: 'Analyzer Hub', icon: <Cpu size={22} />, desc: 'Fleet Matrix' },
    { id: 'middleware', name: 'Middleware', icon: <Terminal size={22} />, desc: 'Protocol Ingress', developerOnly: true },
    { id: 'results', name: 'Verification', icon: <ShieldCheck size={22} />, desc: 'Audit & Dispatch' },
    { id: 'inventory', name: 'Asset Supply', icon: <ShoppingCart size={22} />, desc: 'Resource Log', developerOnly: true },
    { id: 'procurement', name: 'Procurement', icon: <Truck size={22} />, desc: 'Supply Chain Matrix', developerOnly: true },
    { id: 'security', name: 'Security', icon: <Fingerprint size={22} />, desc: 'Authority & Keys', developerOnly: true },
    { id: 'settings', name: 'System Core', icon: <Settings size={22} />, desc: 'Kernel Config' },
  ].filter(item => !item.developerOnly || isDeveloper);

  return (
    <div className="w-[340px] h-screen bg-[#020617]/80 backdrop-blur-3xl text-slate-400 flex flex-col fixed left-0 top-0 z-[110] border-r border-white/5 overflow-hidden font-sans">

      {/* 1. Neural Interface Background */}
      <div className="absolute inset-0 bg-[#020617]"></div>
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-teal-500/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      {/* 2. Brand Identity Ingress */}
      <div className="p-10 pb-12 relative z-10">
        <div className="flex items-center gap-6 group cursor-pointer" onClick={() => setActivePage('dashboard')}>
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500 blur-3xl opacity-20 group-hover:opacity-60 transition-all duration-1000"></div>
            <div className="relative bg-slate-900/50 p-4 rounded-3xl border border-white/10 shadow-3xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-700">
              <Microscope size={36} className="text-teal-400 group-hover:text-white transition-colors" />
            </div>
            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-teal-500 rounded-full border-4 border-[#020617] animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white font-black text-2xl tracking-tighter leading-none italic uppercase truncate max-w-[180px]">{labProfile.lab_name || 'MEDICCON'}</h1>
            <div className="flex items-center gap-2 mt-1.5 opacity-50">
              <div className="h-px w-6 bg-teal-600"></div>
              <span className="text-[9px] text-slate-300 font-black tracking-[0.4em] uppercase">V2.0 Core</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Grid */}
      <nav className="flex-1 px-8 space-y-2 relative z-10 overflow-y-auto custom-scrollbar-dark pb-10">
        <div className="flex items-center gap-4 px-4 mb-8 opacity-40">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.6em] whitespace-nowrap">Integrated Operations Hub</p>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full group relative flex items-center gap-5 px-6 py-4.5 rounded-2xl transition-all duration-500 ${activePage === item.id
              ? 'bg-teal-600 text-white shadow-[0_20px_50px_rgba(20,184,166,0.3)] -translate-y-0.5'
              : 'hover:bg-white/5 hover:text-white hover:translate-x-1'
              }`}
          >
            <div className={`transition-all duration-500 ${activePage === item.id ? 'text-white scale-110' : 'text-slate-500 group-hover:text-teal-400'
              }`}>
              {React.cloneElement(item.icon, { size: 22 })}
            </div>

            <div className="flex flex-col items-start min-w-0">
              <span className={`text-[14px] font-black tracking-tight uppercase leading-none mb-1 ${activePage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}>{item.name}</span>
              <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-colors ${activePage === item.id ? 'text-teal-100/60' : 'text-slate-600 group-hover:text-teal-300/40'
                }`}>
                {item.desc}
              </span>
            </div>

            {activePage === item.id && (
              <div className="ml-auto">
                <ChevronRight size={14} className="text-white/60 animate-pulse" />
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* 4. Authority Matrix */}
      <div className="p-8 relative z-10 mt-auto">
        <div className="bg-slate-900/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden group/profile hover:bg-slate-900/80 transition-all duration-700">
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black text-2xl group-hover/profile:scale-105 transition-transform duration-700">
                {user?.username ? user.username[0].toUpperCase() : 'G'}
              </div>
              <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full border-[3px] border-[#020617] animate-pulse"></div>
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-[14px] tracking-tight truncate uppercase leading-none mb-1.5 italic underline decoration-teal-500/30 underline-offset-4">{user ? user.username : 'GUEST_IO'}</p>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] truncate">{user ? user.role : 'READ_ONLY'}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-rose-600/20 text-slate-500 hover:text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all border border-white/5 hover:border-rose-500/30 active:scale-95"
          >
            <LogOut size={16} /> Terminal Logout
          </button>
        </div>

        <div className="mt-6 text-center">
          <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.5em]">System Node: {nodeId}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

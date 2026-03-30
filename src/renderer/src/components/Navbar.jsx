import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  UserCircle,
  ShieldCheck,
  Wifi,
  Settings,
  Circle,
  Activity,
  HelpCircle,
  ChevronRight,
  Zap,
  Network,
  Cpu,
  Fingerprint,
  Radio,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';

/**
 * Mediccon LIS Premium Network Ingress (Navbar)
 * High-fidelity interface for global search and real-time system telemetry.
 */
const Navbar = () => {
  const { setActivePage, setSelectedPatient, user, labProfile } = useGlobalStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setResults(null);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      const data = await window.api.searchGlobal(searchQuery);
      setResults(data);
      setShowResults(true);
    } catch (e) {
      console.error("Search Matrix Fault:", e);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.length >= 2) performSearch();
  };

  return (
    <header className="h-32 bg-white/40 backdrop-blur-2xl border-b border-white shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex items-center justify-between px-12 sticky top-0 z-[100] transition-all duration-700 font-sans selection:bg-teal-500/30">

      {/* 1. Brand Command Ingress */}
      <div className="flex items-center gap-8 group cursor-pointer" onClick={() => setActivePage('dashboard')}>
        <div className="h-16 w-16 bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-white shadow-3xl group-hover:scale-105 transition-all duration-700 relative overflow-hidden border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600/30 to-transparent"></div>
          <Zap size={28} className="relative z-10 group-hover:text-teal-400 group-hover:rotate-12 transition-all duration-500" />
        </div>
        <div className="hidden lg:block relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,1)]"></div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none italic uppercase whitespace-nowrap">{labProfile.lab_name} <span className="text-teal-600">Hub</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Eco Protocol Active</span>
          </div>
        </div>
      </div>

      {/* 2. Global Intelligence Probe */}
      <div className="relative w-full max-w-[800px] group mx-12">
        <form onSubmit={handleSearch} className="relative z-10">
          <label className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-600 transition-all duration-500 pointer-events-none group-focus-within:scale-110">
            <Search size={20} />
          </label>
          <input
            type="text"
            placeholder="PROBE REGISTRY / ASSETS / PROTOCOLS..."
            className="w-full bg-white/60 border-4 border-white rounded-[2.5rem] py-6 pl-20 pr-10 text-[12px] font-black text-slate-950 focus:outline-none focus:ring-[20px] focus:ring-teal-500/5 focus:bg-white focus:border-teal-500/20 transition-all placeholder:text-slate-600 shadow-sm uppercase tracking-wider"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          />
          {searchQuery && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-slate-950 text-[9px] font-black text-white px-3 py-1.5 rounded-xl animate-in fade-in zoom-in duration-300 uppercase tracking-[0.2em] shadow-xl">
              Probe Active
            </div>
          )}
        </form>

        {/* Cinematic Result Matrix Overlay */}
        {showResults && results && (
          <div className="absolute top-full left-0 right-0 mt-6 bg-white/95 backdrop-blur-2xl rounded-[3.5rem] shadow-[0_60px_150px_rgba(0,0,0,0.15)] border border-white overflow-hidden animate-in fade-in slide-in-from-top-6 duration-700 z-[200]">

            <div className="flex-1 max-h-[600px] overflow-y-auto custom-scrollbar p-4">
              {/* Clinical Registry Ingress */}
              {results.patients.length > 0 && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4 ml-6">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-600"></div>
                    <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Integrated Registry</h5>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {results.patients.map(p => (
                      <SearchItem
                        key={p.nic}
                        icon={<UserCircle size={22} />}
                        title={p.name}
                        subText={p.nic}
                        color="teal"
                        onClick={() => {
                          setSelectedPatient(p);
                          setActivePage('results');
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Asset Matrix Ingress */}
              {results.inventory.length > 0 && (
                <div className="p-6 space-y-4 border-t border-slate-50">
                  <div className="flex items-center gap-3 mb-4 ml-6">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                    <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Asset Telemetry</h5>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {results.inventory.map(i => (
                      <SearchItem
                        key={i.id}
                        icon={<Activity size={22} />}
                        title={i.name}
                        subText={`${i.quantity} ${i.unit} • ${i.category} CLUSTER`}
                        color="emerald"
                        onClick={() => {
                          setActivePage('inventory');
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {results.patients.length === 0 && results.inventory.length === 0 && (
                <div className="py-24 text-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 text-slate-600">
                    <Search size={32} />
                  </div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Query Zero: Zero matching nodes discovered</p>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-teal-600/5 pointer-events-none"></div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] relative z-10">EOF_PROBE_SIGNAL_AUTH</p>
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse"></div>
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Logic Engine Stable</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Temporal Node & Identity Cluster */}
      <div className="flex items-center gap-10 shrink-0">

        {/* Integrated Telemetry HUD */}
        <div className="hidden xl:flex items-center gap-8 bg-white/60 p-5 rounded-[2rem] border border-white shadow-sm backdrop-blur-md">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1.5">
              <Radio size={12} className="text-teal-600 animate-pulse" />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Network Data</span>
            </div>
            <p className="text-xl font-black text-slate-900 tabular-nums tracking-tighter italic leading-none">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</p>
          </div>

          <div className="h-10 w-px bg-slate-200/50"></div>

          <div className="flex flex-col items-start px-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Cpu size={12} className="text-emerald-500" />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Fleet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Global Link 100%</span>
            </div>
          </div>
        </div>

        {/* Identity & Control Matrix */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-right">
            <p className="text-[15px] font-black text-slate-900 tracking-tighter uppercase leading-none mb-1.5">{user?.username || 'GUEST_OPERATOR'}</p>
            <div className="flex items-center gap-2">
              <Fingerprint size={12} className="text-teal-500" />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">{user?.role || 'RESTRICTED'} ACCESS</span>
            </div>
          </div>

          <div className="relative group cursor-pointer" onClick={() => setActivePage('settings')}>
            <div className="absolute inset-0 bg-teal-600 blur-xl opacity-0 group-hover:opacity-40 transition-all duration-700"></div>
            <div className="h-16 w-16 bg-gradient-to-br from-slate-950 to-slate-800 rounded-[1.75rem] flex items-center justify-center text-white shadow-3xl border-4 border-white relative z-10 transition-transform group-hover:scale-110 group-hover:rotate-6 active:scale-95 duration-500">
              <UserCircle size={32} className="group-hover:text-teal-400 transition-colors" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 scale-0 group-hover:scale-100 transition-transform delay-100">
              <Settings size={12} className="text-slate-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

/* --- HIGH-FIDELITY SUBCOMPS --- */

const SearchItem = ({ icon, title, subText, color, onClick }) => {
  const themes = {
    teal: 'bg-teal-600 text-white shadow-teal-500/20',
    emerald: 'bg-emerald-600 text-white shadow-emerald-500/20',
  };
  const iconThemes = {
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 rounded-[2rem] transition-all duration-500 border-2 border-transparent group/item hover:scale-[1.01] ${color === 'teal' ? 'hover:bg-teal-600 hover:shadow-2xl hover:border-teal-500' : 'hover:bg-emerald-600 hover:shadow-2xl hover:border-emerald-500'
        }`}
    >
      <div className="flex items-center gap-5 text-left">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500 ${color === 'teal' ? 'bg-teal-50 text-teal-600 group-hover/item:bg-white/20 group-hover/item:text-white' : 'bg-emerald-50 text-emerald-600 group-hover/item:bg-white/20 group-hover/item:text-white'
          }`}>
          {icon}
        </div>
        <div>
          <p className="font-black text-lg tracking-tighter leading-none mb-1.5 group-hover/item:text-white transition-colors uppercase">{title}</p>
          <div className="flex items-center gap-2">
            <div className={`h-1 w-4 rounded-full transition-colors ${color === 'teal' ? 'bg-teal-200 group-hover/item:bg-white/30' : 'bg-emerald-200 group-hover/item:bg-white/30'}`}></div>
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest group-hover/item:text-white/60 transition-colors italic">{subText}</p>
          </div>
        </div>
      </div>
      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white opacity-0 group-hover/item:opacity-100 transition-all -translate-x-4 group-hover/item:translate-x-0 duration-500">
        <ChevronRight size={18} />
      </div>
    </button>
  );
};

export default Navbar;
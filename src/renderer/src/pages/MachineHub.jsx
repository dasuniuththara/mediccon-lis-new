import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Activity,
  AlertTriangle,
  Database,
  ChevronRight,
  Zap,
  Radio,
  Edit2,
  Trash2,
  Lock,
  Settings2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';
import useMachineStatus from '../hooks/useMachineStatus';
import MachineCard from '../components/MachineCard';
import MachineConfigModal from '../components/MachineConfigModal';
import MachineMonitorModal from '../components/MachineMonitorModal';

const MachineHub = () => {
  const { user, activePage, navigateNext, navigateBack, setActivePage, machineSearch, setMachineSearch } = useGlobalStore();
  const { machines, refresh } = useMachineStatus();
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [monitoredMachine, setMonitoredMachine] = useState(null);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState(machineSearch || '');

  // Sync from global store on mount; clear on unmount to prevent stale data
  React.useEffect(() => {
    if (machineSearch) {
      setSearchTerm(machineSearch);
    }
    return () => setMachineSearch('');
  }, []);

  const isDeveloper = user && ['developer', 'master access', 'admin'].includes(user.role?.toLowerCase());
  const categories = ['All', 'Biochemistry', 'Hematology', 'Electrolyte', 'Hormone'];

  // Filter machines based on authority
  const allMachinesList = Object.values(machines || {}).filter(m => {
    if (isDeveloper) return true;
    const authStr = user?.authorized_machines || '';
    const authorizedIds = authStr.includes('[')
      ? JSON.parse(authStr)
      : authStr.split(',').filter(Boolean);

    return authorizedIds.includes(m.id);
  });

  const filteredMachines = allMachinesList.filter(m => {
    const matchesFilter = filter === 'All' || m?.category === filter;
    const matchesSearch = !searchTerm ||
      m?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m?.id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddNew = () => {
    setSelectedMachine({
      id: "MCN-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      name: "New Analyzer",
      type: "HL7",
      category: "Biochemistry",
      connection_type: "Serial",
      status: "Offline",
      isNew: true
    });
  };

  const handleConfigure = (machine, action) => {
    if (action === 'monitor') {
      setMonitoredMachine(machine);
    } else if (action === 'delete') {
      handleDeleteMachine(machine.id);
    } else {
      setSelectedMachine(machine);
    }
  };

  const handleDeleteMachine = async (id) => {
    if (!confirm("Permanently decommission this hardware node? This action cannot be reversed.")) return;
    try {
      await window.api.deleteMachine(id);
      refresh();
    } catch (e) {
      alert("Decommission Fail: " + e.message);
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-1000 pb-32">

      {/* 1. Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 bg-white/40 p-10 rounded-[2.5rem] border border-white shadow-sm backdrop-blur-xl group">
        <div className="flex items-center gap-8 relative z-10 w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={navigateBack}
              className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <button
              onClick={navigateNext}
              className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
            >
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 flex-1">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Hardware Infrastructure Layer</span>
              </div>
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none flex items-center gap-4">
                Analyzer Hub
                <div className="h-12 w-px bg-slate-200/50"></div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 uppercase">
                  Active Fleet
                </span>
              </h1>
            </div>

            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 w-fit backdrop-blur-md">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${filter === cat ? 'bg-white text-teal-600 shadow-xl border border-slate-100' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          <button
            onClick={() => refresh()}
            className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl group/sync"
          >
            <RefreshCw size={16} className="group-hover/sync:rotate-180 transition-transform duration-700" />
            Synchronize Fleet
          </button>
        </div>
      </div>

      {/* 2. Global Fleet Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <StatusPod label="Total Node Fleet" value={allMachinesList.length} sub="Nodes" icon={<Cpu size={24} />} color="teal" description="Total registered analyzer units" />
        <StatusPod label="Operational Nodes" value={allMachinesList.filter(m => m.status === 'Online').length} sub="Synchronized" icon={<Zap size={24} />} color="emerald" description="Analyzers active in the stream" />
        <StatusPod label="System Faults" value={allMachinesList.filter(m => m.status === 'Error').length} sub="Critical" icon={<AlertTriangle size={24} />} color="rose" description="Nodes requiring immediate review" />
        <StatusPod label="Data Mapping" value={allMachinesList.reduce((acc, m) => acc + (m.mapping_count || 0), 0)} sub="Tests" icon={<Database size={24} />} color="cyan" description="Aggregated clinical parameters" />
      </div>

      {/* 3. Search & Control Matrix */}
      <div className="flex flex-col md:flex-row gap-6 bg-white/40 p-8 rounded-[2.5rem] border border-white shadow-sm backdrop-blur-md">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Probe Hardware Node Registry..."
            className="w-full bg-white/50 border border-slate-100 rounded-2xl py-5 pl-16 pr-6 text-[13px] font-black text-slate-800 focus:bg-white focus:ring-8 focus:ring-teal-500/5 focus:border-teal-500/30 transition-all placeholder:text-slate-600 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Hardware Node Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10">
        {filteredMachines.length === 0 ? (
          <div className="col-span-full py-40 text-center">
            <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-sm text-slate-600">
              <Radio size={48} className="animate-pulse" />
            </div>
            <p className="font-black text-slate-600 uppercase tracking-[0.4em] text-[11px]">No Hardware Nodes Discovered</p>
          </div>
        ) : filteredMachines.map(m => (
          <MachineCard
            key={m.id}
            machine={m}
            onConfigure={handleConfigure}
            isDeveloper={isDeveloper}
          />
        ))}

        {isDeveloper && (
          <button
            onClick={handleAddNew}
            className="group h-[500px] border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-6 hover:border-teal-500/30 hover:bg-teal-50/20 transition-all duration-700 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity"></div>
            <div className="h-24 w-24 bg-white border border-slate-200 text-slate-600 rounded-[2rem] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:text-teal-600 group-hover:border-teal-100 group-hover:rotate-90 transition-all duration-700">
              <Plus size={48} />
            </div>
            <div className="text-center space-y-2">
              <span className="text-[12px] font-black text-slate-600 uppercase tracking-[0.4em] group-hover:text-teal-600 transition-colors">Initialize Fresh Node</span>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Deploy Hardware Interface</p>
            </div>
          </button>
        )}
      </div>

      {/* Modals */}
      {selectedMachine && (
        <MachineConfigModal
          machine={selectedMachine}
          onClose={() => { setSelectedMachine(null); refresh(); }}
        />
      )}
      {monitoredMachine && (
        <MachineMonitorModal
          machine={monitoredMachine}
          onClose={() => setMonitoredMachine(null)}
        />
      )}
    </div>
  );
};

/* --- ENHANCED SUB-COMPONENTS --- */
const StatusPod = ({ label, value, sub, icon, color, description }) => {
  const themes = {
    teal: 'text-teal-600 bg-teal-50 border-teal-100 shadow-teal-100/50',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/50',
    rose: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/50',
    cyan: 'text-cyan-600 bg-cyan-50 border-cyan-100 shadow-cyan-100/50'
  };

  return (
    <div className="bg-white/60 rounded-[2.5rem] p-8 border border-white shadow-sm transition-all duration-700 group hover:shadow-[0_40px_100px_rgba(0,0,0,0.06)] hover:-translate-y-1 relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
        {React.cloneElement(icon, { size: 140 })}
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform duration-700 ${themes[color]}`}>
          {React.cloneElement(icon, { size: 28 })}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono">{label}</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none font-mono">
              {value}
            </span>
            {sub && <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{sub}</span>}
          </div>
        </div>
      </div>
      {description && (
        <div className="mt-6 pt-6 border-t border-slate-100/50 flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${themes[color].split(' ')[0].replace('text-', 'bg-')}`}></div>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest opacity-80">{description}</span>
        </div>
      )}
    </div>
  );
};

export default MachineHub;
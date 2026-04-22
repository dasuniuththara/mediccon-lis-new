import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Network,
  Terminal,
  Server,
  RadioReceiver,
  Activity as ActivityIcon
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

  useEffect(() => {
    if (machineSearch) {
      setSearchTerm(machineSearch);
    }
    return () => setMachineSearch('');
  }, []);

  const isDeveloper = user && ['developer', 'master access', 'admin'].includes(user.role?.toLowerCase());
  const categories = ['All', 'Biochemistry', 'Hematology', 'Electrolyte', 'Hormone'];

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
    <div className="p-8 space-y-10 animate-in fade-in duration-700 pb-32">
      {/* 1. Page Header: Deep Neon Ingress */}
      <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-12 -translate-y-12 rotate-45 group-hover:scale-110 transition-all duration-1000">
          <Cpu size={400} />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_12px_#14b8a6]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-teal-400">Hardware Infrastructure Layer</span>
            </div>
            <h1 className="text-7xl font-black text-white leading-none tracking-tighter uppercase italic">
              Analyzer <span className="text-teal-500">Hub</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
              Managing the global fleet of synchronized diagnostic analyzers and protocol interfaces.
            </p>
          </div>

          <div className="flex bg-black/40 p-3 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${filter === cat ? 'bg-teal-600 text-white shadow-2xl' : 'text-slate-500 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Global Fleet Telemetry Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <StatusPod label="Total Node Fleet" value={allMachinesList.length} sub="Nodes" icon={<Cpu size={24} />} color="teal" description="Total registered units" />
        <StatusPod label="Operational Nodes" value={allMachinesList.filter(m => m.status === 'Online').length} sub="Synchronized" icon={<Zap size={24} />} color="emerald" description="Modules active in stream" />
        <StatusPod label="System Faults" value={allMachinesList.filter(m => m.status === 'Error').length} sub="Critical" icon={<AlertTriangle size={24} />} color="rose" description="Nodes requiring review" />
        <StatusPod label="Data Mapping" value={allMachinesList.reduce((acc, m) => acc + (m.mapping_count || 0), 0)} sub="Tests" icon={<Database size={24} />} color="indigo" description="Clinical parameters" />
      </div>

      {/* 3. Search & Control Matrix Grid */}
      <div className="flex flex-col md:flex-row gap-6 bg-slate-900 border border-white/5 p-8 rounded-[3rem] shadow-2xl">
        <div className="relative flex-1 group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-400 transition-colors" size={24} />
          <input
            type="text"
            placeholder="Probe Hardware Node Registry..."
            className="w-full bg-slate-950 border border-white/10 rounded-[2rem] py-6 pl-20 pr-8 text-[14px] font-black text-white focus:ring-[12px] focus:ring-teal-500/5 focus:border-teal-500/30 transition-all placeholder:text-slate-800 outline-none uppercase tracking-widest"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => refresh()}
          className="h-20 px-12 bg-teal-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] hover:bg-teal-500 transition-all flex items-center gap-4 shadow-2xl active:scale-95 group"
        >
          <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-1000" />
          Synchronize Fleet
        </button>
      </div>

      {/* 4. Hardware Node Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10">
        {filteredMachines.length === 0 ? (
          <div className="col-span-full py-40 text-center opacity-20">
            <Radio size={80} className="mx-auto mb-8 animate-pulse" />
            <p className="font-black text-white uppercase tracking-[0.6em] text-[14px]">No Hardware Nodes Discovered</p>
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
            className="group h-[500px] border-4 border-dashed border-white/5 bg-white/5 rounded-[3.5rem] flex flex-col items-center justify-center gap-8 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all duration-700 relative overflow-hidden"
          >
            <div className="h-24 w-24 bg-slate-900 border border-white/10 text-slate-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:text-teal-400 group-hover:border-teal-500 group-hover:rotate-90 transition-all duration-700">
              <Plus size={52} />
            </div>
            <div className="text-center space-y-3">
              <span className="text-[14px] font-black text-slate-500 uppercase tracking-[0.5em] group-hover:text-teal-400 transition-colors leading-none">Initialize Fresh Node</span>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Deploy Hardware Interface</p>
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

const StatusPod = ({ label, value, sub, icon, color, description }) => {
  const themes = {
    teal: 'text-teal-400 bg-teal-400/10 border-teal-500/20',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-400/10 border-rose-500/20',
    indigo: 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20'
  };

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group hover:border-white/10 transition-all">
      <div className={`p-5 rounded-2xl ${themes[color]} w-fit mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-700`}>
        {icon}
      </div>
      <div className="space-y-2 relative z-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{label}</p>
        <div className="flex items-baseline gap-4">
          <span className="text-5xl font-black text-white tracking-tighter tabular-nums leading-none italic uppercase">{value}</span>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{sub}</span>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${themes[color].split(' ')[0].replace('text-', 'bg-')} shadow-[0_0_8px] shadow-current`}></div>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest opacity-80 italic">{description}</span>
      </div>
    </div>
  );
};

export default MachineHub;
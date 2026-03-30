import React from 'react';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Settings2,
  Database,
  Terminal,
  Server,
  Zap,
  Globe,
  Radio,
  Trash2
} from 'lucide-react';

/**
 * Mediccon Machine Status Card - High-Fidelity Professional Edition
 * Displays status, security verification, and protocol info for analyzers.
 */
const MachineCard = ({ machine, onConfigure, isDeveloper }) => {
  const isOnline = machine.status === 'Online';
  const isError = machine.status === 'Error';

  const theme = isOnline
    ? { color: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100', glow: 'shadow-emerald-200/40', pulse: 'bg-emerald-500' }
    : isError
      ? { color: 'text-rose-500', bg: 'bg-rose-50/50', border: 'border-rose-100', glow: 'shadow-rose-200/40', pulse: 'bg-rose-500' }
      : { color: 'text-slate-600', bg: 'bg-slate-50/50', border: 'border-slate-100', glow: 'shadow-slate-200/40', pulse: 'bg-slate-400' };

  return (
    <div className={`group relative bg-white/60 border border-white rounded-[3rem] shadow-sm hover:shadow-[0_40px_100px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-700 overflow-hidden backdrop-blur-xl flex flex-col min-h-[500px]`}>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
        <Cpu size={250} />
      </div>

      <div className="p-10 flex-1 flex flex-col">
        {/* Header Component */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-4">
            <div className={`h-16 w-16 rounded-2xl ${theme.bg} ${theme.color} border ${theme.border} flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
              <Cpu size={32} />
            </div>
            {isDeveloper && (
              <button
                onClick={() => onConfigure(machine, 'delete')}
                title="Decommission Hardware Node"
                className="h-10 w-10 mt-3 bg-white border border-slate-100 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm active:scale-95"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <div className="text-right space-y-2">
            <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 shadow-sm ${theme.color}`}>
              <div className={`h-2 w-2 rounded-full ${theme.pulse} ${isOnline ? 'animate-pulse' : ''} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
              {machine.status || 'Unknown'}
            </div>
            <p className="text-[9px] text-slate-600 font-mono font-black tracking-widest uppercase opacity-60">ID://{machine.id}</p>
          </div>
        </div>

        {/* Identity Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight group-hover:text-teal-600 transition-colors uppercase">{machine.name}</h3>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono">{machine.category} Node</span>
            <div className="h-1 w-1 rounded-full bg-slate-200"></div>
            <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Active Probe</span>
          </div>
        </div>

        {/* Telemetry Matrix */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <TelemetryBadge icon={<Server size={14} />} label="Interface" value={machine.type || 'ASTM/HL7'} />
          <TelemetryBadge icon={<Database size={14} />} label="Operations" value={`${machine.mapping_count || 0} Parameters`} color="teal" />
        </div>

        {/* Hardware Path Strip */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
            <div className="flex items-center gap-3">
              <Terminal size={14} className="text-slate-600" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Access Path</span>
            </div>
            <span className="text-[11px] font-black text-slate-800 font-mono tracking-tighter">
              {machine.connection_type === 'Ethernet'
                ? (machine.host ? `${machine.host}:${machine.port || 5000}` : 'TCP_PENDING')
                : (machine.com_port || 'COM_PENDING')}
            </span>
          </div>

          <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${machine.isVerified ? 'bg-teal-50/30 border-teal-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${machine.isVerified ? 'bg-teal-600 text-white shadow-lg' : 'bg-white text-slate-600'}`}>
                {machine.isVerified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Security Sentinel</span>
            </div>
            <span className={`text-[10px] font-black font-mono tracking-widest uppercase ${machine.isVerified ? 'text-teal-600' : 'text-slate-600'}`}>
              {machine.isVerified ? 'Synchronized' : 'Null_Key'}
            </span>
          </div>
        </div>

        {/* Control Cluster */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <button
            onClick={() => onConfigure(machine, 'monitor')}
            className={`flex items-center justify-center gap-3 py-4 px-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all hover:shadow-2xl hover:shadow-slate-400/20 active:scale-95 group/btn ${isDeveloper ? 'w-1/2' : 'w-full'}`}
          >
            <Activity size={18} className="group-hover/btn:scale-110 transition-transform" />
            <span>Sentinel Stream</span>
          </button>

          {isDeveloper && (
            <button
              onClick={() => onConfigure(machine, 'config')}
              className="flex items-center justify-center gap-3 py-4 px-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/50 shadow-sm transition-all active:scale-95 group/btn w-1/2"
            >
              <Settings2 size={18} className="group-hover/btn:rotate-90 transition-transform duration-500" />
              <span>Configure Node</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const TelemetryBadge = ({ icon, label, value, color = "slate" }) => {
  const colors = {
    teal: "text-teal-600 bg-teal-50/50 border-teal-100",
    cyan: "text-cyan-600 bg-cyan-50/50 border-cyan-100",
    slate: "text-slate-600 bg-slate-50/50 border-slate-100"
  };

  return (
    <div className={`p-4 rounded-3xl border flex flex-col gap-2 ${colors[color] || colors.slate}`}>
      <div className="flex items-center gap-2 opacity-60">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-[12px] font-black tabular-nums tracking-tighter uppercase">{value}</p>
    </div>
  );
};

export default MachineCard;
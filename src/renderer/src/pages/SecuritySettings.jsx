import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Cpu,
  Fingerprint,
  Terminal,
  ShieldAlert,
  ChevronRight,
  Copy,
  Check,
  Zap,
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';

/**
 * Mediccon Security & Machine Provisioning — Live Data Edition
 * Loads real analyzer machines from the DB and manages their security keys.
 */
const SecuritySettings = () => {
  const { navigateNext, navigateBack, setActivePage } = useGlobalStore();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(null);
  const [editKeys, setEditKeys] = useState({});

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    setLoading(true);
    try {
      const data = await window.api.getMachines();
      setMachines(data || []);
      // Pre-populate edit keys with existing values
      const keys = {};
      (data || []).forEach(m => { keys[m.id] = m.security_key || ''; });
      setEditKeys(keys);
    } catch (e) {
      console.error('SecuritySettings: failed to load machines', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshSync = async () => {
    setSyncing(true);
    await loadMachines();
    setSyncing(false);
  };

  const toggleKeyVisibility = (id) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSaveKey = async (machine) => {
    const newKey = editKeys[machine.id] || '';
    if (!newKey.trim()) return;
    setSaving(machine.id);
    try {
      await window.api.saveMachineConfig({ ...machine, security_key: newKey.trim().toUpperCase() });
      await loadMachines();
    } catch (e) {
      console.error('Failed to save key:', e);
      alert('Key save failed: ' + e.message);
    } finally {
      setSaving(null);
    }
  };

  const getStatusTheme = (machine) => {
    const hasKey = machine.security_key && machine.security_key !== 'NOT LINKED' && machine.security_key.length > 4;
    const isOnline = machine.status === 'Online';
    if (isOnline && hasKey) return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500', label: 'Verified & Online' };
    if (hasKey) return { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', dot: 'bg-teal-500', label: 'Key Provisioned' };
    return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', dot: 'bg-amber-500', label: 'No Key Linked' };
  };

  return (
    <div className="p-10 space-y-12 animate-in fade-in duration-1000 pb-40 font-sans selection:bg-teal-100">

      {/* 1. Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 bg-white/40 p-12 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-3xl group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-50/20 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-8 relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={navigateBack}
              className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <button
              onClick={navigateNext}
              className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse shadow-[0_0_12px_rgba(20,184,166,0.6)]"></div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Encryption Authority Matrix</span>
              </div>
              <h1 className="text-7xl font-black text-slate-950 tracking-tighter leading-none flex items-center gap-5">
                Security Command
                <div className="h-16 w-px bg-slate-200"></div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 uppercase">Gateway</span>
              </h1>
            </div>
            <div className="flex items-center gap-4 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 shadow-sm w-fit">
              <ShieldCheck className="text-emerald-500" size={18} />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">End-to-End Encrypted Tunnel Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-3 px-6 py-3 bg-white/80 border border-white rounded-2xl shadow-sm">
            <Database size={16} className="text-teal-600" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{machines.length} Hardware Nodes</span>
          </div>
          <button
            onClick={refreshSync}
            className="h-16 px-10 bg-slate-950 text-white rounded-[1.75rem] flex items-center gap-4 hover:bg-slate-800 transition-all shadow-xl active:scale-95 group/sync"
          >
            <RefreshCw className={syncing ? 'animate-spin' : 'group-hover/sync:rotate-180 transition-transform duration-700'} size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Synchronize Registry</span>
          </button>
        </div>
      </div>

      {/* 2. Machine Security Registry */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-black text-slate-600 uppercase tracking-[0.4em]">Live Hardware Security Nodes</h2>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-white/60 border border-white px-4 py-2 rounded-xl">
            {machines.filter(m => m.security_key && m.security_key !== 'NOT LINKED' && m.security_key.length > 4).length}/{machines.length} Provisioned
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-6 bg-white/40 rounded-[3rem] border border-white">
            <RefreshCw size={32} className="text-teal-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Loading Security Nodes...</p>
          </div>
        ) : machines.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6 bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="h-24 w-24 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 text-slate-600">
              <AlertCircle size={40} />
            </div>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">No Hardware Analyzer Nodes Provisioned</p>
            <p className="text-xs text-slate-600 font-medium">Register analyzers in the Machine Hub first</p>
          </div>
        ) : (
          <div className="space-y-4">
            {machines.map((machine) => {
              const theme = getStatusTheme(machine);
              const currentKey = editKeys[machine.id] || '';
              const isVisible = showKeys[machine.id];
              const isCopied = copiedId === machine.id;
              const isSaving = saving === machine.id;

              return (
                <div key={machine.id} className="bg-white/60 rounded-[2.5rem] border border-white shadow-sm backdrop-blur-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500 overflow-hidden group">
                  <div className="flex items-start gap-8 p-10">

                    {/* Machine Identity */}
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className={`h-20 w-20 shrink-0 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${theme.bg} ${theme.text} ${theme.border}`}>
                        <Cpu size={32} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xl font-black text-slate-950 uppercase tracking-tight leading-none mb-1 group-hover:text-teal-600 transition-colors truncate">{machine.name}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">ID://{machine.id}</span>
                          <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{machine.category || 'General'} Node</span>
                          <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{machine.type || 'ASTM'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`shrink-0 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${theme.bg} ${theme.text} ${theme.border}`}>
                      <div className={`h-2 w-2 rounded-full ${theme.dot} animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></div>
                      {theme.label}
                    </div>
                  </div>

                  {/* Key Management Row */}
                  <div className="px-10 pb-10 flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-3 bg-slate-50/80 border border-slate-100 rounded-[1.5rem] px-6 py-4 group-hover:bg-white transition-colors">
                      <Key size={16} className="text-teal-500 shrink-0" />
                      <input
                        type={isVisible ? 'text' : 'password'}
                        className="flex-1 bg-transparent outline-none font-mono text-sm font-black text-slate-800 tracking-wider uppercase placeholder:text-slate-600 placeholder:normal-case placeholder:tracking-normal"
                        placeholder="Enter security key to provision..."
                        value={currentKey}
                        onChange={(e) => setEditKeys(prev => ({ ...prev, [machine.id]: e.target.value }))}
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleKeyVisibility(machine.id)}
                          className="h-9 w-9 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-600 hover:text-teal-600 transition-all"
                        >
                          {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        {currentKey && (
                          <button
                            onClick={() => copyToClipboard(currentKey, machine.id)}
                            className="h-9 w-9 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-600 hover:text-teal-600 transition-all"
                          >
                            {isCopied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveKey(machine)}
                      disabled={isSaving || !currentKey.trim()}
                      className="h-14 px-8 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-3 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                      {isSaving ? 'Saving...' : 'Authorize'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Technical Security Notice */}
      <div className="bg-slate-950 rounded-[4rem] p-12 text-white flex items-start gap-12 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group border border-slate-800">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-teal-600/10 blur-[120px] pointer-events-none group-hover:bg-teal-600/20 transition-all duration-1000"></div>
        <div className="h-24 w-24 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
          <Lock size={40} className="text-teal-500" />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-black tracking-tight uppercase leading-none text-white">Private Protocol Enforcement</h3>
          <p className="text-slate-600 text-sm leading-relaxed max-w-2xl font-medium">
            Every data frame received via <b className="text-teal-400 font-black">ASTM (RS232)</b> or <b className="text-teal-400 font-black">HL7 (MLLP)</b> is matched against the machine's security key stored in the Mediccon database. Unrecognized hardware attempts are automatically blocked to prevent patient data tampering.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-600"></div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">HMAC-SHA256 COMPLIANT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">DATABASE-BACKED KEYS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">REAL-TIME VALIDATION</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SecuritySettings;
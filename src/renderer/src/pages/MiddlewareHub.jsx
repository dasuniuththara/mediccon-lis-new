import React, { useState, useEffect } from 'react';
import {
    Terminal,
    Cpu,
    Activity,
    Database,
    Network,
    Zap,
    RefreshCw,
    Search,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    ShieldCheck,
    Radio,
    Clock,
    ZapOff,
    CheckCircle2,
    AlertTriangle,
    FlaskConical,
    ClipboardList,
    Fingerprint
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';

/**
 * Mediccon Middleware & Integration Engine
 * A technical command interface for monitoring real-time analyzer communication,
 * managing protocol mappings, and simulating clinical telemetry.
 */
function MiddlewareHub() {
    const { navigateNext, navigateBack, labProfile } = useGlobalStore();
    const [machines, setMachines] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeMachine, setActiveMachine] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [worklist, setWorklist] = useState([]);
    const [showInspector, setShowInspector] = useState(false);
    const [stats, setStats] = useState({
        rxCount: 0,
        txCount: 0,
        latency: '24ms',
        uptime: '99.9%'
    });

    useEffect(() => {
        loadFleet();
        loadStats();
        loadWorklist();
        const fleetTimer = setInterval(loadFleet, 5000);
        const statsTimer = setInterval(loadStats, 1000); // Synced with 1s Heartbeat
        const worklistTimer = setInterval(loadWorklist, 5000);
        return () => {
            clearInterval(fleetTimer);
            clearInterval(statsTimer);
            clearInterval(worklistTimer);
        };
    }, []);

    const loadStats = async () => {
        try {
            const data = await window.api.getMiddlewareStats();
            if (data) {
                setStats({
                    rxCount: data.rxCount,
                    txCount: data.txCount,
                    errors: data.totalErrors,
                    uptime: `${Math.floor(data.uptimeSeconds / 60)}m ${data.uptimeSeconds % 60}s`
                });
            }
        } catch (e) {
            console.error("Stats sync error:", e);
        }
    };

    const loadFleet = async () => {
        try {
            const data = await window.api.getMachines();
            setMachines(data || []);
            if (activeMachine) {
                const refreshed = (data || []).find(m => m.id === activeMachine.id);
                if (refreshed) setActiveMachine(refreshed);
            }
        } catch (e) {
            console.error("Fleet sync error:", e);
        }
    };

    const loadWorklist = async () => {
        try {
            const data = await window.api.getPendingOrders();
            setWorklist(data || []);
        } catch (e) {
            console.error("Worklist sync error:", e);
        }
    };

    const loadLogs = async (machineId) => {
        try {
            const res = await window.api.getMachineLogs(machineId);
            if (res.success) {
                setLogs(res.logs.map((line, idx) => {
                    let type = 'info';
                    let time = '';
                    let msg = line;

                    const match = line.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
                    if (match) {
                        const [full, timestamp, level, content] = match;
                        time = new Date(timestamp).toLocaleTimeString();
                        msg = content;

                        if (level === 'ERROR') type = 'error';
                        else if (level === 'RX') type = 'process';
                        else if (level === 'TX') type = 'success';
                        else if (level === 'RAW') type = 'raw';
                    }
                    return { id: idx, msg, type, time };
                }).reverse());
            }
        } catch (e) {
            console.error("Log retrieval fault:", e);
        }
    };

    const [simNic, setSimNic] = useState('');
    const [simulating, setSimulating] = useState(false);

    const handleSimulate = async () => {
        if (!activeMachine) return alert("Select an analyzer node first");
        if (!simNic) return alert("Enter or select a Patient ID (NIC) to simulate");

        setSimulating(true);
        try {
            const res = await window.api.simulateAnalyzerQuery(simNic, activeMachine.id);
            if (res.success) {
                // The logs will update via getMachineLogs periodically
                loadLogs(activeMachine.id);
            } else {
                alert(`Simulation Fault: ${res.error}`);
            }
        } catch (e) {
            console.error("Simulation error:", e);
        } finally {
            setSimulating(false);
        }
    };
    const [simLoading, setSimLoading] = useState(false);

    const handleSimQuery = async () => {
        if (!activeMachine || !simNic) return;
        setSimLoading(true);
        try {
            const res = await window.api.simulateAnalyzerQuery(simNic, activeMachine.id);
            if (res.success) {
                // The terminal will pick up the logs
            } else {
                alert("Query Refused: " + res.error);
            }
        } catch (e) {
            console.error("Simulation fault:", e);
        } finally {
            setSimLoading(false);
        }
    };

    useEffect(() => {
        if (activeMachine) {
            loadLogs(activeMachine.id);
            const timer = setInterval(() => loadLogs(activeMachine.id), 2000);
            return () => clearInterval(timer);
        }
    }, [activeMachine]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* 1. Technical Header Architecture - Overhauled for Prominence */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 bg-slate-950 p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                {/* Dynamic Waveform Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 to-emerald-600/10 active-wave"></div>
                    <svg className="absolute bottom-0 w-full h-32 text-teal-500/10" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="currentColor" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>

                <div className="flex items-center gap-10 relative z-10 w-full">
                    {/* Navigation Cluster */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={navigateBack}
                            className="h-16 w-16 bg-white/5 border border-white/10 text-white rounded-3xl flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all shadow-xl active:scale-95 shrink-0"
                        >
                            <ArrowRight size={28} className="rotate-180" />
                        </button>
                        <button
                            onClick={navigateNext}
                            className="h-16 w-16 bg-white/5 border border-white/10 text-white rounded-3xl flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all shadow-xl active:scale-95 shrink-0"
                        >
                            <ArrowRight size={28} />
                        </button>
                    </div>

                    <div className="flex flex-col xl:flex-row justify-between items-center gap-12 flex-1">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="h-4 w-4 rounded-full bg-teal-500 animate-pulse shadow-[0_0_20px_rgba(20,184,166,1)] border-4 border-teal-500/20"></div>
                                <span className="text-[12px] font-black text-teal-400 uppercase tracking-[0.6em] italic">Host-Initiated Protocol Engine</span>
                            </div>
                            <h1 className="text-7xl font-black text-white tracking-tighter leading-none flex items-center gap-8">
                                LIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 italic">Middleware</span>
                            </h1>
                        </div>

                        {/* HIGHLY PROMINENT PULSE STATUS */}
                        <div className="flex items-center gap-12 bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-xl group/pulse px-12">
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30 group-hover/pulse:scale-110 transition-transform duration-700">
                                    <Activity size={32} className="text-emerald-400 animate-pulse" />
                                </div>
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping pointer-events-none opacity-50"></div>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Synchronization State</p>
                                <h2 className="text-3xl font-black text-white leading-none tracking-tight flex items-center gap-3">
                                    <span className="text-emerald-400 italic">Active</span> Heartbeat
                                </h2>
                                <p className="text-[11px] font-black text-emerald-500/60 uppercase tracking-widest font-mono">1sec Pulse Transmission Loop</p>
                            </div>

                            <div className="h-12 w-px bg-white/10 mx-4"></div>

                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Protocol Health</p>
                                <div className="flex items-center gap-3 bg-emerald-500/10 px-5 py-2 rounded-2xl border border-emerald-500/20 shadow-inner">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                    <span className="text-sm font-black text-emerald-400 font-mono tracking-tighter uppercase whitespace-nowrap">Continuous Mode</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* 2. Fleet Matrix Panel */}
                <div className="xl:col-span-4 space-y-10">
                    <div className="bg-white/60 p-10 rounded-[3rem] border border-white shadow-sm backdrop-blur-md flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                                    <Radio size={20} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Fleet Control</h3>
                            </div>
                            <button onClick={loadFleet} className="h-10 w-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {machines.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setActiveMachine(m)}
                                    className={`w-full p-6 rounded-[2rem] border-2 transition-all duration-500 flex items-center justify-between group ${activeMachine?.id === m.id
                                        ? 'bg-slate-950 border-slate-950 shadow-2xl scale-[1.02] -translate-y-1'
                                        : 'bg-white/50 border-white hover:border-slate-200 hover:bg-white'}`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-700 ${activeMachine?.id === m.id ? 'bg-teal-600 text-white rotate-12' : 'bg-slate-100 text-slate-600'}`}>
                                            <Cpu size={22} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-[15px] font-black tracking-tight uppercase leading-none mb-1.5 ${activeMachine?.id === m.id ? 'text-white' : 'text-slate-900'}`}>{m.name}</p>
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${activeMachine?.id === m.id ? 'text-teal-200/50' : 'text-slate-600'}`}>{m.type} • {m.connection_type}</p>
                                        </div>
                                    </div>
                                    <div className={`h-2.5 w-2.5 rounded-full ${m.status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300'}`}></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 h-40 w-40 bg-teal-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="flex items-center gap-4 mb-8">
                            <Activity size={20} className="text-teal-500" />
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Live Telemetry Stats</h4>
                        </div>
                        <div className="space-y-8">
                            <div className="flex justify-between items-center group/item">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol RX Frames</span>
                                <span className="text-2xl font-black text-teal-400 font-mono italic">{stats.rxCount}</span>
                            </div>
                            <div className="flex justify-between items-center group/item">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dispatch TX Frames</span>
                                <span className="text-2xl font-black text-cyan-400 font-mono italic">{stats.txCount}</span>
                            </div>
                            <div className="flex justify-between items-center group/item">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Node Errors</span>
                                <span className="text-2xl font-black text-rose-400 font-mono italic">{stats.errors}</span>
                            </div>
                            <div className="flex justify-between items-center group/item">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Channel Uptime</span>
                                <span className="text-2xl font-black text-emerald-400 font-mono italic">{stats.uptime}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 p-10 rounded-[3rem] border border-white shadow-sm backdrop-blur-md flex flex-col gap-6">
                        <div className="flex items-center gap-4 mb-2">
                            <Zap size={20} className="text-amber-500" />
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Query Simulator</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Simulate an analyzer scanning a barcode. This triggers a host-query and sequence negotiation.</p>
                        <div className="space-y-4">
                            <input
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-black text-slate-900 focus:bg-white transition-all outline-none"
                                placeholder="PATIENT_NIC_OR_BARCODE"
                                value={simNic}
                                onChange={e => setSimNic(e.target.value)}
                            />
                            <button
                                onClick={handleSimQuery}
                                disabled={!activeMachine || !simNic || simLoading}
                                className="w-full h-12 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {simLoading ? <RefreshCw size={14} className="animate-spin" /> : <Network size={14} />}
                                {simLoading ? 'Negotiating...' : 'Trigger Host Query'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/60 p-10 rounded-[3rem] border border-white shadow-sm backdrop-blur-md flex flex-col gap-6">
                        <div className="flex items-center gap-4 mb-2">
                            <ClipboardList size={20} className="text-teal-500" />
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Pending Worklist</h4>
                        </div>

                        <div className="px-10 pb-4">
                            <div className="relative group">
                                <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-[11px] font-black text-slate-900 focus:bg-white focus:ring-8 focus:ring-teal-500/5 transition-all outline-none uppercase placeholder:text-slate-400"
                                    placeholder="Simulate ID (e.g. 1994...)"
                                    value={simNic}
                                    onChange={e => setSimNic(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2 px-10">
                            {worklist.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic text-center py-4">Worklist is currently empty</p>
                            ) : worklist.map(order => (
                                <div key={order.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${simNic === order.nic ? 'bg-teal-600 border-teal-500 text-white shadow-lg' : 'bg-white/80 border-slate-100 text-slate-900 hover:border-teal-500/30'}`} onClick={() => setSimNic(order.nic)}>
                                    <div>
                                        <p className={`text-[11px] font-black leading-none mb-1 ${simNic === order.nic ? 'text-white' : 'text-slate-900'}`}>{order.nic}</p>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest truncate max-w-[150px] ${simNic === order.nic ? 'text-teal-100' : 'text-slate-500'}`}>{order.tests}</p>
                                    </div>
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${simNic === order.nic ? 'bg-white/20' : 'bg-slate-100 opacity-0 group-hover:opacity-100'}`}>
                                        <Zap size={14} className={simNic === order.nic ? 'fill-current' : ''} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Traffic Monitor Panel */}
                <div className="xl:col-span-8 flex flex-col gap-10">
                    <div className="flex-1 bg-slate-950 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col min-h-[700px]">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="h-12 w-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                                    <Terminal size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Protocol Ingress Terminal</h3>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                        Monitor: {activeMachine ? activeMachine.name.toUpperCase() : 'SELECT_NODE_IN_FLEET'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest font-mono">Real-time Stream</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-4 font-mono text-[13px] custom-scrollbar-dark bg-black/40">
                            {!activeMachine ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-40">
                                    <ZapOff size={60} className="mb-6" />
                                    <p className="font-black uppercase tracking-[0.5em] text-[10px]">Awaiting Node Handshake</p>
                                    <p className="text-[9px] uppercase tracking-widest mt-2 italic">Select analyzer to monitor protocol feed</p>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700">
                                    <Activity size={48} className="animate-pulse mb-6 text-teal-500" />
                                    <p className="font-black uppercase tracking-[0.4em] text-[10px]">Signal Interface Established</p>
                                    <p className="text-[9px] uppercase tracking-widest mt-2 italic">Awaiting hardware telemetry ingress...</p>
                                </div>
                            ) : (
                                logs.filter(l => !showInspector || l.type === 'raw').map(log => (
                                    <div key={log.id} className="flex gap-8 group/log py-2 hover:bg-white/5 transition-colors rounded px-6 border border-white/0 hover:border-white/5">
                                        <span className="text-slate-600 shrink-0 select-none font-black text-[11px] mt-1">{log.time}</span>
                                        <div className="flex items-start gap-5 flex-1">
                                            <span className={`shrink-0 font-black uppercase text-[9px] px-2.5 py-1 rounded-lg border italic ${log.type === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-lg shadow-rose-500/10' :
                                                log.type === 'process' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-lg shadow-teal-500/10' :
                                                    log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10' :
                                                        log.type === 'raw' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-lg shadow-amber-500/10' :
                                                            'bg-white/5 text-slate-500 border-white/10'
                                                }`}>
                                                {log.type}
                                            </span>
                                            {log.type === 'raw' ? (
                                                <div className="flex-1 grid grid-cols-8 md:grid-cols-16 gap-2 opacity-80 group-hover/log:opacity-100 transition-opacity">
                                                    {log.msg.match(/.{1,2}/g)?.map((byte, bi) => (
                                                        <span key={bi} className="text-amber-500/80 hover:text-white transition-colors cursor-default border-b border-amber-500/10 hover:border-amber-400">
                                                            {byte}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className={`leading-relaxed text-[13px] font-bold ${log.type === 'error' ? 'text-rose-400' : log.type === 'process' ? 'text-teal-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                    {log.msg}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {activeMachine && (
                            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-teal-500/5 animate-pulse-slow"></div>
                                <div className="flex gap-10 relative z-10">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Port Interface</p>
                                        <p className="text-sm font-black text-white font-mono uppercase">{activeMachine.com_port || activeMachine.host || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Encodement</p>
                                        <p className="text-sm font-black text-white font-mono uppercase italic">{activeMachine.protocol || 'ASTM/LIS2-A'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 relative z-10">
                                    <button
                                        onClick={() => setShowInspector(!showInspector)}
                                        className={`h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${showInspector ? 'bg-amber-500 text-slate-950' : 'bg-teal-600 text-white hover:bg-teal-500'}`}
                                    >
                                        {showInspector ? 'Exit Inspector' : 'Frame Inspector'}
                                    </button>
                                    <button
                                        onClick={handleSimulate}
                                        disabled={simulating}
                                        className="h-12 px-8 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                                    >
                                        {simulating ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                                        {simulating ? 'Simulating...' : 'Test Sync'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MiddlewareHub;

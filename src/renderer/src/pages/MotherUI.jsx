import React, { useState, useEffect } from 'react';
import {
    Activity,
    Globe,
    MapPin,
    Cpu,
    Network,
    Wifi,
    Zap,
    ShieldAlert,
    Database,
    LineChart,
    Server,
    RadioReceiver,
    BarChart3,
    ArrowUpRight,
    Search,
    AlertCircle,
    CheckCircle2,
    Lock,
    Microscope,
    Clock,
    UserCircle,
    ChevronRight,
    Maximize2,
    DollarSign,
    Box,
    Layers,
    ArrowRight
} from 'lucide-react';
import InteractiveNodeMap from '../components/InteractiveNodeMap';

const MotherUI = () => {
    const [stats, setStats] = useState({
        throughput: 0,
        nodes: [],
        revenue: 0,
        validationRate: "0",
        panicRes: 0,
        registrationTrend: [],
        usersList: []
    });
    const [selectedNode, setSelectedNode] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginData, setLoginData] = useState({ user: '', pass: '' });
    const [loginError, setLoginError] = useState('');
    const [machineIndex, setMachineIndex] = useState(0);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const data = await window.api.getMotherUIStats();
            if (data) setStats(data);
        } catch (e) {
            console.error("Mother UI Sync Fault:", e);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const res = await window.api.invoke('login-facility', {
                facilityId: selectedNode.id,
                username: loginData.user,
                password: loginData.pass
            });
            if (res.success) {
                setIsAuthenticated(true);
                setMachineIndex(0);
            } else {
                setLoginError(res.msg);
            }
        } catch (err) {
            setLoginError("Auth System Failure");
        }
    };

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700">
            {/* 1. Global Intelligence Ingress */}
            <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-12 -translate-y-12 rotate-45 group-hover:scale-110 transition-all duration-1000">
                    <Globe size={400} />
                </div>

                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400">Project Mother Node</span>
                        </div>
                        <h1 className="text-7xl font-black text-white leading-none tracking-tighter uppercase italic">
                            Global <span className="text-emerald-500">Command</span>
                        </h1>
                        <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
                            Synthesizing real-time regional diagnostics and multi-node operational health across your clinical pilot fleet.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                            <button
                                onClick={async () => {
                                    const res = await window.api.invoke('export-sync-snapshot');
                                    if (res.success) {
                                        const blob = new Blob([res.data], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'lis_snapshot_' + new Date().toISOString().split('T')[0] + '.json';
                                        a.click();
                                        alert("Snapshot Exported! Please upload this file to the Vercel Dashboard 'Manual Sync' section.");
                                    }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] px-10 py-5 text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(16,185,129,0.2)] active:scale-95 flex items-center gap-4 group"
                            >
                                <Zap className="group-hover:animate-bounce" />
                                SYNK CLOUD MATRIX
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 bg-black/40 p-10 rounded-[3rem] border border-white/5">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Protocols</p>
                            <p className="text-5xl font-black text-white tabular-nums leading-none tracking-tighter">{stats.throughput}</p>
                        </div>
                        <div className="h-16 w-px bg-white/10"></div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sync Latency</p>
                            <p className="text-5xl font-black text-emerald-400 tabular-nums leading-none tracking-tighter">12<span className="text-xs">ms</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Operational Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Network Throughput', val: stats.throughput, trend: '+14.2%', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Pilot Node Fleet', val: `${stats.nodes.length} / 5`, trend: 'Operational', icon: Network, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                    { label: 'Clinical Accuracy', val: `${stats.validationRate}%`, trend: '+0.1%', icon: ShieldAlert, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'Regional Flux', val: stats.panicRes, trend: 'Optimal', icon: Zap, color: 'text-teal-400', bg: 'bg-teal-400/10' }
                ].map((m, i) => (
                    <div key={i} className="bg-slate-900 border border-white/5 p-10 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-all">
                        <div className={`p-4 rounded-2xl ${m.bg} ${m.color} w-fit mb-6`}>
                            <m.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{m.val}</p>
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{m.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Regional Infrastructure Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Pilot Nodes Online</h2>
                        <span className="px-6 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Authorized Grid
                        </span>
                    </div>

                    <div className="grid gap-6">
                        {stats.nodes.map((node, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedNode(node)}
                                className="bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-teal-500/30 p-10 rounded-[3.5rem] flex items-center justify-between group cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-10">
                                    <div className="h-20 w-20 bg-teal-500/10 border border-teal-500/20 rounded-[2rem] flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform duration-700">
                                        <RadioReceiver size={36} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{node.facilityName}</h3>
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-2 text-[10px] font-black text-teal-500 uppercase tracking-widest"><MapPin size={12} /> {node.location}</span>
                                            <span className="text-white/10">•</span>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{node.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-12">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                        </div>
                                    </div>
                                    <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white group-hover:bg-teal-500 transition-colors">
                                        <ArrowRight size={28} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="bg-slate-900/80 border border-white/5 rounded-[3.5rem] flex flex-col h-full overflow-hidden group">
                        <div className="p-10 border-b border-white/5">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                                <Activity size={16} className="text-emerald-500" />
                                Operational Logs
                            </h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Real-time sync packets</p>
                        </div>
                        <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[500px] custom-scrollbar-dark opacity-40 hover:opacity-100 transition-opacity">
                            {[
                                { t: 'HANDSHAKE', m: 'Asiri Health encrypted tunnel stable.', time: '2m ago' },
                                { t: 'REAGENT', m: 'Threshold alert at Nawaloka Sub-Hub.', time: '14m ago' },
                                { t: 'SECURITY', m: 'Deep node credentials refreshed.', time: '31m ago' }
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4 group/log">
                                    <div className="h-auto w-1 bg-white/5 group-hover/log:bg-teal-500 transition-colors"></div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">{log.t}</span>
                                            <span className="text-[8px] font-black text-slate-600 uppercase tabular-nums">{log.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">{log.m}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* DEEP TELEMETRY OVERLAY */}
            {selectedNode && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-300">
                    <div className="absolute inset-0 cursor-zoom-out" onClick={() => { setSelectedNode(null); setIsAuthenticated(false); }}></div>

                    <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                        {!isAuthenticated ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-10">
                                <div className="h-24 w-24 bg-rose-600/10 border border-rose-500/20 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-2xl">
                                    <Lock size={48} className="animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Regional Access Authorization</h2>
                                    <p className="text-slate-500 font-medium max-w-md mx-auto">Site deep telemetry for <span className="text-white">{selectedNode.facilityName}</span> is gated behind regional security protocols.</p>
                                </div>

                                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
                                    <div className="grid gap-3">
                                        <div className="relative group">
                                            <UserCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-400 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                placeholder="PIPELINE USERNAME"
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] py-5 pl-16 text-xs font-black text-white focus:outline-none focus:border-teal-500 transition-all uppercase placeholder:text-slate-700 tracking-widest"
                                                value={loginData.user}
                                                onChange={e => setLoginData({ ...loginData, user: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-400 transition-colors" size={20} />
                                            <input
                                                type="password"
                                                placeholder="ACCESS KEY"
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] py-5 pl-16 text-xs font-black text-white focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-700 tracking-widest"
                                                value={loginData.pass}
                                                onChange={e => setLoginData({ ...loginData, pass: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {loginError && (
                                        <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest animate-bounce">
                                            {loginError}
                                        </p>
                                    )}
                                    <button type="submit" className="w-full py-6 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl transition-all active:scale-95 mt-4">
                                        Synchronize Peer Connection
                                    </button>
                                </form>
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Cancel Authentication Handshake
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-12 border-b border-white/5 bg-slate-950/40 relative">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-8">
                                            <div className="h-20 w-20 bg-teal-500 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl">
                                                {selectedNode.id?.split('-')[1]?.charAt(0) || 'N'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Authenticated: Pilot Stream Live</span>
                                                </div>
                                                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">{selectedNode.facilityName}</h1>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="px-4 py-1 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedNode.type}</span>
                                                    <span className="text-slate-700">•</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedNode.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Throughput</p>
                                                <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{selectedNode.tests || 0}</p>
                                            </div>
                                            <button
                                                onClick={() => { setIsAuthenticated(false); setSelectedNode(null); }}
                                                className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-600 hover:border-rose-500 transition-all active:scale-95"
                                            >
                                                <Maximize2 size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar-dark bg-slate-900/50">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div className="space-y-12">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="bg-slate-950/60 p-8 rounded-[2rem] border border-white/5 space-y-2">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Site Load</p>
                                                    <p className="text-4xl font-black text-white italic">{selectedNode.load || '0%'}</p>
                                                </div>
                                                <div className="bg-slate-950/60 p-8 rounded-[2rem] border border-white/5 space-y-2">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Site Latency</p>
                                                    <p className="text-4xl font-black text-emerald-400 italic">{selectedNode.latency || '0ms'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <MapPin size={16} className="text-teal-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 tracking-widest">Logic Topology & Logistics</span>
                                                </div>
                                                <div className="rounded-[2.5rem] overflow-hidden border border-white/5 h-[340px] relative shadow-2xl">
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none z-10"></div>
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <button
                                                            onClick={async () => {
                                                                const res = await window.api.invoke('export-sync-snapshot');
                                                                if (res.success) {
                                                                    const blob = new Blob([res.data], { type: 'application/json' });
                                                                    const url = URL.createObjectURL(blob);
                                                                    const a = document.createElement('a');
                                                                    a.href = url;
                                                                    a.download = 'lis_snapshot_' + new Date().toISOString().split('T')[0] + '.json';
                                                                    a.click();
                                                                    alert("Snapshot Exported! Please upload this file to the Vercel Dashboard 'Manual Sync' section.");
                                                                }
                                                            }}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] px-10 py-5 text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(16,185,129,0.2)] active:scale-95 flex items-center gap-4 group"
                                                        >
                                                            <Zap className="group-hover:animate-bounce" />
                                                            SYNK CLOUD MATRIX
                                                        </button>
                                                    </div>
                                                    <InteractiveNodeMap machines={selectedNode.machines || []} onNodeClick={() => { }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Active Fleet Matrix</h3>
                                                <div className="flex gap-2">
                                                    {(selectedNode.machines || []).map((m, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setMachineIndex(i)}
                                                            className={`h-2.5 w-10 rounded-full transition-all ${machineIndex === i ? 'bg-teal-500 w-16' : 'bg-white/10'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {selectedNode.machines?.[machineIndex] && (
                                                <div className="bg-slate-950/40 border border-white/10 rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-5 duration-500">
                                                    <div className="flex justify-between items-start mb-8">
                                                        <div>
                                                            <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic">{selectedNode.machines[machineIndex].name}</h4>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedNode.machines[machineIndex].type} Diagnostic Node</p>
                                                            </div>
                                                        </div>
                                                        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${selectedNode.machines[machineIndex].status === 'Online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                            {selectedNode.machines[machineIndex].status}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-6">
                                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Today's Traffic</p>
                                                            <p className="text-3xl font-black text-white font-mono tracking-tighter">{selectedNode.machines[machineIndex].testsToday || 0}</p>
                                                        </div>
                                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Pending Orders</p>
                                                            <p className="text-3xl font-black text-amber-500 font-mono tracking-tighter">{selectedNode.machines[machineIndex].pendingWorklist || 0}</p>
                                                        </div>
                                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Lifetime Peak</p>
                                                            <p className="text-3xl font-black text-slate-500 font-mono tracking-tighter opacity-50">{selectedNode.machines[machineIndex].tests || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-950 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Peer Handshake Established</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Encrypted Stream Protocol</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setIsAuthenticated(false); setSelectedNode(null); }}
                                        className="px-6 py-2 bg-rose-600/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                        Terminate Connection
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MotherUI;

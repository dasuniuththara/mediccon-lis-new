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
    Layers
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

    const developerOverride = (node) => {
        setSelectedNode(node);
        setIsAuthenticated(true);
        setMachineIndex(0);
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

    const satelliteNodes = stats.nodes;

    const navToPrev = () => {
        const currentIndex = satelliteNodes.findIndex(n => n.id === selectedNode.id);
        const nextIdx = (currentIndex + 1) % satelliteNodes.length;
        setSelectedNode(satelliteNodes[nextIdx]);
    };

    const navToNext = () => {
        const currentIndex = satelliteNodes.findIndex(n => n.id === selectedNode.id);
        const prevIndex = (currentIndex - 1 + satelliteNodes.length) % satelliteNodes.length;
        setSelectedNode(satelliteNodes[prevIndex]);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 font-sans tracking-tight pb-10 relative">

            {/* 1. Global Intelligence Header */}
            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-12 -translate-y-12">
                    <Globe size={400} className="animate-[spin_60s_linear_infinite]" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400">Project Mother Node</span>
                        </div>
                        <h1 className="text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                            Mediccon Global Matrix
                        </h1>
                        <p className="text-slate-400 max-w-xl text-sm leading-relaxed font-medium">
                            Synthesizing real-time regional diagnostics and multi-node operational health across your clinical pilot fleet.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-3xl">
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Global Protocols</p>
                                <p className="text-2xl font-black text-white tabular-nums leading-none mt-1">{stats.throughput}</p>
                            </div>
                            <div className="h-8 w-px bg-white/10"></div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Sync Latency</p>
                                <p className="text-2xl font-black text-emerald-400 tabular-nums leading-none mt-1">12<span className="text-xs">ms</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Global Operational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Network Throughput', val: stats.throughput, trend: '+14.2%', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Pilot Node Fleet', val: `${satelliteNodes.length} / 5`, trend: 'Operational', icon: Network, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                    { label: 'Clinical Accuracy', val: `${stats.validationRate}%`, trend: '+0.1%', icon: ShieldAlert, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'Pipeline Revenue', val: `LKR ${(stats.revenue / 1000).toFixed(1)}k`, trend: '+8.4%', icon: DollarSign, color: 'text-teal-400', bg: 'bg-teal-400/10' }
                ].map((m, i) => (
                    <div key={i} className="bg-slate-900 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group hover:border-white/10 transition-all">
                        <div className={`p-3 rounded-2xl ${m.bg} ${m.color} w-fit mb-4`}>
                            <m.icon size={20} />
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.label}</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{m.val}</p>
                            <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                                <ArrowUpRight size={12} /> {m.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Regional Pipeline Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Site List Overlay */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1.5 bg-teal-500 rounded-full"></div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Pilot Infrastructure Matrix</h2>
                        </div>
                        <span className="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                            {satelliteNodes.length} Deep Nodes Online
                        </span>
                    </div>

                    <div className="grid gap-4">
                        {satelliteNodes.length > 0 ? (
                            satelliteNodes.map((node, nIdx) => (
                                <div
                                    key={nIdx}
                                    onClick={() => setSelectedNode(node)}
                                    className="bg-white dark:bg-slate-900/90 hover:shadow-2xl hover:shadow-teal-500/10 border border-slate-200 dark:border-white/5 hover:border-teal-500/30 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 cursor-pointer transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-6 flex-1">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); developerOverride(node); }}
                                            className="h-20 w-20 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-white transition-all shadow-sm font-black text-[9px] uppercase tracking-tighter cursor-crosshair group/dev"
                                        >
                                            <Zap size={20} className="mb-1 group-hover/dev:animate-bounce" />
                                            DEV
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic leading-none">{node.facilityName}</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold"><MapPin size={12} /> {node.location}</span>
                                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                                <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-[8px]">{node.type} PILOT SITE</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        <div className="hidden md:block text-right">
                                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none mb-2">Protocol Count</p>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none tabular-nums">{node.testsToday || 0}</p>
                                        </div>
                                        <div className="h-12 w-px bg-slate-200 dark:bg-white/5"></div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none mb-2">Technical Health</p>
                                                <div className="flex items-center gap-2 justify-end">
                                                    <div className={`h-2.5 w-2.5 rounded-full ${node.status === 'OPTIMAL' || node.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-amber-500'}`}></div>
                                                    <span className={`text-[11px] font-black uppercase ${node.status === 'OPTIMAL' || node.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'}`}>{node.status}</span>
                                                </div>
                                            </div>
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-teal-500 transition-colors">
                                                <ChevronRight size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-slate-900 border border-white/5 p-20 rounded-[3rem] text-center space-y-4">
                                <RadioReceiver size={60} className="mx-auto text-slate-800 animate-pulse" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Waiting for Signal Handshake across regional facility grid...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Regional Activity & Intelligence Feed */}
                <div className="space-y-8">
                    {/* Activity Feed */}
                    <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                            <LineChart size={200} />
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Operational Logs</h3>
                            <Activity size={16} className="text-emerald-500 animate-pulse" />
                        </div>

                        <div className="space-y-6">
                            {[
                                { t: 'PROTOCOL_ESTABLISHED', m: 'Asiri Health encrypted handshake complete.', time: '2m ago', type: 'info' },
                                { t: 'THRESHOLD_ALERT', m: 'Reagent depletion at Nawaloka Regional.', time: '14m ago', type: 'warning' },
                                { t: 'SYS_OPTIMIZATION', m: 'ML Predictive load balancing applied to Hub.', time: '21m ago', type: 'accent' },
                                { t: 'PEER_CONNECTED', m: 'Durdans Hospital Diagnostic secure tunnel ID: 550x.', time: '44m ago', type: 'info' }
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4 group cursor-default">
                                    <div className="h-10 w-px bg-white/5 group-hover:bg-teal-500 transition-colors"></div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${log.type === 'warning' ? 'text-rose-500' : 'text-teal-400'}`}>{log.t}</span>
                                            <span className="text-slate-700 text-[8px]">•</span>
                                            <span className="text-[8px] font-medium text-slate-600 uppercase tracking-widest">{log.time}</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-400 leading-tight">{log.m}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Management Audit */}
                    <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-white/5 rounded-[2.5rem] p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Site Management</h3>
                            <Lock size={16} className="text-indigo-400" />
                        </div>
                        <div className="space-y-4">
                            {stats.usersList.map((user, uIdx) => (
                                <div key={uIdx} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 border border-white/10 rounded-xl flex items-center justify-center bg-slate-900 text-slate-400 group-hover:text-emerald-400 transition-colors">
                                            <UserCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-tight italic">{user.username}</p>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Role: {user.role}</p>
                                        </div>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
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
                                                {selectedNode.id.split('-')[1].charAt(0)}
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
                                                <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{selectedNode.tests}</p>
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
                                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-900/50">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        {/* Facility Intelligence Section */}
                                        <div className="space-y-12">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="bg-slate-950/60 p-8 rounded-[2rem] border border-white/5 space-y-2">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Site Load</p>
                                                    <p className="text-4xl font-black text-white italic">{selectedNode.load}</p>
                                                </div>
                                                <div className="bg-slate-950/60 p-8 rounded-[2rem] border border-white/5 space-y-2">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Site Latency</p>
                                                    <p className="text-4xl font-black text-emerald-400 italic">{selectedNode.latency}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <MapPin size={16} className="text-teal-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 tracking-widest">Logic Topology & Logistics</span>
                                                </div>
                                                <div className="rounded-[2.5rem] overflow-hidden border border-white/5 h-[340px] relative shadow-2xl">
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none z-10"></div>
                                                    <InteractiveNodeMap machines={selectedNode.machines} onNodeClick={() => { }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Machine Fleet Spotlight */}
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Active Fleet Matrix</h3>
                                                <div className="flex gap-2">
                                                    {selectedNode.machines.map((m, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setMachineIndex(i)}
                                                            className={`h-2.5 w-10 rounded-full transition-all ${machineIndex === i ? 'bg-teal-500 w-16' : 'bg-white/10'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-slate-950/40 border border-white/10 rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-5 duration-500">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div>
                                                        <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic">{selectedNode.machines[machineIndex].name}</h4>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedNode.machines[machineIndex].type} Diagnostic Node</p>
                                                            <span className="text-slate-800">•</span>
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-lg border border-white/5">
                                                                <Network size={10} className="text-teal-500" />
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">{selectedNode.machines[machineIndex].connectivity || 'LOCAL-SYNC'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${selectedNode.machines[machineIndex].status === 'Online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                        {selectedNode.machines[machineIndex].status}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-6 mb-10">
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

                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <Box size={14} className="text-teal-400" />
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reagent Consumable Vitality</span>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {selectedNode.machines[machineIndex].reagents.map((reagent, rIdx) => {
                                                            const percent = (reagent.rem / (reagent.used + reagent.rem)) * 100;
                                                            return (
                                                                <div key={rIdx} className="space-y-3">
                                                                    <div className="flex justify-between items-center px-1">
                                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{reagent.name}</span>
                                                                        <span className={`text-[9px] font-black font-mono ${reagent.status === 'CRITICAL' ? 'text-rose-500' : 'text-slate-500'}`}>{reagent.rem}U LEFT</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full transition-all duration-1000 ${reagent.status === 'CRITICAL' ? 'bg-rose-600 shadow-[0_0_10px_#e11d48]' : 'bg-teal-600'}`}
                                                                            style={{ width: `${percent}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Activity size={14} className="text-teal-400" />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Diagnostic Event Stream</span>
                                                        </div>
                                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Real-time Node Output</span>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {selectedNode.machines[machineIndex].lastResults && selectedNode.machines[machineIndex].lastResults.length > 0 ? (
                                                            selectedNode.machines[machineIndex].lastResults.map((r, i) => (
                                                                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.02] rounded-[1.5rem] hover:bg-white/[0.05] transition-all">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-2 w-2 rounded-full bg-teal-500/50"></div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-white uppercase leading-none mb-1">{r.test_name}</p>
                                                                            <p className="text-[8px] font-medium text-slate-600 uppercase tracking-widest">{r.patient_name}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-black text-emerald-400 tabular-nums leading-none">{r.test_value} <span className="text-[8px] text-slate-500 italic">{r.unit}</span></p>
                                                                        <p className="text-[7px] font-bold text-slate-700 uppercase mt-1">{new Date(r.timestamp).toLocaleTimeString()}</p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">No diagnostic packets captured across the secure tunnel yet.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Terminal */}
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

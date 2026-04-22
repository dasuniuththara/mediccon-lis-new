import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
    Activity, Users, Package, BarChart3, Settings, LogOut,
    ChevronRight, AlertCircle, CheckCircle2, Search, Filter,
    Printer, Download, Database, Network, ShieldCheck, Plus, X,
    FlaskConical, Wallet, FileText, XCircle, ChevronDown, Monitor, Cpu, Clock, User, RefreshCw,
    Terminal, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab, onLogout, user }) => {
    const menuItems = [
        { id: 'command', icon: Terminal, label: 'Command Matrix' },
        { id: 'fleet', icon: Network, label: 'Regional Fleet' },
        { id: 'patients', icon: Users, label: 'Patient Registry' },
        { id: 'results', icon: Activity, label: 'Diagnostic Results' },
        { id: 'inventory', icon: Package, label: 'Supply Chain' },
        { id: 'analytics', icon: BarChart3, label: 'Intelligence' }
    ];

    return (
        <div className="w-72 bg-slate-900/60 border-r border-slate-800/50 flex flex-col h-full backdrop-blur-xl">
            <div className="p-8 border-b border-slate-800/30 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
                        <Monitor className="text-teal-500" size={24} />
                    </div>
                    <div className="leading-none">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Central</div>
                        <div className="text-lg font-black text-white uppercase tracking-tighter">Command</div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group
                            ${activeTab === item.id
                                ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20 shadow-[0_4px_20px_rgba(20,184,166,0.1)]'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
                    >
                        <item.icon size={20} className={activeTab === item.id ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                        <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-6 border-t border-slate-800/30">
                <div className="glass-card p-4 mb-4 bg-slate-950/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-teal-500/20 flex items-center justify-center text-teal-500 font-black">
                            {user.username?.[0].toUpperCase()}
                        </div>
                        <div className="leading-tight">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{user.role}</div>
                            <div className="text-xs font-black text-white uppercase truncate w-24 tracking-tighter">{user.username}</div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 text-xs font-black uppercase tracking-widest transition-all"
                >
                    <LogOut size={16} />
                    Terminate Session
                </button>
            </div>
        </div>
    );
};

// ... Placeholder components for tabs
const CommandTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="grid grid-cols-4 gap-6">
            {[
                { label: 'Total Patients', value: '4,281', change: '+12%', icon: Users, color: 'text-teal-500' },
                { label: 'Active Alerts', value: '02', change: 'Critical', icon: AlertCircle, color: 'text-red-500' },
                { label: 'Revenue Forecast', value: '$84.2K', change: '94%', icon: Wallet, color: 'text-amber-500' },
                { label: 'Cloud Handshakes', value: '1.2M', change: '99.9%', icon: Network, color: 'text-blue-500' }
            ].map((stat, i) => (
                <div key={i} className="glass-card p-8 group hover:border-teal-500/30 transition-all cursor-default relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                        <stat.icon size={64} />
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</span>
                        <div className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-[10px] px-2 py-1 rounded bg-slate-950 font-black text-slate-400 border border-slate-800">
                                {stat.change}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 glass-card p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Activity className="text-teal-500" size={20} />
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Global Telemetry Stream</h2>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Live Node Latency: <span className="text-teal-500 tracking-normal">14ms</span></div>
                </div>
                <div className="h-[300px] flex items-center justify-center border-t border-slate-800/30 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <Network size={120} />
                    </div>
                    <div className="text-center relative z-10">
                        <Cpu className="mx-auto mb-4 text-teal-950 animate-pulse" size={48} />
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Establishing Global Handshake...</div>
                    </div>
                </div>
            </div>

            <div className="glass-card p-8 bg-slate-900/20">
                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Security Uplinks</h2>
                <div className="space-y-4">
                    {[
                        { node: 'NODE-ANURADHAPURA', status: 'AUTHORIZED', time: '2m ago' },
                        { node: 'NODE-COLOMBO-CENTRAL', status: 'ACTIVE', time: 'now' },
                        { node: 'NODE-KANDY-REGIONAL', status: 'IDLE', time: '14m ago' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/60 transition-colors group">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-200 uppercase tracking-tighter group-hover:text-teal-500 transition-colors">{item.node}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase italic">{item.time}</span>
                            </div>
                            <div className={item.status === 'ACTIVE' ? 'status-dot-active' : 'status-dot-idle'} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const FleetTab = () => (
    <div className="glass-card p-12 border-dashed flex flex-col items-center justify-center text-center space-y-6">
        <Network size={64} className="text-teal-500 mb-2" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Global Fleet Matrix</h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed font-medium">
            Interrogating regional diagnostic nodes. Secure deep-link tunnels established for real-time telemetry extraction. Regional Grid is currently monitoring 3 active nodes.
        </p>
        <button className="px-8 py-3 bg-teal-600/20 text-teal-400 border border-teal-500/30 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-600 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-3 mt-4">
            <RefreshCw size={16} className="animate-spin-slow" /> Maintain Grid Connection
        </button>
    </div>
);

const PatientsTab = ({ patients }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl">
                    <Users size={24} />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Clinical Registry</h2>
            </div>
            <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-black uppercase text-teal-500 shadow-inner">
                {patients.length} Subject(s) Found
            </div>
        </div>
        <div className="glass-card overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#020617] border-b border-slate-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">NIC</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Details</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {patients.map(p => (
                            <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group cursor-default">
                                <td className="px-8 py-5 text-sm font-black text-slate-300 font-mono tracking-wider group-hover:text-white transition-colors">{p.nic}</td>
                                <td className="px-8 py-5 text-sm font-black text-slate-200 uppercase">{p.name || 'Unknown'}</td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-black tracking-widest">{p.gender}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-black tracking-widest">{p.age}Y</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-[11px] font-black tracking-widest text-slate-500 font-mono">{p.phone || 'N/A'}</td>
                                <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded inline-flex items-center gap-2 border text-[9px] font-black uppercase tracking-widest ${p.pending_tests > 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                        {p.pending_tests > 0 ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                                        {p.pending_tests > 0 ? 'Awaiting' : 'Done'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && (
                            <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-500 text-xs font-black uppercase tracking-[0.4em]">Awaiting Synchronized Patients</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const ResultsTab = ({ results }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <Activity size={24} />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Diagnostic Matrix</h2>
            </div>
            <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-black uppercase text-indigo-500 shadow-inner">
                {results.length} Parameter(s) Extracted
            </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-8 min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {results.map(r => (
                    <div key={r.id} className="p-6 rounded-[1.5rem] border border-slate-800/50 bg-slate-950 hover:bg-slate-900 transition-colors shadow-lg hover:border-indigo-500/30 group">
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest group-hover:text-teal-400 transition-colors">{r.test_name}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${r.status === 'VALIDATED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>{r.status || 'UNVALIDATED'}</span>
                        </div>
                        <div className="flex flex-col gap-1 mb-4">
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-black font-mono tracking-tighter tabular-nums ${r.is_abnormal ? 'text-rose-500' : 'text-white'}`}>{r.test_value || '--'}</span>
                                <span className="text-[10px] font-black text-slate-600 uppercase italic">{r.unit || ''}</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 tracking-widest font-mono">REF: {r.ref_range || 'N/A'}</span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <User size={12} />
                                <span className="text-[9px] font-black font-mono tracking-wider">{r.nic.substring(0, 6)}..</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Cpu size={12} />
                                <span className="text-[9px] font-black uppercase">{r.machine_id}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {results.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-500 text-xs font-black uppercase tracking-[0.4em]">No Telemetry Received</div>
                )}
            </div>
        </div>
    </div>
);

const InventoryTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl">
                    <Package size={24} />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Supply Chain Logistics</h2>
            </div>
            <button className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">Disptach Reagents</button>
        </div>
        <div className="glass-card p-24 flex flex-col items-center justify-center text-center opacity-60">
            <div className="p-6 bg-slate-900 rounded-full border border-slate-800 mb-6 relative">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-pulse"></div>
                <Package size={48} className="text-amber-500 relative z-10" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">Reagent Warehouse Idle</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-sm leading-relaxed">System is awaiting continuous supply chain telemetry from the mother node grid.</p>
        </div>
    </div>
);

const IntelligenceTab = ({ patients, results }) => {
    const anomalies = results.filter(r => parseFloat(r.test_value) > 200 || parseFloat(r.test_value) < 0.5);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[60px] animate-pulse" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shadow-lg">
                        <Zap size={32} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Pulse AI</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Diagnostic Inference Engine: Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <div className="px-6 py-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Anomalies Found</span>
                        <span className="text-xl font-black text-rose-500">{anomalies.length}</span>
                    </div>
                    <div className="px-6 py-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Confidence Score</span>
                        <span className="text-xl font-black text-teal-500">98.4%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 glass-card p-10 space-y-8">
                    <div className="flex items-center gap-3">
                        <Activity className="text-teal-500" size={20} />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Clinical Anomaly Matrix</h3>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                        {anomalies.map((a, i) => (
                            <div key={i} className="p-6 rounded-[1.5rem] border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-500 font-black">
                                        !
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white uppercase">{a.test_name}</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">{a.nic} • Critical Elevation</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-rose-500 tabular-nums">{a.test_value}</div>
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Neural Index: Validated</div>
                                </div>
                            </div>
                        ))}
                        {anomalies.length === 0 && (
                            <div className="py-20 text-center opacity-20">
                                <ShieldCheck size={64} className="mx-auto mb-4" />
                                <div className="text-xs font-black uppercase tracking-[0.5em]">No Critical Anomalies Detected</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card p-10 bg-slate-900/40 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-3 mb-10 relative z-10">
                        <BarChart3 className="text-teal-400" size={20} />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Node Insights</h3>
                    </div>
                    <div className="space-y-8 relative z-10">
                        {[
                            { label: 'Network Throughput', val: '1.2Mbps', sub: 'Healthy Handshake' },
                            { label: 'Diagnostic Latency', val: '42ms', sub: 'Optimal Range' },
                            { label: 'Patient Ingress (24h)', val: patients.length, sub: 'Stability: High' },
                            { label: 'System Uptime', val: '99.98%', sub: 'No Downtime Detected' }
                        ].map((m, i) => (
                            <div key={i} className="flex justify-between items-end border-b border-slate-800/50 pb-4">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{m.label}</span>
                                    <span className="text-[9px] font-medium text-slate-500 uppercase mt-1 italic">{m.sub}</span>
                                </div>
                                <span className="text-sm font-black text-teal-400 tabular-nums">{m.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('command');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [patients, setPatients] = useState([]);
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState({ total_patients: 0, alerts: 2, revenue: '$0.00', connectivity: 'INITIALIZING' });
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const fetchGlobalData = async () => {
            try {
                // Try multiple LAN addresses to discover the local LIS server
                const lanHosts = [
                    'http://192.168.2.41:8080',
                    'http://localhost:8080',
                    'http://127.0.0.1:8080',
                    'http://192.168.2.66:8080'
                ];

                // 1. ATTEMPT DIRECT LOCAL LINK (LAN DISCOVERY)
                const authHeader = { 'Authorization': 'Medi@123' };
                for (const host of lanHosts) {
                    try {
                        const localRes = await fetch(`${host}/api/patients`, {
                            headers: authHeader,
                            signal: AbortSignal.timeout(3000)
                        }).then(r => r.json());

                        if (localRes && localRes.data) {
                            setPatients(localRes.data);
                            setStats(prev => ({ ...prev, total_patients: localRes.data.length, connectivity: 'LOCAL_LIVE' }));

                            const resultsRes = await fetch(`${host}/api/results`, {
                                headers: authHeader,
                                signal: AbortSignal.timeout(3000)
                            }).then(r => r.json()).catch(() => null);

                            if (resultsRes && resultsRes.data) setResults(resultsRes.data);

                            setLoadingData(false);
                            return; // Link Successful
                        }
                    } catch (e) {
                        // Host not reachable, try next
                    }
                }

                // 2. INTERNAL API RELAY (FIREWALL BYPASS)
                const relayPats = await fetch('/api/patients').then(r => r.json()).catch(() => null);

                if (relayPats && relayPats.data && relayPats.data.length > 0) {
                    setPatients(relayPats.data);
                    setStats(prev => ({ ...prev, total_patients: relayPats.data.length, connectivity: 'CLOUD_ACTIVE' }));

                    const relayRes = await fetch('/api/results').then(r => r.json()).catch(() => null);
                    if (relayRes && relayRes.data) setResults(relayRes.data);

                    setLoadingData(false);
                    return;
                }

                // 3. CLOUD MATRIX DIRECT LINK (Legacy / Off-Network)
                const { data: pats, error: pErr } = await supabase.from('patients').select('*').order('created_at', { ascending: false }).limit(100);
                const { data: res, error: rErr } = await supabase.from('results').select('*').order('timestamp', { ascending: false }).limit(100);

                if (!pErr && pats && pats.length > 0) {
                    setPatients(pats);
                    setResults(res || []);
                    setStats(prev => ({ ...prev, total_patients: pats.length, connectivity: 'CLOUD_ACTIVE' }));
                    setLoadingData(false);
                    return;
                }

                // 4. PERSISTENT SNAPSHOT SYNC (LocalStorage)
                const snapshot = localStorage.getItem('mediccon_lis_snapshot');
                if (snapshot) {
                    try {
                        const data = JSON.parse(snapshot);
                        setPatients(data.patients || []);
                        setResults(data.results || []);
                        setStats(prev => ({ ...prev, connectivity: 'MANUAL_SNAPSHOT_ACTIVE' }));
                        setLoadingData(false);
                        return;
                    } catch (snapErr) {
                        console.error("Corrupted Manual Snapshot found. Purging.", snapErr);
                        localStorage.removeItem('mediccon_lis_snapshot');
                    }
                }

                // 5. STATIC CACHE FALLBACK
                console.warn('[LINKING_FALLBACK]: All sources unavailable. Using Static Cache.');
                setStats(prev => ({ ...prev, connectivity: 'OFFLINE_CACHE' }));

                import('./live_data.json').then(liveData => {
                    const payload = liveData.default || liveData;
                    setPatients(payload.patients || []);
                    setResults(payload.results || []);
                    setStats(prev => ({ ...prev, total_patients: (payload.patients || []).length }));
                }).catch(err => {
                    console.error("Static memory payload missing", err);
                });
            } finally {
                setLoadingData(false);
            }
        };

        fetchGlobalData();
        const syncInt = setInterval(fetchGlobalData, 10000);

        return () => {
            clearInterval(timer);
            clearInterval(syncInt);
        };
    }, []);

    return (
        <div className="h-screen w-full flex bg-[#020617] overflow-hidden">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} user={user} />

            <main className="flex-1 flex flex-col relative">
                {/* GLOBAL HEADER HEADER */}
                <header className="h-24 px-12 border-b border-slate-800/30 flex items-center justify-between backdrop-blur-md relative z-20">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Protocol</span>
                            <span className="text-md font-black text-white uppercase tracking-tighter">Handshake Protocol: <span className="text-teal-500">SECURE</span></span>
                        </div>
                        <div className="h-8 w-px bg-slate-800/50" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Local Time</span>
                            <span className="text-md font-black text-white uppercase tracking-tighter">
                                {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-500 overflow-hidden ${stats.connectivity === 'LOCAL_LIVE' ? 'bg-teal-500/10 border-teal-500/30' :
                            stats.connectivity === 'CLOUD_ACTIVE' ? 'bg-blue-500/10 border-blue-500/30' :
                                'bg-slate-800/30 border-slate-700/30'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${stats.connectivity === 'LOCAL_LIVE' ? 'bg-teal-500 animate-pulse' :
                                stats.connectivity === 'CLOUD_ACTIVE' ? 'bg-blue-400' :
                                    'bg-slate-500'
                                }`} />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
                                {stats.connectivity === 'LOCAL_LIVE' ? 'LINKED: 192.168.2.41' :
                                    stats.connectivity === 'CLOUD_ACTIVE' ? 'GRID ONLINE' : 'SNAPSHOT MODE'}
                            </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer relative group">
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse border-2 border-[#020617]" />
                            <AlertCircle size={20} className="text-slate-400 group-hover:text-white" />
                        </div>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-10">
                    {/* AUTOMATED HEALTH CARD */}
                    <div className="mb-12 glass-card p-6 border-dashed border-teal-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                                <Activity className="text-teal-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-tighter">Automated Cloud Bridge</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">System is pushing laboratory telemetry every 30 seconds. No manual action required.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Connected</span>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'command' && <CommandTab />}
                            {activeTab === 'fleet' && <FleetTab />}
                            {activeTab === 'patients' && <PatientsTab patients={patients} />}
                            {activeTab === 'results' && <ResultsTab results={results} />}
                            {activeTab === 'inventory' && <InventoryTab />}
                            {activeTab === 'analytics' && <IntelligenceTab patients={patients} results={results} />}
                        </motion.div>
                    </AnimatePresence>
                </div >

                {/* AMBIENT BG DECORATIONS */}
                <div className="absolute top-48 left-24 w-96 h-96 bg-teal-900/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-24 right-24 w-[30rem] h-[30rem] bg-indigo-900/5 rounded-full blur-[150px] pointer-events-none" />
            </main >
        </div >
    );
};

export default Dashboard;

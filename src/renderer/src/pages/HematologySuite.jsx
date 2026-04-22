import React, { useState, useEffect, useMemo } from 'react';
import {
    Activity,
    Zap,
    ZapOff,
    UserPlus,
    Search,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    FlaskConical,
    Edit2,
    Save,
    LineChart,
    History,
    TrendingUp,
    TrendingDown,
    Cpu,
    RefreshCw,
    ChevronRight,
    Fingerprint,
    Info,
    Flame,
    Target,
    Dna
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';

/* --- SUITE ATOMS --- */

const SuiteAction = ({ icon, label, onClick, theme }) => (
    <button
        onClick={onClick}
        className={`h-14 px-8 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 group/sa border shadow-xl ${theme === 'blue' ? 'bg-teal-600 text-white border-teal-500 hover:bg-teal-500' : 'bg-white/5 text-slate-500 border-white/5 hover:text-white hover:bg-white/10'}`}
    >
        {React.cloneElement(icon, { size: 18, className: 'group-hover/sa:scale-110 group-hover/sa:rotate-12 transition-all' })}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

const ResultNode = ({ res, onEdit, isEditing, editValue, onSave, setEditValue, loadGraph }) => {
    if (!res) return null;

    const val = parseFloat(res.test_value);
    const range = res.ref_range || "";
    let isAbnormal = false;
    let flag = null;

    if (range.includes('-')) {
        const parts = range.split('-').map(p => parseFloat(p.trim()));
        if (!isNaN(val)) {
            if (val < parts[0]) { isAbnormal = true; flag = 'L'; }
            if (val > parts[1]) { isAbnormal = true; flag = 'H'; }
        }
    }

    return (
        <div className={`p-4 rounded-xl border transition-all duration-500 group/res-node ${isEditing ? 'bg-white border-teal-500 shadow-2xl scale-[1.02] z-50' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{res.test_name}</span>
                <div className="flex gap-2 opacity-0 group-hover/res-node:opacity-100 transition-opacity">
                    <button onClick={loadGraph} className="p-1 text-slate-500 hover:text-teal-400"><TrendingUp size={12} /></button>
                    <button onClick={() => onEdit(res.id, res.test_value)} className="p-1 text-slate-500 hover:text-white"><Edit2 size={12} /></button>
                </div>
            </div>

            <div className="flex items-baseline gap-2">
                {isEditing ? (
                    <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => onSave(res.id, editValue)}
                        onKeyDown={e => e.key === 'Enter' && onSave(res.id, editValue)}
                        className="bg-slate-100 text-teal-600 font-mono font-black text-lg py-0.5 px-2 rounded-lg w-20 outline-none"
                    />
                ) : (
                    <span className={`text-xl font-black font-mono tracking-tighter tabular-nums ${isAbnormal ? (flag === 'H' ? 'text-rose-500' : 'text-teal-400') : 'text-white'}`}>
                        {res.test_value}
                    </span>
                )}
                <span className="text-[9px] font-bold text-slate-600 uppercase italic">{res.unit}</span>
            </div>

            {isAbnormal && !isEditing && (
                <div className={`mt-2 text-[7px] font-black uppercase px-2 py-0.5 rounded inline-block ${flag === 'H' ? 'bg-rose-500/10 text-rose-500' : 'bg-teal-500/10 text-teal-400'}`}>
                    OUT_OF_RANGE [{flag}]
                </div>
            )}
        </div>
    );
};

const TelemetryNode = ({ label, value, description, color, icon }) => (
    <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-teal-500 transition-all duration-700">
        <div className="flex justify-between items-start">
            <div className={`h-12 w-12 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6`}>
                {icon}
            </div>
            <Info size={14} className="text-slate-300" />
        </div>
        <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-slate-900 tracking-tighter italic">{value}</span>
                {description && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{description}</span>}
            </div>
        </div>
    </div>
);

/**
 * Mediccon Smart Hematology Suite
 * An operational master-node for real-time analyzer control, data editing, and clinical graphing.
 * Custom-built to match the professional Mispa Count-X layout.
 */
const HematologySuite = () => {
    const { user, labProfile } = useGlobalStore();

    // -- STATES --
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [cableStatus, setCableStatus] = useState('OFF'); // OFF | ON
    const [lisStatus, setLisStatus] = useState('STANDBY'); // STANDBY | READY
    const [searchTerm, setSearchTerm] = useState('');

    // Registration State (Onboarding)
    const [onboarding, setOnboarding] = useState({
        id: '',
        name: '',
        age: 30,
        gender: 'Male'
    });

    // Edit / Analysis State
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [graphData, setGraphData] = useState([]); // Historical data for charting

    // -- DATA LOADING --
    const loadQueue = async () => {
        try {
            const data = await window.api.getPatients();
            // Filter for active/recent patients
            setPatients(data || []);

            // Auto-select first awaiting patient if none selected
            if (!selectedPatient && data && data.length > 0) {
                // Find most recent awaiting
                const awaiting = data.find(p => p.pending_tests > 0);
                if (awaiting) selectPatientNode(awaiting);
                else selectPatientNode(data[0]);
            }
        } catch (e) {
            console.error("Queue Node Fault:", e);
        }
    };

    const selectPatientNode = async (p) => {
        setSelectedPatient(p);
        setIsLoading(true);
        try {
            const data = await window.api.getPatientResults({ nic: p.nic });
            setResults(data.results || []);

            // Load historical data for graphing (default to WBC)
            loadGraphData(p.nic, 'WBC');
        } catch (e) {
            console.error("Result Retrieval Fault:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadGraphData = async (nic, testName) => {
        try {
            const history = await window.api.getHistoricalTestResults({ nic, testName });
            setGraphData(history || []);
        } catch (e) {
            console.error("Graph Data Fault:", e);
        }
    };

    const getDeltaValue = (testName, currentValue) => {
        if (!graphData || graphData.length < 2) return null;
        // Last point is current, second to last is previous
        const previous = graphData[graphData.length - 2]?.test_value;
        if (!previous || isNaN(parseFloat(previous)) || isNaN(parseFloat(currentValue))) return null;

        const curr = parseFloat(currentValue);
        const prev = parseFloat(previous);
        const diff = curr - prev;
        const percent = ((diff / prev) * 100).toFixed(1);
        return { diff: diff.toFixed(2), percent, type: diff > 0 ? 'up' : 'down' };
    };

    // -- ACTIONS --
    const handleOnboard = async (e) => {
        e.preventDefault();
        if (!onboarding.id || !onboarding.name) return;

        setIsLoading(true);
        try {
            const res = await window.api.registerPatient({
                nic: onboarding.id,
                name: onboarding.name,
                age: onboarding.age,
                gender: onboarding.gender,
                specimen_type: 'WHOLE BLOOD (EDTA)',
                tests: [{ code: 'FBC', name: 'Full Blood Count', price: 400 }] // Structured object for the repository
            });

            if (res.success) {
                loadQueue();
                setOnboarding({ id: '', name: '', age: 30, gender: 'Male' });
            }
        } catch (e) {
            console.error("Onboarding Fault:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateResult = async (id, newValue) => {
        try {
            await window.api.updateResult({ id, value: newValue, userId: user?.id });
            setEditingId(null);
            if (selectedPatient) selectPatientNode(selectedPatient);
        } catch (e) {
            console.error("Result Update Fault:", e);
        }
    };

    const handleRelease = async () => {
        if (!selectedPatient || results.length === 0) return;
        try {
            // Batch validate all current results
            for (const res of results) {
                await window.api.updateResultStatus({ id: res.id, status: 'VALIDATED' });
            }
            alert("Node Synchronized: Results Released to Laboratory Matrix.");
            loadQueue(); // Refresh to show "Done" status
        } catch (e) {
            console.error("Release Fault:", e);
        }
    };

    const toggleCable = () => {
        setCableStatus(prev => prev === 'OFF' ? 'ON' : 'OFF');
        setLisStatus(prev => prev === 'STANDBY' ? 'READY' : 'STANDBY');
    };

    // -- RENDER HELPERS --
    const checkAbnormal = (value, range) => {
        if (!range || !value || isNaN(parseFloat(value))) return { isAbnormal: false, flag: null, color: 'text-slate-900' };
        const val = parseFloat(value);
        if (range.includes('-')) {
            const parts = range.split('-').map(p => parseFloat(p.trim()));
            if (val < parts[0]) return { isAbnormal: true, flag: 'L', color: 'text-teal-600', bg: 'bg-teal-50' };
            if (val > parts[1]) return { isAbnormal: true, flag: 'H', color: 'text-rose-600', bg: 'bg-rose-50' };
        }
        return { isAbnormal: false, flag: null, color: 'text-slate-900' };
    };

    // Analytics Summary for the sidebar
    const analytics = useMemo(() => {
        return {
            total: patients.length,
            males: patients.filter(p => p.gender === 'Male').length,
            females: patients.filter(p => p.gender === 'Female').length,
            critical: results.filter(r => checkAbnormal(r.test_value, r.ref_range).isAbnormal).length
        };
    }, [patients, results]);

    // Initial Sync
    useEffect(() => {
        loadQueue();
        const timer = setInterval(loadQueue, 5000);
        return () => clearInterval(timer);
    }, []);

    // Listen for Live Data
    useEffect(() => {
        let cleanup = () => { };
        if (window.api && window.api.onNewResultReceived) {
            cleanup = window.api.onNewResultReceived((data) => {
                if (selectedPatient && data.nic === selectedPatient.nic) {
                    selectPatientNode(selectedPatient);
                }
                loadQueue();
            });
        }
        return () => cleanup();
    }, [selectedPatient]);

    return (
        <div className="flex h-[calc(100vh-140px)] gap-10 font-sans selection:bg-teal-500/30 overflow-hidden">

            {/* 1. SUITE SIDEBAR (Operational Control) */}
            <div className="w-[300px] flex flex-col gap-8 h-full">
                {/* Branding Node */}
                <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <h2 className="text-white font-black text-2xl tracking-tighter leading-none mb-2">MedicconLIS</h2>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Smart Hematology Suite</span>
                        </div>
                    </div>
                </div>

                {/* Connectivity Logic */}
                <div className="bg-white/60 p-8 rounded-[2.5rem] border border-white shadow-sm flex flex-col gap-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CABLE:</span>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${cableStatus === 'ON' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {cableStatus}
                            </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">LIS:</span>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${lisStatus === 'READY' ? 'text-teal-600' : 'text-slate-400'}`}>
                                {lisStatus}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={toggleCable}
                        className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${cableStatus === 'ON' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-950 text-white hover:bg-teal-600'}`}
                    >
                        {cableStatus === 'ON' ? <Zap size={14} /> : <ZapOff size={14} />}
                        {cableStatus === 'ON' ? 'ACTIVE STREAM' : 'CONNECT ANALYZER'}
                    </button>
                </div>

                {/* Today's Metrics Node */}
                <div className="flex-1 bg-white/60 p-8 rounded-[3.5rem] border border-white shadow-sm flex flex-col gap-8 overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                        <div className="h-2 w-2 rounded-full bg-teal-600"></div>
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Today's Analytics</h4>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Patient Load</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter italic">{analytics.total}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nodes</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">M | F Ratio</p>
                                <p className="text-base font-black text-slate-900 font-mono tracking-tighter">{analytics.males} : {analytics.females}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Critical Positives</p>
                                <p className="text-base font-black text-rose-600 font-mono tracking-tighter">{analytics.critical}</p>
                            </div>
                        </div>

                        <div className="mt-auto h-24 relative opacity-40">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M0,80 Q25,20 50,60 T100,20" fill="none" stroke="#14b8a6" strokeWidth="4" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. PRIMARY ACTION MATRIX (Center) */}
            <div className="flex-1 flex flex-col gap-10 overflow-hidden">

                {/* Onboarding Ingress */}
                <div className="bg-white/40 p-10 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-10 w-10 bg-teal-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-teal-200">
                            <UserPlus size={20} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Patient Onboarding</h3>
                        <div className="h-px flex-1 bg-slate-100 mx-4"></div>
                        {!onboarding.id && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse italic">Awaiting valid patient identity</span>}
                    </div>

                    <form onSubmit={handleOnboard} className="grid grid-cols-12 gap-8 items-end">
                        <div className="col-span-3 space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Subject ID (NIC)</label>
                            <input
                                value={onboarding.id}
                                onChange={e => setOnboarding({ ...onboarding, id: e.target.value })}
                                placeholder="2004xxxxxx"
                                className="w-full bg-white border border-slate-100 rounded-2xl py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                            />
                        </div>
                        <div className="col-span-4 space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Legal Name</label>
                            <input
                                value={onboarding.name}
                                onChange={e => setOnboarding({ ...onboarding, name: e.target.value })}
                                placeholder="PROPER_NAME_ONLY"
                                className="w-full bg-white border border-slate-100 rounded-2xl py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-300 shadow-inner uppercase"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Age: {onboarding.age}Y</label>
                            <input
                                type="range" min="1" max="100"
                                value={onboarding.age}
                                onChange={e => setOnboarding({ ...onboarding, age: parseInt(e.target.value) })}
                                className="w-full accent-teal-600"
                            />
                        </div>
                        <div className="col-span-2 flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                            {['Male', 'Female'].map(g => (
                                <button
                                    key={g} type="button"
                                    onClick={() => setOnboarding({ ...onboarding, gender: g })}
                                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${onboarding.gender === g ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {g[0]}
                                </button>
                            ))}
                        </div>
                        <button className="col-span-1 h-16 w-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center hover:bg-teal-600 transition-all shadow-xl active:scale-90 group/btn">
                            <Zap size={24} className="group-hover:rotate-12 transition-transform" />
                        </button>
                    </form>
                </div>

                {/* Live Data Registry Hub */}
                <div className="flex-1 grid grid-cols-12 gap-10 overflow-hidden">

                    {/* Patient Queue Matrix */}
                    <div className="col-span-5 bg-white/60 rounded-[3.5rem] border border-white shadow-sm flex flex-col overflow-hidden">
                        <div className="p-10 border-b border-slate-50 bg-white/40 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Users size={20} className="text-teal-600" />
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Recent Queue</h3>
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="FILTER NODES..."
                                    className="bg-slate-50 border border-slate-100 rounded-full py-2.5 pl-10 pr-6 text-[10px] font-black text-slate-900 outline-none w-48 focus:bg-white transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full">
                                <tbody className="divide-y divide-slate-50">
                                    {patients
                                        .filter(p => !searchTerm || p.name.toUpperCase().includes(searchTerm.toUpperCase()) || p.nic.includes(searchTerm))
                                        .map(p => (
                                            <tr
                                                key={p.nic}
                                                onClick={() => selectPatientNode(p)}
                                                className={`group cursor-pointer transition-all duration-500 ${selectedPatient?.id === p.id ? 'bg-teal-50/50' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${selectedPatient?.id === p.id ? 'bg-teal-600 text-white shadow-lg rotate-6' : 'bg-slate-100 text-slate-600 group-hover:bg-white'}`}>
                                                            {p.name ? p.name[0] : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-[13px] tracking-tighter uppercase leading-none mb-1.5 truncate max-w-[150px]">{p.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-black text-slate-400 font-mono tracking-widest">{p.nic}</span>
                                                                <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                                                <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest">{p.gender[0]} | {p.age}Y</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    {p.pending_tests > 0 ? (
                                                        <div className="flex items-center justify-end gap-2 text-amber-500 animate-pulse">
                                                            <Clock size={12} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Awaiting</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2 text-emerald-500">
                                                            <CheckCircle2 size={12} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Done</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Clinical Results & Analysis Matrix */}
                    <div className="col-span-7 flex flex-col gap-10 overflow-hidden">

                        {/* Live Data Probe */}
                        <div className="flex-1 bg-slate-950 rounded-[3.5rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative group/res">
                            <div className="absolute inset-0 bg-teal-600/5 pointer-events-none group-hover/res:bg-teal-600/10 transition-all duration-1000"></div>

                            <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <Activity size={20} className="text-emerald-400" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Live Data from Analyzer</h3>
                                </div>
                                <div className="flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Signal Synchronized</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-10 relative z-10">
                                {!selectedPatient ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-40">
                                        <History size={60} className="mb-6 animate-pulse" />
                                        <p className="font-black text-[10px] uppercase tracking-[0.5em]">Awaiting Diagnostic Link</p>
                                    </div>
                                ) : (
                                    <div className="space-y-16">
                                        {/* 1. WBC SYSTEM GROUP */}
                                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-10 w-10 bg-teal-600/20 rounded-2xl flex items-center justify-center text-teal-400 border border-teal-500/20 shadow-inner">
                                                        <Dna size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[11px] font-black text-white/90 uppercase tracking-[0.4em]">WBC / Differential Node</h4>
                                                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">Nomenclature: Leukocyte Matrix</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Logic: Stable</span>
                                                    <span className="text-[9px] font-bold text-slate-600 font-mono">ID_SEG: 09-21</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-12 gap-10">
                                                <div className="col-span-8 grid grid-cols-2 gap-6">
                                                    {['WBC', 'LYMPH#', 'MID#', 'GRAN#', 'LYMPH%', 'MID%', 'GRAN%'].map((name, i) => {
                                                        const res = results.find(r => r.test_name === name);
                                                        const delta = getDeltaValue(name, res?.test_value);
                                                        return (
                                                            <div key={name} className="relative group/wrapper">
                                                                <ResultNode res={res} onEdit={(id, val) => { setEditingId(id); setEditValue(val); }} isEditing={editingId === (res?.id)} editValue={editValue} onSave={handleUpdateResult} setEditValue={setEditValue} loadGraph={() => loadGraphData(selectedPatient.nic, name)} />
                                                                {delta && (
                                                                    <div className={`absolute -right-2 top-0 translate-x-full opacity-0 group-hover/wrapper:opacity-100 transition-all flex flex-col items-start gap-1 p-2 bg-slate-900 border border-white/10 rounded-xl z-20 shadow-2xl scale-90 origin-left`}>
                                                                        <span className="text-[7px] font-black text-slate-500 uppercase">Delta Logic</span>
                                                                        <div className={`flex items-center gap-1.5 text-[9px] font-black ${delta.type === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                            {delta.type === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                                            {delta.percent}%
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="col-span-4 self-center">
                                                    <div className="h-40 w-full border border-slate-800 relative bg-teal-500/[0.02] rounded-[2rem] overflow-hidden group/hist hover:border-teal-500/30 transition-all">
                                                        <div className="absolute top-4 left-5 text-[8px] font-black text-teal-500/60 uppercase tracking-[0.3em]">Temporal Histometry</div>
                                                        <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                            <path d="M 5 95 L 10 85 Q 25 10 40 60 L 45 65 Q 55 20 75 50 L 80 55 Q 85 30 95 95" fill="none" stroke="rgba(20,184,166,0.4)" strokeWidth="3" strokeLinejoin="round" className="animate-[dash_3s_ease-in-out_infinite]" />
                                                        </svg>
                                                        <div className="absolute bottom-4 left-5 right-5 flex justify-between">
                                                            <div className="h-1 w-[30%] bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-teal-500 w-1/2 animate-pulse"></div></div>
                                                            <div className="h-1 w-[20%] bg-white/5 rounded-full"></div>
                                                            <div className="h-1 w-[30%] bg-white/5 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. RBC SYSTEM GROUP */}
                                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                                            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-10 w-10 bg-rose-600/20 rounded-2xl flex items-center justify-center text-rose-400 border border-rose-500/20 shadow-inner">
                                                        <Flame size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[11px] font-black text-white/90 uppercase tracking-[0.4em]">Erythrocyte Matrix</h4>
                                                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">Nomenclature: RBC Morphology</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[9px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest">Flow: Optimal</span>
                                                    <span className="text-[9px] font-bold text-slate-600 font-mono">ID_SEG: 10-18</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-12 gap-10">
                                                <div className="col-span-8 grid grid-cols-2 gap-6">
                                                    {['RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'RDW-CV', 'RDW-SD'].map((name, i) => {
                                                        const res = results.find(r => r.test_name === name);
                                                        const delta = getDeltaValue(name, res?.test_value);
                                                        return (
                                                            <div key={name} className="relative group/wrapper">
                                                                <ResultNode res={res} onEdit={(id, val) => { setEditingId(id); setEditValue(val); }} isEditing={editingId === (res?.id)} editValue={editValue} onSave={handleUpdateResult} setEditValue={setEditValue} loadGraph={() => loadGraphData(selectedPatient.nic, name)} />
                                                                {delta && (
                                                                    <div className={`absolute -right-2 top-0 translate-x-full opacity-0 group-hover/wrapper:opacity-100 transition-all flex flex-col items-start gap-1 p-2 bg-slate-900 border border-white/10 rounded-xl z-20 shadow-2xl scale-90 origin-left`}>
                                                                        <span className="text-[7px] font-black text-slate-500 uppercase">Delta Logic</span>
                                                                        <div className={`flex items-center gap-1.5 text-[9px] font-black ${delta.type === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                            {delta.type === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                                            {delta.percent}%
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="col-span-4 self-center">
                                                    <div className="h-40 w-full border border-slate-800 relative bg-rose-500/[0.02] rounded-[2rem] overflow-hidden group/hist hover:border-rose-500/30 transition-all">
                                                        <div className="absolute top-4 left-5 text-[8px] font-black text-rose-500/60 uppercase tracking-[0.3em]">Morphology Curve</div>
                                                        <svg className="absolute inset-0 w-full h-full p-8" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                            <path d="M 5 95 Q 50 0 95 95" fill="none" stroke="rgba(244,63,94,0.4)" strokeWidth="3" strokeLinecap="round" />
                                                            <path d="M 30 95 Q 50 40 70 95" fill="none" stroke="rgba(244,63,94,0.1)" strokeWidth="2" strokeDasharray="4 2" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. PLT SYSTEM GROUP */}
                                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-1000">
                                            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-10 w-10 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                                                        <Target size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[11px] font-black text-white/90 uppercase tracking-[0.4em]">Thrombocyte Analysis</h4>
                                                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">Nomenclature: Platelet Kinetics</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 uppercase tracking-widest">State: Dynamic</span>
                                                    <span className="text-[9px] font-bold text-slate-600 font-mono">ID_SEG: 11-29</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-12 gap-10">
                                                <div className="col-span-8 grid grid-cols-2 gap-6">
                                                    {['PLT', 'MPV', 'PDW', 'PCT', 'PLCR', 'PLCC', 'P-LCR', 'P-LCC'].map((name, i) => {
                                                        const res = results.find(r => r.test_name === name);
                                                        const delta = getDeltaValue(name, res?.test_value);
                                                        return (
                                                            <div key={name} className="relative group/wrapper">
                                                                <ResultNode res={res} onEdit={(id, val) => { setEditingId(id); setEditValue(val); }} isEditing={editingId === (res?.id)} editValue={editValue} onSave={handleUpdateResult} setEditValue={setEditValue} loadGraph={() => loadGraphData(selectedPatient.nic, name)} />
                                                                {delta && (
                                                                    <div className={`absolute -right-2 top-0 translate-x-full opacity-0 group-hover/wrapper:opacity-100 transition-all flex flex-col items-start gap-1 p-2 bg-slate-900 border border-white/10 rounded-xl z-20 shadow-2xl scale-90 origin-left`}>
                                                                        <span className="text-[7px] font-black text-slate-500 uppercase">Delta Logic</span>
                                                                        <div className={`flex items-center gap-1.5 text-[9px] font-black ${delta.type === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                            {delta.type === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                                            {delta.percent}%
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="col-span-4 self-center">
                                                    <div className="h-40 w-full border border-slate-800 relative bg-emerald-500/[0.02] rounded-[2rem] overflow-hidden group/hist hover:border-emerald-500/30 transition-all">
                                                        <div className="absolute top-4 left-5 text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">Kinetic Distribution</div>
                                                        <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                            <path d="M 5 95 Q 15 30 35 85 Q 50 95 95 95" fill="none" stroke="rgba(16,185,129,0.4)" strokeWidth="3" strokeLinecap="round" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Ribbon */}
                            <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-between items-center relative z-10">
                                <div className="flex gap-6">
                                    <SuiteAction icon={<FlaskConical size={18} />} label="Register Order" onClick={() => { }} />
                                    <SuiteAction icon={<CheckCircle2 size={18} />} label="Release Report" onClick={handleRelease} theme="teal" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Audit Node</p>
                                    <p className="text-xs font-black text-white uppercase tracking-tighter">SECURED_HL7_MATRIX</p>
                                </div>
                            </div>
                        </div>

                        {/* Analysis & Graphing Node */}
                        <div className="h-[280px] bg-white/60 rounded-[3.5rem] border border-white shadow-sm p-10 flex flex-col gap-6 relative group/graph overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-cyan-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-cyan-200">
                                        <LineChart size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">Integrated Analysis Matrix</h4>
                                        <p className="text-[9px] font-black text-slate-400 font-mono tracking-widest mt-1 italic">Historical Trend Visualization</p>
                                    </div>
                                </div>
                                {graphData.length > 0 && (
                                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full border border-teal-100 uppercase tracking-widest animate-pulse">
                                        Live History Loaded
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 relative flex items-end gap-1 px-4">
                                {graphData.length === 0 ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 select-none">
                                        <RefreshCw size={32} className="text-slate-400 mb-4 animate-spin-slow" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500 text-center">Awaiting Data Point Selection</p>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-end justify-between px-6 pb-4 relative">
                                        {/* Static Grid Lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between py-6 px-10 pointer-events-none opacity-5">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="h-px bg-slate-900 w-full" />)}
                                        </div>

                                        {/* Dynamic Bars */}
                                        {graphData.map((d, i) => {
                                            const height = Math.min(90, Math.max(10, (parseFloat(d.test_value) || 0) * 5));
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar relative">
                                                    <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-all bg-slate-950 text-white text-[9px] px-2 py-1 rounded shadow-xl font-mono z-20">
                                                        {d.test_value}
                                                    </div>
                                                    <div
                                                        style={{ height: `${height}%` }}
                                                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-1000 ${i === graphData.length - 1 ? 'bg-teal-600 shadow-[0_0_20px_rgba(20,184,166,0.4)]' : 'bg-slate-200 group-hover/bar:bg-teal-300'}`}
                                                    ></div>
                                                    <span className="text-[8px] font-black text-slate-400 font-mono rotate-45 mt-2 origin-left">
                                                        {new Date(d.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </div>

        </div>
    );
};

export default HematologySuite;



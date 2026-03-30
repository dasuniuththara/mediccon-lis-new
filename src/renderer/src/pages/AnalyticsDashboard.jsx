import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    Activity,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    Calendar,
    Search,
    RefreshCw,
    Download,
    Filter,
    ArrowRight,
    Truck,
    Package,
    Shield,
    Zap,
    Cpu,
    Eye,
    BrainCircuit
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';

const AnalyticsDashboard = () => {
    const { labProfile, navigateBack, navigateNext, setActivePage, user } = useGlobalStore();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState(7); // Default to 7 days (Weekly)

    const accentColor = labProfile.lab_accent_color || '#14b8a6';

    useEffect(() => {
        loadAnalytics();
        const timer = setInterval(loadAnalytics, 60000); // 1 minute refresh
        return () => clearInterval(timer);
    }, [timeframe]); // Reload when timeframe changes

    const loadAnalytics = async () => {
        setIsLoading(true);
        try {
            const res = await window.api.getDeepAnalytics(timeframe);
            if (res) setData(res);
        } catch (e) {
            console.error("Analytics Engine Failure:", e);
        }
        setIsLoading(false);
    };

    const [logicStream, setLogicStream] = useState([
        "Initializing Neural Interface...",
        "Analyzing Volumetric Vectors...",
        "Syncing Logic Nodes..."
    ]);

    useEffect(() => {
        const logs = [
            "Optimizing throughput...",
            "Predicting yield nodes...",
            "Caching temporal data...",
            "Anomaly detection active",
            "Hardware latency: 1.2ms",
            "Neural weights updated",
            "Synthesizing test spectrum"
        ];
        const interval = setInterval(() => {
            setLogicStream(prev => [...prev.slice(-4), logs[Math.floor(Math.random() * logs.length)]]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading && !data) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="h-20 w-20 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
                        <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-600 animate-pulse" size={30} />
                    </div>
                    <p className="font-black text-[10px] uppercase tracking-[0.5em] text-slate-500">Synchronizing Intelligence Node...</p>
                </div>
            </div>
        );
    }

    const { volumeData, revenueData, testDistribution, analyzerWorkload, doctorPerformance, reagentUsage, forecast, profitabilityDistribution } = data || {};


    const maxVol = Math.max(...(volumeData?.map(d => d.count) || [1]));
    const totalVolume = volumeData?.reduce((acc, d) => acc + d.count, 0) || 0;
    const totalRevenue = revenueData?.reduce((acc, d) => acc + d.revenue, 0) || 0;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20">

            {/* 1. Global Command Architecture */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-10 bg-slate-950 p-10 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-transparent to-transparent opacity-50 text-white/5">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-[spin_60s_linear_infinite]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
                </div>

                <div className="flex items-center gap-8 relative z-10 w-full xl:w-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={navigateBack}
                            className="h-14 w-14 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all shadow-xl active:scale-95 shrink-0"
                        >
                            <ArrowRight size={20} className="rotate-180" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full animate-pulse bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.8)]"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Neural Logic Core v4.2</span>
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
                            Deep <span className="text-teal-500 italic">Analytics</span>
                        </h1>
                        <div className="flex flex-col gap-2 mt-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">System Nominal</span>
                                <span className="text-[8px] font-bold text-teal-400 uppercase tracking-[0.2em] bg-teal-400/10 px-2 py-0.5 rounded border border-teal-400/20">Predictive Engine: Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BrainCircuit size={12} className="text-teal-500 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Cognitive Forecast: High efficiency detected in Pathology Node</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 gap-2">
                        <button
                            onClick={() => setTimeframe(30)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === 30 ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-white'}`}
                        >
                            Daily (30D)
                        </button>
                        <button
                            onClick={() => setTimeframe(7)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === 7 ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-white'}`}
                        >
                            Weekly (7D)
                        </button>
                    </div>

                    <button onClick={loadAnalytics} className="h-14 w-14 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-all active:scale-95 group/refresh">
                        <RefreshCw size={20} className={`${isLoading ? 'animate-spin' : 'group-hover/refresh:rotate-180 transition-transform duration-700'}`} />
                    </button>

                    <button
                        onClick={async () => {
                            setIsLoading(true);
                            try {
                                const res = await window.api.exportAnalytics();
                                if (res.success) alert(`Node Exported: ${res.path}`);
                            } catch (e) { console.error(e); } finally { setIsLoading(false); }
                        }}
                        className="flex items-center gap-3 px-10 py-4 bg-white text-slate-950 hover:bg-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
                    >
                        <Download size={18} />
                        Export Insights
                    </button>
                </div>
            </div>

            {/* 2. Top-Level Telemetry Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <MetricPod label="Subject Load" value={totalVolume} sub={`Bench: +4.2% Above Avg`} trend="+12.5%" trendType="up" icon={<Users />} color="teal" intelligence="Anomaly Detect: Active" />
                <MetricPod label="Gross Revenue" value={`LKR ${(totalRevenue / 1000).toFixed(1)}k`} sub="Yield Efficiency: 98%" trend="+8.2%" trendType="up" icon={<DollarSign />} color="emerald" intelligence="Optimal Margin" />
                <MetricPod label="Flow Velocity" value={analyzerWorkload?.reduce((acc, d) => acc + d.value, 0)} sub="Congestion Risk: Low" trend="+14.1%" trendType="up" icon={<Zap />} color="cyan" intelligence="Zero Latency Nodes" />
                <MetricPod label="Precision Index" value="99.8%" sub="Protocol: ISO-27001" trend="+0.2%" trendType="up" icon={<Shield />} color="amber" intelligence="Secured Node" />
            </div>

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 0.1; }
                    100% { transform: translateY(1000%); opacity: 0; }
                }
                .holographic-scan {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: linear-gradient(to right, transparent, rgba(20, 184, 166, 0.5), transparent);
                    animation: scan 8s linear infinite;
                    pointer-events: none;
                    z-index: 50;
                }
            `}</style>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 relative">
                <div className="holographic-scan"></div>
                {/* 3. Temporal Volume Analysis */}
                <div className="xl:col-span-8 space-y-10">
                    <div className="bg-slate-950 p-12 rounded-[4rem] shadow-2xl border border-white/5 relative overflow-hidden group">
                        {/* Background Infrastructure */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:60px_60px] opacity-20"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-teal-900/10 via-transparent to-transparent opacity-40"></div>

                        <div className="flex items-center justify-between mb-20 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-teal-600/10 border border-teal-500/20 text-teal-400 rounded-[2rem] flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                                    <BarChart3 size={28} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tight italic">Ingress Vector Trend</h3>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Temporal Subject volume mapping</p>
                                </div>
                            </div>

                            <div className="hidden lg:flex items-center gap-10">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Peak Volume</p>
                                    <p className="text-2xl font-black text-white italic">{maxVol} <span className="text-xs text-teal-500 not-italic">SUB</span></p>
                                </div>
                                <div className="h-10 w-px bg-white/10"></div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Flow</p>
                                    <p className="text-2xl font-black text-white italic">{(totalVolume / timeframe).toFixed(1)} <span className="text-xs text-cyan-500 not-italic">RATE</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="h-[450px] flex items-end gap-3 relative z-10 pt-10 px-4">
                            {/* Horizontal Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 py-10 px-4">
                                {[...Array(5)].map((_, idx) => (
                                    <div key={idx} className="w-full h-px bg-white"></div>
                                ))}
                            </div>

                            {volumeData?.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-6 group/bar relative h-full justify-end">
                                    {/* Bar Pillar */}
                                    <div className="w-full relative group-hover/bar:z-30 transition-all duration-500">
                                        <div
                                            className="w-full rounded-2xl relative transition-all duration-700 cursor-pointer shadow-lg overflow-hidden group-hover/bar:shadow-[0_0_30px_rgba(20,184,166,0.3)]"
                                            style={{
                                                height: `${Math.max((d.count / maxVol) * 400, 4)}px`,
                                                background: `linear-gradient(to top, #0d9488, #14b8a6)`,
                                                opacity: timeframe === 30 ? 0.8 : 1
                                            }}
                                        ></div>

                                        {/* Floating Tooltip Label */}
                                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all scale-90 group-hover/bar:scale-100 pointer-events-none">
                                            <div className="bg-white text-slate-950 px-5 py-2.5 rounded-[1.2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col items-center">
                                                <span className="text-[14px] font-black">{d.count}</span>
                                                <span className="text-[8px] font-black uppercase tracking-tighter opacity-40">Subjects</span>
                                            </div>
                                            <div className="w-2 h-2 bg-white rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                                        </div>
                                    </div>

                                    {/* Temporal Label */}
                                    {timeframe === 7 && (
                                        <div className="text-center group-hover/bar:scale-110 transition-transform">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                            <p className="text-[10px] font-bold text-white/40">{new Date(d.date).getDate()}</p>
                                        </div>
                                    )}
                                    {timeframe === 30 && i % 4 === 0 && (
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{new Date(d.date).getDate()}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* 4. Test Parameter Distribution */}
                        <div className="bg-slate-950 p-10 rounded-[3.5rem] shadow-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent opacity-50"></div>
                            <div className="flex items-center gap-5 mb-12 relative z-10">
                                <div className="h-14 w-14 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-[1.5rem] flex items-center justify-center">
                                    <PieChart size={24} />
                                </div>
                                <h4 className="text-2xl font-black text-white tracking-tight italic">Test Spectrum</h4>
                            </div>
                            <div className="space-y-6 relative z-10">
                                {testDistribution?.slice(0, 6).map((t, idx) => (
                                    <div key={idx} className="space-y-3 p-4 hover:bg-white/5 rounded-2xl transition-all group/item">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                            <span className="text-slate-400 group-hover/item:text-cyan-400 transition-colors">{t.name}</span>
                                            <span className="text-white font-mono italic">{t.value} units</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-600 to-teal-500 rounded-full transition-all duration-1000 group-hover/item:shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                                                style={{ width: `${(t.value / (testDistribution[0]?.value || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 5. Hardware Load Matrix */}
                        <div className="bg-slate-950 p-12 rounded-[3.5rem] text-white shadow-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                                <Activity size={300} />
                            </div>
                            <div className="flex items-center gap-5 mb-12 relative z-10">
                                <div className="h-14 w-14 bg-teal-600/20 border border-teal-500/30 text-teal-400 rounded-[1.5rem] flex items-center justify-center">
                                    <Activity size={24} />
                                </div>
                                <h4 className="text-2xl font-black text-white tracking-tight italic">Analyzer Matrix</h4>
                            </div>
                            <div className="space-y-8 relative z-10">
                                {analyzerWorkload?.map((m, idx) => (
                                    <div key={idx} className="hover:bg-white/5 p-4 rounded-2xl transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center text-teal-400 font-black text-[10px] border border-white/10 uppercase italic">
                                                {m.name.split(' ').map(w => w[0]).join('')}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-slate-400">{m.name}</span>
                                                    <span className="text-teal-400 font-mono italic">{m.value} Logs</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.6)]"
                                                        style={{ width: `${(m.value / (analyzerWorkload[0]?.value || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. Referral Intelligence Terminal */}
                <div className="xl:col-span-4 space-y-10">
                    <div className="bg-slate-950 p-12 rounded-[4rem] shadow-2xl border border-white/5 min-h-[700px] flex flex-col relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-transparent opacity-30"></div>

                        <div className="flex items-center gap-5 mb-16 relative z-10">
                            <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                                <TrendingUp size={28} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tight italic">Yield Matrix</h3>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Top performance nodes</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 relative z-10">
                            {doctorPerformance?.map((doc, idx) => (
                                <div key={idx} className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group/doc">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-5">
                                            <div className="h-16 w-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-xl font-black italic shadow-xl group-hover/doc:bg-teal-600 transition-colors border border-white/10">
                                                {doc.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-md font-black text-white uppercase tracking-tight mb-2">{doc.name}</p>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{doc.patients} Subjects</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden mr-6 shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full group-hover/doc:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-700"
                                                style={{ width: `${(doc.total / (doctorPerformance[0]?.total || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-2xl font-black text-emerald-400 tracking-tighter tabular-nums leading-none italic">
                                                {(doc.total / 1000).toFixed(1)}k
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(!doctorPerformance || doctorPerformance.length === 0) && (
                                <div className="flex-1 flex flex-col items-center justify-center py-40 opacity-20">
                                    <Calendar size={80} className="text-white mb-6" />
                                    <p className="font-black text-[12px] uppercase tracking-[0.5em] text-white">No Temporal Records</p>
                                </div>
                            )}
                        </div>

                        {/* Neural Logic Stream Terminal */}
                        <div className="mt-10 p-6 bg-black/40 rounded-[2rem] border border-white/5 font-mono relative overflow-hidden group/term">
                            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                <div className="flex items-center gap-3">
                                    <Cpu size={14} className="text-teal-500 animate-pulse" />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Logic Stream</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[7px] text-emerald-500 font-bold uppercase">LATENCY: 0.12ms</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {logicStream.map((log, i) => (
                                    <div key={i} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                        <span className="text-[8px] text-slate-600">[{1000 + i}]</span>
                                        <span className="text-[9px] text-teal-300 tracking-tighter">{log}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-teal-500/5 to-transparent"></div>
                        </div>

                        <button onClick={() => setActivePage('doctor-matrix')} className="w-full mt-12 py-6 bg-white text-slate-950 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] hover:bg-teal-600 hover:text-white hover:shadow-2xl hover:shadow-teal-500/40 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 relative z-10">
                            <BrainCircuit size={20} /> Deep Node Audit <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                {/* 7. Financial Profitability Matrix (SMART) */}
                <div className="bg-slate-950 p-12 rounded-[4rem] shadow-2xl border border-white/5 relative overflow-hidden group mt-12 xl:col-span-12">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-transparent opacity-30"></div>
                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                                <DollarSign size={28} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tight italic">Financial Yield Matrix</h3>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Revenue vs Reagent Consumption vectors</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">Fiscal Node: Operational</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                        {profitabilityDistribution?.map((cat, idx) => (
                            <div key={idx} className="p-10 bg-white/5 border border-white/5 rounded-[3rem] hover:bg-white/10 transition-all group/profit">
                                <div className="flex justify-between items-center mb-8">
                                    <h5 className="text-xl font-black text-white uppercase tracking-tight italic">{cat.name}</h5>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Gross Yield</p>
                                        <p className="text-2xl font-black text-emerald-400 italic tabular-nums">LKR {(cat.revenue - cat.cost).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">Yield Velocity</span>
                                        <span className="text-white">{((cat.revenue - cat.cost) / (cat.revenue || 1) * 100).toFixed(1)}% Margin</span>
                                    </div>
                                    <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
                                        {/* Revenue Bar */}
                                        <div className="absolute top-0 left-0 h-full bg-teal-600/30 w-full"></div>
                                        {/* Cost Bar */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-rose-500/60 transition-all duration-1000 shadow-[2px_0_10px_rgba(244,63,94,0.3)]"
                                            style={{ width: `${(cat.cost / (cat.revenue || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex items-center gap-8 text-[9px] font-black uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                                            <span className="text-slate-500">Reagent Nodes: {(cat.cost / 1000).toFixed(1)}k</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                                            <span className="text-slate-500">Ingress Revenue: {(cat.revenue / 1000).toFixed(1)}k</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(!profitabilityDistribution || profitabilityDistribution.length === 0) && (
                            <div className="col-span-full py-20 text-center opacity-20 border border-dashed border-white/10 rounded-[3rem]">
                                <p className="font-black text-[10px] uppercase tracking-[0.5em] text-white">No Fiscal Data Streamed</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 8. Reagent Forecast Matrix (SMART) */}
                <div className="bg-slate-950 p-12 rounded-[4rem] shadow-2xl border border-white/5 relative overflow-hidden group mt-12 xl:col-span-12">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-transparent opacity-30"></div>
                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-amber-500/10">
                                <BrainCircuit size={28} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tight italic">Reagent Depletion Forecast</h3>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Predictive stock longevity mapping</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">Forecast Engine: Online</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 relative z-10">
                        {forecast?.map((item, idx) => (
                            <div key={idx} className={`p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 group/card ${item.days_remaining < 7 ? 'bg-rose-950/20 border-rose-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center border font-black text-[10px] uppercase italic ${item.days_remaining < 7 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-teal-500/10 border-teal-500/20 text-teal-400'}`}>
                                        {item.reagent[0]}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stock Level</p>
                                        <p className="text-xl font-black text-white italic tabular-nums">{item.current_stock} <span className="text-[10px] not-italic opacity-40">U</span></p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h5 className="text-sm font-black text-white uppercase tracking-tight truncate group-hover/card:text-teal-400 transition-colors">{item.reagent}</h5>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{item.analyzer || 'GLOBAL POOL'}</p>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Est. Lifespan</p>
                                            <p className={`text-2xl font-black tracking-tighter italic ${item.days_remaining < 7 ? 'text-rose-500' : 'text-emerald-400'}`}>
                                                {item.days_remaining === 999 ? '∞' : `${item.days_remaining}d`}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Burn Rate</p>
                                            <p className="text-md font-black text-white italic">-{item.burn_rate.toFixed(1)}/d</p>
                                        </div>
                                    </div>

                                    {item.days_remaining < 7 && (
                                        <div className="mt-4 animate-pulse">
                                            <div className="bg-rose-500 h-1.5 w-full rounded-full opacity-20 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 h-full bg-rose-500 w-full animate-[shimmer_2s_infinite]"></div>
                                            </div>
                                            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-2 text-center">Critical Procurement Sync Required</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {(!forecast || forecast.length === 0) && (
                            <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[3rem] opacity-30">
                                <Package size={48} className="mx-auto mb-4 text-white" />
                                <p className="font-black text-[10px] uppercase tracking-[0.5em] text-white">No Predictive Mapping Available</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Initialize Inventory & Test Reagent Links</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 8. Neural Reagent Matrix */}
                <div className="bg-slate-950 p-12 rounded-[4rem] shadow-2xl border border-white/5 relative overflow-hidden group mt-12 xl:col-span-12">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-900/5 via-transparent to-transparent opacity-30"></div>
                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-teal-600/10 border border-teal-500/20 text-teal-400 rounded-[2rem] flex items-center justify-center shadow-2xl">
                                <Package size={28} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tight italic">Reagent Intelligence Matrix</h3>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Daily consumption nodes per lab</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">Supply Chain: Optimal</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Temporal Node</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Analyzer Lab</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Reagent Vector</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Volume Done</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {reagentUsage?.slice(0, 15).map((row, idx) => (
                                    <tr key={idx} className="group/row hover:bg-white/[0.02] transition-colors">
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={14} className="text-slate-600" />
                                                <span className="text-[11px] font-mono font-bold text-slate-400">
                                                    {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
                                                <span className="text-[11px] font-black text-white uppercase tracking-wider">{row.lab}</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="space-y-1">
                                                <span className="text-[12px] font-black text-slate-200 uppercase tracking-tight group-hover/row:text-teal-400 transition-colors">{row.reagent}</span>
                                                <div className="w-24 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-teal-500/40 w-full animate-pulse"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-right">
                                            <span className="text-xl font-black text-white italic tabular-nums">{row.value}</span>
                                            <span className="ml-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Units</span>
                                        </td>
                                    </tr>
                                ))}
                                {(!reagentUsage || reagentUsage.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center opacity-20">
                                            <p className="font-black text-[10px] uppercase tracking-[0.5em] text-white">No Consumption Data Sync</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricPod = ({ label, value, sub, trend, trendType, icon, color, intelligence }) => {
    const { labProfile } = useGlobalStore();
    const themes = {
        teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', iconBg: 'bg-teal-500/20' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', iconBg: 'bg-cyan-500/20' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', iconBg: 'bg-amber-500/20' }
    };

    const theme = themes[color];

    return (
        <div className="bg-slate-900/50 p-8 rounded-[3rem] shadow-2xl border border-white/5 group hover:bg-slate-900 transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 ${theme.text}`}>
                {React.cloneElement(icon, { size: 120 })}
            </div>

            <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-white/5 ${theme.iconBg} ${theme.text}`}>
                    {React.cloneElement(icon, { size: 28 })}
                </div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
                    <span className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">{value}</span>
                </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-white/5 relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{sub}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm ${trendType === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                        {trendType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-teal-500 animate-pulse"></div>
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em]">{intelligence}</span>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;

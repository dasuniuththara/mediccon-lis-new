import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Microscope,
  PlusCircle,
  ClipboardList,
  Search,
  Bell,
  Cpu,
  Zap,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Monitor,
  Command,
  Layers,
  Sparkles,
  Package,
  Wallet,
  Stethoscope,
  ArrowRight,
  Network
} from 'lucide-react';

import useMachineStatus from '../hooks/useMachineStatus';
import MachineCard from '../components/MachineCard';
import MetricCard from '../components/MetricCard';
import ActionButton from '../components/ActionButton';
import ActivityItem from '../components/ActivityItem';
import AIPrecisionEngine from '../components/AIPrecisionEngine';
import InteractiveNodeMap from '../components/InteractiveNodeMap';
import { useGlobalStore } from '../store/globalStore';

const DashboardMetricCard = MetricCard;

/* --- MAIN DASHBOARD NODE --- */

function Dashboard() {
  const { machines } = useMachineStatus();
  const { setActivePage, navigateNext, navigateBack, user, setSelectedPatient, labProfile, setMachineSearch } = useGlobalStore();
  const isDeveloper = user && ['developer', 'master access', 'admin'].includes(user.role?.toLowerCase());

  const [stats, setStats] = useState({
    todayPatients: 0,
    completedTests: 0,
    pendingReports: 0,
    activeAnalyzers: 0,
    lowStockCount: 0,
    todayRevenue: 0,
    pendingWorklist: 0,
    tunnelVolume: 0,
    tunnelVelocity: '0.00',
    precisionIndex: 99.98
  });

  const [topDoctors, setTopDoctors] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    let lastDashUpdate = 0;
    let cleanup = () => { };
    if (window.api && window.api.onNewResultReceived) {
      cleanup = window.api.onNewResultReceived(() => {
        const now = Date.now();
        if (now - lastDashUpdate < 1200) return;
        lastDashUpdate = now;
        loadDashboardData();
      });
    }

    return () => {
      if (typeof cleanup === 'function') cleanup();
      clearInterval(timer);
    };
  }, []);

  const [reagentUsage, setReagentUsage] = useState([]);

  const loadDashboardData = async () => {
    try {
      const isDev = user && ['developer', 'master access', 'admin'].includes(user.role?.toLowerCase());
      const [qStats, activity, analytics, worklist] = await Promise.all([
        window.api.getQuickStats(),
        window.api.getLatestActivity(),
        window.api.getDeepAnalytics(7),
        window.api.getWorklist()
      ]);

      // Resolve authorized machine IDs
      const authStr = user?.authorized_machines || '';
      const authorizedIds = authStr.includes('[')
        ? JSON.parse(authStr)
        : authStr.split(',').filter(Boolean);

      // Filter activity feed: Only show results from authorized machines OR registrations (if permitted)
      const filteredActivity = isDev ? (activity || []) : (activity || []).filter(item => {
        if (item.type === 'REGISTRATION') return true; // Keep registrations
        if (item.machine_id) return authorizedIds.includes(item.machine_id);
        return false;
      });

      setRecentActivity(filteredActivity);
      setReagentUsage(analytics?.reagentUsage || []);
      setStats(prev => ({
        ...prev,
        todayPatients: qStats.todayPatients,
        completedTests: qStats.completedTests,
        pendingReports: qStats.pendingReports,
        lowStockCount: qStats.lowStockCount || 0,
        todayRevenue: qStats.todayRevenue || 0,
        pendingWorklist: (worklist || []).length
      }));

      // Fetch Top Doctors (Only for developers)
      if (isDev) {
        const docs = await window.api.getReferringDoctors();
        setTopDoctors(docs.slice(0, 5));
      }
    } catch (e) {
      console.error("Dashboard Sync Failed", e);
    }
  };

  useEffect(() => {
    const authStr = user?.authorized_machines || '';
    const authorizedIds = authStr.includes('[')
      ? JSON.parse(authStr)
      : authStr.split(',').filter(Boolean);

    const onlineCount = Object.values(machines || {})
      .filter(m => isDeveloper || authorizedIds.includes(m.id))
      .filter(m => m.status === 'Online').length;

    setStats(prev => ({ ...prev, activeAnalyzers: onlineCount }));

    // Telemetry pulse simulation based on online machines
    const telemetryInterval = setInterval(() => {
      setStats(prev => {
        const flux = (Math.random() * 0.8 - 0.4) * onlineCount;
        return {
          ...prev,
          tunnelVelocity: (Math.abs(flux) * 10).toFixed(2)
        };
      });
    }, 1500);
    return () => clearInterval(telemetryInterval);
  }, [machines, isDeveloper]);

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'Momentum';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 selection:bg-teal-100 relative">

      {/* Neural Background Effect */}
      <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden opacity-5 pointer-events-none">
        <svg viewBox="0 0 1000 1000" className="w-full h-full animate-float opacity-30">
          <circle cx="900" cy="100" r="300" fill="url(#grad1)" />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#0d9488', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 1. Command Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 glass p-10 rounded-[3rem] shadow-xl shadow-slate-100/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-50/20 to-emerald-50/20 opacity-40 pointer-events-none"></div>

        <div className="flex items-center gap-10 relative z-10 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={navigateBack}
              className="h-14 w-14 glass-dark text-white rounded-2xl flex items-center justify-center hover:bg-teal-600 transition-all shadow-lg active:scale-90"
            >
              <ArrowRight size={24} className="rotate-180" />
            </button>
            <button
              onClick={navigateNext}
              className="h-14 w-14 glass-dark text-white rounded-2xl flex items-center justify-center hover:bg-teal-600 transition-all shadow-lg active:scale-90"
            >
              <ArrowRight size={24} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-teal-600 node-pulse shadow-[0_0_15px_rgba(20,184,166,0.8)]"></div>
                <div className="h-1 w-8 rounded-full bg-slate-200"></div>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] whitespace-nowrap">{labProfile.lab_name} Intelligence Core</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-none flex items-center gap-4">
                Diagnostic Command
              </h1>
              <p className="text-slate-600 font-medium text-xl leading-relaxed mt-4">
                Systems status: <span className="text-emerald-600 font-black bg-emerald-50 px-2 rounded-lg border border-emerald-100/50 shadow-sm mx-1">OPTIMAL</span>.
                Welcome back, scientist <span className="text-slate-900 font-black border-b-4 border-teal-500/20 px-1 inline-block">{user?.username || 'Scientist'}</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 glass p-2 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 relative group hover:-translate-y-1 transition-all duration-500">
          <div className="flex items-center gap-6 p-8 bg-white/90 rounded-[2.2rem] shadow-inner whitespace-nowrap">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 node-pulse"></div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Node</p>
              </div>
              <p className="text-5xl font-black text-slate-950 tabular-nums leading-none tracking-tighter font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </p>
            </div>

            <div className="h-14 w-px bg-slate-200/50"></div>

            <div className="text-left py-1 min-w-[100px]">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-slate-800 leading-none tracking-tight">{currentTime.getDate()}</span>
                <span className="text-sm font-black text-teal-600 uppercase tracking-widest mt-1 italic">{currentTime.toLocaleString('default', { month: 'long' })}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] font-mono">{currentTime.getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Telemetry Grid */}
      {/* 2. Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <DashboardMetricCard label="Clinical Subjects" value={stats.todayPatients} sub="Intake" color="teal" icon={<Users size={24} />} description="Registered for investigation today" />
        <DashboardMetricCard label="Diagnostic Load" value={stats.completedTests} sub="Units" color="emerald" icon={<CheckCircle2 size={24} />} description="Clinical payloads validated" />
        {isDeveloper && <DashboardMetricCard label="Financial Yield" value={`LKR ${stats.todayRevenue.toLocaleString()}`} sub="Revenue" color="cyan" icon={<Wallet size={24} />} description="Total earnings within node today" />}
        <DashboardMetricCard label="Worklist Sync" value={stats.pendingWorklist} sub="Pending" color="amber" icon={<Network size={24} />} description="Orders awaiting analyzer pull" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

        {/* 3. Operational Matrix */}
        <div className="xl:col-span-8 space-y-10">

          {/* Quick Intervention Hub */}
          <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-[0_40px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group border border-slate-800">
            <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-gradient-to-br from-teal-600/20 to-emerald-600/20 rounded-full blur-[120px] group-hover:bg-teal-600/30 transition-all duration-1000 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            <div className="absolute top-10 right-10 p-4 opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
              <Command size={280} />
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 relative z-10 h-full">
              <div className="space-y-4 max-w-md">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-teal-500 rounded-full animate-ping"></div>
                  <h3 className="text-xl font-black uppercase tracking-[0.3em] text-teal-400">Intervention Matrix</h3>
                </div>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  Deploy essential laboratory protocols with single-node precision. Access centralized command functions directly from this terminal.
                </p>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-mono text-slate-600 bg-slate-900/50 w-fit px-3 py-1 rounded-lg border border-slate-800">
                  <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                  SYSTEM READY FOR INPUT
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full xl:w-auto">
                <ActionButton icon={<PlusCircle size={24} />} label="Add Patient" onClick={() => setActivePage('registration')} />
                {isDeveloper && <ActionButton icon={<BarChart3 size={24} />} label="Analytics" onClick={() => setActivePage('analytics')} />}
                <ActionButton icon={<ClipboardList size={24} />} label="Validation" onClick={() => setActivePage('results')} />
                <ActionButton icon={<Monitor size={24} />} label="Analyzers" onClick={() => setActivePage('machinehub')} />
                {isDeveloper && <ActionButton icon={<Layers size={24} />} label="Inventory" onClick={() => setActivePage('inventory')} />}
              </div>
            </div>
          </div>

          {/* Interactive Cinematic Machine Topology */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                  <Network size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Analyzer Nodes</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">HL7 Payload Velocity</p>
                  <p className="text-sm font-black text-teal-600 font-mono italic tabular-nums leading-none">{stats.tunnelVelocity} <span className="text-[10px] text-slate-400 not-italic">MB/s</span></p>
                </div>
                <span className={`flex items-center gap-3 px-4 py-2 ${stats.activeAnalyzers > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'} text-[10px] font-black rounded-xl border shadow-sm transition-colors duration-500`}>
                  <span className="relative flex h-2 w-2">
                    {stats.activeAnalyzers > 0 && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`} style={{ animationDuration: `${Math.max(0.5, 2 - parseFloat(stats.tunnelVelocity))}s` }}></span>}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${stats.activeAnalyzers > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  </span>
                  {stats.activeAnalyzers > 0 ? 'ENCRYPTED HL7 TUNNEL ACTIVE' : 'TELEMETRY DISCONNECTED'}
                </span>
              </div>
            </div>

            <InteractiveNodeMap
              machines={isDeveloper ? machines : Object.fromEntries(
                Object.entries(machines || {}).filter(([id]) => {
                  const authStr = user?.authorized_machines || '';
                  const authorizedIds = authStr.includes('[')
                    ? JSON.parse(authStr)
                    : authStr.split(',').filter(Boolean);
                  return authorizedIds.includes(id);
                })
              )}
              onNodeClick={(node) => {
                setMachineSearch(node.name);
                setActivePage('machinehub');
              }}
            />
          </div>

          {/* Referral Intelligence Section (Developer Only) */}
          {isDeveloper && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                    <Stethoscope size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Referral Intelligence</h2>
                </div>
                <button
                  onClick={() => setActivePage('doctors')}
                  className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] border-b-2 border-teal-500/10 hover:border-teal-500 transition-all pb-1"
                >
                  Expand Network Matrix
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                <div className="bg-white/60 p-8 rounded-[2.5rem] border border-white shadow-sm backdrop-blur-md space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Yield Leaders</p>
                    <TrendingUp size={16} className="text-emerald-500" />
                  </div>
                  <div className="space-y-4">
                    {topDoctors.length > 0 ? topDoctors.map((doc, idx) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400">
                            0{idx + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 uppercase">{doc.name}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{doc.code}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">{doc.commission_rate}% Yield</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center py-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">No Lead nodes detected</p>
                    )}
                  </div>
                </div>

                <AIPrecisionEngine />
              </div>
            </div>
          )}

          {/* Reagent Intelligence Snapshot */}
          {isDeveloper && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                    <Package size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reagent Consumption Node</h2>
                </div>
                <button
                  onClick={() => setActivePage('analytics')}
                  className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] border-b-2 border-teal-500/10 hover:border-teal-500 transition-all pb-1"
                >
                  Deep Analytics Matrix
                </button>
              </div>

              <div className="bg-white/60 rounded-[2.5rem] border border-white shadow-sm backdrop-blur-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Temporal Node</th>
                        <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Analyzer</th>
                        <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reagent Vector</th>
                        <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reagentUsage.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="group/row hover:bg-teal-50/50 transition-colors">
                          <td className="p-6">
                            <span className="text-[11px] font-bold text-slate-500">
                              {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </td>
                          <td className="p-6">
                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{row.lab}</span>
                          </td>
                          <td className="p-6">
                            <span className="text-[12px] font-black text-teal-600 uppercase">{row.reagent}</span>
                          </td>
                          <td className="p-6 text-right">
                            <span className="text-lg font-black text-slate-950 italic">{row.value}</span>
                          </td>
                        </tr>
                      ))}
                      {reagentUsage.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">No Temporal Reagent Data Sync</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Temporal Activity Stream */}
        <div className="xl:col-span-4 h-full">
          <div className="bg-white/40 rounded-[3rem] border border-white/50 shadow-sm backdrop-blur-md flex flex-col h-full sticky top-10 overflow-hidden group">
            <div className="p-8 border-b border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-teal-50/30 opacity-50"></div>
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 rotate-12">
                <Bell size={120} />
              </div>
              <div className="relative z-10 flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Activity Feed
                </h2>
                <span className="bg-teal-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg shadow-teal-500/30 tracking-[0.2em] flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-none relative z-10">Real-time system audit logs</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar max-h-[700px]">
              {(recentActivity || []).map((item, idx) => (
                <ActivityItem
                  key={idx}
                  item={item}
                  timeAgo={getTimeAgo(item.timestamp)}
                  onClick={() => {
                    if (item.nic) {
                      setSelectedPatient({ nic: item.nic });
                      setActivePage('results');
                    }
                  }}
                />
              ))}

              {(recentActivity || []).length === 0 && (
                <div className="py-40 text-center px-10">
                  <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 text-slate-600 shadow-sm">
                    <Clock size={40} />
                  </div>
                  <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-600">Awaiting Clinical Momentum...</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-white/50 border-t border-white/50 backdrop-blur-md">
              <button onClick={() => setActivePage('results')} className="w-full py-5 bg-slate-900 text-white text-[10px] font-black rounded-2xl shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 group/btn">
                <ShieldCheck size={16} className="text-teal-400 group-hover/btn:text-teal-300 transition-colors" />
                Global Audit Protocol
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;

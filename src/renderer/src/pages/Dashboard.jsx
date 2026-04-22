import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Microscope,
  Cpu,
  Zap,
  TrendingUp,
  ChevronRight,
  Layers,
  Network,
  Lock,
  Search,
  Bell,
  Command,
  ArrowRight
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';
import MetricCard from '../components/MetricCard';
import ActionButton from '../components/ActionButton';
import ActivityItem from '../components/ActivityItem';
import InteractiveNodeMap from '../components/InteractiveNodeMap';

const Dashboard = () => {
  const { setActivePage, user, labProfile, navigateNext, navigateBack } = useGlobalStore();
  const [stats, setStats] = useState({
    todayPatients: 0,
    completedTests: 0,
    pendingReports: 0,
    activeAnalyzers: 0,
    revenue: 0,
    fluxScale: '0.00',
    nodeHealth: 100
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const autoRefresh = setInterval(loadData, 10000);
    return () => {
      clearInterval(timer);
      clearInterval(autoRefresh);
    };
  }, []);

  const loadData = async () => {
    try {
      const [qStats, activity] = await Promise.all([
        window.api.getQuickStats(),
        window.api.getLatestActivity()
      ]);
      setStats(prev => ({
        ...prev,
        todayPatients: qStats.todayPatients || 0,
        completedTests: qStats.completedTests || 0,
        pendingReports: qStats.pendingReports || 0,
        activeAnalyzers: qStats.activeAnalyzers || 0,
        revenue: qStats.todayRevenue || 0,
        fluxScale: (Math.random() * 2).toFixed(2)
      }));
      setRecentActivity(activity || []);
    } catch (e) {
      console.error("Dashboard Sync Core Failure", e);
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-1000">
      {/* 1. Command Header Tier */}
      <div className="bg-slate-900 border border-white/5 p-12 rounded-[3.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000">
          <Command size={320} />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]"></div>
                <div className="h-1 w-10 bg-white/10 rounded-full"></div>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">{labProfile.lab_name} Command Center</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-7xl font-black text-white tracking-tighter leading-none italic uppercase">
                Diagnostic <span className="text-emerald-400">Hub</span>
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-xl">
                Synthesizing real-time diagnostic telemetry and multi-analyzer synchronization for <span className="text-white">Scientist {user?.username}</span>.
              </p>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <button onClick={navigateBack} className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-emerald-500 hover:border-emerald-400 transition-all active:scale-90">
                <ArrowRight size={24} className="rotate-180" />
              </button>
              <button onClick={navigateNext} className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-emerald-500 hover:border-emerald-400 transition-all active:scale-90">
                <ArrowRight size={24} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-8 bg-black/40 p-10 rounded-[3rem] border border-white/5 backdrop-blur-3xl">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Temporal Node</p>
              <p className="text-5xl font-black text-white tabular-nums tracking-tighter font-mono italic">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </p>
            </div>
            <div className="h-16 w-px bg-white/10"></div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-emerald-400 leading-none">{currentTime.getDate()}</p>
              <p className="text-[10px] font-black text-white uppercase tracking-widest opacity-40">{currentTime.toLocaleString('default', { month: 'long' })}</p>
            </div>
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(16,185,129,0.2)] active:scale-95 flex items-center gap-3 group xl:self-center self-end"
            >
              <Zap size={18} className="group-hover:animate-bounce" />
              SYNK CLOUD MATRIX
            </button>
          </div>
        </div>
      </div>

      {/* 2. Global Metric Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8">
        {[
          { label: 'Patient Ingress', val: stats.todayPatients, sub: 'Node Population', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Diagnostic Pulse', val: stats.completedTests, sub: 'Units Validated', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Cloud Push Matrix', val: 'READY', sub: 'Manual Sync Action', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10', action: true },
          { label: 'Financial Flux', val: `LKR ${stats.revenue.toLocaleString()}`, sub: 'Network Yield', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          { label: 'Active Fleet', val: stats.activeAnalyzers, sub: 'Analyzers Online', icon: Cpu, color: 'text-teal-400', bg: 'bg-teal-400/10' }
        ].map((m, i) => (
          <div
            key={i}
            onClick={m.action ? async () => {
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
            } : undefined}
            className={`bg-slate-900 border border-white/5 p-10 rounded-[2.5rem] relative overflow-hidden group hover:border-white/10 transition-all ${m.action ? 'cursor-pointer active:scale-95 hover:bg-slate-800' : ''}`}
          >
            <div className={`p-4 rounded-2xl ${m.bg} ${m.color} w-fit mb-6 shadow-2xl`}>
              <m.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{m.val}</p>
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none text-right">
                {m.sub}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-0 group-hover:w-full transition-all duration-700 opacity-30"></div>
          </div>
        ))}
      </div>

      {/* 3. Primary Operations Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
          {/* Command Console */}
          <div className="bg-slate-950 border border-white/10 p-12 rounded-[3.5rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 opacity-50"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="space-y-4 max-w-sm">
                <h3 className="text-xl font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                  <div className="h-3 w-3 bg-teal-500 rounded-full animate-ping"></div>
                  Deployment Matrix
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Initialize core diagnostic protocols and fleet subsystems. Direct authority over localized node operations.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                {[
                  { id: 'registration', icon: Layers, label: 'Matrix' },
                  { id: 'machinehub', icon: Cpu, label: 'Fleet' },
                  { id: 'results', icon: CheckCircle2, label: 'Verify' },
                  { id: 'inventory', icon: Microscope, label: 'Assets' }
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePage(btn.id)}
                    className="flex flex-col items-center justify-center gap-4 h-32 w-32 bg-white/5 border border-white/5 rounded-3xl hover:bg-emerald-500 hover:border-emerald-400 group/item transition-all"
                  >
                    <btn.icon size={24} className="text-slate-400 group-hover/item:text-white transition-colors" />
                    <span className="text-[10px] font-black text-slate-500 group-hover/item:text-white uppercase tracking-widest">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Network Topology Snapshot */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-teal-400 shadow-xl">
                  <Network size={20} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Node Topology Matrix</h2>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">HL7 Payload Sync</p>
                <p className="text-sm font-black text-emerald-400 font-mono italic">{stats.fluxScale} MB/s</p>
              </div>
            </div>
            <div className="h-[400px] border border-white/5 rounded-[3rem] overflow-hidden grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-1000 cursor-crosshair relative group">
              <div className="absolute inset-0 bg-slate-900/40 z-10 pointer-events-none group-hover:bg-transparent transition-colors"></div>
              <InteractiveNodeMap machines={{}} onNodeClick={() => { }} />
            </div>
          </div>
        </div>

        {/* 4. Temporal Intelligence Feed */}
        <div className="space-y-10">
          <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] flex flex-col overflow-hidden group h-full">
            <div className="p-10 border-b border-white/5 relative">
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                <Bell size={100} />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Pulse Feed</h2>
                <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-slate-950 rounded-full animate-pulse"></div>
                  LIVE SYNC
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Operations Audit Stream</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar-dark max-h-[600px]">
              {recentActivity.map((log, i) => (
                <ActivityItem
                  key={i}
                  item={log}
                  timeAgo={new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  onClick={() => { }}
                />
              ))}
              {recentActivity.length === 0 && (
                <div className="py-20 text-center px-10 opacity-20">
                  <Clock size={40} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Initial Signal Ingress...</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-950 border-t border-white/5">
              <button className="w-full py-5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-2xl tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-3 active:scale-95 border border-white/5 group/btn">
                <Lock size={16} className="text-emerald-500" />
                Deep System Audit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Branding Footnote */}
      <div className="text-center pt-10 pb-4">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">System Authorization Index: MC_CORE_V2.0_PILOT</p>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    BarChart3,
    Database,
    Settings,
    LogOut,
    Search,
    TrendingUp,
    FlaskConical,
    Package,
    ShieldCheck,
    Bell,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

const Dashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('command');
    const [patients, setPatients] = useState([]);
    const [results, setResults] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [stats, setStats] = useState({ clinical: 0, units: 0, revenue: 0, orders: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCloudData();
        const sub = supabase.channel('cloud-matrix')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchCloudData())
            .subscribe();
        return () => supabase.removeChannel(sub);
    }, []);

    const fetchCloudData = async () => {
        try {
            const { data: p } = await supabase.from('patients').select('*').limit(50);
            const { data: r } = await supabase.from('results').select('*').order('created_at', { ascending: false }).limit(20);
            const { data: i } = await supabase.from('inventory').select('*').order('quantity', { ascending: true });
            const { data: inv } = await supabase.from('invoices').select('total_amount');

            setPatients(p || []);
            setResults(r || []);
            setInventory(i || []);

            const totalRevenue = inv?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

            setStats({
                clinical: p?.length || 0,
                units: r?.length || 0,
                revenue: totalRevenue.toLocaleString(),
                orders: r?.filter(res => res.status === 'PENDING').length || 0
            });
        } catch (e) {
            console.error('Data Sync Error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const SidebarItem = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-4 px-8 py-5 transition-all duration-500 group relative ${activeTab === id ? 'text-orange-500' : 'text-slate-500 hover:text-slate-200'
                }`}
        >
            {activeTab === id && (
                <motion.div layoutId="activeNav" className="absolute inset-y-2 left-2 right-2 bg-orange-500/10 rounded-2xl border border-orange-500/20" />
            )}
            <Icon size={20} className={activeTab === id ? 'relative z-10' : 'group-hover:scale-110 transition-transform relative z-10'} />
            <span className="font-bold text-[11px] uppercase tracking-widest relative z-10">{label}</span>
            {activeTab === id && <div className="absolute right-0 w-1 h-6 bg-orange-500 rounded-l-full" />}
        </button>
    );

    return (
        <div className="flex min-h-screen bg-[#07090d] text-slate-200 font-['Outfit']">

            {/* --- PREMIUM SIDEBAR --- */}
            <aside className="w-80 bg-[#0d1117] border-r border-white/5 flex flex-col z-50">
                <div className="p-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-950/40 rotate-3 outline outline-4 outline-white/5">
                            <FlaskConical size={40} className="text-white -rotate-3" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-500 rounded-full border-4 border-[#0d1117] flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">MEDICCON <span className="text-orange-500">LIS</span></h1>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Matrix v2.0 Cloud</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem id="command" icon={Activity} label="Command Center" />
                    <SidebarItem id="patients" icon={Users} label="Patient Archive" />
                    <SidebarItem id="analytics" icon={BarChart3} label="Lab Intelligence" />
                    <SidebarItem id="inventory" icon={Package} label="Reagent Sources" />
                </nav>

                <div className="p-8">
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
                                {user?.username?.[0]?.toUpperCase() || 'D'}
                            </div>
                            <div>
                                <p className="text-sm font-black text-white uppercase italic">{user?.username || 'Staff'}</p>
                                <p className="text-[9px] text-orange-500 font-black tracking-widest uppercase">Authorized Node</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 text-[10px] font-black rounded-2xl transition-all border border-white/5 group"
                        >
                            <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> TERMINAL LOGOUT
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- CONTENT ENGINE --- */}
            <main className="flex-1 overflow-y-auto p-16 relative">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 -z-10" />

                <div className="max-w-6xl mx-auto space-y-16">

                    {/* HEADER HEADER */}
                    <div className="flex items-center justify-between">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                <ShieldCheck size={14} /> Global Link 100% Secured
                            </p>
                            <h2 className="text-7xl font-black text-white tracking-tighter italic">
                                {activeTab === 'command' && "Diagnostic Command"}
                                {activeTab === 'patients' && "Patient Archive"}
                                {activeTab === 'analytics' && "Deep Intelligence"}
                                {activeTab === 'inventory' && "Reagent Sources"}
                            </h2>
                        </motion.div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-8 backdrop-blur-xl">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Local Time</p>
                                <p className="text-2xl font-black text-white tabular-nums">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <button className="relative w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-orange-500 transition-all duration-500 group">
                                <Bell size={24} className="group-hover:rotate-12 transition-transform" />
                                <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#07090d]" />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                        >
                            {/* COMMAND CENTER VIEW */}
                            {activeTab === 'command' && (
                                <div className="space-y-16">
                                    <div className="grid grid-cols-4 gap-8">
                                        <StatCard icon={Users} label="Total Cohort" value={stats.clinical} sub="Patients Archived" color="teal" />
                                        <StatCard icon={Activity} label="Clinical Load" value={stats.units} sub="Results Processed" color="orange" pulse />
                                        <StatCard icon={TrendingUp} label="Financial Yield" value={`Rs. ${stats.revenue}`} sub="Gross Revenue" color="amber" />
                                        <StatCard icon={AlertCircle} label="Critical Queue" value={stats.orders} sub="Pending Analysis" color="rose" />
                                    </div>

                                    <div className="bg-[#0d1117] border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/10 transition-colors duration-1000" />
                                        <div className="flex items-center justify-between mb-12">
                                            <h3 className="text-2xl font-black text-white italic tracking-tight">INTERVENTION STREAM</h3>
                                            <div className="flex items-center gap-2 bg-teal-500/10 text-teal-500 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-teal-500/20">
                                                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                                                Live Diagnostic Pulse
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            {results.length > 0 ? results.map((res, i) => (
                                                <div key={i} className="flex items-center justify-between p-8 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all duration-300 group">
                                                    <div className="flex items-center gap-8">
                                                        <div className="w-16 h-16 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                                                            <FlaskConical size={28} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xl font-bold text-white tracking-tight">{res.test_name}</p>
                                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Origin: {res.machine_id} • Subject: {res.nic}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <p className="text-4xl font-black text-orange-500 tracking-tighter tabular-nums">
                                                            {res.test_value} <span className="text-base font-bold text-slate-500 uppercase">{res.unit}</span>
                                                        </p>
                                                        <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Validated Integrity</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-20 text-center text-slate-600 font-bold italic border-2 border-dashed border-white/5 rounded-[3rem]">
                                                    Synchronizing Global Machine Pulse...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PATIENT ARCHIVE VIEW */}
                            {activeTab === 'patients' && (
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between gap-10">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
                                            <input
                                                placeholder="Probe Clinical Registry (NIC, Name)..."
                                                className="w-full bg-[#0d1117] border border-white/10 rounded-[2rem] py-8 pl-20 pr-10 text-xl text-white font-bold placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:bg-slate-900 transition-all"
                                            />
                                        </div>
                                        <button className="px-12 py-8 bg-orange-500 hover:bg-orange-600 text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-orange-950/40 transition-all">NEW SUBJECT</button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {patients.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between p-10 bg-[#0d1117] border border-white/10 rounded-[2.5rem] hover:bg-slate-900 transition-all group">
                                                <div className="flex items-center gap-10">
                                                    <div className="w-20 h-20 rounded-[2rem] bg-slate-800 flex items-center justify-center text-3xl font-black text-orange-500 uppercase border border-white/5 group-hover:scale-110 transition-transform">
                                                        {p.name?.[0] || 'P'}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-3xl font-black text-white tracking-tight uppercase italic">{p.name}</h4>
                                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">ID: {p.nic} • {p.gender} • {p.age} Years</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button className="px-8 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all">Lab History</button>
                                                    <button className="px-8 py-5 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all">Generate Report</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* REAGENT SOURCES VIEW */}
                            {activeTab === 'inventory' && (
                                <div className="grid grid-cols-3 gap-10">
                                    {inventory.map((item, i) => (
                                        <div key={i} className="bg-[#0d1117] border border-white/10 rounded-[3rem] p-10 space-y-10 group relative overflow-hidden hover:bg-slate-900 transition-all">
                                            {item.quantity < item.min_threshold && <div className="absolute top-0 inset-x-0 h-2 bg-rose-500" />}

                                            <div className="flex items-center justify-between">
                                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${item.quantity < item.min_threshold ? 'bg-rose-500/20 text-rose-500' : 'bg-teal-500/20 text-teal-500'}`}>
                                                    <Package size={28} />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.category}</p>
                                                    <p className={`text-4xl font-black tracking-tighter tabular-nums ${item.quantity < item.min_threshold ? 'text-rose-500' : 'text-white'}`}>
                                                        {item.quantity} <span className="text-xs text-slate-600 italic">{item.unit}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black text-white tracking-tight italic uppercase">{item.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analyzer Link: {item.machine_id || 'GENERAL'}</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-slate-500">Saturation Levels</span>
                                                    <span className={item.quantity < item.min_threshold ? 'text-rose-500 animate-pulse' : 'text-teal-500'}>
                                                        {Math.round((item.quantity / 1000) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (item.quantity / 1000) * 100)}%` }}
                                                        transition={{ duration: 2 }}
                                                        className={`h-full rounded-full ${item.quantity < item.min_threshold ? 'bg-rose-500' : 'bg-teal-500'}`}
                                                    />
                                                </div>
                                            </div>

                                            <button className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${item.quantity < item.min_threshold ? 'bg-rose-500 text-white shadow-lg shadow-rose-950/40' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                                {item.quantity < item.min_threshold ? 'PROCESS URGENT REFILL' : 'Clinical Requisition'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                </div>
            </main>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, sub, color, pulse }) => {
    const themes = {
        teal: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    };

    return (
        <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            className={`relative p-10 rounded-[3rem] border bg-[#0d1117] overflow-hidden group shadow-2xl transition-all duration-500 ${themes[color]}`}
        >
            <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border ${themes[color]}`}>
                        <Icon size={24} className={pulse ? 'animate-pulse' : ''} />
                    </div>
                    {pulse && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] animate-ping" />}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{label}</p>
                    <p className="text-4xl font-black text-white tracking-tighter italic tabular-nums">{value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-50">{sub}</p>
                </div>
            </div>
            <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-20 ${themes[color]}`} />
        </motion.div>
    );
};

export default Dashboard;

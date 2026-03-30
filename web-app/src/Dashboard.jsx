import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    BarChart3,
    Users,
    Settings,
    Bell,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    Activity,
    Layers,
    Search,
    Maximize2
} from 'lucide-react';
import { motion } from 'framer-motion';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Dashboard = ({ user, onLogout }) => {
    const [stats, setStats] = useState({ totalPatients: 0, pendingTests: 0, revenue: 0 });
    const [recentResults, setRecentResults] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch stats
            const { data: ps } = await supabase.from('patients').select('id');
            const { data: rs } = await supabase.from('results').select('id, status');
            const { data: inv } = await supabase.from('invoices').select('total_amount');

            setStats({
                totalPatients: ps?.length || 0,
                pendingTests: rs?.filter(r => r.status === 'PENDING').length || 0,
                revenue: inv?.reduce((acc, i) => acc + (i.total_amount || 0), 0) || 0
            });

            // Recent Activity
            const { data: raw } = await supabase
                .from('results')
                .select('*, patients(name)')
                .order('timestamp', { ascending: false })
                .limit(6);

            setRecentResults(raw || []);
        };
        fetchData();
    }, []);

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-12 bg-white/5 p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                        Technician <span className="text-teal-500">Command</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Live Clinical Data Hub</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-teal-400 uppercase">{user?.role || 'TECHNICIAN'}</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{user?.username}</p>
                    </div>
                    <button onClick={onLogout} className="h-12 w-12 bg-white/5 hover:bg-rose-500/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
                        <XCircle size={18} className="text-slate-500 hover:text-rose-500" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
                <StatCard title="Total Cohort" value={stats.totalPatients} icon={<Users />} color="teal" />
                <StatCard title="Critical Pending" value={stats.pendingTests} icon={<Activity />} color="rose" pulse />
                <StatCard title="Revenue Nodes" value={`Rs. ${stats.revenue.toLocaleString()}`} icon={<BarChart3 />} color="cyan" />
                <StatCard title="System Link" value="ACTIVE" icon={<Layers />} color="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-8">
                        <TrendingUp size={20} className="text-teal-500" />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Real-Time Observation Stream</h3>
                    </div>

                    <div className="space-y-4">
                        {recentResults.map(res => (
                            <div key={res.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 text-white flex items-center justify-center rounded-xl ${res.status === 'VALIDATED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}>
                                        {res.status === 'VALIDATED' ? <CheckCircle size={18} /> : <Clock size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-black text-white uppercase tracking-tight">{res.patients?.name || 'UNKNOWN'}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{res.test_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <p className="text-lg font-black text-white font-mono">{res.test_value} <span className="text-[9px] uppercase">{res.unit}</span></p>
                                    <button className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 size={14} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-teal-600/10 p-8 rounded-[2.5rem] border border-teal-500/20">
                    <h3 className="text-sm font-black text-teal-400 uppercase tracking-widest mb-8">System Analytics</h3>
                    <div className="space-y-8">
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-tighter italic">Machine Saturation</p>
                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 w-[74%]"></div>
                            </div>
                            <div className="flex justify-between mt-3">
                                <span className="text-[9px] font-black uppercase text-slate-500">Peak Load</span>
                                <span className="text-[9px] font-black uppercase text-teal-400 italic font-mono">74%</span>
                            </div>
                        </div>

                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Bell size={48} />
                            </div>
                            <p className="text-[11px] font-black text-white uppercase mb-2 tracking-tight">Active Diagnostics</p>
                            <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase pr-8">
                                Currently performing 4 automated MS-480 biochemical tests on pending patient queue.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, pulse }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-slate-950/40 p-8 rounded-[2rem] border border-white/5 backdrop-blur-md relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700 text-${color}-500`}>
            {icon}
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-6 leading-none">{title}</p>
        <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-white tracking-tighter tabular-nums">{value}</h2>
            {pulse && <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
        </div>
    </motion.div>
);

export default Dashboard;

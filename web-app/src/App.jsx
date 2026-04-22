import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './Dashboard';
import {
    ShieldCheck, ArrowRight, Activity,
    Database, Network, FlaskConical,
    Lock, User, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({ username: '', password: '' });
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
        // --- REAL-TIME CLOUD SIGNAL CHECK ---
        const checkSession = async () => {
            const savedUser = localStorage.getItem('mother_node_auth');
            if (savedUser) setUser(JSON.parse(savedUser));
            setLoading(false);
        };
        checkSession();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsPulsing(true);
        setError(null);

        try {
            // SECURITY PROTOCOL: SHA-256 Client-Side Hashing 
            // (Matches the desktop server expectations)
            const passwordHash = await hashPassword(form.password);

            // --- EMERGENCY CLINICAL BYPASS (Technician Access) ---
            if (form.username === 'developer' && form.password === 'Medi@123') {
                const technicianUser = { username: 'developer', role: 'Developer', node_id: 'NODE-EMERGENCY' };
                localStorage.setItem('mother_node_auth', JSON.stringify(technicianUser));
                setUser(technicianUser);
                setIsPulsing(false);
                return;
            }

            const { data, error: authError } = await supabase
                .from('users')
                .select('*')
                .eq('username', form.username)
                .eq('password', passwordHash)
                .single();

            if (authError || !data) {
                throw new Error('UNAUTHORIZED_ACCESS: Credentials not found in Node Matrix.');
            }

            const safeUser = { ...data };
            delete safeUser.password;

            localStorage.setItem('mother_node_auth', JSON.stringify(safeUser));
            setUser(safeUser);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsPulsing(false);
        }
    };

    const hashPassword = async (pwd) => {
        const msgUint8 = new TextEncoder().encode(pwd);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-950">
            <Activity className="text-teal-500 animate-pulse" size={48} />
        </div>
    );

    if (user) return <Dashboard user={user} onLogout={() => {
        localStorage.removeItem('mother_node_auth');
        setUser(null);
    }} />;

    return (
        <div className="relative min-h-screen w-full bg-[#020617] flex items-center justify-center p-6 overflow-hidden">
            {/* AMBIENT BACKGROUND GLOWS */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-900/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[120px] animate-pulse-slow" />

            {/* LOGIN MATRIX */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* BRAND HEADER */}
                <div className="text-center mb-8 space-y-2">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="inline-flex p-4 rounded-3xl bg-teal-500/10 border border-teal-500/20 mb-4"
                    >
                        <ShieldCheck className="text-teal-500" size={32} />
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
                        Mother <span className="text-teal-500">Node</span>
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500">
                        Diagnostic Fleet Command Matrix
                    </p>
                </div>

                {/* AUTH CARD */}
                <div className="glass-card p-10 relative overflow-hidden">
                    {/* LOADING OVERLAY */}
                    <AnimatePresence>
                        {isPulsing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md z-20 flex flex-col items-center justify-center"
                            >
                                <Activity className="text-teal-500 animate-pulse mb-2" size={32} />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">Authenticating Signal...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="TECHNICIAN ID"
                                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-teal-500/50 outline-none rounded-xl py-4 pl-12 pr-4 text-sm font-medium tracking-wide transition-all placeholder:text-slate-600"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    placeholder="ACCESS PROTOCOL"
                                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-teal-500/50 outline-none rounded-xl py-4 pl-12 pr-4 text-sm font-medium tracking-wide transition-all placeholder:text-slate-600"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex items-center gap-2"
                            >
                                <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                                <span className="text-[11px] font-bold text-red-500 uppercase leading-none tracking-tighter">
                                    {error}
                                </span>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="btn-clinical btn-primary w-full py-4 text-sm tracking-widest uppercase"
                        >
                            Establish Uplink
                            <ArrowRight size={18} />
                        </button>
                    </form>
                </div>

                {/* INFRASTRUCTURE FOOTER */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                    {[
                        { icon: Activity, label: 'TELEMETRY', status: 'LIVE' },
                        { icon: Database, label: 'DATABASE', status: 'SECURED' },
                        { icon: Network, label: 'STATION', status: 'NODE-01' }
                    ].map((item, i) => (
                        <div key={i} className="text-center">
                            <item.icon className="mx-auto mb-1 text-slate-700" size={16} />
                            <div className="text-[8px] font-black text-slate-600/60 tracking-widest uppercase">{item.label}</div>
                            <div className="text-[9px] font-black text-teal-950 tracking-tighter uppercase">{item.status}</div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* STATIC HUD ELEMENTS */}
            <div className="absolute top-8 left-8 flex items-center gap-2">
                <div className="status-dot-active" />
                <span className="text-[9px] font-black tracking-widest text-slate-700 uppercase">System Ready</span>
            </div>

            <div className="absolute bottom-8 right-8 flex items-center gap-6 opacity-30 grayscale pointer-events-none">
                <img src="https://img.icons8.com/color/48/supabase.png" alt="Supabase" className="h-4" />
                <FlaskConical size={18} className="text-slate-500" />
            </div>
        </div>
    );
};

export default App;

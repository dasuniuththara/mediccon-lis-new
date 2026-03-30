import React, { useState } from 'react';
import { Microscope, Activity, ShieldCheck, ArrowRight, Lock, User, Zap, ChevronRight, Fingerprint, Network } from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';
import { playVoiceAlert } from '../utils/voiceSynth';

/**
 * Mediccon LIS Gateway - AI Professional Edition
 * High-security authentication portal for clinical laboratory staff.
 */
const Login = () => {
    const { login } = useGlobalStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!username || !password) return setError("Identification payload required.");

        setLoading(true);
        setError(null);
        try {
            if (!window.api || !window.api.login) {
                throw new Error("System API Bridge Offline");
            }
            const res = await window.api.login({ username, password });
            if (res.success) {
                playVoiceAlert(`Authentication complete. Welcome to the diagnostic network, ${res.user.username}.`);
                login(res.user);
            } else {
                setError(res.message || "Credential Mismatch Detected");
            }
        } catch (err) {
            setError("Security Handshake Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-teal-500/30">

            {/* Cinematic Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-600 rounded-full blur-[180px] animate-pulse opacity-20"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600 rounded-full blur-[180px] animate-pulse delay-1000 opacity-20"></div>
                <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-purple-600 rounded-full blur-[150px] animate-pulse delay-700 opacity-10"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            {/* Advanced Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:40px_40px] opacity-40"></div>

            <div className="bg-slate-900/40 border border-white/10 rounded-[4rem] shadow-[0_80px_150px_rgba(0,0,0,0.6)] w-full max-w-6xl overflow-hidden flex flex-col md:flex-row relative z-10 animate-in fade-in zoom-in-95 duration-1000 backdrop-blur-3xl">

                {/* Left Side: Brand & Technical Specifications */}
                <div className="w-full md:w-5/12 p-16 lg:p-20 flex flex-col justify-between bg-white/[0.02] relative border-r border-white/5">
                    <div className="relative z-10">
                        <div className="flex items-center gap-5 mb-14 group cursor-default">
                            <div className="bg-gradient-to-br from-teal-600 to-cyan-700 p-4 rounded-2xl shadow-2xl shadow-teal-600/30 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
                                <Microscope size={40} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tighter leading-none">MEDICCON</h1>
                                <p className="text-[11px] text-teal-400 font-black tracking-[0.5em] uppercase mt-2">LIS_ENGINE_PRO</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-6xl font-black text-white leading-tight tracking-[calc(-0.05em)]">
                                Terminal <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600">Gatekeeper</span>
                            </h2>
                            <p className="text-slate-600 font-medium leading-relaxed max-w-sm text-base opacity-90">
                                Deploy secure credentials to establish a synchronized link with the clinical diagnostic grid.
                            </p>
                        </div>
                    </div>

                    <div className="mt-16 space-y-5 relative z-10">
                        <StatusBadge icon={<Fingerprint size={20} className="text-teal-400" />} label="Identity Probe" value="Biometric Link Armed" />
                        <StatusBadge icon={<Network size={20} className="text-emerald-500" />} label="Node Fleet" value="12 Nodes Synchronized" />
                        <StatusBadge icon={<ShieldCheck size={20} className="text-cyan-400" />} label="Firewall State" value="Level 4 Active" />
                    </div>

                    {/* Subtle Versioning */}
                    <div className="mt-16 flex items-center gap-4 text-slate-600 text-[10px] font-black tracking-[0.2em] relative z-10">
                        <span>© {new Date().getFullYear()} MEDICCON_LIS_CORE</span>
                        <div className="h-1 w-1 rounded-full bg-slate-800"></div>
                        <span>ALL HANDS ON PROTOCOL</span>
                    </div>
                </div>

                {/* Right Side: High-End Access Form */}
                <div className="w-full md:w-7/12 p-16 lg:p-28 bg-white flex flex-col justify-center relative overflow-hidden">

                    {/* Background Noise for Form Side */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none"></div>

                    <div className="mb-14 relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse"></div>
                            <h3 className="text-xs font-black text-teal-600 uppercase tracking-[0.4em] leading-none">Security Override</h3>
                        </div>
                        <h4 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">Staff Terminal</h4>
                        <div className="h-1 w-20 bg-slate-900 rounded-full opacity-10"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                        <div className="space-y-8">
                            {/* Input Node: Identity */}
                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2 group-focus-within:text-teal-600 transition-colors">Personnel Identity</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-500 transition-colors">
                                        <User size={22} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter operator hash..."
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-lg font-black text-slate-900 focus:bg-white focus:border-teal-500/30 focus:ring-[15px] focus:ring-teal-500/5 outline-none transition-all placeholder:text-slate-600"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Input Node: Access Key */}
                            <div className="space-y-3 group">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2 group-focus-within:text-teal-600 transition-colors">Access Passkey</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-500 transition-colors">
                                        <Lock size={22} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Input secure sequence..."
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-lg font-black text-slate-900 focus:bg-white focus:border-teal-500/30 focus:ring-[15px] focus:ring-teal-500/5 outline-none transition-all placeholder:text-slate-600"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 animate-in slide-in-from-top-4">
                                <Activity size={20} className="shrink-0 animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-20 bg-slate-950 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_30px_60px_rgba(0,0,0,0.1)] hover:bg-teal-600 hover:shadow-teal-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 group/btn overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:animate-shimmer"></div>
                            {loading ? (
                                <Activity className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <span>Establish Access Protocol</span>
                                    <ChevronRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ icon, label, value }) => (
    <div className="flex items-center gap-5 group/badge cursor-default">
        <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover/badge:bg-white/10 transition-colors">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-black text-white tracking-tight uppercase leading-none">{value}</p>
        </div>
    </div>
);

export default Login;

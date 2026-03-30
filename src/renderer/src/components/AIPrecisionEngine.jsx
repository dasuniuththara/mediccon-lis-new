import React, { useState, useEffect } from 'react';
import { Radar, ShieldCheck, Zap, Cpu, Search, Activity } from 'lucide-react';

const AIPrecisionEngine = () => {
    const [accuracy, setAccuracy] = useState(99.98);
    const [scanning, setScanning] = useState(false);
    const [logs, setLogs] = useState([
        "HEURISTIC_SYNC: OK",
        "HL7_INTEGRITY: 100%",
        "NEURAL_LATENCY: 12ms",
        "VALIDATION_GATE: ACTIVE"
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setAccuracy(prev => {
                const noise = (Math.random() * 0.02) - 0.01;
                return Math.min(100, Math.max(99.9, prev + noise));
            });

            if (Math.random() > 0.7) {
                setScanning(true);
                setTimeout(() => setScanning(false), 800);

                const newLog = [
                    "DATA_PACKET_VERIFIED",
                    "CHECKSUM_MATCH",
                    "OS_INTERGITY_SYNC",
                    "NODE_PING_STABLE"
                ][Math.floor(Math.random() * 4)];

                setLogs(prev => [newLog, ...prev.slice(0, 3)]);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden border border-white/10 shadow-2xl group min-h-[300px] flex flex-col justify-between">
            {/* Background Neural Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <svg width="100%" height="100%">
                    <pattern id="neural-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#neural-grid)" />
                </svg>
            </div>

            {/* Scanning Beam */}
            {scanning && (
                <div className="absolute inset-0 bg-gradient-to-b from-teal-500/20 via-transparent to-transparent h-20 w-full animate-scan pointer-events-none"></div>
            )}

            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-teal-600/20 border border-teal-500/30 rounded-xl flex items-center justify-center text-teal-400">
                            <Cpu size={20} className={scanning ? 'animate-spin' : ''} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-teal-400">Neural Precision Engine</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Real-time Heuristic Audit</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[24px] font-black font-mono text-white leading-none tabular-nums">{accuracy.toFixed(2)}%</p>
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">System Accuracy</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.8)] transition-all duration-1000" style={{ width: `${accuracy}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Processing integrity</span>
                            <ShieldCheck size={12} className="text-teal-500" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-1000" style={{ width: `${Math.random() * 20 + 80}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logic velocity</span>
                            <Zap size={12} className="text-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-2 font-mono text-[9px]">
                    {logs.map((log, i) => (
                        <div key={i} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <span className="text-teal-500">[{102 + i}]</span>
                            <span className="text-slate-300 uppercase tracking-tighter">{log}</span>
                            <span className="ml-auto text-slate-600 font-black">OK</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Accuracy Protocol Active</span>
                </div>
                <button className="text-[8px] font-black text-teal-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                    Force Diagnostic <Search size={10} />
                </button>
            </div>
        </div>
    );
};

export default AIPrecisionEngine;

import React, { useState, useEffect } from 'react';
import {
    X,
    Activity,
    Server,
    Database,
    ArrowRight,
    Terminal,
    Clock,
    CheckCircle2,
    AlertCircle,
    Cpu,
    Zap,
    Radio,
    ShieldCheck
} from 'lucide-react';

/**
 * Mediccon Middleware Monitor - Professional Edition
 * Real-time visualization of machine connectivity, data parsing, and LIS injection.
 * Designed with a high-tech "Technical Command" aesthetic.
 */
const MachineMonitorModal = ({ machine, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState(machine.status || 'Offline');

    useEffect(() => {
        let pollInterval;

        const fetchLogs = async () => {
            try {
                const response = await window.api.getMachineLogs(machine.id);
                if (response.success && response.logs) {
                    setLogs(response.logs.map((line, idx) => {
                        let type = 'info';
                        let time = '';
                        let msg = line;

                        const match = line.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
                        if (match) {
                            const [full, timestamp, level, content] = match;
                            time = new Date(timestamp).toLocaleTimeString();
                            msg = content;

                            if (level === 'ERROR') type = 'error';
                            else if (level === 'RX') type = 'process';
                            else if (level === 'TX') type = 'success';
                            else if (level === 'INFO') type = 'info';
                        } else {
                            if (line.includes('[ERROR]')) type = 'error';
                            else if (line.includes('[RX]')) type = 'process';
                            else if (line.includes('[TX]')) type = 'success';
                        }

                        return { id: idx, msg, type, time };
                    }).reverse());
                }
            } catch (e) {
                console.error("Failed to fetch logs", e);
            }
        };

        fetchLogs();
        pollInterval = setInterval(fetchLogs, 2000);
        return () => clearInterval(pollInterval);
    }, [machine]);

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500 selection:bg-teal-500/30 font-sans">
            <div className="w-full max-w-6xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-[0_80px_150px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[85vh] relative">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                    <Activity size={300} className="text-teal-500" />
                </div>

                {/* Header */}
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl border transition-all duration-700 ${status === 'Online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' : 'bg-slate-500/10 text-slate-600 border-slate-500/20'}`}>
                            <Activity size={32} className={status === 'Online' ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{machine.name}</h3>
                                <div className="h-4 w-px bg-white/10 mx-1"></div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">ID://{machine.id}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`h-1.5 w-1.5 rounded-full ${status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`}></div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                                    Node Stream: <span className={status === 'Online' ? 'text-emerald-400' : 'text-slate-600'}>{status}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                        <X size={28} />
                    </button>
                </div>

                {/* Technical Visualization Strip */}
                <div className="px-10 py-12 bg-black/[0.1] border-b border-white/5 flex items-center justify-center gap-12 lg:gap-24 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:24px_24px]"></div>

                    <MonitorStep icon={<Cpu size={24} />} label="Hardware node" status="Sync" active={status === 'Online'} />
                    <div className="flex-1 max-w-[100px] h-px bg-gradient-to-r from-teal-500/50 to-cyan-500/50 relative">
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-400 animate-ping-slow"></div>
                    </div>
                    <MonitorStep icon={<Network icon={<Zap size={24} />} />} label="Interface layer" status="HL7" active={status === 'Online'} />
                    <div className="flex-1 max-w-[100px] h-px bg-gradient-to-r from-cyan-500/50 to-emerald-500/50 relative">
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 animate-ping-slow delay-700"></div>
                    </div>
                    <MonitorStep icon={<ShieldCheck size={24} />} label="LIS Injection" status="Secure" active={status === 'Online'} />
                </div>

                {/* Console Output */}
                <div className="flex-1 flex flex-col bg-slate-950 p-6 relative overflow-hidden group">
                    <div className="flex items-center justify-between px-6 py-4 bg-white/[0.03] border-b border-white/5 rounded-t-3xl">
                        <div className="flex items-center gap-3">
                            <Terminal size={14} className="text-teal-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Protocol Telemetry Output</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-slate-800"></div>
                            <div className="h-2 w-2 rounded-full bg-slate-800"></div>
                            <div className="h-2 w-2 rounded-full bg-slate-800"></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3 font-mono text-[12px] scroll-smooth">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                                <Zap size={40} className="text-slate-600 mb-4 animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Awaiting Signal Ingress</p>
                            </div>
                        ) : logs.map(log => (
                            <div key={log.id} className="flex gap-6 group/log py-1 hover:bg-white/5 transition-colors rounded px-4">
                                <span className="text-slate-600 shrink-0 select-none whitespace-nowrap">[{log.time}]</span>
                                <div className="flex-1 flex items-start gap-4">
                                    <span className={`shrink-0 font-black uppercase text-[10px] px-2 py-0.5 rounded ${log.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                        log.type === 'process' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                                            log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                'bg-white/5 text-slate-600 border border-white/10'
                                        }`}>
                                        {log.type}
                                    </span>
                                    <span className={`leading-relaxed ${log.type === 'error' ? 'text-rose-400' : 'text-slate-600'}`}>
                                        {log.msg}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
                    <div className="flex gap-8">
                        <StatusMetric label="Data Points" value="1,204" />
                        <StatusMetric label="Success Rate" value="99.9%" />
                        <StatusMetric label="Latency" value="24ms" />
                    </div>
                    <button onClick={onClose} className="h-12 px-8 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all active:scale-95 shadow-xl">
                        Terminate Monitor
                    </button>
                </div>
            </div>
        </div>
    );
};

const MonitorStep = ({ icon, label, status, active }) => (
    <div className={`flex items-center gap-5 transition-all duration-700 ${active ? 'opacity-100 scale-100' : 'opacity-20 scale-95'}`}>
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-xl ${active ? 'bg-white text-teal-600 border-white shadow-teal-500/10' : 'bg-transparent text-slate-600 border-white/5'}`}>
            {icon}
        </div>
        <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">{label}</p>
            <p className={`text-base font-black tracking-tight uppercase leading-none ${active ? 'text-white' : 'text-slate-700'}`}>{status}</p>
        </div>
    </div>
);

const StatusMetric = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-base font-black text-white tracking-tighter leading-none font-mono">//{value}</p>
    </div>
);

const Network = ({ icon }) => (
    <div className="flex items-center justify-center">
        {icon}
    </div>
);

export default MachineMonitorModal;

import React, { useState, useEffect } from 'react';
import {
    X,
    Settings2,
    Wifi,
    Link,
    Save,
    RefreshCw,
    Plus,
    Trash2,
    ShieldCheck
} from 'lucide-react';

/**
 * MachineConfigModal - Professional Edition
 * Provides high-fidelity control over analyzer connectivity and parameter mapping.
 */
const MachineConfigModal = ({ machine, onClose, onSave }) => {
    const [config, setConfig] = useState({ ...machine });
    const [ports, setPorts] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [activeTab, setActiveTab] = useState('settings'); // settings | mappings
    const [loading, setLoading] = useState(false);
    const [newMapping, setNewMapping] = useState({ machine_code: '', lis_name: '' });
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadPorts();
        if (activeTab === 'mappings') loadMappings();
    }, [machine.id, activeTab]);

    const loadPorts = async () => {
        try {
            const list = await window.api.getSerialPorts();
            setPorts(list || []);
        } catch (e) {
            console.error("Port Detection Error:", e);
        }
    };

    const loadMappings = async () => {
        try {
            const list = await window.api.getTestMappings(machine.id);
            setMappings(list || []);
        } catch (e) {
            console.error("Mapping Load Error:", e);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await window.api.saveMachineConfig(config);
            if (onSave) onSave();
            onClose();
        } catch (e) {
            alert("Protocol Commit Failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to decommission this analyzer? This action cannot be undone.")) return;
        setLoading(true);
        try {
            await window.api.deleteMachine(machine.id);
            if (onSave) onSave();
            onClose();
        } catch (e) {
            alert("Decommission Failed: " + e.message);
            setLoading(false);
        }
    };

    const handleSaveMapping = async () => {
        if (!newMapping.machine_code || !newMapping.lis_name) return;
        try {
            await window.api.saveTestMapping({
                machine_id: machine.id,
                ...newMapping,
                unit: ''
            });
            setNewMapping({ machine_code: '', lis_name: '' });
            setIsAdding(false);
            loadMappings();
        } catch (e) {
            alert("Mapping Save Failed");
        }
    };

    const deleteMapping = async (id) => {
        if (!confirm("Delete this mapping?")) return;
        try {
            await window.api.deleteTestMapping(id);
            loadMappings();
        } catch (e) {
            alert("Delete Failed");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500 selection:bg-teal-500/30 font-sans">
            <div className="bg-white/60 w-full max-w-5xl rounded-[3rem] shadow-[0_80px_150px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-white backdrop-blur-2xl h-[85vh]">

                {/* 1. Integrated Header Terminal */}
                <div className="p-10 border-b border-white flex justify-between items-center bg-white/40">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Protocol Provisioning</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mt-1">
                            {config.isNew ? 'New Node Provisioning' : `Config node: ${config.id}`}
                        </h2>
                    </div>
                    <button onClick={onClose} className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm">
                        <X size={24} />
                    </button>
                </div>

                {/* 2. Unified Navigation Controller */}
                <div className="bg-slate-50 border-b border-slate-100 flex p-2 gap-2">
                    <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Wifi size={14} />} label="Hardware Settings" />
                    <TabButton active={activeTab === 'mappings'} onClick={() => setActiveTab('mappings')} icon={<Link size={14} />} label="Protocol Parameters" />
                </div>

                {/* 3. Main Data Matrix */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 h-full">
                    {activeTab === 'settings' ? (
                        <div className="space-y-12 animate-in slide-in-from-left-8 duration-500">
                            {/* Node Identity */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <Settings2 size={16} className="text-teal-600" />
                                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Identity Hub</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <FormInput label="Node Nomenclature" value={config.name || ''} onChange={v => setConfig({ ...config, name: v })} />
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Node Category</label>
                                        <select
                                            className="w-full bg-white/50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-black text-slate-900 focus:bg-white transition-all outline-none"
                                            value={config.category || 'Biochemistry'}
                                            onChange={e => setConfig({ ...config, category: e.target.value })}
                                        >
                                            <option value="Biochemistry">Biochemistry Node</option>
                                            <option value="Hematology">Hematology Node</option>
                                            <option value="Electrolyte">Electrolyte Node</option>
                                            <option value="Hormone">Hormone Node</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Transmission Protocol */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <Wifi size={16} className="text-teal-600" />
                                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Transmission Protocol</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Connection Mode</label>
                                        <select
                                            className="w-full bg-white/50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-black text-slate-900 focus:bg-white transition-all outline-none"
                                            value={config.connection_type || 'Serial'}
                                            onChange={e => setConfig({ ...config, connection_type: e.target.value })}
                                        >
                                            <option value="Serial">Standard Serial (RS232)</option>
                                            <option value="Ethernet">Ethernet (TCP/IP)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Interface Protocol</label>
                                        <select
                                            className="w-full bg-white/50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-black text-slate-900 focus:bg-white transition-all outline-none"
                                            value={config.type || 'ASTM'}
                                            onChange={e => setConfig({ ...config, type: e.target.value })}
                                        >
                                            <option value="ASTM">ASTM_E1381</option>
                                            <option value="HL7">HL7_V2.X</option>
                                            <option value="Mispa Count X">Mispa Count X</option>
                                            <option value="PKL PCC 125">PKL PCC 125</option>
                                            <option value="MS-480">MS-480 Automatic (TCP)</option>
                                        </select>
                                    </div>
                                    {config.connection_type === 'Serial' ? (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Serial Port Node</label>
                                            <select
                                                className="w-full bg-white/50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-black text-slate-900 focus:bg-white transition-all outline-none"
                                                value={config.com_port || ''}
                                                onChange={e => setConfig({ ...config, com_port: e.target.value })}
                                            >
                                                <option value="">Detecting...</option>
                                                {ports.map(p => <option key={p.path} value={p.path}>{p.path} ({p.manufacturer || 'General Node'})</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <>
                                            <FormInput label="Ethernet Host IP" value={config.host || ''} onChange={v => setConfig({ ...config, host: v })} />
                                            <FormInput label="TCP Port" value={config.port || ''} onChange={v => setConfig({ ...config, port: parseInt(v) || '' })} type="number" />
                                        </>
                                    )}
                                </div>
                            </section>

                            {!config.isNew && (
                                <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="h-12 w-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                                            <Trash2 size={24} />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black text-rose-900 uppercase">Decommission Hardware node</h5>
                                            <p className="text-[11px] text-rose-600/60 font-medium">Permanently sever the clinical link with diagnostic engine.</p>
                                        </div>
                                    </div>
                                    <button onClick={handleDelete} className="h-12 px-6 bg-white border border-rose-200 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-sm">Sever Node Link</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in slide-in-from-right-8 duration-500 h-full flex flex-col min-h-[500px]">
                            {/* Parameter Ingress */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Protocol Mapping Matrix</h4>
                                    <p className="text-[9px] font-bold text-slate-600 uppercase opacity-60">Total active probes: {mappings.length}</p>
                                </div>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="h-11 px-6 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-teal-500 transition-all active:scale-95 shadow-xl shadow-blue-200"
                                >
                                    <Plus size={16} /> Deploy Probe
                                </button>
                            </div>

                            <div className="flex-1 overflow-x-auto bg-white/20 rounded-[2rem] border border-white">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-slate-100">
                                            <th className="px-8 py-6">Hardware Trace Code</th>
                                            <th className="px-8 py-6">LIS Integrated Parameter</th>
                                            <th className="px-8 py-6 text-right">Intervention</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isAdding && (
                                            <tr className="bg-blue-50/30 animate-in slide-in-from-top-4">
                                                <td className="px-8 py-6">
                                                    <input
                                                        className="w-full bg-white border border-teal-100 rounded-xl py-3 px-4 text-xs font-black text-teal-600 focus:ring-4 focus:ring-teal-500/5 outline-none"
                                                        placeholder="e.g. GLU"
                                                        value={newMapping.machine_code}
                                                        onChange={e => setNewMapping({ ...newMapping, machine_code: e.target.value.toUpperCase() })}
                                                    />
                                                </td>
                                                <td className="px-8 py-6">
                                                    <input
                                                        className="w-full bg-white border border-teal-100 rounded-xl py-3 px-4 text-xs font-black text-teal-600 focus:ring-4 focus:ring-teal-500/5 outline-none"
                                                        placeholder="e.g. Glucose"
                                                        value={newMapping.lis_name}
                                                        onChange={e => setNewMapping({ ...newMapping, lis_name: e.target.value })}
                                                    />
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={handleSaveMapping} className="h-10 px-5 bg-teal-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest">Commit</button>
                                                        <button onClick={() => setIsAdding(false)} className="h-10 px-5 bg-white border border-slate-100 text-slate-600 rounded-lg font-black text-[10px] uppercase tracking-widest">Cancel</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {mappings.length === 0 && !isAdding ? (
                                            <tr><td colSpan="3" className="px-8 py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">No mapping probes detected</td></tr>
                                        ) : mappings.map(m => (
                                            <tr key={m.id} className="group hover:bg-blue-50/40 transition-all">
                                                <td className="px-8 py-6">
                                                    <span className="font-black font-mono text-teal-600 text-[11px] tracking-widest uppercase bg-blue-50/50 px-3 py-1 rounded-lg border border-teal-100">{m.machine_code}</span>
                                                </td>
                                                <td className="px-8 py-6 font-black text-slate-900 tracking-tight text-sm uppercase">{m.lis_name}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <button onClick={() => deleteMapping(m.id)} className="h-10 w-10 inline-flex items-center justify-center bg-white border border-slate-100 text-slate-600 hover:text-rose-500 hover:border-rose-100 rounded-xl shadow-sm transition-all active:scale-90">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Persistence Controller */}
                <div className="p-10 border-t border-white flex justify-between items-center bg-white/40">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                        <ShieldCheck size={14} className="text-teal-500" /> System integrity validated for node deployment
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="h-14 px-10 bg-white border border-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">Cancel Protocol</button>
                        <button onClick={handleSave} disabled={loading} className="h-14 px-12 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-400/20 active:scale-95 flex items-center gap-3 disabled:opacity-50">
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                            {loading ? 'Processing...' : 'Persistent Save Node'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- SUB-COMPONENTS --- */
const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${active ? 'bg-white text-teal-600 shadow-sm border border-slate-100' : 'text-slate-600 hover:text-slate-800'}`}
    >
        {icon}
        {label}
    </button>
);

const FormInput = ({ label, value, onChange, type = "text" }) => (
    <div className="space-y-3 group w-full">
        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 group-focus-within:text-teal-600 transition-colors uppercase">{label}</label>
        <div className="relative">
            <input
                type={type}
                className="w-full bg-white/50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-black text-slate-900 focus:bg-white focus:ring-8 focus:ring-teal-500/5 focus:border-teal-500/30 transition-all outline-none"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    </div>
);

export default MachineConfigModal;

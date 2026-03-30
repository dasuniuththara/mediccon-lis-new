import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Plus,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    AlertCircle,
    Package,
    History,
    Search,
    ChevronRight,
    ArrowDownRight,
    ArrowUpRight,
    Trash2,
    Zap,
    Scale,
    Layers,
    Activity,
    ShieldCheck,
    Box,
    Barcode,
    QrCode,
    Filter,
    MoreVertical,
    CheckCircle2,
    Clock,
    User,
    ArrowRight,
    Link,
    GripVertical,
    Truck,
    Info as InfoIcon
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';

/* --- ENHANCED UI ATOMS --- */

const TelemetryCard = ({ icon, label, value, sub, color, isAlert }) => {
    const themes = {
        teal: 'text-teal-500 bg-teal-500/5 border-teal-500/10',
        rose: 'text-rose-500 bg-rose-500/5 border-rose-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
        cyan: 'text-cyan-500 bg-cyan-500/5 border-cyan-500/10'
    };

    return (
        <div className={`p-8 rounded-[2.5rem] border backdrop-blur-xl transition-all duration-700 group relative overflow-hidden ${isAlert ? 'bg-rose-50/50 border-rose-200 shadow-[0_20px_50px_rgba(244,63,94,0.1)]' : 'bg-white/40 border-white shadow-sm hover:shadow-2xl hover:-translate-y-1'}`}>
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-transparent to-slate-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex items-center gap-6 relative z-10">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 duration-700 ${themes[color] || themes.teal}`}>
                    {React.cloneElement(icon, { size: 28 })}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black tracking-tighter tabular-nums ${isAlert ? 'text-rose-600' : 'text-slate-900'}`}>{value}</span>
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.2em]">{sub}</span>
                    </div>
                </div>
            </div>
            {isAlert && <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,1)]"></div>}
        </div>
    );
};

const AssetCard = ({ item, onAdjust, onDelete }) => {
    const isLow = item.quantity <= item.min_threshold;
    return (
        <div className={`bg-white/60 rounded-[3rem] p-10 border border-white shadow-sm transition-all duration-700 group hover:shadow-[0_40px_100px_rgba(20,184,166,0.08)] hover:-translate-y-1 relative overflow-hidden ${isLow ? 'bg-rose-50/30' : ''}`}>
            {/* Artistic Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:20px_20px]"></div>

            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
                <Box size={140} />
            </div>

            <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-teal-600 uppercase tracking-[0.25em] px-3 py-1.5 bg-teal-50/50 rounded-lg border border-teal-100/50 backdrop-blur-sm">
                            {item.category}
                        </span>
                        {item.barcode && (
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 bg-slate-50/50 px-2 py-1 rounded-md">
                                <Barcode size={12} className="text-teal-400" /> {item.barcode}
                            </span>
                        )}
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none group-hover:text-teal-600 transition-colors uppercase">{item.name}</h4>
                </div>
                <div className="flex gap-2 relative z-20">
                    <button onClick={() => onAdjust('IN')} title="Provision Stock" className="h-12 w-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center border border-slate-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm active:scale-95 group/btn"><TrendingUp size={20} className="group-hover/btn:scale-110 transition-transform" /></button>
                    <button onClick={() => onAdjust('OUT')} title="Deplete Stock" className="h-12 w-12 bg-white text-rose-600 rounded-2xl flex items-center justify-center border border-slate-100 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm active:scale-95 group/btn"><TrendingDown size={20} className="group-hover/btn:scale-110 transition-transform" /></button>
                </div>
            </div>

            <div className="flex items-end justify-between relative z-10">
                <div className="space-y-3">
                    <div className="flex items-baseline gap-3">
                        <span className={`text-6xl font-black tracking-tighter tabular-nums leading-none ${isLow ? 'text-rose-600' : 'text-slate-950'}`}>{item.quantity}</span>
                        <span className="text-sm font-black text-slate-600 uppercase tracking-[0.2em] leading-none mb-1">{item.unit}</span>
                    </div>
                    {isLow ? (
                        <div className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 w-fit animate-pulse">
                            <AlertCircle size={14} /> Critical Depletion
                        </div>
                    ) : (
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 w-fit">
                            <CheckCircle2 size={12} /> Resource Stable
                        </div>
                    )}
                </div>
                <button onClick={onDelete} className="h-12 w-12 bg-white/50 border border-slate-100 text-slate-600 hover:text-red-500 hover:border-red-100 hover:bg-white rounded-2xl flex items-center justify-center transition-all active:scale-90 group/del relative z-20">
                    <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                </button>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-200/50 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-teal-400"></div>
                        <span>Sync Floor: {item.min_threshold} {item.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${isLow ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`}></div>
                        <span>Protocol {isLow ? 'Compromised' : 'Secured'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PredictionModal = ({ isOpen, onClose, insights, isAnalyzing, onAutoProcure }) => {
    if (!isOpen) return null;

    const riskColors = {
        CRITICAL: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        WARNING: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        STABLE: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        REPLENISH: 'text-teal-500 bg-teal-500/10 border-teal-500/20'
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-end p-10 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-[600px] h-full bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-right-20 duration-700 border border-white">
                <div className="p-10 bg-slate-950 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12">
                        <Zap size={150} />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="bg-teal-500 h-2 w-2 rounded-full animate-ping"></span>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-teal-400">Inventory Intelligence</h2>
                            </div>
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic">Predictive Out-of-Stock</h3>
                        </div>
                        <button onClick={onClose} className="h-12 w-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/10">
                            <Plus size={24} className="rotate-45" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                    {isAnalyzing ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6 py-40">
                            <RefreshCw size={50} className="text-teal-500 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Calculating Burn Rates...</p>
                        </div>
                    ) : insights.length > 0 ? (
                        insights.map((item, idx) => (
                            <div key={idx} className="p-8 bg-slate-50 border border-slate-200/50 rounded-[2.5rem] space-y-6 group hover:border-teal-200 transition-all duration-500">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.unit} Supply Node</p>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase group-hover:text-teal-600 transition-colors">{item.name}</h4>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${riskColors[item.riskLevel] || riskColors.STABLE}`}>
                                        {item.riskLevel}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Stock Left</p>
                                        <p className="text-xl font-black text-slate-900 tabular-nums">{item.currentQty} <span className="text-[10px] text-slate-400 uppercase">{item.unit}</span></p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Burn Velocity</p>
                                        <p className="text-xl font-black text-teal-600 tabular-nums">~{item.dailyAvg.toFixed(1)} <span className="text-[10px] text-slate-400 uppercase">/ Day</span></p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-950 rounded-2xl text-white flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Clock size={20} className="text-teal-400" />
                                        <div>
                                            <p className="text-[14px] font-black tracking-tight">{item.daysRemaining} {item.daysRemaining === 1 ? 'Day' : 'Days'} Remaining</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Est. Depletion Node</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest animate-pulse">{item.recommendation}</span>
                                        {item.riskLevel === 'CRITICAL' && !item.hasPending && (
                                            <button
                                                onClick={() => onAutoProcure(item.id)}
                                                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                                            >
                                                <Zap size={10} /> Auto-Replenish
                                            </button>
                                        )}
                                        {item.hasPending && (
                                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                                <History size={10} /> Order Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-40 text-center opacity-30">
                            <Activity size={80} className="mx-auto mb-6" />
                            <p className="font-black text-[10px] uppercase tracking-[0.5em]">No Clinical Data for Forecasting</p>
                        </div>
                    )}
                </div>

                <div className="p-10 border-t border-slate-100 bg-slate-50">
                    <button onClick={onClose} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-teal-600 transition-all shadow-xl active:scale-95">
                        Dismiss Intelligence Layer
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModalInput = ({ label, placeholder, icon, value, onChange, type = "text", color = "text-slate-600" }) => (
    <div className="space-y-4 group">
        <label className={`text-[10px] font-black uppercase tracking-[0.3em] ml-2 group-focus-within:text-teal-600 transition-colors ${color}`}>{label}</label>
        <div className="relative">
            <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-500 transition-all group-focus-within:scale-110">
                {icon}
            </div>
            <input
                type={type}
                className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] py-6 pl-16 pr-8 text-sm font-bold text-slate-900 focus:bg-white focus:ring-8 focus:ring-teal-500/5 focus:border-teal-500/50 outline-none transition-all placeholder:text-slate-600"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    </div>
);

/* --- CLINICAL PROTOCOL MAPPING TERMINAL --- */

const MappingModal = ({ open, onClose, catalog, items, mappings, newMapping, setNewMapping, onSave, onDelete }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col h-[85vh] overflow-hidden">
                <div className="p-12 border-b border-slate-100 bg-white flex justify-between items-center relative transition-all">
                    <div>
                        <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-2 leading-none">Auto-Deduction Engine</h3>
                        <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none flex items-center gap-4">
                            Protocol Mapping Matrix
                            <div className="h-8 w-px bg-slate-200"></div>
                            <span className="text-teal-600 italic">Core</span>
                        </h4>
                    </div>
                    <button onClick={onClose} className="h-14 w-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-red-500 transition-all">
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
                    {/* Left: Configuration Form */}
                    <div className="w-full xl:w-[400px] p-10 border-r border-slate-100 bg-slate-50/30 space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">Select Clinical Test</label>
                            <select
                                className="w-full bg-white border border-slate-100 rounded-[1.5rem] py-5 px-6 text-sm font-black text-slate-900 focus:ring-8 focus:ring-teal-500/5 transition-all outline-none"
                                value={newMapping.testCode}
                                onChange={e => setNewMapping({ ...newMapping, testCode: e.target.value })}
                            >
                                <option value="">CHOOSE CLINICAL NODE...</option>
                                {catalog.map(t => <option key={t.code} value={t.code}>{t.name} ({t.code})</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">Associated Asset (Reagent)</label>
                            <select
                                className="w-full bg-white border border-slate-100 rounded-[1.5rem] py-5 px-6 text-sm font-black text-slate-900 focus:ring-8 focus:ring-teal-500/5 transition-all outline-none"
                                value={newMapping.itemId}
                                onChange={e => setNewMapping({ ...newMapping, itemId: parseInt(e.target.value) })}
                            >
                                <option value="">SELECT SUPPLY NODE...</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">Consumption Payload (Amount)</label>
                            <div className="relative">
                                <Scale size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
                                <input
                                    type="number"
                                    className="w-full bg-white border border-slate-100 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-black text-slate-950 outline-none focus:ring-8 focus:ring-teal-500/5"
                                    value={newMapping.usageAmount}
                                    onChange={e => setNewMapping({ ...newMapping, usageAmount: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={onSave}
                            className="w-full h-18 bg-slate-950 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-4 group"
                        >
                            <Zap size={18} className="group-hover:fill-current" /> Commit Protocol
                        </button>

                        <div className="p-6 bg-teal-50 rounded-3xl border border-teal-100">
                            <div className="flex gap-4">
                                <InfoIcon size={20} className="text-teal-500 shrink-0" />
                                <p className="text-[10px] font-bold text-teal-700 leading-relaxed uppercase tracking-tight">
                                    Linked assets will automatically decrement during machine-to-LIS transmission events.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Active Mappings List */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Active Intelligence Links</h5>
                            <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full">{mappings.length} Links Active</span>
                        </div>

                        {mappings.map((m, idx) => (
                            <div key={idx} className="group bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center gap-8 hover:bg-slate-50 hover:border-teal-100 transition-all shadow-sm">
                                <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                                    <GripVertical size={18} />
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 leading-none">Clinical Node</p>
                                        <p className="font-black text-slate-900 text-sm tracking-tight">{m.test_code}</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <ArrowRight className="text-teal-300" size={18} />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 leading-none">Asset Node</p>
                                            <p className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                                                {items.find(i => i.id === m.item_id)?.name || 'UNKNOWN_ASSET'}
                                                <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">-{m.usage_amount}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => onDelete(m.id)} className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:text-red-500 hover:border-red-100 hover:shadow-lg transition-all active:scale-95">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}

                        {mappings.length === 0 && (
                            <div className="py-20 text-center">
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 text-slate-600">
                                    <Link size={32} />
                                </div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No logic-links established</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Inventory = () => {
    const { user, setActivePage, navigateNext, navigateBack } = useGlobalStore();
    const [items, setItems] = useState([]);
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [adjustModal, setAdjustModal] = useState({ open: false, item: null, type: 'IN', amount: '' });
    const [scanTerm, setScanTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [newItem, setNewItem] = useState({ name: '', category: 'Biochemistry', unit: 'ml', quantity: 0, min_threshold: 10, barcode: '' });

    // Mapping Terminal State
    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
    const [catalog, setCatalog] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [newMapping, setNewMapping] = useState({ testCode: '', itemId: '', usageAmount: 1 });

    // AI Prediction State
    const [aiInsights, setAIInsights] = useState([]);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [userMachines, setUserMachines] = useState([]);

    useEffect(() => {
        loadData();
        loadAIInsights();
    }, []);

    const loadAIInsights = async () => {
        setIsAnalyzing(true);
        try {
            const res = await window.api.getInventoryAI();
            if (res) setAIInsights(res);
        } catch (e) {
            console.error("AI Insight Fault:", e);
        }
        setIsAnalyzing(false);
    };

    const handleQuickProcure = async (itemId) => {
        const item = items.find(i => i.id === itemId);
        const insight = aiInsights.find(i => i.id === itemId);
        if (!item || !insight) return;

        try {
            const suggestedQty = Math.max(Math.ceil(insight.dailyAvg * 30), 5);
            await window.api.createProcurementOrder({
                itemId,
                quantity: suggestedQty,
                unit: item.unit,
                priority: 'CRITICAL',
                generatedBy: 'AI_MANUAL_INTERVENTION'
            });
            alert(`Procurement protocol initialized for ${item.name}.`);
            loadAIInsights();
        } catch (e) {
            alert("Procurement Link Failed.");
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await window.api.getInventoryItems();
            const logData = await window.api.getInventoryLogs();
            const machines = await window.api.getMachines(user);
            setItems(res || []);
            setLogs(logData || []);
            setUserMachines(machines || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleAddItem = async () => {
        if (!newItem.name) return alert("Asset nomenclature required.");
        try {
            await window.api.addInventoryItem(newItem);
            setIsAddModalOpen(false);
            setNewItem({ name: '', category: 'Biochemistry', unit: 'ml', quantity: 0, min_threshold: 10, barcode: '' });
            loadData();
        } catch (e) { alert("Integration fault: Double identifier detected?"); }
    };

    const handleUpdateStock = async () => {
        const amt = parseFloat(adjustModal.amount);
        if (isNaN(amt) || amt <= 0) return alert("Quantitative payload invalid.");

        try {
            await window.api.updateInventoryStock({
                id: adjustModal.item.id,
                quantity: amt,
                type: adjustModal.type,
                reason: `${adjustModal.type === 'IN' ? 'Provisioning' : 'Depletion'} intervention`,
                processedBy: user.username
            });
            setAdjustModal({ open: false, item: null, type: 'IN', amount: '' });
            loadData();
            loadAIInsights();
        } catch (e) { alert("Stock synchronization failure."); }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm("Disconnect item from matrix permanently?")) return;
        try {
            await window.api.deleteInventoryItem(id);
            loadData();
            loadAIInsights();
        } catch (e) { alert("Deletion lock active."); }
    };

    const handleQuickScan = async (e) => {
        if (e.key === 'Enter' && scanTerm) {
            const res = await window.api.searchGlobal(scanTerm);
            if (res.inventory && res.inventory.length > 0) {
                const item = res.inventory[0];
                setAdjustModal({ open: true, item, type: 'IN', amount: '1' });
            } else {
                alert("Probe returned zero matches.");
            }
            setScanTerm('');
        }
    };

    // Mapping Logic
    const openMappingTerminal = async () => {
        try {
            const tests = await window.api.getTestCatalog();
            const currentMappings = await window.api.getTestReagents();
            setCatalog(tests || []);
            setMappings(currentMappings || []);
            setIsMappingModalOpen(true);
        } catch (e) {
            alert("Mapping terminal initialization fault.");
        }
    };

    const handleSaveMapping = async () => {
        if (!newMapping.testCode || !newMapping.itemId) return alert("Mapping identifiers required.");
        try {
            await window.api.addTestReagent(newMapping);
            const currentMappings = await window.api.getTestReagents();
            setMappings(currentMappings || []);
            setNewMapping({ testCode: '', itemId: '', usageAmount: 1 });
            loadAIInsights();
        } catch (e) {
            alert("Duplicate protocol link detected.");
        }
    };

    const handleDeleteMapping = async (id) => {
        try {
            await window.api.deleteTestReagent(id);
            const mappingData = await window.api.getTestReagents();
            setMappings(mappingData || []);
            loadAIInsights();
        } catch (e) {
            alert("De-linking protocol interrupted.");
        }
    };

    const filteredItems = items.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.barcode?.includes(search);
        const matchesTab = activeTab === 'ALL' || i.category === activeTab || (activeTab === 'LOW' && i.quantity <= i.min_threshold);

        // Role-based Machine Category Filter
        let matchesMachine = true;
        if (user?.role !== 'developer' && userMachines.length > 0) {
            const myCategories = userMachines.map(m => m.category);
            matchesMachine = myCategories.includes(i.category) || i.category === 'Consumable';
        }

        return matchesSearch && matchesTab && matchesMachine;
    });

    const categories = ['ALL', 'Biochemistry', 'Hematology', 'Electrolyte', 'Consumable', 'LOW'];
    const lowStockItems = items.filter(i => i.quantity <= i.min_threshold);

    return (
        <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-40 selection:bg-teal-100">

            {/* 1. Page Header with Actions */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 bg-white/40 p-10 rounded-[2.5rem] border border-white shadow-sm backdrop-blur-xl group">
                <div className="flex items-center gap-8 relative z-10 w-full">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={navigateBack}
                            className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                        >
                            <ArrowRight size={20} className="rotate-180" />
                        </button>
                        <button
                            onClick={navigateNext}
                            className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 flex-1">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse"></div>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Integrated Logistics Command</span>
                            </div>
                            <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none flex items-center gap-4">
                                Asset Matrix
                                <div className="h-12 w-px bg-slate-200/50"></div>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 uppercase">
                                    Telemetry
                                </span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative group/scan">
                                <Barcode className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-400 group-focus-within/scan:text-teal-600 transition-colors" size={20} />
                                <input
                                    className="bg-white/80 border border-slate-100 rounded-2xl py-5 pl-16 pr-8 text-[13px] font-black text-slate-900 focus:ring-12 focus:ring-teal-500/5 focus:bg-white focus:border-teal-500/30 outline-none w-80 transition-all shadow-sm backdrop-blur-md"
                                    placeholder="QUICK PROBE SCAN..."
                                    value={scanTerm}
                                    onChange={e => setScanTerm(e.target.value)}
                                    onKeyDown={handleQuickScan}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="h-14 px-8 bg-slate-900 text-teal-400 border border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl group/ai"
                    >
                        <Zap size={18} className="group-hover:animate-pulse" />
                        Predictive Analysis
                    </button>
                    <button
                        onClick={() => setActivePage('procurement')}
                        className="h-14 px-8 bg-teal-950 text-teal-100 border border-teal-700/50 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-800 transition-all flex items-center gap-3 shadow-xl group/truck"
                    >
                        <Truck size={18} />
                        Procurement Matrix
                    </button>
                    <button
                        onClick={openMappingTerminal}
                        className="h-14 px-8 bg-white border border-slate-100 text-teal-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:border-teal-600 transition-all flex items-center gap-3 shadow-sm group/map"
                    >
                        <Link size={18} className="group-hover/map:rotate-12 transition-transform" />
                        Protocol Mapping
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-14 px-8 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-500 transition-all flex items-center gap-3 shadow-xl shadow-teal-500/20 group/add"
                    >
                        <Plus size={20} className="group-hover/add:rotate-90 transition-transform duration-500" />
                        Integrate Node
                    </button>
                    <button
                        onClick={loadData}
                        className="h-14 w-14 flex items-center justify-center bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl group/refresh"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                    </button>
                </div>
            </div>

            {/* 2. Intelligence Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <TelemetryCard icon={<Box size={24} />} label="Active Registry" value={filteredItems.length} sub="Synchronized Nodes" color="teal" />
                <TelemetryCard
                    icon={<AlertCircle size={24} />}
                    label="Depletion Alerts"
                    value={filteredItems.filter(i => i.quantity <= i.min_threshold).length}
                    sub="Critical Thresholds"
                    color={filteredItems.filter(i => i.quantity <= i.min_threshold).length > 0 ? "rose" : "emerald"}
                    isAlert={filteredItems.filter(i => i.quantity <= i.min_threshold).length > 0}
                />
                <TelemetryCard icon={<Activity size={24} />} label="Supply Velocity" value="Nominal" sub="Throughput Node" color="teal" />
                <TelemetryCard icon={<ShieldCheck size={24} />} label="Integrity Status" value="Locked" sub="Protocol Audit" color="teal" />
            </div>

            {/* 3. Operational Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-8 space-y-8">
                    {/* Navigation Tabs */}
                    <div className="flex items-center justify-between bg-white/40 p-4 rounded-[2rem] border border-white shadow-sm backdrop-blur-md">
                        <div className="flex gap-2">
                            {categories.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-white'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="relative group/search flex-1 max-w-xs ml-8">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                            <input
                                className="w-full bg-white/60 border border-slate-100 rounded-xl py-3 pl-14 pr-6 text-[11px] font-bold text-slate-900 focus:bg-white focus:ring-8 focus:ring-teal-500/5 transition-all outline-none"
                                placeholder="PROBE LOGS..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Asset Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {filteredItems.map(item => (
                            <AssetCard
                                key={item.id}
                                item={item}
                                onAdjust={(type) => setAdjustModal({ open: true, item, type, amount: '1' })}
                                onDelete={() => handleDeleteItem(item.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Audit Stream */}
                <div className="xl:col-span-4 h-full sticky top-10">
                    <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-2xl flex flex-col min-h-[700px] relative overflow-hidden group border border-slate-800">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
                            <History size={240} />
                        </div>

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <History size={24} className="text-teal-500" />
                                <h3 className="text-xl font-black uppercase tracking-[0.2em]">Audit Stream</h3>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar-dark pr-3">
                            {logs.map(log => (
                                <div key={log.id} className="bg-white/5 border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.08] transition-all group/log">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${log.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                {log.type === 'IN' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white group-hover/log:text-teal-400 transition-colors uppercase mb-1">{log.reason}</p>
                                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{log.item_name || 'System Asset'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-black tabular-nums ${log.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {log.type === 'IN' ? '+' : '-'}{log.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{log.processed_by}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {adjustModal.open && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
                        <div className="p-12 border-b border-slate-50 bg-slate-50 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><Activity size={200} /></div>
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-2 leading-none">Stock Intervention</h3>
                                <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{adjustModal.item.name}</h4>
                            </div>
                            <button onClick={() => setAdjustModal({ open: false, item: null })} className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-red-500 transition-all shadow-sm active:scale-95">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-12 space-y-10">
                            <div className="flex bg-slate-100/50 p-1.5 rounded-3xl border border-slate-200/50 w-full backdrop-blur-md">
                                {['IN', 'OUT'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setAdjustModal({ ...adjustModal, type: t })}
                                        className={`flex-1 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${adjustModal.type === t
                                            ? (t === 'IN' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30' : 'bg-rose-600 text-white shadow-xl shadow-rose-500/30')
                                            : 'text-slate-600 hover:text-slate-900 border border-transparent'
                                            }`}
                                    >
                                        {t === 'IN' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                        {t === 'IN' ? 'Increment' : 'Decrement'}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">Quantitative Payload ({adjustModal.item.unit})</label>
                                <div className="relative">
                                    <input
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-10 px-12 text-6xl font-black text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-12 focus:ring-teal-500/5 transition-all outline-none tabular-nums shadow-inner"
                                        type="number"
                                        autoFocus
                                        value={adjustModal.amount}
                                        onChange={e => setAdjustModal({ ...adjustModal, amount: e.target.value })}
                                    />
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-600 pointer-events-none uppercase">{adjustModal.item.unit}</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-12 pt-0">
                            <button
                                onClick={handleUpdateStock}
                                className={`w-full h-24 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-5 transition-all active:scale-95 shadow-2xl ${adjustModal.type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 text-white' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30 text-white'}`}
                            >
                                <Zap size={22} className="fill-current" /> Commit Sync Protocol
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20">
                        <div className="p-12 border-b border-slate-50 bg-slate-50 flex justify-between items-center relative">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-2 leading-none">Supply Node Authorization</h3>
                                <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase">Register Global Asset</h4>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-red-500 transition-all relative z-10 shadow-sm active:scale-95">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-12 space-y-8">
                            <ModalInput label="ASSET NOMENCLATURE" placeholder="EX. GLUCOSE REAGENT" icon={<Package size={20} />} value={newItem.name} onChange={v => setNewItem({ ...newItem, name: v })} />
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">CORE CLASSIFICATION</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] py-6 px-8 text-sm font-black text-slate-900 transition-all outline-none appearance-none cursor-pointer"
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                    >
                                        {categories.filter(c => c !== 'ALL' && c !== 'LOW').map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <ModalInput label="METRIC UNIT" placeholder="EX. ML" icon={<Scale size={20} />} value={newItem.unit} onChange={v => setNewItem({ ...newItem, unit: v })} />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <ModalInput label="INITIAL PAYLOAD" type="number" placeholder="0" icon={<Activity size={20} />} value={newItem.quantity} onChange={v => setNewItem({ ...newItem, quantity: parseFloat(v) })} />
                                <ModalInput label="CRITICAL THRESHOLD" type="number" placeholder="10" icon={<AlertCircle size={20} />} value={newItem.min_threshold} onChange={v => setNewItem({ ...newItem, min_threshold: parseFloat(v) })} color="text-rose-500" />
                            </div>
                            <ModalInput label="BARCODE" placeholder="SCAN CODE..." icon={<Barcode size={20} />} value={newItem.barcode} onChange={v => setNewItem({ ...newItem, barcode: v })} />
                        </div>

                        <div className="p-12 bg-slate-50 border-t border-slate-100 flex gap-6">
                            <button onClick={handleAddItem} className="w-full h-20 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-teal-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                                <Zap size={18} /> Authorize Integration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MappingModal
                open={isMappingModalOpen}
                onClose={() => setIsMappingModalOpen(false)}
                catalog={catalog}
                items={items}
                mappings={mappings}
                newMapping={newMapping}
                setNewMapping={setNewMapping}
                onSave={handleSaveMapping}
                onDelete={handleDeleteMapping}
            />

            <PredictionModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                insights={aiInsights}
                isAnalyzing={isAnalyzing}
                onAutoProcure={handleQuickProcure}
            />
        </div>
    );
};

export default Inventory;

import React, { useState, useEffect } from 'react';
import {
    Stethoscope,
    PlusCircle,
    Search,
    Trash2,
    Edit,
    RefreshCcw,
    UserPlus,
    Phone,
    Code,
    DollarSign,
    ChevronRight,
    Database,
    CheckCircle2,
    X,
    ArrowRight,
    Users
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';

const DoctorMatrix = () => {
    const { navigateNext, navigateBack, setActivePage } = useGlobalStore();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', contact: '', commission_rate: 0 });
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [doctorStats, setDoctorStats] = useState(null);
    const [viewingStats, setViewingStats] = useState(false);

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        setLoading(true);
        try {
            const data = await window.api.getReferringDoctors();
            setDoctors(data || []);
        } catch (e) {
            console.error("Doctor Hub Sync Failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDoctor) {
                await window.api.updateReferringDoctor(editingDoctor.id, formData);
            } else {
                await window.api.addReferringDoctor(formData);
            }
            setShowModal(false);
            setEditingDoctor(null);
            setFormData({ name: '', code: '', contact: '', commission_rate: 0 });
            loadDoctors();
        } catch (e) {
            alert("Doctor Registry Fault: " + e.message);
        }
    };

    const deleteDoctor = async (id) => {
        if (confirm("Purge Doctor Node from Registry? This action is irreversible.")) {
            try {
                await window.api.deleteReferringDoctor(id);
                loadDoctors();
            } catch (e) {
                alert("Node Purge Failure: " + e.message);
            }
        }
    };

    const openEdit = (doc) => {
        setEditingDoctor(doc);
        setFormData({
            name: doc.name,
            code: doc.code,
            contact: doc.contact,
            commission_rate: doc.commission_rate
        });
        setShowModal(true);
    };

    const viewStats = async (doc) => {
        setViewingStats(true);
        setSelectedDoctor(doc);
        try {
            const data = await window.api.getDoctorStats(doc.id);
            setDoctorStats(data);
        } catch (e) {
            console.error("Stats Retrieval Failure", e);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 font-sans">
            {/* 1. Header Architecture */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={navigateBack}
                            className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            <ArrowRight size={20} className="rotate-180" />
                        </button>
                        <button
                            onClick={navigateNext}
                            className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-200/50">
                                <Stethoscope size={24} />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Referring Doctors</h1>
                        </div>
                        <p className="text-slate-600 font-medium text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            MANAGING {doctors.length} ACTIVE CLINICAL SOURCES
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => { setEditingDoctor(null); setFormData({ name: '', code: '', contact: '', commission_rate: 0 }); setShowModal(true); }}
                    className="px-8 py-5 bg-slate-950 text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-200 transition-all hover:-translate-y-1 active:scale-95 group"
                >
                    <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                    Enroll New Doctor
                </button>
            </div>

            {/* 2. Registry Matrix */}
            <div className="bg-white/60 rounded-[3rem] border border-white shadow-sm backdrop-blur-xl overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-10 border-b border-slate-100 bg-white/40 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="SEARCH BY NAME, CODE OR CONTACT..."
                            className="bg-transparent border-none focus:ring-0 text-lg font-black text-slate-950 placeholder:text-slate-400 w-full uppercase tracking-tight outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] bg-white px-5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                            Filter: All Nodes
                        </span>
                        <button onClick={loadDoctors} className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-all shadow-sm">
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] border-b border-slate-100">
                                <th className="px-10 py-6">Status</th>
                                <th className="px-10 py-6">Doctor Name / Code</th>
                                <th className="px-10 py-6">Contact Node</th>
                                <th className="px-10 py-6 text-right">Yield (Commission %)</th>
                                <th className="px-10 py-6 text-right">Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white/10">
                            {doctors
                                .filter(d => !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.code.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((doc) => (
                                    <tr key={doc.id} className="group hover:bg-emerald-50/50 transition-all duration-500">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Node</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-base font-black text-slate-900 tracking-tight uppercase group-hover:text-emerald-600 transition-colors">{doc.name}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{doc.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Phone size={14} className="opacity-50" />
                                                <span className="text-sm font-bold tracking-tight">{doc.contact || 'UNAFFECTED'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg tabular-nums">
                                                {doc.commission_rate}%
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => viewStats(doc)}
                                                    className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
                                                    title="Financial Intelligence"
                                                >
                                                    <DollarSign size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openEdit(doc)}
                                                    className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteDoctor(doc.id)}
                                                    disabled={doc.code === 'SELF'}
                                                    className={`h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center transition-all shadow-sm ${doc.code === 'SELF' ? 'opacity-20 cursor-not-allowed' : 'text-slate-600 hover:text-red-500 hover:border-red-200'}`}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>

                    {doctors.length === 0 && !loading && (
                        <div className="py-40 flex flex-col items-center justify-center opacity-30 text-slate-600">
                            <Database size={80} className="mb-6" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Doctor Registry Empty</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Enrollment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[300] flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-3xl overflow-hidden border border-white flex flex-col">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">{editingDoctor ? 'Modify Node' : 'Initialize Node'}</span>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Doctor Credentials</h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2">Physician Name</label>
                                    <div className="relative group">
                                        <UserPlus size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            required
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.75rem] py-5 pl-16 pr-8 text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-500/20 transition-all outline-none uppercase tracking-tight"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2">Clinical Code</label>
                                    <div className="relative group">
                                        <Code size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            required
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.75rem] py-5 pl-16 pr-8 text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-500/20 transition-all outline-none uppercase tracking-tight"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2">Contact Frequency</label>
                                    <div className="relative group">
                                        <Phone size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.75rem] py-5 pl-16 pr-8 text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-500/20 transition-all outline-none uppercase tracking-tight"
                                            value={formData.contact}
                                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2">Yield Protocol (%)</label>
                                    <div className="relative group">
                                        <DollarSign size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.75rem] py-5 pl-16 pr-8 text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-500/20 transition-all outline-none uppercase tracking-tight"
                                            value={formData.commission_rate}
                                            onChange={e => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-50 text-slate-600 py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-slate-100 transition-all"
                                >
                                    Cancel Protocol
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-emerald-600 text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-emerald-500 shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-4 group"
                                >
                                    <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                                    Commit to Registry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* 4. Stats Intelligence Panel */}
            {viewingStats && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[400] flex items-center justify-end p-8 animate-in slide-in-from-right duration-700">
                    <div className="bg-white w-full max-w-2xl h-full rounded-[3.5rem] shadow-3xl overflow-hidden border border-white flex flex-col">
                        <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em]">Physician Financial Telemetry</span>
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{selectedDoctor?.name}</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedDoctor?.code} MODULE ACTIVE</p>
                            </div>
                            <button
                                onClick={() => { setViewingStats(false); setDoctorStats(null); }}
                                className="h-16 w-16 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-red-500 hover:shadow-xl transition-all active:scale-95"
                            >
                                <X size={32} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                            {/* Yield Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <StatCard
                                    label="Total Case Volume"
                                    value={doctorStats?.stats.total_visits || 0}
                                    icon={<Users size={20} />}
                                    theme="emerald"
                                />
                                <StatCard
                                    label="Earned Commission"
                                    value={`LKR ${(doctorStats?.stats.earned_commission || 0).toLocaleString()}`}
                                    icon={<DollarSign size={20} />}
                                    theme="cyan"
                                />
                                <div className="md:col-span-2">
                                    <StatCard
                                        label="Gross Revenue Contribution"
                                        value={`LKR ${(doctorStats?.stats.gross_revenue || 0).toLocaleString()}`}
                                        icon={<Database size={20} />}
                                        theme="slate"
                                    />
                                </div>
                            </div>

                            {/* Recent Visit Sequence */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Recent Referral Sequence</h4>
                                    <div className="h-px flex-1 bg-slate-100 mx-6"></div>
                                </div>
                                <div className="space-y-4">
                                    {doctorStats?.recentVisits.map((v, i) => (
                                        <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all duration-500">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(v.created_at).toLocaleDateString()}</p>
                                                <p className="font-black text-slate-900 uppercase">Case Node #{v.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-lg text-slate-900 tracking-tighter">LKR {v.total_amount.toLocaleString()}</p>
                                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${v.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {v.payment_status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {doctorStats?.recentVisits.length === 0 && (
                                        <div className="py-20 text-center opacity-20 italic font-black uppercase tracking-[0.3em] text-[10px]">No historical case data available</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, theme }) => {
    const themes = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
        slate: 'bg-slate-50 text-slate-900 border-slate-200'
    };
    return (
        <div className={`p-8 rounded-[2rem] border transition-all hover:shadow-2xl hover:-translate-y-1 ${themes[theme]}`}>
            <div className="flex items-center gap-4 mb-4 opacity-70">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
            </div>
            <div className="text-3xl font-black tracking-tighter tabular-nums">{value}</div>
        </div>
    );
};

export default DoctorMatrix;

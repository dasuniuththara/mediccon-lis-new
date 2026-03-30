import React, { useState, useEffect } from 'react';
import {
    Receipt,
    Search,
    RefreshCw,
    CreditCard,
    DollarSign,
    ArrowRight,
    TrendingUp,
    X,
    Printer,
    ChevronRight,
    Activity,
    ShieldCheck,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    Zap,
    Scale,
    Timer,
    Database,
    Lock,
    Stethoscope,
    ChevronLeft,
    Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useGlobalStore } from '../store/globalStore';

/**
 * Mediccon Global Financial Matrix
 * High-fidelity command terminal for laboratory invoicing, payments, and revenue telemetry.
 */
const PaymentModal = ({ invoice, labProfile, onClose, onComplete }) => {
    const { setActivePage, setSelectedPatient } = useGlobalStore();
    const [amount, setAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [patientNic, setPatientNic] = useState(invoice?.patient_nic || '');
    const [patientName, setPatientName] = useState(invoice?.name || '');
    const [discount, setDiscount] = useState(invoice?.discount || 0);
    const bal = (invoice?.total_amount || 0) - (invoice?.paid_amount || 0) - (discount || 0);

    useEffect(() => { setAmount(bal); }, [bal]);

    const handlePay = async (full) => {
        setLoading(true);
        try {
            if (patientNic !== invoice.patient_nic || patientName !== invoice.name) {
                await window.api.updatePatient(invoice.patient_nic, patientNic, patientName);
            }

            const pay = full ? bal : parseFloat(amount);
            const newPaid = (invoice.paid_amount || 0) + pay;
            const status = newPaid >= (invoice.total_amount - (discount || 0)) ? 'PAID' : 'PARTIAL';

            await window.api.updateInvoice(invoice.id, { paid: newPaid, status, discount: discount || 0 });

            onComplete();
            onClose();
        } catch (err) {
            console.error("Payment Error:", err);
            alert("Logic Synchronicity Error: Failed to commit transaction.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = async () => {
        try {
            printPaymentSlip({
                name: patientName,
                nic: patientNic,
                age: invoice?.age || 'N/A',
                gender: invoice?.gender || 'N/A',
                doctor_name: invoice?.doctor_name || 'Self Referred'
            }, {
                id: invoice?.id || 0,
                total_amount: invoice?.total_amount || 0,
                paid_amount: (invoice?.paid_amount || 0) + parseFloat(amount || 0),
                status: (invoice?.paid_amount || 0) + parseFloat(amount || 0) >= (invoice?.total_amount - discount) ? 'PAID' : 'PARTIAL',
                discount: discount || 0
            });
        } catch (err) {
            console.error("Print Protocol Error:", err);
            alert("Digital Receipt Failure: " + (err.message || "Hardware extraction refused."));
        }
    };

    const printPaymentSlip = (patientData, invoiceData) => {
        const printWin = window.open('', '_blank', 'width=800,height=900');
        const date = new Date().toLocaleString();

        printWin.document.write(`
            <html>
            <head>
                <title>Clinical Financial Settlement - ${patientData.name}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <style>
                    body { font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #020617; line-height: 1.5; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 4px solid #0f172a; padding-bottom: 25px; margin-bottom: 30px; }
                    .brand h1 { margin: 0; font-size: 32px; font-weight: 900; color: #000; letter-spacing: -0.02em; text-transform: uppercase; }
                    .brand p { margin: 4px 0 0; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.25em; }
                    .lab-meta { font-size: 11px; color: #64748b; margin-top: 20px; line-height: 1.6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                    .doc-type { text-align: right; }
                    .doc-type h2 { margin: 0; font-size: 26px; font-weight: 950; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; font-style: italic; }
                    .doc-type p { margin: 5px 0 0; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }

                    .barcode-container { text-align: right; margin-top: 15px; }
                    .barcode-container img { height: 40px; }

                    .patient-card { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; background: #f8fafc; padding: 25px 30px; border-radius: 12px; border: 2px solid #e2e8f0; }
                    .card-sec strong { display: block; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 0.15em; margin-bottom: 5px; }
                    .card-sec p { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
                    
                    .summary-container { display: flex; justify-content: flex-end; margin-top: 30px; }
                    .summary-box { width: 400px; background: #fff; border: 2px solid #0f172a; border-radius: 12px; overflow: hidden; }
                    .sum-line { display: flex; justify-content: space-between; padding: 12px 20px; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; }
                    .sum-line:nth-child(even) { background: #f8fafc; }
                    .sum-total { display: flex; justify-content: space-between; padding: 20px; background: #0f172a; font-size: 24px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; }
                    
                    .auth-section { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .stamp-box { transform: rotate(-5deg); border: 4px solid #10b981; color: #10b981; padding: 12px 30px; font-weight: 950; border-radius: 8px; font-size: 28px; letter-spacing: 0.1em; opacity: 0.8; text-transform: uppercase; background: rgba(16, 185, 129, 0.05); }
                    .stamp-box.pending { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05); }
                    .sig-box { text-align: right; width: 300px; }
                    .sig-line { border-bottom: 2px solid #0f172a; margin-bottom: 10px; }
                    .sig-text { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; }

                    .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 2px border-dashed #e2e8f0; padding-top: 30px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
                    @media print { body { padding: 0; } .patient-card { border: 1px solid #000; background: transparent; } .summary-box { border: 1px solid #000; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">
                        <h1>${labProfile.lab_name || 'MEDICCON'}</h1>
                        <p>${labProfile.lab_tagline || 'Clinical Diagnostics Interface'}</p>
                        <div class="lab-meta">
                            ${labProfile.lab_address || 'Mediccon Main Hub, 42 Clinical Way'}<br>
                            T: ${labProfile.lab_phone || '+94 112 000 000'} &nbsp;|&nbsp; E: ${labProfile.lab_email || 'results@mediccon.com'}
                        </div>
                    </div>
                    <div class="doc-type">
                        <h2>SETTLEMENT RECEIPT</h2>
                        <p>INV-${invoiceData.id.toString().padStart(6, '0')} // ${date}</p>
                        <div class="barcode-container">
                            <canvas id="receipt-barcode"></canvas>
                        </div>
                    </div>
                </div>

                <div class="patient-card">
                    <div class="card-sec">
                        <strong>Clinical Target Identity</strong>
                        <p>${patientData.name}</p>
                        <p style="font-size: 12px; font-weight: 800; color: #64748b; margin-top: 8px; letter-spacing: 0.05em;">
                            ID: ${patientData.nic} | AGE: ${patientData.age} | SEX: ${patientData.gender}
                        </p>
                        <p style="font-size: 11px; font-weight: 900; color: #020617; text-transform: uppercase; margin-top: 15px; letter-spacing: 0.15em;">
                            DIRECTED BY: DR. ${patientData.doctor_name}
                        </p>
                    </div>
                    <div class="card-sec" style="text-align: right;">
                        <strong>Settlement Vector</strong>
                        <p style="color: ${invoiceData.status === 'PAID' ? '#10b981' : '#ef4444'}; font-size: 22px; font-style: italic;">
                            ${invoiceData.status === 'PAID' ? 'FULLY SETTLED' : 'PARTIAL HOLD'}
                        </p>
                        <p style="font-size: 11px; font-weight: 800; color: #64748b; margin-top: 8px; letter-spacing: 0.1em;">
                            TXN-REF: TXN-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}
                        </p>
                    </div>
                </div>

                <div class="summary-container">
                    <div class="summary-box">
                        <div class="sum-line"><span>Gross Exposure</span><span>LKR ${invoiceData.total_amount.toFixed(2)}</span></div>
                        <div class="sum-line text-teal-600"><span>Authorized Discount</span><span>- LKR ${parseFloat(invoiceData.discount).toFixed(2)}</span></div>
                        <div class="sum-line" style="background:#f1f5f9; color:#0f172a; font-weight:900;"><span>Net Obligation</span><span>LKR ${(invoiceData.total_amount - parseFloat(invoiceData.discount)).toFixed(2)}</span></div>
                        <div class="sum-line"><span>Liquidity Injected</span><span>- LKR ${invoiceData.paid_amount.toFixed(2)}</span></div>
                        <div class="sum-total">
                            <span>Balance</span>
                            <span>LKR ${(invoiceData.total_amount - invoiceData.paid_amount - parseFloat(invoiceData.discount)).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div class="auth-section">
                    <div class="stamp-box ${invoiceData.status === 'PAID' ? '' : 'pending'}">
                        ${invoiceData.status === 'PAID' ? 'SETTLED IN FULL' : 'PAYMENT EXPECTED'}
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-text">Authorized Financial Protocol</div>
                    </div>
                </div>

                <div class="footer">
                    <p>Computer-generated financial ledger entry tracked by ${labProfile.lab_name || 'Mediccon LIS'}. No physical signature strictly required.</p>
                </div>

                <script>
                    window.onload = () => {
                        try {
                            JsBarcode("#receipt-barcode", "${patientData.nic}", {
                                format: "CODE128",
                                width: 1.5,
                                height: 40,
                                displayValue: true,
                                fontSize: 12,
                                margin: 0,
                                fontOptions: "bold"
                            });
                        } catch(e){}
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    };
                    window.onafterprint = () => {
                        window.close();
                    };
                    setTimeout(() => window.close(), 12000);
                </script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-12 animate-in fade-in duration-500">
            <div className="bg-white/95 w-full max-w-7xl h-[95vh] rounded-[3rem] shadow-[0_80px_200px_rgba(0,0,0,0.6)] border border-white/20 flex flex-col animate-in zoom-in-95 duration-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>

                {/* Header */}
                <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-8">
                        <div className="h-20 w-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-3xl shadow-slate-200 animate-in spin-in-12 duration-1000">
                            <Receipt size={36} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Financial Settlement Node</h2>
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Secured Clinical Transaction Interface</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-16 w-16 bg-slate-50 text-slate-600 rounded-[1.75rem] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 group">
                        <X size={28} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left: Patient and Details */}
                    <div className="w-full lg:w-[450px] border-b lg:border-b-0 lg:border-r border-slate-100 p-8 lg:p-12 space-y-8 bg-slate-50/30 overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Node Identity</label>
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-teal-600"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Name</span>
                                    </div>
                                    <input
                                        className="w-full bg-slate-50 border-none rounded-xl py-4 px-6 text-lg font-black text-slate-900 focus:bg-teal-50 transition-all outline-none uppercase"
                                        value={patientName}
                                        onChange={e => setPatientName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-teal-600"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Universal ID (NIC)</span>
                                    </div>
                                    <input
                                        className="w-full bg-slate-50 border-none rounded-xl py-4 px-6 text-lg font-black text-slate-900 focus:bg-teal-50 transition-all outline-none uppercase font-mono"
                                        value={patientNic}
                                        onChange={e => setPatientNic(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Clinical Context</label>
                            <div className="bg-slate-900 rounded-[2rem] p-8 space-y-6 text-white shadow-2xl shadow-slate-900/20">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-50">
                                    <span>Source Physician</span>
                                    <span>Origin Level</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-black uppercase tracking-tighter truncate max-w-[200px] italic">
                                        Dr. {invoice?.doctor_name || 'Self Referred'}
                                    </span>
                                    <span className="text-[10px] font-black bg-teal-600 px-3 py-1 rounded-full">{invoice?.doctor_code || 'SEL'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Financial Controls */}
                    <div className="flex-1 p-8 lg:p-12 space-y-8 lg:space-y-12 bg-white flex flex-col overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gross Bill</p>
                                <p className="text-3xl font-black text-slate-900 italic">LKR {invoice?.total_amount?.toLocaleString()}</p>
                            </div>
                            <div className="p-8 bg-teal-50 rounded-[2.5rem] border border-teal-100 flex flex-col justify-between group transition-all hover:bg-teal-100 cursor-pointer">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em]">Financial Discount</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-teal-400">LKR</span>
                                    <input
                                        type="number"
                                        className="bg-transparent border-none text-3xl font-black text-teal-600 outline-none w-full tabular-nums"
                                        value={discount}
                                        onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/5 flex flex-col justify-between shadow-2xl shadow-slate-200">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Net Balance Due</p>
                                <p className="text-3xl font-black text-white italic">LKR {bal.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center space-y-12 min-h-[250px]">
                            <div className="relative w-full max-w-2xl group">
                                <div className="absolute inset-0 bg-teal-600/5 blur-[60px] rounded-full scale-125 group-focus-within:bg-teal-600/10 transition-all"></div>
                                <label className="absolute -top-10 left-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Settlement Allocation</label>
                                <div className="relative">
                                    <span className="absolute left-8 lg:left-12 top-1/2 -translate-y-1/2 text-3xl lg:text-5xl font-black text-slate-300 italic">LKR</span>
                                    <input
                                        type="number"
                                        className="w-full bg-white border-2 border-slate-100 rounded-[4rem] py-12 lg:py-16 pl-32 lg:pl-48 pr-32 lg:pr-48 text-6xl lg:text-8xl font-black text-slate-950 outline-none shadow-2xl focus:border-teal-500 transition-all tabular-nums text-center italic"
                                        value={amount}
                                        onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                        autoFocus
                                    />
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                                        <button onClick={() => setAmount(bal)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl">Full Pay</button>
                                        <button onClick={() => setAmount(0)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Reset</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 pt-8 lg:pt-10 border-t border-slate-50 mt-auto">
                            <button
                                onClick={handlePrintReceipt}
                                className="h-20 lg:h-24 px-8 lg:px-12 bg-white border-2 border-slate-100 text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-slate-50 transition-all flex items-center justify-center gap-6 shadow-xl active:scale-95 shrink-0"
                            >
                                <Printer size={24} /> Dispatch Receipt
                            </button>
                            <button
                                onClick={() => handlePay(false)}
                                disabled={loading}
                                className="flex-1 h-24 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.6em] shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:bg-teal-600 transition-all flex items-center justify-center gap-8 group relative overflow-hidden active:scale-[0.98]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10 flex items-center gap-8">
                                    {loading ? <RefreshCw className="animate-spin" /> : <Zap size={24} className="group-hover:fill-current" />}
                                    Establish Authority
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function BillingMatrix() {
    const { labProfile, setActivePage, navigateNext, navigateBack, billingSearch, setBillingSearch } = useGlobalStore();
    const [invoices, setInvoices] = useState([]);
    const [search, setSearch] = useState(billingSearch || '');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, collected: 0 });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        loadInvoices();
        // Sync local search with global search if it exists
        if (billingSearch) {
            setSearch(billingSearch);
        }
        return () => setBillingSearch(''); // Reset global search on unmount to prevent legacy data bleed
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await window.api.getAllInvoices();
            setInvoices(data || []);

            const total = data.reduce((acc, inv) => acc + inv.total_amount, 0);
            const collected = data.reduce((acc, inv) => acc + (inv.paid_amount || 0), 0);
            const pending = total - collected;

            setStats({ total, pending, collected });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = invoices.filter(inv => {
        const matchesSearch = (inv.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (inv.patient_nic || '').includes(search);

        if (activeTab === 'historical') {
            return matchesSearch && inv.status === 'PAID';
        }
        return matchesSearch && (inv.status !== 'PAID');
    });

    return (
        <div className="p-10 space-y-12 animate-in fade-in duration-1000 pb-40 font-sans selection:bg-teal-100">

            {/* 1. Cinematic Header Architecture */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 bg-white/40 p-12 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-3xl group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-transparent to-transparent w-full animate-scan-sweep pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-50/20 to-transparent pointer-events-none"></div>
                <div className="flex items-center gap-8 relative z-10">
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
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse shadow-[0_0_12px_rgba(20,184,166,0.6)]"></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Global Revenue Telemetry</span>
                        </div>
                        <h1 className="text-7xl font-black text-slate-950 tracking-tighter leading-none flex items-center gap-5">
                            Financial Matrix
                            <span
                                className="text-transparent bg-clip-text ml-5"
                                style={{ backgroundImage: `linear-gradient(to r, ${labProfile.lab_accent_color || '#14b8a6'}, #06b6d4)` }}
                            >
                                AUDIT
                            </span>
                        </h1>
                    </div>
                </div>
                <div className="flex bg-slate-100/50 p-2 rounded-2xl border border-slate-200/40 w-fit backdrop-blur-md relative overflow-hidden">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white shadow-xl border border-white' : 'text-slate-600 hover:text-slate-900'}`}
                        style={activeTab === 'active' ? { color: labProfile.lab_accent_color || '#14b8a6' } : {}}
                    >
                        Active Registry
                    </button>
                    <button
                        onClick={() => setActiveTab('historical')}
                        className={`px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'historical' ? 'bg-white shadow-xl border border-white' : 'text-slate-600 hover:text-slate-900'}`}
                        style={activeTab === 'historical' ? { color: labProfile.lab_accent_color || '#14b8a6' } : {}}
                    >
                        Historical Arcing
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <div className="relative group/search">
                    <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/search:text-teal-600 transition-colors" />
                    <input
                        className="w-[450px] bg-white border border-slate-100 rounded-[2rem] py-5 pl-16 pr-8 text-[13px] font-black text-slate-950 focus:ring-[15px] focus:ring-teal-500/5 transition-all outline-none placeholder:text-slate-600 shadow-sm"
                        placeholder="PROBE FISCAL IDENTITY..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={loadInvoices}
                    className="h-16 w-16 bg-slate-950 text-white rounded-[1.75rem] flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl group/sync active:scale-95"
                >
                    <RefreshCw className={loading ? 'animate-spin' : 'group-hover/sync:rotate-180 transition-transform duration-700'} size={20} />
                </button>
            </div>

            {/* 2. Fiscal Telemetry Cluster */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <FiscalPod label="Gross Laboratory Revenue" value={stats.total} icon={<TrendingUp size={32} />} color="teal" description="Cumulative node receivables" />
                <FiscalPod label="Settled Liquidity" value={stats.collected} icon={<ShieldCheck size={32} />} color="emerald" description="Verified financial injection" />
                <FiscalPod label="Outstanding Exposure" value={stats.pending} icon={<Activity size={32} />} color="rose" description="Total pending settlement links" />
            </div>

            {/* 3. Global Invoice Registry */}
            <div className="bg-white/40 rounded-[4rem] border border-white shadow-sm backdrop-blur-3xl overflow-hidden p-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
                            <th className="px-12 py-10">Personnel Node</th>
                            <th className="px-8 py-10">Reference Link</th>
                            <th className="px-8 py-10">Financial Weight</th>
                            <th className="px-8 py-10 text-center">Protocol State</th>
                            <th className="px-12 py-10 text-right">Operational Vector</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                        {filtered.length > 0 ? filtered.map((inv, idx) => (
                            <tr key={inv.id} className="group hover:bg-white/80 transition-all duration-500" style={{ boxShadow: `0 0 8px ${labProfile.lab_accent_color}40` }}>
                                <td className="px-12 py-8">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-teal-500 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-slate-950 uppercase tracking-tight group-hover:text-teal-600 transition-colors leading-none mb-2">{inv.name}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">ID://{inv.patient_nic}</span>
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <Stethoscope size={10} />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">{inv.doctor_name || 'SELF'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocol Date</p>
                                        <p className="text-sm font-black text-slate-800 tabular-nums leading-none uppercase">{new Date(inv.created_at || inv.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Net Value</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-950 tabular-nums tracking-tighter">LKR {inv.total_amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="flex justify-center">
                                        <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${inv.status === 'PAID'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            <div className={`h-2 w-2 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                                            {inv.status}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-12 py-8 text-right flex items-center justify-end gap-4">
                                    <button
                                        onClick={async () => {
                                            if (confirm('Purge Financial Node and Associated Diagnostic Hub?')) {
                                                await window.api.deletePatient(inv.patient_nic);
                                                loadInvoices();
                                                toast.success('Financial Node Purged');
                                            }
                                        }}
                                        className="h-12 w-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedInvoice(inv)}
                                        className="inline-flex items-center gap-4 px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 hover:shadow-2xl transition-all active:scale-95 group/btn"
                                    >
                                        Establish Authority <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="py-40 text-center">
                                    <div className="h-24 w-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-600">
                                        <Scale size={48} />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Zero financial matrices discovered in registry</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL SUITE --- */}
            {
                selectedInvoice && (
                    <PaymentModal
                        invoice={selectedInvoice}
                        labProfile={labProfile}
                        onClose={() => setSelectedInvoice(null)}
                        onComplete={loadInvoices}
                    />
                )
            }
        </div >
    );
};

/* --- HIGH-FIDELITY ATOMS --- */

const FiscalPod = ({ label, value, icon, color, description }) => {
    const { labProfile } = useGlobalStore();
    const accentColor = labProfile.lab_accent_color || '#14b8a6';

    const themes = {
        teal: { text: accentColor, bg: `${accentColor}10`, border: `${accentColor}20`, glow: `${accentColor}30` },
        emerald: { text: '#10b981', bg: '#ecfdf5', border: '#d1fae5', glow: '#d1fae580' },
        rose: { text: '#f43f5e', bg: '#fff1f2', border: '#ffe4e6', glow: '#ffe4e680' }
    };

    const theme = themes[color];

    return (
        <div className="bg-white/60 rounded-[3.5rem] p-12 border border-white shadow-xl shadow-slate-100/50 transition-all duration-700 group hover:shadow-[0_80px_120px_rgba(0,0,0,0.1)] hover:-translate-y-4 relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000" style={{ color: theme.text }}>
                {React.cloneElement(icon, { size: 220 })}
            </div>

            {/* Visual Pulse */}
            <div className="absolute -top-20 -left-20 h-64 w-64 blur-[80px] rounded-full opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity" style={{ backgroundColor: theme.text }}></div>

            <div className="relative z-10 space-y-10">
                <div
                    className="h-24 w-24 rounded-[2rem] flex items-center justify-center border shadow-2xl transition-all duration-700 group-hover:rotate-6"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                >
                    {React.cloneElement(icon, { size: 40 })}
                </div>

                <div className="space-y-4">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic">{label}</p>
                    <div className="flex flex-col">
                        <span className="text-6xl font-black text-slate-950 tracking-tighter tabular-nums leading-none italic">
                            {value.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.text }}></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">LKR Global Liquidity</span>
                        </div>
                    </div>
                </div>

                {description && (
                    <div className="pt-10 border-t border-slate-100/80 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-80">{description}</span>
                        <ArrowUpRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingMatrix;

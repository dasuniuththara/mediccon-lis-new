import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Printer,
  FileText,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Edit2,
  User,
  History,
  FlaskConical,
  ListFilter,
  Save,
  ChevronRight,
  TrendingUp,
  Activity,
  Zap,
  Info as InfoIcon,
  ShieldCheck,
  Dna,
  Terminal,
  Cpu,
  Microscope,
  FileCheck,
  TrendingDown,
  Clock,
  ArrowRight,
  ZapOff,
  Layers,
  LineChart,
  AlertTriangle,
  Volume2,
  Check,
  X,
  Filter
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';
import { toast, Toaster } from 'react-hot-toast';
import JsBarcode from 'jsbarcode';

const BarcodeComponent = ({ value }) => {
  const barcodeRef = useRef(null);
  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        width: 1.2,
        height: 30,
        displayValue: false,
        margin: 0
      });
    }
  }, [value]);
  return <canvas ref={barcodeRef}></canvas>;
};

const LabResults = () => {
  const { user, labProfile, navigateNext, navigateBack } = useGlobalStore();
  const [activeTab, setActiveTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [nicSearch, setNicSearch] = useState("");
  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await window.api.getPendingResults();
      setQueue(data || []);
    } catch (e) {
      console.error("Queue Sync Fault:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!nicSearch) return;
    setIsLoading(true);
    try {
      const data = await window.api.getPatientResults({ nic: nicSearch });
      if (data && data.patient) {
        setPatient(data.patient);
        setResults(data.results || []);
        const visitData = await window.api.getVisits(nicSearch);
        setVisits(visitData || []);
        if (visitData.length > 0) setSelectedVisitId(visitData[0].id);
        setActiveTab('search');
      } else {
        toast.error("NODE NOT FOUND");
      }
    } catch (e) {
      toast.error("SEARCH FAULT");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      const res = await window.api.validateResult(id, user?.id);
      if (res.success) {
        toast.success("PROTOCOL AUTHORIZED");
        loadQueue();
        if (patient) handleSearch();
      }
    } catch (e) {
      toast.error("VALIDATION FAULT");
    }
  };

  return (
    <div className="p-8 space-y-12 animate-in fade-in duration-700 pb-32">
      <Toaster />

      {/* 1. Matrix Header */}
      <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-12 -translate-y-12 rotate-45 group-hover:scale-110 transition-all duration-1000">
          <FlaskConical size={400} />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_12px_#14b8a6]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-teal-400">Clinical Validation Node</span>
            </div>
            <h1 className="text-7xl font-black text-white leading-none tracking-tighter uppercase italic">
              Verification <span className="text-teal-500">Matrix</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
              Authorizing diagnostic protocols and releasing verified clinical telemetry to the regional stream.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-black/40 p-4 rounded-[2.5rem] border border-white/5 self-end xl:self-center">
            <TabButton active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} icon={<History size={18} />} label="Live Queue" badge={queue.length} />
            <TabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search size={18} />} label="Diagnostic Search" />
          </div>
        </div>
      </div>

      {activeTab === 'queue' ? (
        <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-8 px-4">
              <div className="h-16 w-16 bg-teal-500/10 text-teal-400 rounded-[2rem] flex items-center justify-center border border-teal-500/20 shadow-2xl">
                <Terminal size={32} />
              </div>
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Live Stream <span className="text-teal-400 opacity-40">/ {queue.length} PENDING</span></h3>
            </div>
            <button onClick={loadQueue} className="h-14 px-8 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-teal-500 transition-all flex items-center gap-4 active:scale-95">
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> SYNC QUEUE
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar-dark">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] border-b border-white/10 pb-8 italic">
                  <th className="px-8 py-8">Transmission ID</th>
                  <th className="px-8 py-8">Subject Identity</th>
                  <th className="px-8 py-8">Diagnostic Module</th>
                  <th className="px-8 py-8">Extraction Value</th>
                  <th className="px-8 py-8 text-right">Decision Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {queue.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-all group">
                    <td className="px-8 py-10">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-950 text-slate-600 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-teal-500 transition-all">
                          <Cpu size={20} />
                        </div>
                        <span className="font-mono text-[10px] font-black text-slate-500 tracking-widest">NODE-{item.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-10">
                      <div className="space-y-1">
                        <h4 className="text-xl font-black text-white uppercase italic tracking-tight">{item.patient_name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 font-mono tracking-widest">{item.patient_nic}</p>
                      </div>
                    </td>
                    <td className="px-8 py-10">
                      <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5 group-hover:border-teal-500/30 transition-all">
                        <Microscope size={16} className="text-teal-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.test_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-10">
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{item.test_value}</span>
                        <span className="text-[10px] font-black text-slate-600 uppercase italic">{item.unit || 'VAL'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-10 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleValidate(item.id)} className="h-12 px-8 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-teal-500 transition-all">Authorize Protocol</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {queue.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-40 text-center opacity-20">
                      <ZapOff size={60} className="mx-auto mb-6" />
                      <p className="text-[12px] font-black uppercase tracking-[0.4em]">Integrated Fleet Synchronized</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-12 animate-in slide-in-from-right-10 duration-700">
          {/* Search Ingress */}
          <div className="bg-slate-900 border border-white/5 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-transparent opacity-50"></div>
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="h-20 w-20 bg-slate-950 border border-white/10 text-white rounded-3xl flex items-center justify-center shadow-2xl">
                <Search size={32} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4 block ml-1">Integrated Archive Probe</label>
                <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-teal-400 transition-colors" size={28} />
                  <input
                    className="w-full bg-slate-950 border border-white/10 rounded-[2.5rem] py-8 pl-24 pr-8 text-2xl font-black text-white focus:ring-[15px] focus:ring-teal-500/5 focus:border-teal-500/30 transition-all outline-none placeholder:text-slate-800 uppercase tracking-widest font-mono"
                    placeholder="UNIVERSAL IDENTIFIER (NIC)..."
                    value={nicSearch}
                    onChange={e => setNicSearch(e.target.value)}
                  />
                </form>
              </div>
              <button onClick={handleSearch} className="h-24 px-12 bg-teal-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] hover:bg-teal-500 transition-all shadow-2xl active:scale-95">Probe Archive</button>
            </div>
          </div>

          {patient ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
              {/* Profile Module */}
              <div className="xl:col-span-4 space-y-12">
                <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] p-12 text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000"><User size={200} /></div>
                  <div className="relative z-10 space-y-10">
                    <div className="h-48 w-48 bg-teal-600/10 border-8 border-slate-950 rounded-[4rem] text-teal-400 flex items-center justify-center mx-auto shadow-3xl group-hover:scale-105 transition-all duration-700">
                      <User size={80} />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em]">Node Identity Verified</h4>
                      <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{patient.name}</h2>
                      <p className="text-xl font-black text-slate-500 font-mono tracking-widest">{patient.nic}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <button onClick={() => setShowReport(true)} className="h-20 bg-teal-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-teal-500 transition-all active:scale-95 flex items-center justify-center gap-4">
                        <FileCheck size={24} /> Release Report
                      </button>
                      <button onClick={handleSearch} className="h-20 bg-white/5 text-white border border-white/5 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all flex items-center justify-center gap-4">
                        <RefreshCw size={24} /> Sync Results
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-950 border border-white/5 rounded-[3rem] p-10 h-96 overflow-y-auto custom-scrollbar-dark">
                  <div className="flex items-center gap-4 mb-8">
                    <History size={20} className="text-teal-500" />
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Temporal History</h4>
                  </div>
                  <div className="space-y-4">
                    {visits.map(v => (
                      <button key={v.id} onClick={() => setSelectedVisitId(v.id)} className={`w-full p-6 rounded-2xl border transition-all text-left flex justify-between items-center ${selectedVisitId === v.id ? 'bg-teal-600 border-teal-500 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                        <div>
                          <p className={`text-[10px] font-black uppercase mb-1 ${selectedVisitId === v.id ? 'text-white' : 'text-slate-300'}`}>{new Date(v.created_at).toLocaleDateString()}</p>
                          <p className={`text-[8px] font-bold text-slate-500 uppercase tracking-widest`}>ID: {v.id.substring(0, 8)}</p>
                        </div>
                        <ChevronRight size={16} className={selectedVisitId === v.id ? 'text-white' : 'text-slate-600'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results Module */}
              <div className="xl:col-span-8 bg-slate-900 border border-white/5 rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                      <Dna size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Investigation Matrix</h3>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_10px_#14b8a6] animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Encrypted Secure Line</span>
                  </div>
                </div>
                <div className="flex-1 overflow-x-auto custom-scrollbar-dark">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] border-b border-white/5 italic">
                        <th className="px-10 py-8">Investigation Protocol</th>
                        <th className="px-10 py-8">Result Matrix</th>
                        <th className="px-10 py-8">Reference Cluster</th>
                        <th className="px-10 py-8 text-right">Decision Engine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {results.map((res, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                          <td className="px-10 py-10">
                            <h4 className="text-lg font-black text-white uppercase italic tracking-tight mb-2">{res.test_name}</h4>
                            <span className="text-[9px] font-black text-slate-600 bg-white/5 px-3 py-1 rounded-lg uppercase tracking-widest">{res.machine_name || 'MANUAL NODE'}</span>
                          </td>
                          <td className="px-10 py-10">
                            <div className="flex items-baseline gap-3">
                              <span className={`text-4xl font-black tracking-tighter tabular-nums ${parseFloat(res.test_value) > 100 ? 'text-rose-500' : 'text-teal-400'}`}>{res.test_value}</span>
                              <span className="text-[10px] font-black text-slate-600 uppercase italic">{res.unit || 'VAL'}</span>
                            </div>
                          </td>
                          <td className="px-10 py-10">
                            <div className="inline-flex flex-col gap-1.5 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Interval</span>
                              <span className="text-[12px] font-black text-teal-500 font-mono italic">{res.ref_range || '--'}</span>
                            </div>
                          </td>
                          <td className="px-10 py-10 text-right">
                            {res.status === 'VALIDATED' ? (
                              <div className="flex items-center justify-end gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-widest bg-emerald-400/10 px-6 py-3 rounded-2xl border border-emerald-500/20">
                                <CheckCircle2 size={16} /> Authorized
                              </div>
                            ) : (
                              <button onClick={() => handleValidate(res.id)} className="h-12 px-8 bg-white/5 text-white border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all">Authorize Protocol</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-40 text-center bg-slate-900 border border-white/5 rounded-[4rem] opacity-20">
              <Search size={80} className="mx-auto mb-8 animate-pulse" />
              <p className="text-[14px] font-black uppercase tracking-[0.6em] text-white">No Patient Node Active</p>
            </div>
          )}
        </div>
      )}

      {/* Cinematic Report Terminal Overlay */}
      {showReport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-12 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-500 overflow-y-auto">
          <div className="w-full max-w-6xl bg-white rounded-[4rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col relative animate-in zoom-in-95 h-full max-h-[90vh] overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 w-full">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-teal-600 text-white rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Diagnostic Record</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Verified Regional Pilot Report</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => window.print()} className="h-16 px-12 bg-slate-950 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-black transition-all flex items-center gap-4 active:scale-95">
                  <Printer size={22} /> Print Matrix
                </button>
                <button onClick={() => setShowReport(false)} className="h-16 w-16 bg-slate-100 text-slate-600 rounded-[1.5rem] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                  <X size={28} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-slate-50 custom-scrollbar scroll-smooth">
              <div className="bg-white mx-auto max-w-[800px] p-16 shadow-2xl min-h-[1000px] text-black">
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-10">
                  <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">{labProfile.lab_name}</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{labProfile.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Diagnostic Hash</p>
                    <p className="text-sm font-black font-mono">RX-244-90-MATRIX</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-12 mb-16 text-[12px] font-bold uppercase tracking-tight">
                  <div className="space-y-1"><p className="text-slate-500 text-[10px] font-black">SUBJECT:</p> {patient?.name}</div>
                  <div className="space-y-1"><p className="text-slate-500 text-[10px] font-black">IDENTIFIER:</p> {patient?.nic}</div>
                  <div className="space-y-1"><p className="text-slate-500 text-[10px] font-black">GENDER:</p> {patient?.gender}</div>
                  <div className="space-y-1"><p className="text-slate-500 text-[10px] font-black">DATE:</p> {new Date().toLocaleDateString()}</div>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase tracking-widest">
                      <th className="py-4">Investigation Protocol</th>
                      <th className="py-4">Result</th>
                      <th className="py-4">Unit</th>
                      <th className="py-4 text-right">Interval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((r, i) => (
                      <tr key={i} className="text-sm">
                        <td className="py-6 font-black uppercase">{r.test_name}</td>
                        <td className="py-6 font-black tabular-nums">{r.test_value}</td>
                        <td className="py-6 text-slate-600 italic uppercase text-xs">{r.unit || 'VAL'}</td>
                        <td className="py-6 text-right font-mono font-bold text-xs">{r.ref_range || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, badge }) => (
  <button onClick={onClick} className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all relative ${active ? 'bg-teal-600 text-white shadow-2xl' : 'text-slate-500 hover:text-white'}`}>
    {icon} {label}
    {badge > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-600 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-slate-900">{badge}</span>}
  </button>
);

const TelemetryItem = ({ label, value, icon }) => (
  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
    <div className="flex items-center gap-3 text-slate-500">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-sm font-black text-teal-400 italic">{value}</span>
  </div>
);

export default LabResults;
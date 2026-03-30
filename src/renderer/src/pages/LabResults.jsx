import React, { useState, useEffect } from 'react';
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
  Volume2
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';
import { playVoiceAlert } from '../utils/voiceSynth';
import JsBarcode from 'jsbarcode';

const BarcodeComponent = ({ value }) => {
  const barcodeRef = React.useRef(null);
  React.useEffect(() => {
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

/**
 * Mediccon Clinical Validation & Report Node
 */
const LabResults = () => {
  const { user, activePage, setActivePage, navigateNext, navigateBack, selectedPatient, setSelectedPatient, labProfile } = useGlobalStore();

  // Clinical Intelligence: Abnormal Result Detection
  const checkAbnormal = (value, range, dbFlag = null) => {
    // 1. Clinical Authority: Respond to Pre-Calculated Database Flags
    if (dbFlag === 'P') return { isAbnormal: true, flag: 'P', color: 'text-white', bg: 'bg-rose-900', border: 'border-rose-950', ring: 'ring-rose-500/50' };
    if (dbFlag === 'H') return { isAbnormal: true, flag: 'H', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
    if (dbFlag === 'L') return { isAbnormal: true, flag: 'L', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' };

    // 2. Real-time Calculation Fallback (For manual edits or un-flagged historical data)
    if (!range || !value || isNaN(parseFloat(value))) return { isAbnormal: false, flag: null, color: 'text-slate-950' };

    const val = parseFloat(value);

    // Range: "3.5 - 5.0"
    if (range.includes('-')) {
      const parts = range.split('-').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (val < parts[0]) return { isAbnormal: true, flag: 'L', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' };
        if (val > parts[1]) return { isAbnormal: true, flag: 'H', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
      }
    }

    // Range: "< 1.0"
    if (range.includes('<')) {
      const limit = parseFloat(range.replace('<', '').trim());
      if (!isNaN(limit) && val >= limit) return { isAbnormal: true, flag: 'H', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
    }

    // Range: "> 10.0"
    if (range.includes('>')) {
      const limit = parseFloat(range.replace('>', '').trim());
      if (!isNaN(limit) && val <= limit) return { isAbnormal: true, flag: 'L', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' };
    }

    return { isAbnormal: false, flag: null, color: 'text-slate-950' };
  };
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'search'
  const [queue, setQueue] = useState([]);

  // Auto-load if nav-search was used
  useEffect(() => {
    if (selectedPatient) {
      setActiveTab('search');
      setNicSearch(selectedPatient.nic);
      loadData(selectedPatient.nic);
    }
  }, [selectedPatient]);

  // Search State
  const [nicSearch, setNicSearch] = useState("");
  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [trendingTest, setTrendingTest] = useState(null); // { testName, data: [] }

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editingNameId, setEditingNameId] = useState(null);
  const [editNameValue, setEditNameValue] = useState("");

  // Initial Load
  useEffect(() => {
    if (activeTab === 'queue') loadQueue();
  }, [activeTab]);

  // Real-time updates
  useEffect(() => {
    let lastUpdate = 0;
    const handleNewData = (data) => {
      // Clinical Voice Intelligence: Vocalize critical state changes
      if (data.flag === 'P') {
        playVoiceAlert(`Panic result detected for ${data.patient_name || data.nic}. ${data.test_name} is ${data.test_value}. Please prioritize validation.`);
      } else if (data.flag === 'H' || data.flag === 'L') {
        playVoiceAlert(`Abnormal protocol received.`);
      }

      // Throttle updates: Only allow one refresh every 800ms to avoid UI locking during high-frequency data bursts
      const now = Date.now();
      if (now - lastUpdate < 800) return;
      lastUpdate = now;

      if (activeTab === 'queue') loadQueue();
      if (activeTab === 'search' && patient && (data.nic === patient.nic || data.patient_nic === patient.nic)) {
        loadData(patient.nic, selectedVisitId);
      }
    };

    let cleanup = () => { };
    if (window.api) {
      cleanup = window.api.onNewResultReceived(handleNewData);
    }
    return () => cleanup();
  }, [activeTab, patient]);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await window.api.getPendingResults();
      setQueue(data || []);
    } catch (e) {
      console.error("Queue load failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async (nic, visitId = null) => {
    setIsLoading(true);
    setSelectedVisitId(visitId);
    try {
      const data = await window.api.getPatientResults({ nic, visitId });
      if (data && data.patient) {
        setPatient(data.patient);
        setResults(data.results || []);

        // Also fetch visits to build the timeline
        const visitData = await window.api.getVisits(nic);
        setVisits(visitData || []);

        // If we just searched and didn't specify a visit, auto-select the latest
        if (!visitId && visitData && visitData.length > 0) {
          setSelectedVisitId(visitData[0].id);
        }
      }
    } catch (e) {
      console.error("Clinical retrieval error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVisits = async (nic) => {
    try {
      const data = await window.api.getVisits(nic);
      setVisits(data || []);
    } catch (e) { console.error(e); }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (nicSearch) loadData(nicSearch);
  };

  const handleValidate = async (id) => {
    try {
      const res = await window.api.validateResult(id, user?.id);
      if (res.success) {
        if (activeTab === 'queue') loadQueue();
        else if (patient) loadData(patient.nic, selectedVisitId);
      }
    } catch (e) {
      console.error("Clinical validation failure", e);
    }
  };

  const handleBulkValidate = async () => {
    const pending = results.filter(r => r.status !== 'VALIDATED');
    if (pending.length === 0) return;

    if (!confirm(`Authorize clinical release for all ${pending.length} pending probes?`)) return;

    setIsLoading(true);
    try {
      for (const res of pending) {
        await window.api.validateResult(res.id, user?.id);
      }
      loadData(patient.nic, selectedVisitId);
    } catch (e) {
      console.error("Bulk validation explosion", e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateResultValue = async (id) => {
    // Relaxed validation: Clinical results may be non-numeric (e.g. "Trace", "1+", etc.)
    try {
      await window.api.updateResult({ id, value: editValue, userId: user?.id });
      setEditingId(null);
      if (activeTab === 'queue') loadQueue();
      else if (patient) loadData(patient.nic, selectedVisitId);
    } catch (e) {
      alert("Persistence Error: Failed to commit change.");
    }
  };

  const updateResultName = async (id) => {
    try {
      await window.api.updateResultTestName({ id, testName: editNameValue, userId: user?.id });
      setEditingNameId(null);
      if (activeTab === 'queue') loadQueue();
      else if (patient) loadData(patient.nic, selectedVisitId);
    } catch (e) {
      alert("Mapping Error: Failed to re-route investigation protocol.");
    }
  };

  const handleViewTrend = async (testName) => {
    if (!patient) return;
    setIsLoading(true);
    try {
      const data = await window.api.getHistoricalTestResults({ nic: patient.nic, testName });
      setTrendingTest({ testName, data: data || [] });
    } catch (e) {
      console.error("Trend Analysis Error:", e);
      alert("Intelligence Matrix Error: Could not resolve historical trajectory.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowReport = async () => {
    if (!patient || !selectedVisitId) return;

    setIsLoading(true);
    try {
      const invoice = await window.api.getInvoiceByVisit(selectedVisitId);

      // If payment is settled or if no invoice exists (possibly bypass), allow print
      // Logic: Status MUST be 'PAID' to release clinical report
      if (!invoice || invoice.status === 'PAID') {
        setShowReport(true);
      } else {
        const remaining = (invoice.total_amount - (invoice.paid_amount || 0) - (invoice.discount || 0)).toFixed(2);
        if (confirm(`Clinical Release Blocked: Outstanding balance of LKR ${remaining} detected in Financial Matrix. Link to Account Authority to settle?`)) {
          setActivePage('billing');
        }
      }
    } catch (e) {
      console.error("Financial Interlock Failure:", e);
      alert("Security Protocol: Could not verify financial settlement status.");
    } finally {
      setIsLoading(true); // Keep loading state until we decide
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-1000 pb-32 font-sans selection:bg-teal-500/30">

      {/* 1. Page Narrative Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 glass p-10 rounded-[3.5rem] shadow-xl shadow-slate-100/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-transparent to-transparent w-full animate-scan-sweep pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
          <FlaskConical size={180} />
        </div>

        <div className="flex items-center gap-10 relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={navigateBack}
              className="h-14 w-14 glass-dark text-white rounded-2xl flex items-center justify-center hover:bg-teal-600 transition-all shadow-lg active:scale-90"
            >
              <ArrowRight size={24} className="rotate-180" />
            </button>
            <button
              onClick={navigateNext}
              className="h-14 w-14 glass-dark text-white rounded-2xl flex items-center justify-center hover:bg-teal-600 transition-all shadow-lg active:scale-90"
            >
              <ArrowRight size={24} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-600 node-pulse shadow-[0_0_15px_rgba(20,184,166,0.8)]"></div>
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Integrated Validation Node</span>
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
              Verification <span className="text-teal-600">Matrix</span>
            </h1>
          </div>
        </div>

        <div className="flex bg-slate-200/50 p-2 rounded-[2rem] relative z-10 shadow-inner border border-slate-200/50">
          <TabButton active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} icon={<History size={18} />} label="Pending Queue" badge={queue.length} />
          <TabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search size={18} />} label="Diagnostic Search" />
        </div>
      </div>

      {activeTab === 'queue' ? (
        <div className="bg-white/60 rounded-[3rem] border border-white shadow-sm backdrop-blur-md overflow-hidden animate-in slide-in-from-bottom-6 duration-700 min-h-[600px] flex flex-col">
          <div className="p-12 border-b border-slate-100 bg-white/40 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <Terminal size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Live Protocol Stream</h3>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)] animate-pulse"></div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Monitoring Hardware Node Intercepts</p>
                </div>
              </div>
            </div>
            <button
              onClick={loadQueue}
              className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all active:scale-90"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] border-b border-slate-100">
                  <th className="px-12 py-8">Transmission ID</th>
                  <th className="px-12 py-8">Subject Identity</th>
                  <th className="px-12 py-8">Diagnostic Module</th>
                  <th className="px-12 py-8">Extraction Value</th>
                  <th className="px-12 py-8 text-right">Decision Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white/20">
                {queue.map((item, idx) => (
                  <tr key={idx} className="group hover:bg-teal-50/50 transition-all duration-500">
                    <td className="px-12 py-10">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-500 transition-all duration-500 shadow-sm">
                          <Cpu size={20} />
                        </div>
                        <span className="font-mono text-[11px] font-black text-slate-600 tracking-widest uppercase">NODE-{item.id}</span>
                      </div>
                    </td>
                    <td className="px-12 py-10">
                      <div className="space-y-1">
                        <h4 className="text-[15px] font-black text-slate-900 tracking-tight uppercase group-hover:text-teal-600 transition-colors">{item.patient_name}</h4>
                        <p className="text-[10px] font-black text-slate-600 font-mono tracking-tighter">{item.patient_nic}</p>
                      </div>
                    </td>
                    <td className="px-12 py-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 group-hover:bg-teal-50 transition-colors rounded-lg border border-slate-100 group-hover:border-teal-100">
                        <Microscope size={14} className="text-teal-600" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.test_name}</span>
                      </div>
                    </td>
                    <td className="px-12 py-10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-950 tracking-tighter tabular-nums">{item.test_value}</span>
                        <span className="text-[11px] font-black text-slate-600 uppercase">{item.unit || 'NODE'}</span>
                      </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <button
                          onClick={() => {
                            setNicSearch(item.patient_nic);
                            loadData(item.patient_nic);
                            setActiveTab('search');
                          }}
                          className="h-12 px-6 bg-white border border-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                          Extract Core <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={() => handleValidate(item.id)}
                          className="h-12 px-8 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-teal-200 hover:bg-teal-500 transition-all active:scale-95"
                        >
                          Authorize Protocol
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {queue.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-40 text-center opacity-30 flex flex-col items-center gap-6 text-slate-600">
                      <ZapOff size={80} />
                      <div className="space-y-2">
                        <p className="font-black text-[12px] uppercase tracking-[0.5em]">No Pending Transmissions</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">All Hardware Nodes are Synchronized</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">

          {/* Matrix Search Ingress */}
          <div className="glass p-12 rounded-[3.5rem] shadow-xl shadow-slate-100/50 flex flex-col md:flex-row gap-10 items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 via-transparent to-transparent h-full w-full animate-scan pointer-events-none"></div>
            <div className="h-20 w-20 glass-dark text-white rounded-3xl flex items-center justify-center shadow-2xl shrink-0 group hover:scale-105 transition-transform duration-500">
              <Search size={32} />
            </div>
            <div className="flex-1 space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-teal-600 node-pulse shadow-[0_0_10px_rgba(20,184,166,0.8)]"></div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Integrated Archive Probe</label>
              </div>
              <form onSubmit={handleSearch} className="relative group/search">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-teal-600 transition-colors" size={28} />
                <input
                  type="text"
                  placeholder="Universal Subject Identifier (NIC)..."
                  className="w-full bg-white/40 border border-slate-100 rounded-[2.5rem] py-8 pl-20 pr-10 text-2xl font-black text-slate-900 focus:bg-white focus:ring-[20px] focus:ring-teal-500/5 transition-all outline-none placeholder:text-slate-400 shadow-sm font-mono uppercase tracking-widest leading-none"
                  value={nicSearch}
                  onChange={e => setNicSearch(e.target.value.toUpperCase())}
                />
              </form>
            </div>
            <button
              onClick={handleSearch}
              className="h-24 px-14 glass-dark text-white rounded-[2.2rem] font-black text-[12px] uppercase tracking-[0.4em] hover:bg-teal-600 transition-all shadow-2xl active:scale-95 flex items-center gap-4 group/btn"
            >
              Probe Archive <ArrowRight size={22} className="group-hover/btn:translate-x-2 transition-transform" />
            </button>
          </div>

          {patient ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 h-full">

              {/* Subject Profile Architecture */}
              <div className="xl:col-span-4 space-y-10">
                <div className="bg-white/60 p-12 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-md text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <User size={180} />
                  </div>

                  <div className="relative z-10 space-y-10">
                    <div className="w-40 h-40 bg-gradient-to-br from-teal-600 to-cyan-700 rounded-[3.5rem] flex items-center justify-center text-white mx-auto shadow-3xl border-8 border-white group-hover:scale-105 transition-all duration-700">
                      <User size={80} />
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em]">Clinical Identity Verified</h2>
                      <h3 className="font-black text-slate-900 text-4xl tracking-tighter uppercase leading-none">{patient.name}</h3>
                      <p className="text-lg font-black text-slate-600 font-mono tracking-widest uppercase">{patient.nic}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <button
                        onClick={handleShowReport}
                        className="h-18 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-teal-500/30 hover:bg-teal-500 transition-all flex items-center justify-center gap-4 active:scale-95"
                      >
                        <FileCheck size={22} /> Final Report Protocol
                      </button>
                      {results.some(r => r.status !== 'VALIDATED') && (
                        <button
                          onClick={handleBulkValidate}
                          className="h-18 bg-slate-900 text-teal-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 active:scale-95 border border-teal-500/20"
                        >
                          <ShieldCheck size={22} /> Secure All Probes
                        </button>
                      )}
                      {(user?.role === 'Developer' || user?.role === 'MASTER ACCESS' || user?.role === 'Admin') && (
                        <button
                          onClick={async () => {
                            if (confirm(`Trigger dynamic hardware telemetry for ${patient.name}?`)) {
                              const res = await window.api.simulatePatientResults(patient.nic);
                              if (res.success) {
                                loadData(patient.nic, selectedVisitId);
                              } else {
                                alert("Simulation Fault: " + res.error);
                              }
                            }
                          }}
                          className="h-18 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/30 hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 active:scale-95 border-b-4 border-emerald-800"
                        >
                          <Cpu size={22} className="animate-pulse" /> Inject Hardware Telemetry
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-64 w-64 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <History size={20} className="text-teal-500" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Clinical Timeline</h4>
                    </div>
                    <span className="text-[10px] font-black text-teal-400 bg-teal-400/10 px-3 py-1 rounded-full">{visits.length} Visits</span>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar-dark pr-2">
                    {visits.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => loadData(patient.nic, v.id)}
                        className={`w-full p-6 rounded-2xl border transition-all text-left flex justify-between items-center group/vbtn ${selectedVisitId === v.id ? 'bg-teal-600 border-teal-500 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                        <div>
                          <p className={`text-[11px] font-black uppercase tracking-tight mb-1 ${selectedVisitId === v.id ? 'text-white' : 'text-slate-300'}`}>{new Date(v.created_at).toLocaleDateString()}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedVisitId === v.id ? 'text-teal-200' : 'text-slate-600'}`}>Ref: {v.doctor_name || 'Self referred'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black tracking-tighter ${selectedVisitId === v.id ? 'text-white' : 'text-slate-100'}`}>{v.test_count}</p>
                          <p className={`text-[8px] font-black uppercase ${selectedVisitId === v.id ? 'text-teal-200' : 'text-slate-600'}`}>Probes</p>
                        </div>
                      </button>
                    ))}
                    {visits.length === 0 && (
                      <div className="py-10 text-center opacity-20">
                        <Clock size={40} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase">No historical sequence</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-64 w-64 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                  <div className="flex items-center gap-4 mb-8">
                    <Activity size={20} className="text-teal-500" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Node Real-time Telemetry</h4>
                  </div>
                  <div className="space-y-6">
                    <TelemetryItem label="Total Investigations" value={results.length} icon={<Layers size={14} />} />
                    <TelemetryItem label="Validation Rate" value={`${Math.round((results.filter(r => r.status === 'VALIDATED').length / (results.length || 1)) * 100)}%`} icon={<ShieldCheck size={14} />} />
                    <TelemetryItem label="Node Maturity" value={results[0] ? new Date(results[0].timestamp).toLocaleDateString() : 'Active'} icon={<Clock size={14} />} />
                  </div>
                </div>
              </div>

              {/* Results Grid Integration */}
              <div className="xl:col-span-8 bg-white/60 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-md overflow-hidden flex flex-col">
                <div className="p-10 border-b border-slate-100 bg-white/40 flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setActiveTab('queue')}
                      className="h-12 w-12 bg-white border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <ArrowRight size={20} className="rotate-180" />
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
                        <Dna size={20} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Investigation Matrix</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="h-2 w-2 rounded-full bg-teal-600 shadow-[0_0_8px_rgba(20,184,166,1)]"></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Live Feed from Analyzers</span>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] border-b border-slate-100">
                        <th className="px-10 py-8">Investigation Protocol</th>
                        <th className="px-10 py-8">Result Matrix</th>
                        <th className="px-10 py-8">Reference Cluster</th>
                        <th className="px-10 py-8 text-right">Decision Module</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white/20">
                      {results.map((res, i) => (
                        <tr key={i} className={`group hover:bg-teal-50/50 transition-all duration-500 ${res.status === 'VALIDATED' ? '' : 'bg-amber-50/30'}`}>
                          <td className="px-10 py-8">
                            {editingNameId === res.id ? (
                              <div className="flex items-center gap-3">
                                <input
                                  autoFocus
                                  className="w-full bg-white border-2 border-rose-500 rounded-xl py-2 px-4 font-black text-sm text-rose-600 outline-none shadow-xl shadow-rose-100 uppercase"
                                  value={editNameValue}
                                  onChange={e => setEditNameValue(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && updateResultName(res.id)}
                                />
                                <button onClick={() => updateResultName(res.id)} className="h-10 px-4 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Map</button>
                                <button onClick={() => setEditingNameId(null)} className="h-10 w-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"><XCircle size={14} /></button>
                              </div>
                            ) : (
                              <>
                                <div className="font-black text-slate-900 text-[15px] tracking-tight uppercase group-hover:text-teal-600 transition-colors mb-2">{res.test_name}</div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded tracking-widest uppercase truncate max-w-[120px] inline-block">{res.machine_name || res.machine_id || 'EXTERNAL'}</span>
                                  <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                  {res.is_ordered ? (
                                    <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest">{res.machine_category || 'MANUAL INPUT'}</span>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 uppercase animate-pulse">Unauthorized Investigation</span>
                                      <button
                                        onClick={() => { setEditingNameId(res.id); setEditNameValue(res.test_name); }}
                                        className="h-6 px-2 bg-slate-900 text-white rounded-md text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-1"
                                      >
                                        <Edit2 size={10} /> Edit Error
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </td>
                          <td className="px-10 py-8">
                            {editingId === res.id ? (
                              <div className="flex items-center gap-3">
                                <input
                                  autoFocus
                                  className="w-32 bg-white border-2 border-teal-500 rounded-xl py-3 px-4 font-black text-xl text-teal-600 outline-none shadow-xl shadow-teal-100"
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && updateResultValue(res.id)}
                                />
                                <button onClick={() => updateResultValue(res.id)} className="h-12 px-6 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Commit</button>
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-2 group/val cursor-pointer" onClick={() => { setEditingId(res.id); setEditValue(res.test_value); }}>
                                {(() => {
                                  const status = checkAbnormal(res.test_value, res.ref_range, res.flag);
                                  return (
                                    <>
                                      <span className={`text-4xl font-black tracking-tighter tabular-nums transition-colors ${status.flag === 'P' ? 'text-rose-950' : status.color} ${status.flag === 'P' ? 'animate-pulse' : ''}`}>
                                        {res.test_value}
                                      </span>
                                      {status.flag && (
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-black border shadow-sm flex items-center gap-1 ${status.color} ${status.bg} ${status.border} ${status.ring ? `ring-4 ${status.ring}` : ''}`}>
                                          {status.flag === 'H' && <TrendingUp size={10} />}
                                          {status.flag === 'L' && <TrendingDown size={10} />}
                                          {status.flag === 'P' && <AlertTriangle size={10} className="animate-bounce" />}
                                          {status.flag === 'H' && 'HIGH'}
                                          {status.flag === 'L' && 'LOW'}
                                          {status.flag === 'P' && 'CRITICAL PANIC'}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                                <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">{res.unit || 'VAL'}</span>
                                <Edit2 size={12} className="text-slate-600 group-hover/val:text-teal-400 opacity-0 group-hover/val:opacity-100 transition-all ml-2" />
                              </div>
                            )}
                          </td>
                          <td className="px-10 py-8">
                            <div className="inline-flex flex-col gap-1.5 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none">Standard interval</span>
                              <span className="text-[13px] font-black text-teal-600 font-mono tracking-tighter leading-none">{res.ref_range || 'NODE_PENDING'}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <div className="flex flex-col items-end gap-3">
                              {res.status === 'VALIDATED' ? (
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={() => handleViewTrend(res.test_name)}
                                    className="h-10 px-5 bg-white border border-slate-100 text-teal-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-teal-50 transition-all flex items-center gap-2 group/trend"
                                  >
                                    <LineChart size={14} className="group-hover/trend:scale-110 transition-transform" /> View Trajectory
                                  </button>
                                  <div className="flex items-center gap-2.5 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-50">
                                    <CheckCircle2 size={16} /> Authorized
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2.5 text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 animate-pulse">
                                    <Clock size={16} /> Awaiting audit
                                  </div>
                                  <button onClick={() => handleValidate(res.id)} className="text-[10px] font-black text-teal-500 hover:text-teal-700 underline underline-offset-8 decoration-2 decoration-teal-200 uppercase tracking-widest">Manually bypass audit</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-40 text-center bg-white/40 rounded-[3rem] border border-white backdrop-blur-md animate-in fade-in zoom-in-95 duration-700">
              <div className="h-28 w-28 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 mx-auto mb-8 border border-slate-100 relative group">
                <div className="absolute inset-0 bg-teal-500/5 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Search size={48} />
              </div>
              <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">No Patient Node Active</h3>
              <p className="text-[10px] font-bold text-slate-600 mt-3 uppercase tracking-[0.3em]">Input Universal Identifier to initiate data extraction</p>
            </div>
          )}
        </div>
      )}

      {/* 4. CINEMATIC REPORT PREVIEW TERMINAL */}
      {showReport && patient && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-6 lg:p-12 animate-in fade-in duration-700 overflow-y-auto selection:bg-teal-500/30 font-sans">
          <div className="bg-white/95 w-full max-w-6xl rounded-[4rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative border border-white/20 h-full max-h-[95vh]">

            {/* Fixed Action Terminal Header */}
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-50 print:hidden">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-3xl shadow-teal-500/40 animate-pulse">
                  <FileText size={32} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Electronic Clinical Record</h2>
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">System Authenticated / Final Print Matrix</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowReport(false);
                    setActiveTab('queue');
                  }}
                  className="h-16 px-10 bg-white border border-slate-100 text-slate-600 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center gap-4"
                >
                  <History size={20} /> Back to Queue
                </button>
                <button onClick={() => window.print()} className="h-16 px-12 bg-slate-950 text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-3xl active:scale-95 flex items-center gap-4">
                  <Printer size={22} /> Execute Final Print
                </button>
                <button onClick={() => setShowReport(false)} className="h-16 w-16 bg-slate-100 text-slate-600 rounded-[1.75rem] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                  <XCircle size={28} />
                </button>
              </div>
            </div>

            {/* Professional Medical Report Viewer (Premium Clinical Grade) */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-200/50 print:bg-white print:p-0 custom-scrollbar relative" id="printable-report">
              <style>{`
                @media print {
                  @page { size: A4; margin: 15mm; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  #printable-report { padding: 0 !important; background: white !important; }
                  .print-no-break { break-inside: avoid; }
                }
              `}</style>

              <div className="bg-white w-full max-w-[850px] mx-auto p-12 lg:p-14 shadow-2xl print:shadow-none print:p-0 rounded-xl print:rounded-none relative text-black font-sans leading-normal">

                {/* 1. Header (Premium Medical Style) */}
                <div
                  className="flex justify-between items-start border-b-2 pb-6 mb-10"
                  style={{ borderColor: labProfile.lab_accent_color || '#1e293b' }}
                >
                  <div className="flex items-center gap-6">
                    {labProfile.lab_logo ? (
                      <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                        <img src={labProfile.lab_logo} alt="Lab Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 border-[3px] flex items-center justify-center font-serif text-3xl font-black bg-white"
                        style={{ borderColor: labProfile.lab_accent_color || 'black', color: labProfile.lab_accent_color || 'black' }}
                      >
                        {labProfile.lab_name ? labProfile.lab_name.substring(0, 1) : 'M'}
                      </div>
                    )}
                    <div>
                      <h1 className="text-3xl font-black tracking-tight text-black font-serif uppercase">{labProfile.lab_name || 'MEDICCON LABORATORIES'}</h1>
                      <p className="text-sm font-semibold text-gray-700 mt-1 uppercase tracking-wider">{labProfile.lab_tagline || 'Advanced Clinical Diagnostics'}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-800 space-y-1 font-medium">
                    <p className="font-bold mb-1" style={{ color: labProfile.lab_accent_color || 'black' }}>CLINICAL DIAGNOSTIC NODE</p>
                    {patient && (
                      <div className="mb-2 flex justify-end">
                        <div className="h-10 w-32 flex items-center justify-end overflow-hidden">
                          <BarcodeComponent value={patient.nic} />
                        </div>
                      </div>
                    )}
                    <p>{labProfile.lab_address || 'Mediccon Main Hub, 42 Clinical Way'}</p>
                    <p>Tel: {labProfile.lab_phone || '+94 112 000 000'}</p>
                    <p>Email: {labProfile.lab_email || 'results@mediccon.com'}</p>
                  </div>
                </div>

                {/* 2. Clinical Demographics Grid (Matching Mispa Layout) */}
                <div className="mb-8 p-6 bg-slate-50/50 border border-slate-100 rounded-2xl print:bg-transparent print:border-none print:p-0">
                  <div className="grid grid-cols-2 gap-x-16 gap-y-4 text-[13px]">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-500 uppercase tracking-tighter w-24">NAME:</span>
                      <span className="font-black text-slate-900 uppercase flex-1 text-right">{patient.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-500 uppercase tracking-tighter w-24">ID:</span>
                      <span className="font-black text-slate-900 flex-1 text-right">{patient.nic}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-500 uppercase tracking-tighter w-24">AGE:</span>
                      <span className="font-black text-slate-900 uppercase flex-1 text-right">{patient.age} {patient.age_type || 'Years'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-500 uppercase tracking-tighter w-24">GENDER:</span>
                      <span className="font-black text-slate-900 uppercase flex-1 text-right">{patient.gender}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-500 uppercase tracking-tighter w-24">REPORTED:</span>
                      <span className="font-black text-slate-900 flex-1 text-right">{new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-500 uppercase tracking-tighter w-24 text-[11px]">SPECIMEN:</span>
                      <span className="font-black text-slate-900 uppercase flex-1 text-right">{results.some(r => r.machine_category === 'Hematology') ? 'WHOLE BLOOD (EDTA)' : 'PLASMA / SERUM'}</span>
                    </div>
                  </div>
                </div>

                {/* Report Title (Centered & Bold) */}
                <div className="mb-8 text-center border-y border-slate-950 py-3">
                  <h2 className="text-[17px] font-black uppercase tracking-[0.3em] text-slate-900 italic">
                    {results.some(r => r.machine_category === 'Hematology') ? 'Hematology Laboratory Report' : 'Laboratory Diagnostic Report'}
                  </h2>
                </div>

                {/* 3. Investigation Matrix */}
                <div className="mb-10 min-h-[400px]">
                  {results.some(r => r.machine_category === 'Hematology') ? (
                    /* SPECIALIZED HEMATOLOGY LAYOUT - ULTRA COMPACT FOR 1-PAGE PRINT */
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-8 items-start">
                        {/* LEFT COLUMN: WBC & PLT */}
                        <div className="col-span-6 space-y-6">
                          {/* WBC System */}
                          <div>
                            <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] mb-2 border-b-2 border-teal-100 pb-1">WBC SYSTEM</h4>
                            <table className="w-full text-[11px] leading-tight">
                              <tbody className="divide-y divide-slate-50">
                                {['WBC', 'LYMPH#', 'MID#', 'GRAN#', 'LYMPH%', 'MID%', 'GRAN%'].map(name => {
                                  const r = results.find(item => item.test_name === name && item.status === 'VALIDATED');
                                  if (!r) return null;
                                  const status = checkAbnormal(r.test_value, r.ref_range);
                                  return (
                                    <tr key={name}>
                                      <td className="py-1 font-bold text-slate-800 uppercase">{name}</td>
                                      <td className={`py-1 text-right font-black text-[13px] ${status.isAbnormal ? 'text-rose-700' : 'text-slate-950'}`}>{r.test_value}</td>
                                      <td className="py-1 text-center font-bold text-slate-500 text-[10px]">{r.unit}</td>
                                      <td className="py-1 text-right font-bold text-slate-500 text-[9px]">{r.ref_range}</td>
                                      <td className="py-1 text-right font-black text-[10px] text-rose-600">{status.flag}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Platelet System */}
                          <div>
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-2 border-b-2 border-emerald-100 pb-1">PLATELET SYSTEM</h4>
                            <table className="w-full text-[11px] leading-tight">
                              <tbody className="divide-y divide-slate-50">
                                {['PLT', 'MPV', 'PDW', 'PCT', 'PLCR', 'PLCC', 'P-LCR', 'P-LCC'].map(name => {
                                  const r = results.find(item => item.test_name === name && item.status === 'VALIDATED');
                                  if (!r) return null;
                                  const status = checkAbnormal(r.test_value, r.ref_range);
                                  return (
                                    <tr key={name}>
                                      <td className="py-1 font-bold text-slate-800 uppercase">{name}</td>
                                      <td className={`py-1 text-right font-black text-[13px] ${status.isAbnormal ? 'text-rose-700' : 'text-slate-950'}`}>{r.test_value}</td>
                                      <td className="py-1 text-center font-bold text-slate-500 text-[10px]">{r.unit}</td>
                                      <td className="py-1 text-right font-bold text-slate-500 text-[9px]">{r.ref_range}</td>
                                      <td className="py-1 text-right font-black text-[10px] text-rose-600">{status.flag}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: RBC & HISTOGRAMS */}
                        <div className="col-span-6 space-y-6">
                           {/* RBC System */}
                           <div>
                            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] mb-2 border-b-2 border-rose-100 pb-1">RBC SYSTEM</h4>
                            <table className="w-full text-[11px] leading-tight">
                              <tbody className="divide-y divide-slate-50">
                                {['RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'RDW-CV', 'RDW-SD'].map(name => {
                                  const r = results.find(item => item.test_name === name && item.status === 'VALIDATED');
                                  if (!r) return null;
                                  const status = checkAbnormal(r.test_value, r.ref_range);
                                  return (
                                    <tr key={name}>
                                      <td className="py-1 font-bold text-slate-800 uppercase">{name}</td>
                                      <td className={`py-1 text-right font-black text-[13px] ${status.isAbnormal ? 'text-rose-700' : 'text-slate-950'}`}>{r.test_value}</td>
                                      <td className="py-1 text-center font-bold text-slate-500 text-[10px]">{r.unit}</td>
                                      <td className="py-1 text-right font-bold text-slate-500 text-[9px]">{r.ref_range}</td>
                                      <td className="py-1 text-right font-black text-[10px] text-rose-600">{status.flag}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Mini Histograms Area */}
                          <div className="grid grid-cols-2 gap-2 pt-2">
                             <div className="h-16 border border-slate-200 rounded p-1 bg-slate-50/30 relative">
                               <span className="absolute top-0.5 left-1 text-[7px] font-black uppercase text-teal-600">WBC Hist</span>
                               <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <path d="M 5 95 Q 25 20 45 70 Q 60 30 95 95" fill="none" stroke="#0d9488" strokeWidth="1.5" />
                               </svg>
                             </div>
                             <div className="h-16 border border-slate-200 rounded p-1 bg-slate-50/30 relative">
                               <span className="absolute top-0.5 left-1 text-[7px] font-black uppercase text-rose-600">RBC Hist</span>
                               <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <path d="M 10 95 Q 50 10 90 95" fill="none" stroke="#dc2626" strokeWidth="1.5" />
                               </svg>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Display any extra biochemistry tests ordered with FBC */}
                      {results.filter(r => r.machine_category !== 'Hematology' && r.status === 'VALIDATED').length > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-slate-900 border-dotted">
                          <h4 className="text-[9px] font-black text-slate-950 uppercase tracking-[0.4em] mb-2">ADDITIONAL INVESTIGATIONS</h4>
                          <table className="w-full text-[10px]">
                            <tbody className="divide-y divide-slate-100">
                              {results.filter(r => r.machine_category !== 'Hematology' && r.status === 'VALIDATED').map(r => (
                                <tr key={r.id}>
                                  <td className="py-1 font-bold text-slate-800 uppercase">{r.test_name}</td>
                                  <td className="py-1 text-right font-black text-[12px]">{r.test_value}</td>
                                  <td className="py-1 text-center font-bold text-slate-600">{r.unit}</td>
                                  <td className="py-1 text-right font-bold text-slate-600 text-[9px]">{r.ref_range}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* STANDARD BIOCHEMISTRY TABLE */
                    <table className="w-full text-left text-[14px] border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-900 font-black text-slate-900 italic">
                          <th className="py-2 px-1 w-[45%] uppercase tracking-tight">Test Description</th>
                          <th className="py-2 px-1 w-[15%] text-right uppercase tracking-tight">Result</th>
                          <th className="py-2 px-1 w-[12%] text-center uppercase tracking-tight">Unit</th>
                          <th className="py-2 px-1 w-[18%] text-center uppercase tracking-tight">Ref. Range</th>
                          <th className="py-2 px-1 w-[10%] text-right uppercase tracking-tight">Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.filter(r => r.status === 'VALIDATED').map((test, idx) => {
                          const status = checkAbnormal(test.test_value, test.ref_range);
                          return (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-1">
                                <span className="font-bold text-slate-800 uppercase text-[13px]">{test.test_name}</span>
                              </td>
                              <td className="py-2.5 px-1 text-right">
                                <span className={`font-black text-[15px] ${status.isAbnormal ? (status.flag === 'H' ? 'text-rose-700' : 'text-teal-700') : 'text-slate-950'}`}>
                                  {test.test_value}
                                </span>
                              </td>
                              <td className="py-2.5 px-1 text-center font-bold text-slate-600">
                                {test.unit}
                              </td>
                              <td className="py-2.5 px-1 text-center font-bold text-slate-600 text-[12px]">
                                {test.ref_range || '-'}
                              </td>
                              <td className="py-2.5 px-1 text-right">
                                {status.flag && (
                                  <span className={`font-black text-[11px] uppercase ${status.flag === 'H' ? 'text-rose-600' : 'text-teal-600'}`}>
                                    {status.flag === 'H' ? 'HIGH' : 'LOW'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {results.filter(r => r.status === 'VALIDATED').length === 0 && (
                          <tr>
                            <td colSpan="4" className="py-20 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-40">
                                <ZapOff size={40} />
                                <p className="text-xs font-bold uppercase tracking-widest">No Validated Diagnostic Data Available</p>
                                <p className="text-[10px] uppercase">Please authorize pending probes in the validation matrix</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 5. Footer & Authentications */}
                <div className="pt-8 flex justify-between items-end border-t-2 border-slate-900 mt-auto">
                  <div className="text-[10px] text-slate-900 font-bold italic space-y-1">
                    <p>System generated by Mediccon LIS - Mispa Count-X Clinical Core</p>
                    <p>Validated by: {user?.username} (ID: {user?.id})</p>
                    <p>Auth Stamp: {new Date().toLocaleTimeString()} @ {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-8">Clinical Approver Segment</p>
                    <div className="h-0.5 w-40 bg-slate-950 ml-auto"></div>
                    <p className="text-[12px] font-black text-slate-950 uppercase mt-2">Laboratory In-Charge</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. HISTORICAL TRAJECTORY MODAL (TRENDING) */}
      {trendingTest && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[300] flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500 font-sans">
          <div className="bg-white/95 w-full max-w-5xl rounded-[4rem] shadow-[0_80px_200px_rgba(0,0,0,0.6)] border border-white overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white relative">
              <div className="flex items-center gap-6 relative z-10">
                <div className="h-16 w-16 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-3xl shadow-teal-500/30">
                  <TrendingUp size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{trendingTest.testName} Trajectory</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse"></div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Longitudinal Clinical Audit Matrix</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setTrendingTest(null)}
                className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-[1.75rem] flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
              >
                <XCircle size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-slate-50/30">
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-full w-1/3 bg-teal-600/10 blur-[120px] pointer-events-none"></div>
                <div className="relative z-10 flex items-end justify-between">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Integrated Archive Subject</p>
                    <p className="text-4xl font-black tracking-tighter uppercase">{patient.name}</p>
                    <p className="text-sm font-bold text-teal-400 font-mono tracking-widest">{patient.nic}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Data Maturity</p>
                    <p className="text-4xl font-black tracking-tighter text-teal-500">{trendingTest.data.length} <span className="text-xl">Points</span></p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <History size={20} className="text-teal-600" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Sequential Extraction Log</h4>
                  </div>
                  <div className="space-y-4">
                    {trendingTest.data.length > 0 ? trendingTest.data.map((point, idx) => (
                      <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-teal-200 hover:bg-white transition-all duration-500">
                        <div className="flex items-center gap-6">
                          <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-sm group-hover:text-teal-600 transition-colors">
                            {trendingTest.data.length - idx}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase">{new Date(point.visit_date).toLocaleDateString()} {new Date(point.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Visit-Node: {point.visit_id}</p>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-black text-slate-950 tracking-tighter tabular-nums group-hover:text-teal-600 transition-colors">{point.test_value}</span>
                          <span className="text-[11px] font-black text-slate-500 uppercase">{point.unit || 'VAL'}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center opacity-30 flex flex-col items-center gap-6">
                        <ZapOff size={60} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero historical intersections discovered</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 flex justify-between items-center bg-white">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Note: Values are clinical extractions and should be interpreted by a verified pathologist.</p>
              <button onClick={() => setTrendingTest(null)} className="h-16 px-12 bg-slate-950 text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-teal-600 transition-all active:scale-95">
                Close Trajectory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- HIGH-FIDELITY SUBCOMPS --- */

const TabButton = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`h-12 px-10 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all duration-500 relative ${active
      ? 'bg-white text-teal-600 shadow-xl border border-white -translate-y-0.5'
      : 'text-slate-600 hover:text-slate-900'
      }`}
  >
    {icon} {label}
    {badge > 0 && (
      <span className={`h-6 min-w-6 flex items-center justify-center rounded-full text-[10px] font-black px-2 shadow-lg transition-all duration-500 ${active ? 'bg-teal-600 text-white shadow-teal-500/30' : 'bg-red-500 text-white shadow-red-500/30'}`}>
        {badge}
      </span>
    )}
    {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-teal-600 rounded-full"></div>}
  </button>
);

const TelemetryItem = ({ label, value, icon }) => (
  <div className="flex justify-between items-center group/tel relative overflow-hidden p-3 rounded-xl hover:bg-white/5 transition-all">
    <div className="flex items-center gap-4 relative z-10">
      <div className="text-slate-600 group-hover/tel:text-teal-500 transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-sm font-black text-teal-400 tabular-nums font-mono relative z-10">{value}</span>
  </div>
);

export default LabResults;
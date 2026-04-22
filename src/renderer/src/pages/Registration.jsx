import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Globe, MapPin, Cpu, Network, Wifi, Zap, ShieldAlert, Database,
  LineChart, Server, RadioReceiver, BarChart3, ArrowUpRight, Search,
  AlertCircle, CheckCircle2, Lock, Microscope, Clock, UserCircle, ChevronRight,
  Maximize2, DollarSign, Box, Layers, ArrowRight, UserPlus, Users,
  Fingerprint, Mic, UploadCloud, Barcode, Stethoscope, Smartphone,
  FlaskConical, Receipt, Save, Trash2, RefreshCcw, TrendingUp, FileDown, FileText,
  Laptop, Sparkles, Check, X, Dna, Flame, Target, Droplets, Info
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';
import { toast, Toaster } from 'react-hot-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import BarcodeGenerator from '../components/BarcodeGenerator';

const Registration = ({ user }) => {
  const { setActivePage, setBillingSearch } = useGlobalStore();
  const [activeTab, setActiveTab] = useState('registration');
  const [activeNode, setActiveNode] = useState('ALL');
  const [patients, setPatients] = useState([]);
  const [worklist, setWorklist] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [formData, setFormData] = useState({
    name: '', nic: '', age: '', gender: 'Male', phone: '', doctor_id: '', address: ''
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Biochemistry');
  const [barcodeModalOrder, setBarcodeModalOrder] = useState(null);
  const [selectedPatientModal, setSelectedPatientModal] = useState(null);
  const [patientResults, setPatientResults] = useState([]);
  const [isInjecting, setIsInjecting] = useState(false);
  const [selectedPushTargets, setSelectedPushTargets] = useState({});

  useEffect(() => {
    loadInitialData();
    loadPatients();
    loadWorklist();

    // Auto-refresh worklist every 60s
    const interval = setInterval(loadWorklist, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      const [cat, docs, mach] = await Promise.all([
        window.api.getTestCatalog(),
        window.api.getReferringDoctors(),
        window.api.getMachines()
      ]);
      setCatalog(cat || []);
      setDoctors(docs || []);
      setMachines(mach || []);
    } catch (e) {
      toast.error("DATA MATRIX LINK FAILED");
    }
  };

  const loadPatients = async () => {
    const data = await window.api.getPatients();
    setPatients(data || []);
  };

  const loadWorklist = async () => {
    const data = await window.api.getWorklist();
    setWorklist(data || []);
  };

  const handleNICChange = (val) => {
    setFormData({ ...formData, nic: val });
    if (val.length >= 10) extractNICData(val);
  };

  const extractNICData = (nic) => {
    let birthYear, days;
    if (nic.length === 10) {
      birthYear = "19" + nic.substring(0, 2);
      days = parseInt(nic.substring(2, 5));
    } else if (nic.length === 12) {
      birthYear = nic.substring(0, 4);
      days = parseInt(nic.substring(4, 7));
    } else return;

    const gender = days > 500 ? "Female" : "Male";
    const currentYear = new Date().getFullYear();
    const age = currentYear - parseInt(birthYear);
    setFormData(prev => ({ ...prev, gender, age: age.toString() }));
  };

  const toggleTest = (test) => {
    if (selectedTests.find(t => t.code === test.code)) {
      setSelectedTests(prev => prev.filter(t => t.code !== test.code));
    } else {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const handleRegistration = async () => {
    if (!formData.name || !formData.nic) return toast.error("IDENTIFIERS REQUIRED");
    if (selectedTests.length === 0) return toast.error("NO TESTS TARGETED");

    setSaving(true);
    try {
      const res = await window.api.registerPatient({
        ...formData,
        tests: selectedTests,
        user_id: user?.id
      });
      if (res.success) {
        // Create an invoice record for the Billing Matrix
        await window.api.createInvoice({
          nic: formData.nic,
          visitId: res.visitId || null,
          total: billTotal,
          discount: 0,
          paid: 0,
          status: 'PENDING'
        });

        toast.success("NODE SYNCHRONIZED - TRANSFERRING TO FINANCE MATRIX");

        // Trigger Success Modal instead of auto-redirecting
        setBarcodeModalOrder({
          name: formData.name,
          nic: formData.nic,
          testsString: selectedTests.map(t => t.name).join(','),
          amount: billTotal
        });

        setFormData({ name: '', nic: '', age: '', gender: 'Male', phone: '', doctor_id: '', address: '' });
        setSelectedTests([]);
        loadWorklist();
      }
    } catch (e) {
      toast.error("SYNC FAULT");
    } finally {
      setSaving(false);
    }
  };

  const handleAtomicPush = async (nic, machineId, silent = false) => {
    try {
      const result = await window.api.manualPushOrder({ nic, machineId });
      if (result.success) {
        if (!silent) toast.success(`LOCKED TO ${machineId}`);
        loadWorklist();
      } else {
        if (!silent) toast.error(`REJECTION: ${result.error}`);
      }
    } catch (e) {
      if (!silent) toast.error("GATEWAY ERROR");
    }
  };

  const handleBulkPush = async (order) => {
    const toPush = [];
    ['Hematology', 'Biochemistry', 'Electrolyte', 'Hormone'].forEach(cluster => {
      const targetKey = `${order.id}-${cluster}`;
      const mId = selectedPushTargets[targetKey];
      if (mId) toPush.push(mId);
    });

    if (toPush.length === 0) return toast.error("NO NODES TARGETED");

    toast.loading(`Deploying to ${toPush.length} separate nodes...`, { id: 'bulkpush' });
    let successCount = 0;
    for (const machineId of toPush) {
      const sentBefore = (order.machine_name || '').includes(machineId);
      if(!sentBefore) {
        await handleAtomicPush(order.nic, machineId, true);
        successCount++;
      }
    }
    toast.dismiss('bulkpush');
    toast.success(`Dispatched to ${successCount} separate nodes successfully!`);
    loadWorklist();
  };

  const handlePrintBarcode = (patientName, nic, testsString) => {
    const cats = getCategorizedTests(testsString);
    const categoryList = Object.keys(cats);

    if (categoryList.length === 0) {
      // Fallback to single label if no categories found
      printSingleLabel(patientName, nic, testsString);
      return;
    }

    // Print labels for each category
    categoryList.forEach((cat, index) => {
      const catTests = cats[cat].join(', ');
      setTimeout(() => {
        printSingleLabel(patientName, nic, catTests, cat);
      }, index * 1000); // 1s delay between labels to allow print spooler
    });
  };

  const printSingleLabel = (patientName, nic, testsDisplay, categoryName = '') => {
    const printWin = window.open('', '_blank', 'width=400,height=300');
    if (!printWin) return toast.error("Pop-up blocked. Allow pop-ups for Barcode Printing.");

    let shortTests = testsDisplay || '';
    if (shortTests.length > 50) shortTests = shortTests.substring(0, 47) + '...';

    printWin.document.write(`
      <html>
      <head>
        <title>Barcode - ${categoryName || 'General'}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
        <style>
          @page { margin: 0; size: auto; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; color: #000; }
          .label { text-align: center; border: 2px dashed #333; padding: 10px 20px; border-radius: 8px; max-width: 250px; position: relative; }
          .category-tag { position: absolute; top: 0; right: 0; background: #000; color: #fff; font-size: 8px; padding: 2px 6px; border-radius: 0 6px 0 6px; font-weight: 900; text-transform: uppercase; }
          .name { font-weight: 900; font-size: 14px; margin-bottom: 2px; text-transform: uppercase; }
          .tests { font-size: 9px; margin-top: 2px; color: #333; font-weight: bold; text-transform: uppercase; line-height: 1.1; }
        </style>
      </head>
      <body>
        <div class="label">
          ${categoryName ? `<div class="category-tag">${categoryName}</div>` : ''}
          <div class="name">${patientName}</div>
          <canvas id="barcode"></canvas>
          <div class="tests">${shortTests}</div>
        </div>
        <script>
          window.onload = () => {
            try {
              JsBarcode("#barcode", "${nic}", { format: "CODE128", width: 1.5, height: 45, displayValue: true, fontSize: 13, fontOptions: "bold", margin: 5 });
            } catch(e) {}
            setTimeout(() => { window.print(); window.close(); }, 700);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const getCategorizedTests = (testsString) => {
    if (!testsString) return {};
    const names = testsString.split(',');
    const grouped = {};
    names.forEach(n => {
      const info = catalog.find(c => c.name === n.trim() || c.code === n.trim());
      const cat = info?.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(n);
    });
    return grouped;
  };

  const openPatientModal = async (pat) => {
    setSelectedPatientModal(pat);
    try {
      const data = await window.api.getPatientResults({ nic: pat.nic });
      if (data && data.results) {
        setPatientResults(data.results);
      }
    } catch (e) {
      console.log('Results sync fail');
    }
  };

  const billTotal = selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 font-sans selection:bg-emerald-500/30">
      <Toaster position="top-right" />

      {/* --- HUD: NEURAL STATUS STRIP --- */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-110 transition-transform duration-1000">
            <RadioReceiver size={300} />
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="h-20 w-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 shadow-2xl">
              <Activity className="text-emerald-400 animate-pulse" size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Diagnostic <span className="text-emerald-500">Hub</span></h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-1">Real-Time Ingress & Control Matrix</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 bg-black/40 p-3 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl items-center shadow-2xl">
          {[
            { id: 'registration', label: 'Intake Node', icon: UserPlus },
            { id: 'worklist', label: 'Command Hub', icon: Zap },
            { id: 'patients', label: 'Nexus DB', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all border ${activeTab === tab.id ? 'bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-600/20' : 'bg-transparent border-transparent text-slate-500 hover:text-white'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'registration' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-8"
          >
            {/* 1. INTAKE PROTOCOL */}
            <div className="xl:col-span-4 space-y-6">
              <div className="bg-white/[0.03] border border-white/5 rounded-[3.5rem] p-10 backdrop-blur-3xl shadow-2xl">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-1.5 h-12 bg-emerald-500 rounded-full" />
                  <h2 className="text-2xl font-black uppercase italic">Patient Profile</h2>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Patient Name</label>
                    <input
                      className="w-full h-16 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm font-bold placeholder:text-slate-700 focus:border-emerald-500/50 focus:bg-emerald-500/[0.02] transition-all"
                      placeholder="ENTER FULL IDENTITY"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">National ID / NIC</label>
                      <input
                        className="w-full h-16 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm font-bold focus:border-emerald-500/50"
                        placeholder="ID NUMBER"
                        value={formData.nic}
                        onChange={(e) => handleNICChange(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Calculated Age</label>
                      <input
                        className="w-full h-16 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm font-bold"
                        placeholder="AUTO"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Gender</label>
                      <select
                        className="w-full h-16 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm font-bold appearance-none cursor-pointer"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Contact Link</label>
                      <input
                        className="w-full h-16 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm font-bold"
                        placeholder="+94 7X XXX XXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TEST MAPPING GRID */}
            <div className="xl:col-span-8 flex flex-col gap-8">
              <div className="bg-white/[0.03] border border-white/5 rounded-[3.5rem] p-10 backdrop-blur-3xl shadow-2xl flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-1.5 h-12 bg-emerald-500 rounded-full" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tight">Test Protocol Mapping</h2>
                  </div>
                  <div className="flex bg-black/40 p-2 rounded-2xl border border-white/10 gap-2">
                    {['Biochemistry', 'Hematology', 'Electrolyte', 'Hormone'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {catalog
                    .filter(t => t.category === activeCategory)
                    .map(test => {
                      const isSelected = selectedTests.find(st => st.code === test.code);
                      return (
                        <button
                          key={test.code}
                          onClick={() => toggleTest(test)}
                          className={`group p-5 rounded-3xl border transition-all text-left relative overflow-hidden ${isSelected ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                        >
                          {isSelected && <Check className="absolute top-4 right-4 text-white" size={16} />}
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>{test.code}</p>
                          <p className={`text-sm font-black leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>{test.name}</p>
                          <div className={`mt-4 text-[10px] font-bold ${isSelected ? 'text-emerald-100' : 'text-emerald-500'}`}>Rs. {test.price.toLocaleString()}</div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 3. FINAL LOCK & PAY */}
              <div className="bg-emerald-600 rounded-[3rem] p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl shadow-emerald-600/30 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-10 opacity-20"><Zap size={140} /></div>
                <div className="flex items-center gap-10">
                  <div className="text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-70">Total Diagnostic Surcharge</p>
                    <div className="text-5xl font-black tabular-nums tracking-tighter">Rs. {billTotal.toLocaleString()}</div>
                  </div>
                  <div className="h-16 w-px bg-white/20" />
                  <div className="text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-70">Tests Targeted</p>
                    <div className="text-5xl font-black tabular-nums tracking-tighter">{selectedTests.length}</div>
                  </div>
                </div>
                <button
                  onClick={handleRegistration}
                  className="bg-white text-emerald-700 h-20 px-16 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl"
                >
                  Confirm & Sync Node
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'worklist' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* NODE SELECTOR */}
            <div className="flex gap-4 bg-black/40 p-2 rounded-[2.5rem] border border-white/5 w-fit mx-auto shadow-2xl">
              {[
                { id: 'ALL', label: 'Global Matrix', icon: Globe },
                { id: 'Hematology', label: 'Hem Node', icon: Activity },
                { id: 'Biochemistry', label: 'Bio Node', icon: Droplets },
                { id: 'Electrolyte', label: 'Elec Node', icon: Zap },
                { id: 'Hormone', label: 'Hor Node', icon: Target }
              ].map(node => (
                <button
                  key={node.id}
                  onClick={() => setActiveNode(node.id)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeNode === node.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                >
                  <node.icon size={16} />
                  {node.label}
                </button>
              ))}
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-[4rem] p-12 backdrop-blur-3xl shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20"><Zap size={28} /></div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Bi-Directional Command Center</h2>
                </div>
                <button onClick={loadWorklist} className="flex items-center gap-3 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest"><RefreshCcw size={16} /> Pulse Refresh</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry ID</th>
                      <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Diagnostic Node</th>
                      <th className="py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Protocol</th>
                      <th className="py-6 px-10 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Route to Analyzer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {worklist
                      .filter(w => {
                        if (activeNode === 'ALL') return true;
                        const cats = getCategorizedTests(w.tests);
                        return cats[activeNode]?.length > 0;
                      })
                      .map(order => {
                        const cats = getCategorizedTests(order.tests);
                        return (
                          <tr key={order.id} className="group hover:bg-white/[0.01]">
                            <td className="py-8 px-4">
                              <p className="font-black italic text-slate-500 text-xs mb-3">#{order.id.toString().padStart(4, '0')}</p>
                              <button
                                onClick={() => handlePrintBarcode(order.patient_name, order.nic, order.tests)}
                                className="bg-white/10 hover:bg-emerald-500 hover:text-white text-slate-400 p-2 rounded-xl transition-all border border-white/5 hover:border-emerald-500 shadow-sm"
                                title="Print Barcode Label"
                              >
                                <Barcode size={16} />
                              </button>
                            </td>
                            <td className="py-8 px-4">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white font-black">{order.patient_name ? order.patient_name.charAt(0) : '?'}</div>
                                <div>
                                  <p className="text-sm font-black uppercase tracking-tight">{order.patient_name || 'Unknown Patient'}</p>
                                  <p className="text-[10px] font-bold text-slate-500 tracking-widest">{order.nic}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-8 px-4">
                              <div className="flex flex-wrap gap-2">
                                {Object.keys(cats).map(c => (
                                  <span key={c} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">{c}</span>
                                ))}
                              </div>
                            </td>
                            <td className="py-8 px-10 text-right">
                              <div className="flex flex-col items-end gap-4">
                                {['Hematology', 'Biochemistry', 'Electrolyte', 'Hormone'].map(cluster => {
                                  if (!cats[cluster]) return null;
                                  const cMachines = machines.filter(m => m.category === cluster);
                                  if (cMachines.length === 0) return (
                                    <div key={cluster} className="text-[10px] text-slate-500 uppercase tracking-widest bg-black/20 p-2 rounded-2xl px-4 text-center border border-white/5">{cluster}: No Analyzer Nodes Localized</div>
                                  );

                                  const targetKey = `${order.id}-${cluster}`;
                                  // Default to first machine if only one exists in the node cluster
                                  const selectedMachineId = selectedPushTargets[targetKey] || (cMachines.length === 1 ? cMachines[0].id : '');
                                  const sentToThisCategory = cMachines.some(m => (order.machine_name || '').includes(m.id));

                                  return (
                                    <div key={cluster} className="flex gap-2 items-center bg-black/20 p-2 rounded-2xl border border-white/5">
                                      <span className="text-[9px] font-black text-slate-500 uppercase w-24 text-left ml-2">{cluster}</span>
                                      
                                      <select 
                                        value={selectedMachineId}
                                        onChange={(e) => setSelectedPushTargets(prev => ({ ...prev, [targetKey]: e.target.value }))}
                                        className="h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-[10px] font-bold text-white outline-none w-[180px] hover:border-emerald-500 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                                      >
                                        <option value="" disabled>Select Logic Node...</option>
                                        {cMachines.map(m => (
                                          <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                      </select>

                                      <button
                                        disabled={!selectedMachineId}
                                        onClick={() => handleAtomicPush(order.nic, selectedMachineId)}
                                        className={`h-10 px-6 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-3 ${sentToThisCategory ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-xl shadow-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                      >
                                        <Zap size={14} className={sentToThisCategory ? 'text-indigo-500' : 'text-emerald-100'} />
                                        {sentToThisCategory ? `Sent` : `Dispatch`}
                                      </button>
                                    </div>
                                  );
                                })}

                                <div className="mt-2 w-full flex justify-end">
                                  <button 
                                    onClick={() => handleBulkPush(order)}
                                    className="h-10 px-6 rounded-xl text-[9px] text-teal-100 font-black uppercase tracking-[0.2em] bg-teal-600 hover:bg-teal-500 transition-all flex items-center gap-2 shadow-lg shadow-teal-900/20"
                                  >
                                    <Network size={14} /> Master Dispatch To Separate Nodes
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'patients' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-[3.5rem] p-12 backdrop-blur-3xl shadow-2xl">
              <div className="flex items-center gap-8 mb-12">
                <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 rounded-[2rem] flex items-center justify-center border border-white/10"><Users size={32} /></div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Diagnostic Nexus Database</h2>
              </div>
              {/* PATIENT GRID UI */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.map(pat => (
                  <div
                    key={pat.nic}
                    onClick={() => openPatientModal(pat)}
                    className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.04] transition-all group cursor-pointer active:scale-95"
                  >
                    <div className="flex items-center gap-5 mb-6">
                      <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-xl italic">
                        {pat.name ? pat.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-black text-lg uppercase tracking-tight">{pat.name || 'Unknown Patient'}</p>
                        <p className="text-xs text-slate-500 font-bold tracking-widest">{pat.nic}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                      <div><p className="text-[10px] font-black text-slate-600 uppercase">Age</p><p className="font-bold">{pat.age}</p></div>
                      <div><p className="text-[10px] font-black text-slate-600 uppercase">Gender</p><p className="font-bold">{pat.gender}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POST-REGISTRATION SUCCESS MODAL */}
      <AnimatePresence>
        {barcodeModalOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl bg-slate-950 border border-emerald-500/30 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(16,185,129,0.1)] flex flex-col items-center text-center"
            >
              <div className="h-24 w-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-8 border-[0.5rem] border-slate-950 shadow-[0_0_0_2px_rgba(16,185,129,0.5)]">
                <Check size={40} strokeWidth={3} />
              </div>

              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Node Synchronized</h2>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-10">Patient Telemetry Locked and Active in the Live Grid.</p>

              <div className="w-full space-y-4">
                {/* Visual Barcode Display inside Modal */}
                <div className="flex justify-center bg-white rounded-2xl p-4 shadow-inner mb-6">
                  <BarcodeGenerator value={barcodeModalOrder.nic} />
                </div>

                <button
                  onClick={() => handlePrintBarcode(barcodeModalOrder.name, barcodeModalOrder.nic, barcodeModalOrder.testsString)}
                  className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-4"
                >
                  <Barcode size={20} /> Print Categorical Barcodes
                </button>

                <button
                  onClick={() => {
                    setBarcodeModalOrder(null);
                    if (setBillingSearch && setActivePage) {
                      setBillingSearch(barcodeModalOrder.nic);
                      setActivePage('billing');
                    }
                  }}
                  className="w-full h-16 bg-indigo-600/20 border border-indigo-500/50 hover:bg-indigo-600 text-indigo-100 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-4"
                >
                  <Receipt size={20} /> Process Invoice & Receipt
                </button>

                <button
                  onClick={() => setBarcodeModalOrder(null)}
                  className="w-full h-12 bg-transparent text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all mt-4"
                >
                  Dismiss
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PATIENT MODAL: FULL DETAILS, QUEUE, INJECT, & REPORT */}
      {selectedPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-slate-950 border border-emerald-500/30 rounded-[3.5rem] shadow-[0_0_100px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-emerald-950/20">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                  <UserCircle size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Node Intelligence</h2>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Integrated Bio-Telemetry View</p>
                </div>
              </div>
              <button onClick={() => setSelectedPatientModal(null)} className="h-14 w-14 bg-white/5 text-slate-400 hover:text-white rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar-dark grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LEFT COLUMN: Node Demographics & Queue Data */}
              <div className="space-y-8">
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 opacity-5"><Users size={200} /></div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Subject Identity</h3>
                  <div className="space-y-4 relative z-10">
                    <p className="text-4xl font-black uppercase text-white italic">{selectedPatientModal.name}</p>
                    <p className="text-xl font-bold font-mono tracking-widest text-emerald-400">{selectedPatientModal.nic}</p>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
                      <div><p className="text-[10px] uppercase font-black text-slate-500">Gender</p><p className="font-bold">{selectedPatientModal.gender}</p></div>
                      <div><p className="text-[10px] uppercase font-black text-slate-500">Age</p><p className="font-bold">{selectedPatientModal.age}</p></div>
                    </div>
                    {/* Visual Barcode Display inside Modal */}
                    <div className="flex justify-center bg-white rounded-xl py-2 mt-4 shadow-inner">
                      <BarcodeGenerator value={selectedPatientModal.nic} />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3"><Clock size={14} /> Queue Status</h3>
                  <div className="space-y-4">
                    {(() => {
                      const order = worklist.find(w => w.nic === selectedPatientModal.nic);
                      if (!order) return <p className="text-sm font-black text-amber-500/60 uppercase">No active queue detected</p>;
                      const cats = getCategorizedTests(order.tests);
                      return (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {Object.keys(cats).map(c => (
                              <div key={c} className="bg-emerald-900/20 border border-emerald-500/20 px-3 py-2 rounded-xl">
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-1">{c}</span>
                                <span className="text-xs font-bold text-slate-300 uppercase">{cats[c].join(', ')}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handlePrintBarcode(order.patient_name, order.nic, order.tests)}
                            className="w-full mt-4 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3"
                          >
                            <Barcode size={16} /> Print Categorical Barcodes
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Actions & Reports */}
              <div className="space-y-8">
                <div className="bg-white/[0.02] border border-indigo-500/20 p-8 rounded-3xl group">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-3"><Zap size={14} /> Target Injection</h3>
                  <p className="text-xs text-slate-400 mb-6 font-medium">Force a direct telemetry push to analyzers for this subject bypassing global dispatch.</p>

                  {isInjecting ? (
                    <div className="grid grid-cols-2 gap-3">
                      {machines.filter(m => m.status === 'Online').map(m => (
                        <button
                          key={m.id}
                          onClick={async () => {
                            await handleAtomicPush(selectedPatientModal.nic, m.id);
                            setIsInjecting(false);
                          }}
                          className="h-10 bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 font-bold text-[9px] uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 justify-center"
                        >
                          <Network size={12} /> {m.name}
                        </button>
                      ))}
                      <button onClick={() => setIsInjecting(false)} className="col-span-2 mt-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest">Cancel Injection</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsInjecting(true)} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                      <Cpu size={16} /> Select Diagnostic Node
                    </button>
                  )}
                </div>

                <div className="bg-white/[0.02] border border-teal-500/20 p-8 rounded-3xl flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-6 flex items-center gap-3"><FileDown size={14} /> Reporting Engine</h3>
                    <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5 mb-6">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sync Packets Available</span>
                      <span className="text-xl font-black tabular-nums text-white">{patientResults.length}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPatientModal(null);
                      // Redirect to the clinical results matrix to print
                      if (setBillingSearch && setActivePage) {
                        setBillingSearch(selectedPatientModal.nic);
                        setActivePage('results');
                      }
                    }}
                    className="w-full h-16 bg-teal-600/20 border border-teal-500/50 hover:bg-teal-600 text-teal-100 font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl transition-all flex items-center justify-center gap-3"
                  >
                    <FileText size={18} className="animate-pulse" /> Generate Master Report
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #14b8a6; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Registration;

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Dna, 
  Search, 
  FileText, 
  Download, 
  CheckCircle2, 
  Activity, 
  ArrowRight,
  User,
  FlaskConical,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Supabase Client Initialization ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [nic, setNic] = useState('');
  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('login'); // 'login' | 'dashboard'

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!nic) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Patient Demo
      const { data: patientData, error: pError } = await supabase
        .from('patients')
        .select('*')
        .eq('nic', nic.toUpperCase())
        .single();

      if (pError || !patientData) {
        throw new Error('Patient record not found. Please verify your NIC.');
      }

      setPatient(patientData);

      // 2. Fetch Validated Results
      const { data: resultsData, error: rError } = await supabase
        .from('results')
        .select('*')
        .eq('patient_nic', nic.toUpperCase())
        .eq('status', 'VALIDATED')
        .order('timestamp', { ascending: false });

      if (rError) throw rError;

      setResults(resultsData || []);
      setView('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setView('login');
    setNic('');
    setPatient(null);
    setResults([]);
  };

  return (
    <div className="min-h-screen">
      <div className="bg-mesh" />
      
      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="auth-wrapper"
          >
            <div className="glass-card">
              <div className="flex flex-col items-center mb-12">
                <div className="h-16 w-16 bg-teal-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-teal-500/30 mb-6 border border-white/20">
                  <Dna size={32} />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                  Mediccon<span className="text-teal-500">Cloud</span>
                </h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">Smart Patient Results Portal</p>
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-3">Input Your Identity (NIC)</label>
                  <input 
                    type="text"
                    value={nic}
                    onChange={(e) => setNic(e.target.value.toUpperCase())}
                    placeholder="ENTER NIC NUMBER..."
                    className="input-field"
                    required
                  />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] font-black text-rose-400 uppercase tracking-widest leading-relaxed text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-premium flex items-center justify-center gap-4"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Establish Secure Link <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-4 grayscale opacity-40">
                <ShieldCheck size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">HL7 Protected Protocol</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 lg:p-12 max-w-6xl mx-auto"
          >
            {/* Header Node */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 bg-slate-950/40 p-10 rounded-[3rem] border border-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-gradient-to-br from-teal-500 to-cyan-700 rounded-3xl flex items-center justify-center text-white shadow-3xl">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">{patient?.name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-teal-400 font-mono tracking-widest uppercase bg-teal-500/10 px-3 py-1 rounded-full">{patient?.nic}</span>
                    <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject Maturity: Validated</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all active:scale-95"
              >
                Terminate Session
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Sidebar Stats */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <Activity size={120} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Cloud Status Node</h4>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="status-ring" />
                      <span className="text-lg font-black text-white uppercase tracking-tighter">System Live</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight">
                      All diagnostic data is encrypted and mirrored from the local master-node in real-time.
                    </p>
                  </div>
                </div>

                <div className="bg-teal-600 p-8 rounded-[2.5rem] shadow-3xl shadow-teal-500/20 group">
                    <h4 className="text-[10px] font-black text-teal-200 uppercase tracking-[0.3em] mb-6">Patient Summary</h4>
                    <div className="space-y-6">
                      <div className="flex justify-between border-b border-teal-500 pb-4">
                        <span className="text-[9px] font-black text-teal-200 uppercase">Age Spectrum</span>
                        <span className="text-sm font-black text-white uppercase">{patient?.age} Years</span>
                      </div>
                      <div className="flex justify-between border-b border-teal-500 pb-4">
                        <span className="text-[9px] font-black text-teal-200 uppercase">Gender Identity</span>
                        <span className="text-sm font-black text-white uppercase">{patient?.gender}</span>
                      </div>
                    </div>
                </div>
              </div>

              {/* Investigation List */}
              <div className="lg:col-span-8 space-y-8">
                <div className="flex items-center gap-4 mb-4 ml-4">
                  <FlaskConical size={20} className="text-teal-500" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Diagnostic Archives</h3>
                  <div className="h-px flex-1 bg-white/5 mx-4"></div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{results.length} Files Found</span>
                </div>

                <div className="space-y-4">
                  {results.length === 0 ? (
                    <div className="p-20 text-center bg-white/5 rounded-[3rem] border border-white/5 opacity-50">
                      <Clock size={48} className="mx-auto mb-6 text-slate-600" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Pending Authorization</p>
                    </div>
                  ) : (
                    results.map((res, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={res.id} 
                        className="result-item"
                      >
                        <div className="flex items-center gap-6">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${res.machine_category === 'Hematology' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-400/20'}`}>
                            <Activity size={20} />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-[15px] tracking-tight uppercase mb-1">{res.test_name}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">ID: {res.id.toString().slice(-4)}</span>
                              <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{new Date(res.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-10">
                          <div className="text-right">
                             <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{res.test_value}</span>
                             <span className="text-[10px] font-black text-slate-500 ml-2 uppercase italic">{res.unit}</span>
                          </div>
                          <button 
                            onClick={() => window.print()}
                            className="h-12 w-12 bg-white/10 hover:bg-teal-600 text-white rounded-xl flex items-center justify-center transition-all group/dl"
                          >
                            <Download size={18} className="group-hover/dl:scale-110 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Global Footer */}
            <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 grayscale pb-20">
               <div className="flex items-center gap-3">
                 <div className="h-6 w-6 bg-white text-black font-black flex items-center justify-center text-[10px] rounded">M</div>
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">Mediccon Ecosystem</span>
               </div>
               <p className="text-[9px] font-black uppercase tracking-widest">© 2026 Smart Diagnostics Node | All Rights Reserved</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;

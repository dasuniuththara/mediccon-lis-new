import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Dna,
  ArrowRight,
  ShieldCheck,
  User,
  ShieldAlert,
  ArrowLeft,
  Search,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './Dashboard';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [nic, setNic] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('patient_login'); // 'patient_login' | 'staff_login' | 'patient_dashboard' | 'staff_dashboard'

  useEffect(() => {
    // Basic Persistence
    const saved = localStorage.getItem('mediccon_staff');
    if (saved) {
      setActiveUser(JSON.parse(saved));
      setView('staff_dashboard');
    }
  }, []);

  const handlePatientSearch = async (e) => {
    e.preventDefault();
    if (!nic) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: patientData, error: pError } = await supabase.from('patients').select('*').eq('nic', nic.toUpperCase()).single();
      if (pError || !patientData) throw new Error('Patient record not found. Please verify your NIC.');
      setPatient(patientData);
      const { data: resultsData, error: rError } = await supabase.from('results').select('*').eq('patient_nic', nic.toUpperCase()).eq('status', 'VALIDATED').order('timestamp', { ascending: false });
      if (rError) throw rError;
      setResults(resultsData || []);
      setView('patient_dashboard');
    } catch (err) { setError(err.message); } finally { setIsLoading(false); }
  };

  const hashPassword = async (string) => {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const hashedPassword = await hashPassword(password);
      const { data: userData, error: uError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', hashedPassword)
        .single();

      if (uError || !userData) throw new Error('Invalid Credentials. Please probe again.');
      setActiveUser(userData);
      localStorage.setItem('mediccon_staff', JSON.stringify(userData));
      setView('staff_dashboard');
    } catch (err) { setError(err.message); } finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('mediccon_staff');
    setView('patient_login');
    setActiveUser(null);
    setPatient(null);
    setResults([]);
    setNic('');
    setUsername('');
    setPassword('');
  };

  if (view === 'staff_dashboard') {
    return <Dashboard user={activeUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <div className="bg-mesh" />

      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50">
        <div className="flex bg-slate-900 border border-white/10 p-1.5 rounded-full backdrop-blur-xl">
          <button
            onClick={() => setView('patient_login')}
            className={`px-8 py-2.5 rounded-full text-[10px] uppercase font-black tracking-widest transition-all ${view === 'patient_login' ? 'bg-teal-600 text-white shadow-xl shadow-teal-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            Patient Portal
          </button>
          <button
            onClick={() => setView('staff_login')}
            className={`px-8 py-2.5 rounded-full text-[10px] uppercase font-black tracking-widest transition-all ${view === 'staff_login' ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            Diagnostic Command
          </button>
        </div>
      </div>

      <div className="auth-wrapper pt-32">
        <AnimatePresence mode="wait">
          {view === 'patient_login' && (
            <motion.div
              key="patient"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass-card"
            >
              <div className="flex flex-col items-center mb-12">
                <div className="h-16 w-16 bg-teal-600 rounded-3xl flex items-center justify-center text-white shadow-3xl mb-6">
                  <Search size={32} />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Diagnostic <span className="text-teal-400">Archives</span></h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3">Identity Retrieval Console</p>
              </div>

              <form onSubmit={handlePatientSearch} className="space-y-6">
                <input
                  type="text" value={nic} onChange={e => setNic(e.target.value.toUpperCase())}
                  placeholder="INPUT PATIENT NIC..." className="input-field" required
                />
                {error && <p className="text-[9px] font-black text-rose-400 text-center uppercase tracking-widest leading-relaxed p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">{error}</p>}
                <button disabled={isLoading} className="btn-premium flex items-center justify-center gap-4">
                  {isLoading ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Fetch Result Files <ArrowRight size={18} /></>}
                </button>
              </form>
            </motion.div>
          )}

          {view === 'staff_login' && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="glass-card !border-amber-500/20"
            >
              <div className="flex flex-col items-center mb-12">
                <div className="h-16 w-16 bg-amber-600 rounded-3xl flex items-center justify-center text-white shadow-3xl mb-6">
                  <LayoutDashboard size={32} />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Clinical <span className="text-amber-500">Node</span></h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3">Technician Authentication</p>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-6">
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="USER UNIQUE IDENTIFIER..." className="input-field" required
                />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="ACCESS KEY..." className="input-field" required
                />
                {error && <p className="text-[9px] font-black text-rose-400 text-center uppercase tracking-widest leading-relaxed p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">{error}</p>}
                <button disabled={isLoading} className="btn-premium !bg-amber-600 flex items-center justify-center gap-4">
                  {isLoading ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Authorize Uplink <ShieldCheck size={18} /></>}
                </button>
              </form>
            </motion.div>
          )}

          {view === 'patient_dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl w-full p-12 bg-slate-950/80 border border-white/5 backdrop-blur-3xl rounded-[3rem] shadow-4xl shadow-black/50">
              <button onClick={() => setView('patient_login')} className="flex items-center gap-2 text-teal-500 text-[10px] font-black uppercase tracking-widest mb-10">
                <ArrowLeft size={16} /> Exit Archive
              </button>
              <div className="flex items-center gap-8 mb-16">
                <div className="h-14 w-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white"><User size={28} /></div>
                <div>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{patient?.name}</h2>
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em]">{patient?.nic}</span>
                </div>
              </div>
              <div className="space-y-4">
                {results.map(res => (
                  <div key={res.id} className="flex justify-between items-center p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all group">
                    <div>
                      <p className="text-xl font-black text-white italic uppercase tracking-tight">{res.test_name}</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Sample Time: {new Date(res.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-white font-mono tracking-tighter">{res.test_value} <span className="text-xs italic text-teal-500">{res.unit}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;

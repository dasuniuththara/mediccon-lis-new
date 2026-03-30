import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UserPlus,
  Fingerprint,
  User,
  Calendar,
  Users,
  Save,
  RefreshCcw,
  CheckCircle2,
  Zap,
  Printer,
  Receipt,
  Microscope,
  Trash2,
  CreditCard,
  Search,
  ChevronRight,
  Info as InfoIcon,
  ClipboardList,
  ShieldCheck,
  Activity,
  ArrowRight,
  Flame,
  Dna,
  HeartPulse,
  FlaskConical,
  Clock,
  Barcode,
  Layers,
  Sparkles,
  Database,
  Stethoscope,
  Smartphone,
  TrendingUp,
  Network,
  Cpu,
  Laptop,
  Sun,
  Moon,
  UploadCloud,
  FileDown,
  Target
} from 'lucide-react';
import Papa from 'papaparse';
import JsBarcode from 'jsbarcode';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useGlobalStore } from '../store/globalStore';
import { toast, Toaster } from 'react-hot-toast';
import BiometricScanner from '../components/BiometricScanner';

/**
 * Mediccon LIS Professional Intake & Registration Node
 * Premium interface for high‑throughput clinical registration and protocol authorizing.
 */
const generateTrendData = (nic) => {
  const seed = (nic || '').toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
  return Array.from({ length: 12 }).map((_, i) => ({
    val: 50 + Math.cos(seed * 0.5 + i) * 30 + Math.sin(i * 0.8) * 15
  }));
};

function Registration() {
  const {
    user,
    setActivePage,
    navigateNext,
    navigateBack,
    setSelectedPatient,
    labProfile,
    setBillingSearch
  } = useGlobalStore();

  const initialState = {
    title: 'Mr.',
    name: '',
    nic: '',
    age: '',
    age_type: 'Years',
    gender: 'Male',
    phone: '',
    doctor_id: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [isInfant, setIsInfant] = useState(false);
  const [nicExtractionFlash, setNicExtractionFlash] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Biochemistry');
  const [isSaved, setIsSaved] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [billAmount, setBillAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [worklist, setWorklist] = useState([]);
  const [machines, setMachines] = useState([]);
  const [authorizedCategories, setAuthorizedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('register');

  const statusData = useMemo(() => {
    const counts = { pending: 0, sent: 0, completed: 0 };
    worklist.forEach(order => {
      if (order.status === 'pending') counts.pending++;
      else if (order.status === 'sent_to_analyzer') counts.sent++;
      else if (order.status === 'completed') counts.completed++;
    });
    return [{ name: 'Orders', pending: counts.pending, sent: counts.sent, completed: counts.completed }];
  }, [worklist]);
  const [pushing, setPushing] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [showBulkTerminal, setShowBulkTerminal] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [biometricSyncing, setBiometricSyncing] = useState(false);

  const [lastVisitId, setLastVisitId] = useState(null);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [selectedTrendPatient, setSelectedTrendPatient] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [worklistSearch, setWorklistSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | PENDING | SENT | COMPLETED
  const [worklistSort, setWorklistSort] = useState('DESC'); // DESC | ASC

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [activeDictationField, setActiveDictationField] = useState(null);

  useEffect(() => {
    if (transcript && activeDictationField) {
      if (activeDictationField === 'nic') {
        const cleaned = transcript.replace(/\s+/g, '').toUpperCase();
        setFormData(prev => ({ ...prev, nic: cleaned }));
        if (cleaned.length >= 10) handleNicChange(cleaned);
      } else if (activeDictationField === 'name') {
        const cleaned = transcript.replace(/\b\w/g, l => l.toUpperCase());
        setFormData(prev => ({ ...prev, name: cleaned }));
      } else if (activeDictationField === 'phone') {
        const cleaned = transcript.replace(/[^0-9+]/g, '');
        setFormData(prev => ({ ...prev, phone: cleaned }));
      } else if (activeDictationField === 'age') {
        const cleaned = transcript.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, age: cleaned }));
      }
    }
  }, [transcript, activeDictationField]);

  const toggleDictation = (field) => {
    if (!browserSupportsSpeechRecognition) {
      toast.error('Voice commands are not supported in this browser environment.');
      return;
    }
    if (listening && activeDictationField === field) {
      SpeechRecognition.stopListening();
      setActiveDictationField(null);
    } else {
      resetTranscript();
      setActiveDictationField(field);
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      toast.success(`Voice Dictation started for ${field.toUpperCase()}`);
    }
  };

  const isDarkMode = document.documentElement.classList.contains('dark');
  const [darkToggle, setDarkToggle] = useState(isDarkMode);

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkToggle(isDark);
  };

  /* ------------------------------------------------------------------ */
  /*                         DATA LOADERS                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    loadCatalog();
    loadAuthCategories();
    loadPatients();
    loadDoctors();
    loadWorklist();
    loadMachines();
  }, []);

  const loadWorklist = async () => {
    try {
      const data = await window.api.getWorklist();
      setWorklist(data || []);
    } catch (e) {
      console.error('Worklist stream failure', e);
    }
  };

  const loadMachines = async () => {
    try {
      const data = await window.api.getMachines(user);
      setMachines(data || []);
    } catch (e) {
      console.error('Machine focus failure', e);
    }
  };

  const handleManualPush = async (nic, machineId) => {
    setPushing(true);
    try {
      const res = await window.api.manualPushOrder({ nic, machineId });
      if (res.success) {
        toast.success(`Order synchronized to node: ${machineId}`);
        loadWorklist();
      } else {
        toast.error(`Synchronization Fault: ${res.error}`);
      }
    } catch (e) {
      toast.error('Hardware Communication Error');
    } finally {
      setPushing(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await window.api.getReferringDoctors();
      setDoctors(data || []);
      const self = data.find(d => d.code === 'SELF');
      if (self) setFormData(prev => ({ ...prev, doctor_id: self.id }));
    } catch (e) {
      console.error('Doctors load failure', e);
    }
  };

  const viewTrends = async patient => {
    setSelectedTrendPatient(patient);
    setTrendLoading(true);
    setShowTrendModal(true);
    try {
      const data = await window.api.getPatientTrends(patient.nic);
      setTrendData(data || []);
    } catch (e) {
      console.error('Historical extraction failure', e);
    }
    setTrendLoading(false);
  };

  const loadPatients = async () => {
    try {
      const data = await window.api.getPatients(user);
      setPatients(data || []);
    } catch (e) {
      console.error('Registry load failure', e);
    }
  };

  const loadCatalog = async () => {
    try {
      const data = await window.api.getTestCatalog();
      setCatalog(data || []);
    } catch (e) {
      console.error('Catalog load failure', e);
    }
  };

  const loadAuthCategories = async () => {
    try {
      if (['Developer', 'MASTER ACCESS', 'Admin'].includes(user?.role)) {
        const data = await window.api.getTestCatalog();
        const categories = [
          ...new Set((data || []).map(t => t.category).filter(Boolean))
        ].filter(cat => cat !== 'Hematology-Parameter');
        setAuthorizedCategories(categories);
        if (categories.length) setActiveCategory(categories[0]);
        return;
      }
      const machines = await window.api.getMachines(user);
      const cats = [
        ...new Set((machines || []).map(m => m.category))
      ].filter(Boolean).filter(cat => cat !== 'Hematology-Parameter');
      setAuthorizedCategories(cats);
      if (cats.length) setActiveCategory(cats[0]);
    } catch (e) {
      console.error('Auth categories focus failed', e);
    }
  };

  /* ------------------------------------------------------------------ */
  /*                         NIC INTELLIGENCE LOGIC                      */
  /* ------------------------------------------------------------------ */
  const extractNicData = (nicValue) => {
    let rawNic = nicValue.toUpperCase().trim();
    if (!/^\d{9}[VX]$/.test(rawNic) && !/^\d{12}$/.test(rawNic)) return null;

    let birthYear, dayText;
    if (rawNic.length === 10) {
      birthYear = 1900 + parseInt(rawNic.substring(0, 2), 10);
      dayText = parseInt(rawNic.substring(2, 5), 10);
    } else {
      birthYear = parseInt(rawNic.substring(0, 4), 10);
      dayText = parseInt(rawNic.substring(4, 7), 10);
    }

    let gender = 'Male';
    let title = 'Mr.';
    if (dayText > 500) {
      gender = 'Female';
      title = 'Mrs.'; // Defaulting female to Mrs, though could be Miss
      dayText = dayText - 500;
    }

    if (dayText < 1 || dayText > 366) return null;

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age < 0 || age > 120) return null;

    return { age: age.toString(), gender, title };
  };

  const handleNicChange = (val) => {
    const rawValue = val.toUpperCase();

    setFormData(prev => {
      const extracted = extractNicData(rawValue);
      if (extracted) {
        // Trigger visual flash
        setNicExtractionFlash(true);
        setTimeout(() => setNicExtractionFlash(false), 2000);

        return {
          ...prev,
          nic: rawValue,
          age: extracted.age,
          gender: extracted.gender,
          title: extracted.title,
          age_type: 'Years'
        };
      }
      return { ...prev, nic: rawValue };
    });
  };

  /* ------------------------------------------------------------------ */
  /*                         UI LOGIC                                    */
  /* ------------------------------------------------------------------ */
  const toggleTest = test => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t.code === test.code);
      const newList = exists
        ? prev.filter(t => t.code !== test.code)
        : [...prev, { ...test }];
      const total = newList.reduce((acc, t) => acc + (t.price || 0), 0);
      setBillAmount(total);
      return newList;
    });
  };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (!formData.nic) return toast.error('Please enter the patient NIC or ID number.');
    if (!formData.name) return toast.error('Please enter the patient name.');

    // NIC validation (Sri Lankan format)
    const nicClean = formData.nic.trim().toUpperCase();
    const nicValid =
      /^\d{9}[VX]$/.test(nicClean) || /^\d{12}$/.test(nicClean);
    if (!nicValid)
      return toast.error(
        'Invalid NIC format. Use e.g. 901234567V or 199034500874.'
      );

    if (selectedTests.length === 0)
      return toast.error('Please select at least one test before registering.');

    setSaving(true);
    setBiometricSyncing(true);
  };

  /* ------------------------------------------------------------------ */
  /*                         BULK UPLOAD LOGIC                           */
  /* ------------------------------------------------------------------ */
  const fileInputRef = useRef(null);

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          toast.error("CSV file is empty.");
          return;
        }

        const previewData = rows.map((row, idx) => {
          const nicClean = (row.NIC || row.nic || "").trim().toUpperCase();
          const extracted = extractNicData(nicClean);
          return {
            id: idx,
            title: row.Title || extracted?.title || 'Mr.',
            name: row.Name || row.name || 'Unknown Patient',
            nic: nicClean,
            age: row.Age || extracted?.age || '20',
            gender: row.Gender || extracted?.gender || 'Male',
            phone: row.Phone || row.phone || '',
            selected: true,
            status: 'pending' // pending | processing | success | error
          };
        });

        setBulkPreview(previewData);
        setShowBulkTerminal(true);
      },
      error: (error) => {
        toast.error('Failed to parse CSV file: ' + error.message);
      }
    });
    e.target.value = null;
  };

  const handleExport = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data available for export.');
      return;
    }
    try {
      const csv = Papa.unparse(data);
      const dblob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(dblob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${filename} exported to CSV successfully!`);
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    }
  };

  /* ------------------------------------------------------------------ */
  /*                         PRINTING LOGIC                              */
  /* ------------------------------------------------------------------ */
  const printLabelFromRegistry = async patient => {
    try {
      const tests = await window.api.getPatientTests(patient.nic);
      printPatientLabel(patient, tests || []);
    } catch (e) {
      console.error('Print Error:', e);
      toast.error('Print Engine Failure: ' + (e.message || 'Device not detected.'));
    }
  };

  const printPatientLabel = (patient, tests) => {
    const printWin = window.open('', '_blank', 'width=400,height=300');
    const date = new Date();
    const dateStr = `${date
      .getDate()
      .toString()
      .padStart(2, '0')}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${date.getFullYear()} ${date
          .getHours()
          .toString()
          .padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;

    let barcodeDataUrl = '';
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, patient.nic, {
        format: 'CODE128',
        width: 1.5,
        height: 40,
        displayValue: false,
        margin: 2
      });
      barcodeDataUrl = canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Barcode generation failed', e);
    }

    const testNames = tests
      .map(t => t.test_name || t.name || '')
      .filter(Boolean);
    const testStr = testNames.join(' | ');

    printWin.document.write(`
      <html>
        <head>
          <title>Clinical Node Label - ${patient.name}</title>
          <style>
            @page { size: 2.0in 1.0in; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Segoe UI', Tahoma, sans-serif;
              width: 2.0in;
              height: 1.0in;
              background: #fff;
              color: #000;
              display: flex;
              flex-direction: column;
              padding: 4px 6px;
              overflow: hidden;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 0.8px solid #000;
              padding-bottom: 2px;
              margin-bottom: 4px;
            }
            .patient-name {
              font-size: 8.5pt;
              font-weight: 950;
              text-transform: uppercase;
              letter-spacing: -0.01em;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 1.5in;
            }
            .timestamp {
              font-size: 5pt;
              font-weight: 800;
              text-align: right;
              line-height: 1;
            }
            .demographics {
              font-size: 6pt;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.02em;
              display: flex;
              gap: 8px;
              margin-bottom: 2px;
            }
            .barcode-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .barcode-img {
              width: 1.8in;
              height: 40px;
              object-fit: fill;
            }
            .barcode-text {
              font-size: 6.5pt;
              font-family: 'Courier New', Courier, monospace;
              font-weight: 900;
              letter-spacing: 0.15em;
              margin-top: 1px;
            }
            .footer-tests {
              font-size: 5pt;
              font-weight: 900;
              text-transform: uppercase;
              border-top: 0.5px solid #000;
              padding-top: 2px;
              margin-top: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = () => window.close(); setTimeout(() => window.close(), 5000);">
          <div class="header">
            <div class="patient-name">${patient.title || ''} ${patient.name}</div>
            <div class="timestamp">${dateStr.split(' ')[1]}<br>${dateStr.split(' ')[0]}</div>
          </div>
          <div class="demographics">
            <span>NIC: ${patient.nic}</span>
            <span>| AGE: ${patient.age}${patient.age_type ? patient.age_type[0] : 'Y'}</span>
            <span>| ${patient.gender ? patient.gender.toUpperCase()[0] : ''}</span>
          </div>
          <div class="barcode-container">
            ${barcodeDataUrl ? `<img class="barcode-img" src="${barcodeDataUrl}" />` : '<div style="font-size:6pt;">BARCODE ERROR</div>'}
            <div class="barcode-text">${patient.nic}</div>
          </div>
          ${testStr ? `<div class="footer-tests">${testStr}</div>` : ''}
        </body>
      </html>
    `);
    printWin.document.close();

    setTimeout(() => {
      printWin.focus();
    }, 500);
  };

  const printReceiptFromRegistry = async patient => {
    try {
      setBillingSearch(patient.nic);
      setActivePage('billing');
    } catch (e) {
      console.error('Receipt navigation error', e);
      toast.error('Could not navigate to financial terminal.');
    }
  };

  const printBarcodeFromRegistry = async patient => {
    try {
      const tests = await window.api.getPatientTests(patient.nic);
      printPatientLabel(patient, tests || []);

      const canvas = document.createElement('canvas');
      JsBarcode(canvas, patient.nic, {
        format: 'CODE128',
        width: 2,
        height: 60
      });
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `Barcode_${patient.nic}_${patient.name
        .replace(/\s+/g, '_')}.png`;

      await window.api.saveBarcode({ dataUrl, filename });
    } catch (e) {
      console.error('Print/Save Error:', e);
      toast.error('Hardware Hub Error: Could not print or save barcode.');
    }
  };

  const categories =
    authorizedCategories.length > 0
      ? authorizedCategories
      : ['Biochemistry', 'Hematology', 'Electrolyte', 'Hormone'];

  /* ------------------------------------------------------------------ */
  /*                         MAIN RENDERING                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-1000 pb-32 font-sans selection:bg-teal-500/30">

      {/* Premium Notification Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDarkMode ? '#020617' : '#ffffff',
            color: isDarkMode ? '#f8fafc' : '#0f172a',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(24px)',
            borderRadius: '1rem',
            padding: '16px 20px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '11px',
            fontWeight: '900',
          },
          duration: 4000,
          success: {
            icon: <CheckCircle2 className="text-emerald-500 animate-[bounce_1s_infinite]" size={22} />,
          },
          error: {
            icon: <Zap className="text-rose-500 animate-pulse" size={22} />,
          },
        }}
      />

      {/* Biometric Syncing Overlay */}
      {biometricSyncing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-12 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-12 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[80px] animate-pulse"></div>
              <div className="h-48 w-48 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden">
                {/* Fingerprint Scanner Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] animate-scan-sweep mix-blend-screen z-20"></div>
                <div className="absolute top-0 left-0 w-full h-[100%] bg-gradient-to-b from-transparent to-emerald-500/20 animate-scan-sweep mix-blend-screen z-20" style={{ animationDelay: '0.1s' }}></div>

                <Fingerprint size={80} className="text-emerald-500 animate-pulse relative z-10" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em] italic">
                Encrypting Node
              </h2>
              <div className="flex items-center justify-center gap-3">
                <ShieldCheck size={18} className="text-emerald-500 animate-pulse" />
                <p className="text-[12px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                  Biometric Data Matrix Syncing...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Registration Terminal Overlay */}
      <BulkRegistrationTerminal
        show={showBulkTerminal}
        onClose={() => {
          if (!bulkProcessing) {
            setShowBulkTerminal(false);
            setBulkPreview([]);
          }
        }}
        previewData={bulkPreview}
        catalog={catalog}
        doctors={doctors}
        user={user}
        onComplete={() => {
          loadPatients();
          setShowBulkTerminal(false);
          setBulkPreview([]);
        }}
      />


      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 glass p-8 rounded-[3rem] shadow-xl shadow-slate-100/50 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-transparent to-transparent w-full animate-scan-sweep pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
          <UserPlus size={140} />
        </div>

        <div className="flex items-center gap-10 relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={navigateBack}
              className="h-12 w-12 glass-dark text-white rounded-2xl flex items-center justify-center hover:bg-teal-600 transition-all shadow-lg active:scale-90"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <button
              onClick={navigateNext}
              className="h-12 w-12 glass-dark text-white rounded-2xl flex items-center justify-center hover:bg-teal-600 transition-all shadow-lg active:scale-90"
            >
              <ArrowRight size={20} />
            </button>
            <button
              onClick={toggleDarkMode}
              className="h-12 w-12 glass-dark text-white rounded-2xl flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg active:scale-90 ml-4 border border-slate-600/50"
              title="Toggle Dark Mode"
            >
              {darkToggle ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-teal-300" />}
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-600 node-pulse shadow-[0_0_12px_rgba(20,184,166,0.8)]"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">
                Integrated Intake Protocol
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
              Patient <span className="text-teal-600">Registration</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100/50 p-1.5 rounded-2xl relative z-10 border border-slate-200 shadow-inner">
        <TabButton
          active={activeTab === 'register'}
          onClick={() => setActiveTab('register')}
          icon={<UserPlus size={16} />}
          label="Add Patient"
        />
        <TabButton
          active={activeTab === 'registry'}
          onClick={() => setActiveTab('registry')}
          icon={<Database size={16} />}
          label="Patient Registry"
        />
        <TabButton
          active={activeTab === 'worklist'}
          onClick={() => {
            setActiveTab('worklist');
            loadWorklist();
          }}
          icon={<Network size={16} />}
          label="Worklist Hub"
        />
      </div>

      {/* ==================== LIVE STATS RIBBON ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        {[
          { label: 'Patient Node Enrollment', value: patients.length, color: 'teal', icon: <Users size={16} /> },
          { label: 'Analyzer Throughput', value: worklist.filter(w => w.status === 'completed').length, color: 'emerald', icon: <Target size={16} /> },
          { label: 'Awaiting Diagnostic Result', value: worklist.filter(w => w.status === 'pending').length, color: 'amber', icon: <Clock size={16} /> },
          { label: 'Registry Capacity', value: '98.2%', color: 'cyan', icon: <Activity size={16} /> }
        ].map((stat, i) => (
          <div key={i} className="glass rounded-3xl p-6 border-white shadow-sm flex items-center justify-between group hover:scale-[1.02] transition-all">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
              <p className={`text-2xl font-black text-slate-900 tabular-nums`}>{stat.value}</p>
            </div>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100 group-hover:rotate-12 transition-all shadow-inner`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ==================== REGISTER TAB ==================== */}
      {activeTab === 'register' && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Left Panel – Form */}
            <div className="xl:col-span-8 space-y-10">
              {/* Patient Details Card */}
              <div className="glass rounded-[3.5rem] p-12 shadow-xl shadow-slate-100/50 space-y-12 relative overflow-hidden">
                <div className="flex items-center gap-6 border-b border-slate-100 pb-10">
                  <div className="h-12 w-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-teal-200/50">
                    <Fingerprint size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                    Patient Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* NIC */}
                  <div className="relative">
                    <InputField
                      label="Universal Identifier (NIC)"
                      placeholder="e.g. 199423456789"
                      icon={<CreditCard />}
                      value={formData.nic}
                      onChange={handleNicChange}
                    />
                    {browserSupportsSpeechRecognition && (
                      <button
                        onClick={() => toggleDictation('nic')}
                        className={`absolute right-4 top-1/2 -translate-y-1/3 p-2 rounded-full transition-all ${listening && activeDictationField === 'nic' ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-100 text-slate-400 hover:text-teal-500 hover:bg-teal-50'}`}
                        title="Dictate NIC"
                      >
                        <Zap size={14} />
                      </button>
                    )}
                    {nicExtractionFlash && (
                      <div className="absolute right-4 top-12 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl shadow-emerald-500/20 animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-2">
                        <Zap size={12} className="fill-current" /> Biometric Sync
                      </div>
                    )}
                  </div>

                  {/* Title + Name */}
                  <div className="space-y-4 group">
                    <div className="flex items-center gap-3 ml-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-600 shadow-[0_0_10px_rgba(20,184,166,0.6)] group-focus-within:animate-pulse"></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-600 shadow-[0_0_10px_rgba(20,184,166,0.6)] group-focus-within:animate-pulse"></div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
                        Patient Identity
                      </label>
                    </div>
                    <div className="flex gap-4">
                      <select
                        className="w-32 bg-white border border-slate-100 rounded-[1.5rem] py-5 px-6 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-12 focus:ring-teal-500/5 transition-all outline-none"
                        value={formData.title}
                        onChange={e => {
                          const title = e.target.value;
                          let gender = formData.gender;
                          if (title === 'Mr.') gender = 'Male';
                          if (title === 'Mrs.' || title === 'Miss') gender = 'Female';
                          setIsInfant(title === 'Baby');
                          setFormData({
                            ...formData,
                            title,
                            gender,
                            age_type: title === 'Baby' ? 'Months' : 'Years'
                          });
                        }}
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Miss">Miss</option>
                        <option value="Baby">Baby</option>
                      </select>

                      <div className="relative flex-1">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                          <User size={20} />
                        </div>
                        <input
                          className="w-full bg-white border border-slate-100 rounded-[2rem] py-5 pl-14 pr-8 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-12 focus:ring-teal-500/5 transition-all outline-none"
                          placeholder="Enter full name..."
                          value={formData.name}
                          onChange={e =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                        {browserSupportsSpeechRecognition && (
                          <button
                            onClick={() => toggleDictation('name')}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${listening && activeDictationField === 'name' ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-100 text-slate-400 hover:text-teal-500 hover:bg-teal-50'}`}
                            title="Dictate Name"
                          >
                            <Zap size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Age & Contact */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Age */}
                    <div className="space-y-4 group">
                      <div className="flex items-center gap-3 ml-1">
                        <div className={`h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.6)] ${nicExtractionFlash ? 'bg-emerald-500 shadow-emerald-500' : 'bg-teal-600'}`}></div>
                        <label className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors ${nicExtractionFlash ? 'text-emerald-500' : 'text-slate-600'}`}>
                          Chronological Age
                        </label>
                      </div>
                      <div className={`flex bg-white border rounded-[2rem] overflow-hidden group-focus-within:ring-12 transition-all duration-500 ${nicExtractionFlash ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-emerald-500/10' : 'border-slate-100 group-focus-within:ring-teal-500/5'}`}>
                        <input
                          type="number"
                          className={`flex-1 py-5 px-6 text-[13px] font-black outline-none transition-colors ${nicExtractionFlash ? 'text-emerald-600' : 'text-slate-900'}`}
                          placeholder={formData.age_type === 'Years' ? 'Years' : 'Months'}
                          value={formData.age}
                          onChange={e =>
                            setFormData({ ...formData, age: e.target.value })
                          }
                        />
                        {browserSupportsSpeechRecognition && (
                          <button
                            onClick={() => toggleDictation('age')}
                            className={`px-3 transition-all ${listening && activeDictationField === 'age' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-50 text-slate-400 hover:text-teal-500 hover:bg-teal-50'}`}
                            title="Dictate Age"
                          >
                            <Zap size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              age_type: formData.age_type === 'Years' ? 'Months' : 'Years'
                            })
                          }
                          className={`px-6 text-[9px] font-black uppercase tracking-widest transition-all ${formData.age_type === 'Months'
                            ? 'bg-amber-500 text-white'
                            : nicExtractionFlash ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {formData.age_type}
                        </button>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-4 group">
                      <div className="flex items-center gap-3 ml-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-teal-600 shadow-[0_0_10px_rgba(20,184,166,0.6)]"></div>
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                          Patient Contact
                        </label>
                      </div>
                      <div className="relative flex bg-white border border-slate-100 rounded-[2rem] overflow-hidden group-focus-within:ring-12 group-focus-within:ring-teal-500/5 transition-all duration-500">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                          <Smartphone size={20} />
                        </div>
                        <input
                          type="text"
                          className="flex-1 py-5 pl-14 pr-8 text-[13px] font-black outline-none text-slate-900"
                          placeholder="PH: +94 ..."
                          value={formData.phone}
                          onChange={e =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                        {browserSupportsSpeechRecognition && (
                          <button
                            onClick={() => toggleDictation('phone')}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${listening && activeDictationField === 'phone' ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-100 text-slate-400 hover:text-teal-500 hover:bg-teal-50'}`}
                            title="Dictate Contact"
                          >
                            <Zap size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-4 group">
                    <div className="flex items-center gap-3 ml-1">
                      <div className={`h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.6)] ${nicExtractionFlash ? 'bg-emerald-500 shadow-emerald-500' : 'bg-teal-600'}`}></div>
                      <label className={`text-[10px] font-black uppercase tracking-[0.4em] ${nicExtractionFlash ? 'text-emerald-500' : 'text-slate-600'}`}>
                        Gender Node
                      </label>
                    </div>
                    <select
                      className={`w-full bg-white border rounded-[1.5rem] py-5 px-8 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-12 outline-none transition-all duration-500 ${nicExtractionFlash ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] text-emerald-600 ring-emerald-500/10' : 'border-slate-100 focus:ring-teal-500/5'}`}
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male Profile</option>
                      <option value="Female">Female Profile</option>
                    </select>
                  </div>

                  {/* Referring Doctor */}
                  <div className="space-y-4 group">
                    <div className="flex items-center gap-3 ml-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
                        Referring Physician
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                        <Stethoscope size={20} />
                      </div>
                      <select
                        className="w-full bg-white border border-slate-100 rounded-[2rem] py-5 pl-14 pr-8 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-12 focus:ring-emerald-500/5 transition-all outline-none appearance-none"
                        value={formData.doctor_id}
                        onChange={e =>
                          setFormData({ ...formData, doctor_id: e.target.value })
                        }
                      >
                        <option value="">SELECT CLINICAL SOURCE</option>
                        {doctors.map(doc => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} [{doc.code}]
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="flex items-end pb-2">
                    <div className="bg-teal-50 p-5 rounded-2xl border border-teal-100 flex items-center gap-4 w-full">
                      <InfoIcon size={18} className="text-teal-500" />
                      <p className="text-[10px] font-bold text-teal-600/80 uppercase tracking-widest leading-relaxed">
                        Ensure identifiers match physical credentials for diagnostic audit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Selection Matrix */}
              <div className="glass rounded-[3.5rem] p-12 shadow-xl shadow-slate-100/50 space-y-12 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 glass-dark text-white rounded-2xl flex items-center justify-center shadow-2xl">
                      <Microscope size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                      Protocol Selection Matrix
                    </h3>
                  </div>

                  <div className="relative group w-full md:w-80">
                    <Search
                      className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-600 transition-colors"
                      size={18}
                    />
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-[11px] font-black text-slate-900 focus:bg-white focus:ring-8 focus:ring-teal-500/5 transition-all outline-none uppercase placeholder:text-slate-600"
                      placeholder="Filter Active Probes..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${activeCategory === cat
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xl shadow-teal-200/50 -translate-y-0.5'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-teal-200 hover:text-teal-600'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Test Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {catalog
                    .filter(t => t.category === activeCategory)
                    .filter(
                      t =>
                        !searchTerm ||
                        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(test => (
                      <TestNodeCard
                        key={test.code}
                        test={test}
                        isSelected={!!selectedTests.find(st => st.code === test.code)}
                        onToggle={() => toggleTest(test)}
                      />
                    ))}

                  {catalog.filter(t => t.category === activeCategory).length ===
                    0 && (
                      <div className="col-span-full py-20 text-center opacity-30 flex flex-col items-center gap-4">
                        <Dna size={60} className="animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                          No investigative nodes detected in this sector
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Right Panel – Decision Hub */}
            <div className="xl:col-span-4 sticky top-10 space-y-10">
              {/* Ledger Card */}
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-[0_60px_100px_rgba(0,0,0,0.4)] border border-slate-800 relative overflow-hidden group h-fit">
                <div className="absolute top-0 right-0 h-64 w-64 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-teal-400 border border-white/10 shadow-inner">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-[0.3em]">
                      Decision Node
                    </h3>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
                      Integrated Protocol Engine
                    </p>
                  </div>
                </div>

                <div className="space-y-10 relative z-10">
                  {isSaved ? (
                    <div className="animate-in zoom-in duration-500 space-y-12">
                      <div className="text-center space-y-6">
                        <div className="h-32 w-32 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500/20 shadow-[0_0_60px_rgba(16,185,129,0.3)] relative">
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-20"></div>
                          <ShieldCheck size={56} className="relative z-10" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-3xl font-black tracking-tighter uppercase italic text-emerald-400">
                            Patient Registered!
                          </h4>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
                            Successfully saved to the patient registry
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <ActionBtn
                          onClick={() => printLabelFromRegistry(formData)}
                          icon={<Barcode size={18} />}
                          label="Print Sample Label"
                          theme="white"
                        />
                        <ActionBtn
                          onClick={() => printReceiptFromRegistry(formData)}
                          icon={<Receipt size={18} />}
                          label="Print Receipt"
                          theme="dark"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setIsSaved(false);
                          setFormData(initialState);
                          setIsInfant(false);
                          setSelectedTests([]);
                          setBillAmount(0);
                        }}
                        className="w-full py-4 text-[10px] font-black text-teal-400 uppercase tracking-[0.5em] hover:text-teal-300 transition-all flex items-center justify-center gap-3 border border-white/5 rounded-2xl hover:bg-white/5"
                      >
                        Register Next Patient <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {/* Selected Tests Summary */}
                      <div className="space-y-6">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] pb-4 border-b border-white/5">
                          <span>Selected Tests</span>
                          <span className="text-teal-500">
                            {selectedTests.length} selected
                          </span>
                        </div>

                        <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar-dark pr-4">
                          {selectedTests.length === 0 ? (
                            <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                              <Clock size={40} />
                              <p className="text-[10px] font-black uppercase tracking-widest">
                                No tests selected yet
                              </p>
                            </div>
                          ) : (
                            selectedTests.map(t => (
                              <div
                                key={t.code}
                                className="flex justify-between items-center animate-in slide-in-from-right-4"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,1)]"></div>
                                  <span className="text-sm font-bold text-slate-600 truncate max-w-[200px] uppercase tracking-tight">
                                    {t.name}
                                  </span>
                                </div>
                                <span className="text-xs font-black text-slate-600 font-mono tracking-tighter">
                                  LKR {t.price.toLocaleString()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Billing Summary */}
                      <div className="pt-10 border-t border-white/5 space-y-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
                            Integrated Net Valuation
                          </span>
                          <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-black text-teal-500 tracking-tighter tabular-nums">
                              LKR
                            </span>
                            <span className="text-7xl font-black tracking-tighter tabular-nums font-mono leading-none">
                              {billAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleSubmit}
                          disabled={saving || selectedTests.length === 0}
                          className={`w-full h-20 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-6 transition-all active:scale-[0.97] shadow-xl hover:-translate-y-1 relative overflow-hidden group/authorize ${saving || selectedTests.length === 0
                            ? 'bg-slate-900 text-slate-600 border border-slate-800'
                            : 'bg-teal-600 text-white hover:bg-teal-500 shadow-teal-500/20'
                            }`}
                        >
                          {saving ? (
                            <>
                              <Fingerprint size={22} className="animate-pulse text-emerald-400" />
                              Authenticating...
                            </>
                          ) : (
                            <>
                              <Zap size={22} className="group-hover/authorize:fill-current group-hover/authorize:animate-pulse" />
                              Register Patient
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* System Integrity Notification */}
              <div className="bg-teal-50/5 border border-teal-500/10 rounded-[2.5rem] p-8 flex gap-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12">
                  <ShieldCheck size={100} className="text-teal-500" />
                </div>
                <div className="h-12 w-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em]">
                    Integrity Protocol Active
                  </p>
                  <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-widest">
                    Patient clinical matrix is encrypted at point of entry. All nodes
                    authorized under Mediccon Security Tier 1.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REGISTRY TAB ==================== */}
      {activeTab === 'registry' && (
        <div className="bg-white/60 dark:bg-slate-900/60 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-sm backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-700 min-h-[700px] flex flex-col">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-slate-950 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <Database size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                  Registry Matrix
                </h3>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  <p className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.3em]">
                    Total Active Nodes: {patients.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full justify-end lg:w-auto">
              <div className="relative group w-full lg:w-[400px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                <input
                  className="w-full bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] py-5 pl-14 pr-8 text-[13px] font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-12 focus:ring-teal-500/5 transition-all outline-none uppercase placeholder:text-slate-600 dark:placeholder:text-slate-500 shadow-sm"
                  placeholder="Global ID / Nomenclature Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleBulkUpload}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="h-14 px-6 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-lg active:scale-95 shrink-0"
              >
                <UploadCloud size={18} />
                Bulk CSV
              </button>
              <button
                onClick={() => handleExport(patients, 'PatientRegistry')}
                className="h-14 px-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-lg shadow-slate-100 dark:shadow-none active:scale-95 shrink-0"
              >
                <FileDown size={18} className="text-teal-600 dark:text-teal-400" />
                Export Matrix
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5">Integrity Status</th>
                  <th className="px-8 py-5">Universal ID (NIC)</th>
                  <th className="px-8 py-5">Subject Identity</th>
                  <th className="px-8 py-5">Biometric Hub</th>
                  <th className="px-8 py-5">Clinical Source</th>
                  <th className="px-8 py-5">Intake Stamp</th>
                  <th className="px-8 py-5">Trend Matrix</th>
                  <th className="px-8 py-5 text-right">Node Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 bg-white/20 dark:bg-slate-900/20">
                {patients
                  .filter(
                    p =>
                      !searchTerm ||
                      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (p.nic && p.nic.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((p, idx) => (
                    <tr key={p.nic || idx} className="group hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-all duration-500">
                      {/* Status Badge */}
                      <td className="px-8 py-5">
                        {p.total_tests === 0 ? (
                          <StatusBadge color="slate" icon={<Layers size={12} />} label="Null Data" />
                        ) : p.pending_tests > 0 ? (
                          <StatusBadge color="amber" icon={<Clock size={12} />} label={`${p.pending_tests} Awaiting`} pulse />
                        ) : (
                          <StatusBadge color="emerald" icon={<CheckCircle2 size={12} />} label="Validated" />
                        )}
                      </td>

                      {/* NIC */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-500 transition-all duration-500 shadow-sm">
                            <Fingerprint size={16} />
                          </div>
                          <span className="font-mono text-[13px] font-black text-slate-900 dark:text-slate-200 tracking-tighter uppercase">{p.nic}</span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-8 py-5">
                        <span className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight uppercase group-hover:text-teal-600 transition-colors duration-500">
                          {p.name}
                        </span>
                      </td>

                      {/* Gender / Age */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700 uppercase tracking-widest">{p.gender}</span>
                          <span className="text-[9px] font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-md border border-teal-100 dark:border-teal-800 uppercase tracking-widest">{p.age}Y Matrix</span>
                        </div>
                      </td>

                      {/* Referring Doctor */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <Stethoscope size={12} />
                          <span className="text-[10px] font-black uppercase tracking-tight">{p.doctor_name || 'SELF REFERRED'}</span>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="px-8 py-5">
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-black text-slate-900 dark:text-slate-200 uppercase">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</p>
                          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                        </div>
                      </td>

                      {/* Sparkline Trend Matrix */}
                      <td className="px-8 py-5">
                        <div className="h-8 w-24">
                          <LineChart width={96} height={32} data={generateTrendData(p.nic)}>
                            <Line
                              type="monotone"
                              dataKey="val"
                              stroke={p.pending_tests > 0 ? "#f59e0b" : "#10b981"}
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={true}
                              animationDuration={1500}
                            />
                          </LineChart>
                        </div>
                      </td>

                      {/* Controls */}
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0">
                          <ControlBtn
                            onClick={() => {
                              setSelectedPatient(p);
                              setActivePage('results');
                            }}
                            icon={<FlaskConical size={20} />}
                            theme="teal"
                            title="Analyzer Engine"
                          />
                          <ControlBtn
                            onClick={() => viewTrends(p)}
                            icon={<TrendingUp size={20} />}
                            theme="amber"
                            title="Clinical Trends"
                          />
                          <ControlBtn
                            onClick={() => printBarcodeFromRegistry(p)}
                            icon={<Barcode size={20} />}
                            theme="emerald"
                            title="Sample Trace"
                          />
                          <ControlBtn
                            onClick={() => printReceiptFromRegistry(p)}
                            icon={<Receipt size={20} />}
                            theme="cyan"
                            title="Financial Link"
                          />
                          <div className="h-10 w-px bg-slate-100 mx-1"></div>
                          <ControlBtn
                            onClick={async () => {
                              if (confirm('Purge Patient Node?')) {
                                await window.api.deletePatient(p.nic);
                                loadPatients();
                                toast.success('Node Purged');
                              }
                            }}
                            icon={<Trash2 size={20} />}
                            theme="rose"
                            title="Purge Node"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {activeTab === 'worklist' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700">
          <div className="glass rounded-[3.5rem] p-12 shadow-xl shadow-slate-100/50 space-y-12 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-10">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-slate-950 text-white rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                  <Network size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
                    Bi‑Directional Worklist
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                    Real‑time Diagnostic Order Stream
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleExport(worklist, 'DiagnosticWorklist')}
                  className="h-14 px-8 bg-white border border-slate-200 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-slate-50 transition-all flex items-center gap-4 active:scale-95"
                >
                  <FileDown size={18} className="text-teal-500" /> Export List
                </button>
                <button
                  onClick={loadWorklist}
                  className="h-14 px-8 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-teal-700 transition-all flex items-center gap-4 active:scale-95"
                >
                  <RefreshCcw size={18} /> Refresh Stream
                </button>
              </div>
            </div>
            {/* Analyzer Routing Visualization */}
            <div className="my-6 min-h-[200px]">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Analyzer Routing Overview</h3>
              <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
                <BarChart data={statusData}>
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pending" fill="#fbbf24" name="Pending" />
                  <Bar dataKey="sent" fill="#14b8a6" name="Sent to Analyzer" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                <input
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-[11px] font-black outline-none focus:ring-8 focus:ring-teal-500/5 transition-all uppercase"
                  placeholder="Filter Worklist Nodes (Name / ID)..."
                  value={worklistSearch}
                  onChange={(e) => setWorklistSearch(e.target.value)}
                />
              </div>

              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                {['ALL', 'PENDING', 'SENT', 'COMPLETED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${statusFilter === status
                      ? 'bg-slate-950 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setWorklistSort(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                className="h-14 px-6 bg-white border border-slate-200 rounded-2xl text-[9px] font-black text-slate-600 flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
              >
                <TrendingUp size={16} className={worklistSort === 'ASC' ? 'rotate-180' : ''} />
                {worklistSort === 'DESC' ? 'NEWEST' : 'OLDEST'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b-2 border-slate-950 pb-6 italic">
                    <th className="px-8 py-6">Status Vector</th>
                    <th className="px-8 py-6">Patient Identifier</th>
                    <th className="px-8 py-6">Node Protocols</th>
                    <th className="px-8 py-6">Temporal Stamp</th>
                    <th className="px-8 py-6 text-right">Node Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/20">
                  {worklist
                    .filter(order => {
                      const matchesSearch = !worklistSearch ||
                        order.patient_name.toLowerCase().includes(worklistSearch.toLowerCase()) ||
                        order.nic.toLowerCase().includes(worklistSearch.toLowerCase());

                      const orderStatus = order.status === 'sent_to_analyzer' ? 'SENT' : (order.status || 'PENDING').toUpperCase();
                      const matchesStatus = statusFilter === 'ALL' || orderStatus === statusFilter;

                      return matchesSearch && matchesStatus;
                    })
                    .sort((a, b) => {
                      const dateA = new Date(a.created_at);
                      const dateB = new Date(b.created_at);
                      return worklistSort === 'DESC' ? dateB - dateA : dateA - dateB;
                    })
                    .map(order => (
                      <tr key={order.id} className="hover:bg-teal-50/50 transition-all duration-500 group">
                        {/* Status */}
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-2 w-2 rounded-full ${order.status === 'pending'
                                ? 'bg-amber-500 animate-pulse'
                                : order.status === 'sent_to_analyzer'
                                  ? 'bg-teal-500 animate-ping'
                                  : 'bg-emerald-500'
                                }`}
                            ></div>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest ${order.status === 'pending'
                                ? 'text-amber-600'
                                : order.status === 'sent_to_analyzer'
                                  ? 'text-teal-600'
                                  : 'text-emerald-600'
                                }`}
                            >
                              {(order.status || 'PENDING')
                                .replace(/_/g, ' ')
                                .toUpperCase()}
                            </span>
                          </div>
                        </td>

                        {/* Patient */}
                        <td className="px-8 py-8">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-[14px] uppercase tracking-tight">
                              {order.patient_name}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter italic">
                              {order.nic}
                            </span>
                          </div>
                        </td>

                        {/* Tests / Node Protocols */}
                        <td className="px-8 py-8">
                          <div className="flex flex-col gap-3">
                            {(() => {
                              const testCodes = (order.tests || '').split(',').filter(Boolean);
                              const grouped = {};

                              testCodes.forEach(t => {
                                if (t === '[object Object]') return; // ignore malformed old data
                                const testInfo = catalog.find(c => c.code === t.trim() || c.name === t.trim() || c.analyzer_code === t.trim());
                                const cat = testInfo ? testInfo.category : 'General';
                                if (!grouped[cat]) grouped[cat] = [];
                                grouped[cat].push(t.trim());
                              });

                              if (Object.keys(grouped).length === 0 && testCodes.includes('[object Object]')) {
                                return (
                                  <span className="text-[9px] font-black text-rose-500 uppercase bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 w-max">
                                    Corrupted Tuple Data Use Override
                                  </span>
                                );
                              }

                              return Object.entries(grouped).map(([category, tests], idx) => (
                                <div key={idx} className="space-y-1.5">
                                  <span className="text-[8px] font-black text-teal-600/70 uppercase tracking-widest">{category} MATRIX</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {tests.map((test, i) => (
                                      <span
                                        key={i}
                                        className="text-[9px] font-black bg-white/40 border border-slate-300/50 px-2.5 py-1 rounded-md text-slate-700 uppercase group-hover:border-teal-400 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors"
                                      >
                                        {test}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="px-8 py-8">
                          <div className="space-y-1">
                            <p className="text-[11px] font-black text-slate-900 uppercase">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              {new Date(order.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>

                        {/* Manual Push Buttons */}
                        <td className="px-8 py-8 text-right align-middle">
                          <div className="flex flex-wrap justify-end gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 max-w-[200px] ml-auto">
                            {(() => {
                              const testCodes = (order.tests || '').split(',').filter(Boolean);
                              const orderedCategories = new Set();
                              testCodes.forEach(t => {
                                const testInfo = catalog.find(c => c.code === t.trim() || c.name === t.trim() || c.analyzer_code === t.trim());
                                if (testInfo) orderedCategories.add(testInfo.category);
                              });

                              return machines
                                .filter(m => m.status === 'Online')
                                .map(m => {
                                  const isRequired = orderedCategories.has(m.category);

                                  return (
                                    <button
                                      key={m.id}
                                      onClick={() => handleManualPush(order.nic, m.id)}
                                      disabled={pushing}
                                      className={`h-9 px-3 flex items-center gap-2 rounded-xl text-[8.5px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${isRequired
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 border border-emerald-400'
                                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                                        }`}
                                    >
                                      <Cpu size={12} className={isRequired ? "animate-pulse" : ""} /> {m.name}
                                    </button>
                                  );
                                });
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}

                  {worklist.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-24 text-center">
                        <div className="opacity-20 flex flex-col items-center gap-4">
                          <Laptop size={60} />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                            No active diagnostic worklist nodes detected
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showTrendModal && (
        <PatientTrendModal
          patient={selectedTrendPatient}
          data={trendData}
          onClose={() => setShowTrendModal(false)}
          loading={trendLoading}
        />
      )}

      <BulkRegistrationTerminal
        show={showBulkTerminal}
        onClose={() => setShowBulkTerminal(false)}
        previewData={bulkPreview}
        catalog={catalog}
        doctors={doctors}
        user={user}
        onComplete={() => {
          setShowBulkTerminal(false);
          loadPatients();
          loadWorklist();
        }}
      />

      {biometricSyncing && (
        <BiometricScanner onComplete={async () => {
          const nicClean = formData.nic.trim().toUpperCase();
          const payload = {
            ...formData,
            nic: nicClean,
            barcode: nicClean,
            tests: selectedTests.map(t => ({
              code: t.code,
              name: t.name,
              category: t.category,
              price: t.price
            })),
            total: billAmount,
            user_id: user?.id,
            created_at: new Date()
          };

          try {
            const result = await window.api.registerPatient(payload);
            if (result.success) {
              await window.api.createInvoice({
                nic: nicClean,
                visitId: result.visitId,
                total: billAmount,
                status: 'PENDING'
              });

              setFormData(prev => ({ ...prev, nic: nicClean }));
              setLastVisitId(result.visitId);
              setIsSaved(true);
              loadPatients();
              toast.success('Patient registered successfully!');
            } else {
              toast.error('Registration failed: ' + (result.error || 'Unknown error.'));
            }
          } catch (e) {
            console.error('Registration fatal error', e);
            toast.error('Registration failed. Check your connection and try again.');
          } finally {
            setSaving(false);
            setBiometricSyncing(false);
          }
        }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                         REUSABLE COMPONENTS                        */
/* ------------------------------------------------------------------ */

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500 relative ${active
      ? 'bg-white text-teal-600 shadow-lg border border-white'
      : 'text-slate-600 hover:text-slate-800'
      }`}
  >
    {icon} {label}
    {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-teal-600 rounded-full"></div>}
  </button>
);

const InputField = ({ label, placeholder, icon, value, onChange, type = 'text' }) => (
  <div className="space-y-4 group">
    <div className="flex items-center gap-3 ml-1">
      <div className="h-1.5 w-1.5 rounded-full bg-teal-600 shadow-[0_0_10px_rgba(20,184,166,0.6)] group-focus-within:animate-pulse"></div>
      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">{label}</label>
    </div>
    <div className="relative">
      <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-600 transition-all duration-500 group-focus-within:scale-110">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <input
        type={type}
        className="w-full bg-white/50 border border-slate-100 rounded-[2rem] py-5 pl-18 pr-10 text-[13px] font-black text-slate-900 focus:bg-white focus:ring-[12px] focus:ring-teal-500/5 focus:border-teal-500/30 outline-none transition-all placeholder:text-slate-600 shadow-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  </div>
);

const TestNodeCard = ({ test, isSelected, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative overflow-hidden text-left p-8 rounded-[2.5rem] border-2 transition-all duration-700 flex flex-col gap-6 group/test ${isSelected
      ? 'bg-teal-600 border-teal-600 shadow-2xl shadow-teal-500/30 -translate-y-1'
      : 'bg-white/40 border-white hover:bg-white hover:border-teal-100 hover:-translate-y-1'
      }`}
  >
    <div className="flex justify-between items-center relative z-10">
      <span
        className={`text-[10px] font-black font-mono tracking-widest px-3 py-1.5 rounded-lg uppercase ${isSelected ? 'bg-teal-500/50 text-white' : 'bg-slate-50 text-slate-600 group-hover/test:text-teal-600 group-hover/test:bg-teal-50'
          }`}
      >
        {test.code}
      </span>
      {isSelected && <Sparkles size={16} className="text-white animate-pulse" />}
    </div>

    <h4
      className={`text-xl font-black tracking-tighter leading-tight relative z-10 uppercase ${isSelected ? 'text-white' : 'text-slate-900 group-hover/test:text-teal-600'
        }`}
    >
      {test.name}
    </h4>

    <div className="mt-auto flex items-center justify-between relative z-10">
      <div className="h-1 w-10 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`absolute inset-0 bg-teal-400 transition-all duration-1000 ${isSelected ? 'w-full' : 'w-0 group-hover/test:w-1/2'
            }`}
        ></div>
      </div>
      <span
        className={`text-[11px] font-black font-mono tracking-widest ${isSelected ? 'text-teal-100' : 'text-teal-600'
          }`}
      >
        LKR {test.price.toLocaleString()}
      </span>
    </div>

    {isSelected && (
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
        <FlaskConical size={100} className="text-white" />
      </div>
    )}
  </button>
);

const ActionBtn = ({ onClick, icon, label, theme }) => (
  <button
    onClick={onClick}
    className={`h-18 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-[0.96] shadow-xl group/abtn ${theme === 'white' ? 'bg-white text-slate-950 hover:bg-slate-50 shadow-white/10' : 'bg-slate-950 border border-white/5 text-white hover:bg-slate-900'
      }`}
  >
    {React.cloneElement(icon, { size: 20, className: 'group-hover/abtn:scale-110 transition-transform' })}
    {label}
  </button>
);

const StatusBadge = ({ color, icon, label, pulse }) => {
  const themes = {
    amber: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100/50',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/50',
    slate: 'text-slate-600 bg-slate-100 border-slate-200 shadow-slate-200/50'
  };
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-[0.2em] w-fit shadow-sm ${themes[color]} ${pulse ? 'animate-pulse' : ''
        }`}
    >
      {icon} {label}
    </div>
  );
};

const ControlBtn = ({ onClick, icon, theme, title }) => {
  const themes = {
    teal: 'text-teal-600 hover:bg-teal-600',
    emerald: 'text-emerald-600 hover:bg-emerald-600',
    cyan: 'text-cyan-600 hover:bg-cyan-600',
    rose: 'text-rose-600 hover:bg-rose-600'
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 group/cbtn ${themes[theme]} hover:text-white hover:border-transparent`}
    >
      {React.cloneElement(icon, { size: 20, className: 'group-hover/cbtn:scale-110 transition-transform' })}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*                         PATIENT TREND MODAL                        */
/* ------------------------------------------------------------------ */
const PatientTrendModal = ({ patient, data, onClose, loading }) => {
  const groupedData = data.reduce((acc, cur) => {
    if (!acc[cur.test_name]) acc[cur.test_name] = [];
    acc[cur.test_name].push(cur);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className="bg-slate-950 border border-white/10 w-full max-w-6xl rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col max-h-full group">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/10 via-transparent to-transparent opacity-50"></div>

        {/* Header */}
        <div className="p-12 pb-8 border-b border-white/5 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-teal-600/10 text-teal-400 rounded-[2rem] flex items-center justify-center border border-teal-500/20 shadow-2xl shadow-teal-500/10">
              <TrendingUp size={28} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight uppercase leading-none italic">
                Health <span className="text-teal-500">Vector Matrix</span>
              </h3>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-2">
                Longitudinal diagnostic mapping for{' '}
                <span className="text-white italic">{patient?.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-14 w-14 glass text-white rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all shadow-xl active:scale-90"
          >
            <Zap size={20} className="rotate-45" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-10">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-6 opacity-40">
              <RefreshCcw size={40} className="animate-spin text-teal-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                Synthesizing Temporal Nodes...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-6 opacity-20">
              <Activity size={80} className="text-white" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                Zero Logical Intersections Found
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(groupedData).map(([test, points], idx) => (
                <div key={test} className="space-y-10 group/test animate-in slide-in-from-bottom-5 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">{test}</h4>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{points[0].unit || 'Diagnostic Units'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                        Delta Tracking: Active
                      </span>
                    </div>
                  </div>

                  <div className="relative h-48 flex items-end gap-1 px-4 mb-2">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between opacity-5 py-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-full h-px bg-white"></div>
                      ))}
                    </div>

                    {/* Reference Range Visualizer (Mock Safe Zone) */}
                    <div className="absolute inset-0 px-4 py-8 pointer-events-none">
                      <div className="h-20 w-full bg-teal-500/5 border-y border-teal-500/10 rounded-sm mt-8 relative">
                        <span className="absolute -left-12 top-0 text-[7px] font-black text-teal-400/50 uppercase tracking-widest -rotate-90 origin-right">Ref Range</span>
                      </div>
                    </div>

                    {/* Points */}
                    {points.map((p, pIdx) => {
                      const maxVal = Math.max(...points.map(pt => parseFloat(pt.result_value) || 0), 100);
                      const height = (parseFloat(p.result_value) / maxVal) * 100;

                      // Mocking "out of range" identification
                      const isHigh = parseFloat(p.result_value) > 85;
                      const isLow = parseFloat(p.result_value) < 20;

                      return (
                        <div key={pIdx} className="flex-1 flex flex-col items-center group/point">
                          <div className="relative w-full flex justify-center">
                            {/* Tooltip */}
                            <div className="absolute -top-12 opacity-0 group-hover/point:opacity-100 transition-all duration-300 scale-90 group-hover/point:scale-100 z-20">
                              <div className={`px-4 py-1.5 rounded-xl font-black text-[12px] shadow-2xl ${isHigh || isLow ? 'bg-rose-500 text-white' : 'bg-white text-slate-950'}`}>
                                {p.result_value} {isHigh ? ' (HIGH)' : isLow ? ' (LOW)' : ''}
                              </div>
                              <div className={`w-2 h-2 rotate-45 mx-auto -mt-1 ${isHigh || isLow ? 'bg-rose-500' : 'bg-white'}`}></div>
                            </div>

                            {/* Column */}
                            <div
                              className={`w-2 rounded-full transition-all duration-500 relative ${isHigh || isLow
                                ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                                : 'bg-gradient-to-t from-teal-600 to-teal-400 group-hover/point:shadow-[0_0_15px_rgba(20,184,166,0.8)]'
                                }`}
                              style={{ height: `${Math.max(height, 8)}%`, opacity: 0.9 }}
                            >
                              <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full -mt-1.5 shadow-2xl ${isHigh || isLow ? 'bg-white animate-ping' : 'bg-white animate-pulse'}`}></div>
                            </div>
                          </div>

                          <div className="mt-4 text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter tabular-nums">
                              {p.date.split('-').slice(1).join('/')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/5 bg-black/40 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
            <Dna size={14} className="text-teal-500" />
            Temporal Diagnostic Resolution: 100%
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * Cinematic Bulk Registration Terminal
 * High-performance workspace for mass clinical node synchronization.
 */
const BulkRegistrationTerminal = ({ show, onClose, previewData, catalog, doctors, user, onComplete }) => {
  const [items, setItems] = useState(previewData);
  const [processing, setProcessing] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setItems(previewData);
    const self = doctors.find(d => d.code === 'SELF');
    if (self) setDoctorId(self.id);
  }, [previewData, doctors]);

  const toggleItem = (id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const toggleTest = (test) => {
    if (selectedTests.find(t => t.code === test.code)) {
      setSelectedTests(prev => prev.filter(t => t.code !== test.code));
    } else {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const handleExecute = async () => {
    const targets = items.filter(i => i.selected && i.status !== 'success');
    if (targets.length === 0) return;

    setProcessing(true);
    let completed = 0;

    for (let i = 0; i < items.length; i++) {
      if (!items[i].selected || items[i].status === 'success') continue;

      setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item));

      try {
        const payload = {
          title: items[i].title,
          name: items[i].name,
          nic: items[i].nic,
          age: items[i].age,
          age_type: 'Years',
          gender: items[i].gender,
          phone: items[i].phone,
          doctor_id: doctorId,
          barcode: items[i].nic,
          tests: selectedTests,
          total: selectedTests.reduce((acc, t) => acc + (t.price || 0), 0),
          user_id: user?.id,
          created_at: new Date()
        };

        const result = await window.api.registerPatient(payload);
        if (result.success) {
          setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success' } : item));
          completed++;
        } else {
          setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
        }
      } catch (err) {
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
      }
      setProgress(Math.round(((i + 1) / items.length) * 100));
    }

    setProcessing(false);
    toast.success(`Neural Ingress Complete: ${completed} nodes synchronized.`);
    if (completed === targets.length) {
      setTimeout(onComplete, 1500);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-12 animate-in fade-in duration-500">
      <div className="bg-white/95 w-full max-w-7xl h-[85vh] rounded-[4rem] shadow-[0_80px_200px_rgba(0,0,0,0.6)] border border-white/20 overflow-hidden flex flex-col animate-in zoom-in-95 duration-700">

        {/* Terminal Header */}
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="h-16 w-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-3xl shadow-teal-500/40 animate-pulse">
              <UploadCloud size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Neural Ingress Terminal</h2>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Mass Clinical Node Synchronization Protocol</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right mr-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right">Synchronization Progress</p>
              <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <button onClick={onClose} className="h-16 w-16 bg-slate-100 text-slate-600 rounded-[1.75rem] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel: Ingress Preview Table */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50/50 backdrop-blur-md z-10">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-200">
                  <th className="py-6 px-4">Identify</th>
                  <th className="py-6 px-4">Subject Vector</th>
                  <th className="py-6 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`group transition-all ${item.selected ? 'bg-white opacity-100' : 'bg-transparent opacity-40 hover:opacity-60 cursor-pointer'}`}
                    onClick={() => !processing && toggleItem(item.id)}
                  >
                    <td className="py-6 px-4">
                      <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.selected ? 'bg-teal-600 border-teal-600 shadow-lg shadow-teal-200' : 'border-slate-300'}`}>
                        {item.selected && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 font-mono tracking-widest">{item.nic}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-right">
                      {item.status === 'success' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 animate-in zoom-in-90">
                          <CheckCircle2 size={12} /> Sync Complete
                        </div>
                      ) : item.status === 'processing' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-100 animate-pulse">
                          <RefreshCcw size={12} className="animate-spin" /> Authorizing...
                        </div>
                      ) : item.status === 'error' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100">
                          <Flame size={12} /> Data Collision
                        </div>
                      ) : (
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Awaiting Command</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Panel: Protocol Assignment */}
          <div className="w-[450px] border-l border-slate-100 p-12 space-y-12 bg-white overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Apply Global Protocol</label>
              <div className="relative">
                <Stethoscope size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] py-6 pl-14 pr-8 text-[12px] font-black text-slate-900 outline-none appearance-none focus:ring-8 focus:ring-teal-500/5 transition-all"
                  value={doctorId}
                  onChange={e => setDoctorId(e.target.value)}
                >
                  {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name} [{doc.code}]</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Mass Investigation Panel</label>
              <div className="space-y-3">
                {catalog.filter(t => t.category === 'Biochemistry' || t.category === 'Hematology').slice(0, 8).map(test => (
                  <button
                    key={test.code}
                    onClick={() => toggleTest(test)}
                    className={`w-full p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedTests.find(t => t.code === test.code) ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-200/50' : 'bg-white border-slate-100 text-slate-600 hover:border-teal-200'}`}
                  >
                    <div>
                      <p className="text-[11px] font-black uppercase leading-none mb-1">{test.name}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedTests.find(t => t.code === test.code) ? 'text-teal-100' : 'text-slate-400'}`}>{test.code}</p>
                    </div>
                    {selectedTests.find(t => t.code === test.code) && <Zap size={16} />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExecute}
              disabled={processing || items.filter(i => i.selected).length === 0}
              className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] shadow-3xl hover:bg-teal-600 transition-all flex items-center justify-center gap-6 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex items-center gap-6">
                {processing ? <RefreshCcw size={24} className="animate-spin" /> : <Dna size={24} className="group-hover:rotate-180 transition-transform duration-700" />}
                Execute Mass Ingress
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;

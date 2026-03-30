import React, { useState, useEffect } from 'react';
import {
    Settings,
    Building2,
    Users,
    Table,
    Database,
    Save,
    CheckCircle2,
    Trash2,
    Plus,
    ShieldCheck,
    Smartphone,
    Info as InfoIcon,
    X,
    FlaskConical,
    Microscope,
    Settings2,
    Beaker,
    ChevronRight,
    Lock,
    Cpu,
    Activity,
    Server,
    Globe,
    Zap,
    Search,
    Edit2,
    DatabaseZap,
    ShieldAlert,
    LayoutDashboard,
    Network,
    Package,
    ArrowRight,
    QrCode,
    Key,
    Terminal,
    Fingerprint,
    CreditCard,
    RefreshCw,
    CalendarDays,
    BadgeCheck,
    AlertTriangle,
    Star,
    Star,
    Archive as ArchiveIcon,
    MessagesSquare,
    Send
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';

/**
 * Mediccon LIS System Configuration Terminal
 * High-fidelity management suite for laboratory infrastructure and core protocols.
 */
const SystemSettings = () => {
    const { user, navigateNext, navigateBack, setActivePage, loadLabProfile: refreshGlobalProfile } = useGlobalStore();
    const isDeveloper = user && ['developer', 'master access', 'admin'].includes(user.role?.toLowerCase());
    const [activeTab, setActiveTab] = useState(isDeveloper ? 'profile' : 'subscription'); // Default based on role
    const [labInfo, setLabInfo] = useState({
        name: 'Mediccon Clinical Network',
        tagline: 'Advanced Clinical Diagnostics',
        address: '123 Healthcare Plaza, Colombo 07',
        phone: '+94 11 234 5678',
        email: 'info@mediccon.lis',
        license: 'MCN-LIC-2024-001',
        logo: '',
        accentColor: '#14b8a6'
    });
    const [users, setUsers] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [machines, setMachines] = useState([]);
    const [permModalUser, setPermModalUser] = useState(null);
    const [hwid, setHwid] = useState('Fetching...');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subscription, setSubscription] = useState({
        plan: 'STANDARD',
        licenseKey: '',
        expiryDate: '',
        activatedOn: '',
        site: ''
    });
    const [licenseInput, setLicenseInput] = useState('');
    const [licenseActivating, setLicenseActivating] = useState(false);
    const [licenseMsg, setLicenseMsg] = useState(null);
    const [backups, setBackups] = useState([]);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [dynamicRanges, setDynamicRanges] = useState([]);
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [editingRange, setEditingRange] = useState(null);
    const [newRange, setNewRange] = useState({ gender: 'Both', age_min: 0, age_max: 150, ref_range: '', is_active: true });
    const [commSettings, setCommSettings] = useState({
        whatsappEnabled: false,
        whatsappApi: '',
        emailEnabled: false,
        emailSmtp: '',
        autoDispatch: false
    });

    useEffect(() => {
        console.log('[DEBUG] SystemSettings: Initializing nodes...');
        loadAll();
    }, []);

    const loadAll = async () => {
        loadUsers();
        loadCatalog();
        loadHwid();
        loadLocalLabProfile();
        loadMachines();
        loadSubscription();
        loadBackups();
        loadCommSettings();
    };

    const loadCommSettings = async () => {
        try {
            const settings = await window.api.getSystemSettings();
            setCommSettings({
                whatsappEnabled: settings.comm_whatsapp_enabled === 'true',
                whatsappApi: settings.comm_whatsapp_api || '',
                emailEnabled: settings.comm_email_enabled === 'true',
                emailSmtp: settings.comm_email_smtp || '',
                autoDispatch: settings.comm_auto_dispatch === 'true'
            });
        } catch (e) { }
    };

    const loadBackups = async () => {
        try {
            const list = await window.api.getBackups();
            setBackups(list || []);
        } catch (e) { console.error(e); }
    };

    const handleManualBackup = async () => {
        setIsBackingUp(true);
        try {
            const res = await window.api.backupNow();
            if (res.success) {
                alert(`Archival snapshot created: ${res.fileName}`);
                loadBackups();
            } else {
                alert("Archival Fault: " + res.error);
            }
        } catch (e) {
            alert("Fatal Redundancy Error");
        } finally {
            setIsBackingUp(false);
        }
    };

    const loadSubscription = async () => {
        try {
            const settings = await window.api.getSystemSettings();
            setSubscription({
                plan: settings.sub_plan || 'STANDARD',
                licenseKey: settings.sub_license_key || '',
                expiryDate: settings.sub_expiry || '',
                activatedOn: settings.sub_activated_on || '',
                site: settings.lab_name || 'Mediccon Lab'
            });
            setLicenseInput(settings.sub_license_key || '');
        } catch (e) { }
    };

    const handleActivateLicense = async () => {
        if (!licenseInput.trim()) return;
        setLicenseActivating(true);
        setLicenseMsg(null);
        try {
            // Parse plan and expiry from key format: PLAN-YYYYMMDD-XXXX
            const parts = licenseInput.trim().toUpperCase().split('-');
            let plan = 'STANDARD';
            let expiry = '';
            if (parts.length >= 3) {
                // Key format: MCN-PRO-20260101-XXXX or MCN-STD-20260101-XXXX
                const planCode = parts[1];
                const dateStr = parts[2];
                if (planCode === 'PRO' || planCode === 'PROFESSIONAL') plan = 'PROFESSIONAL';
                else if (planCode === 'ENT' || planCode === 'ENTERPRISE') plan = 'ENTERPRISE';
                if (dateStr && dateStr.length === 8) {
                    expiry = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
                }
            }
            if (!expiry) {
                // Default 1-year if no date in key
                const d = new Date();
                d.setFullYear(d.getFullYear() + 1);
                expiry = d.toISOString().slice(0, 10);
            }
            await window.api.saveSystemSetting('sub_license_key', licenseInput.trim().toUpperCase());
            await window.api.saveSystemSetting('sub_plan', plan);
            await window.api.saveSystemSetting('sub_expiry', expiry);
            await window.api.saveSystemSetting('sub_activated_on', new Date().toISOString().slice(0, 10));
            await loadSubscription();
            setLicenseMsg({ type: 'success', text: `License activated! Plan: ${plan} · Expires: ${expiry}` });
        } catch (e) {
            setLicenseMsg({ type: 'error', text: 'Activation failed: ' + e.message });
        } finally {
            setLicenseActivating(false);
        }
    };

    const loadMachines = async () => {
        const data = await window.api.getMachines();
        setMachines(data || []);
    };

    const loadUsers = async () => {
        const data = await window.api.getUsers();
        setUsers(data || []);
    };

    const loadCatalog = async () => {
        const data = await window.api.getTestCatalog();
        setCatalog(data || []);
    };

    const loadHwid = async () => {
        try {
            const data = await window.api.getSecurityStats();
            setHwid(data.hwid || 'N/A');
            setIsAuthorized(data.isAuthorized);
        } catch (e) {
            setHwid('HARDWARE_ID_LINK_FAULT');
        }
    };

    const handleAuthorizeHardware = async () => {
        if (!confirm("Link this clinical workstation permanently? This will authorize all system nodes.")) return;
        try {
            await window.api.authorizeHardware();
            loadHwid();
            alert("Node Authorization Successful. System Integrity Restored.");
        } catch (e) {
            alert("Authorization Loop Fault: " + e.message);
        }
    };

    const loadLocalLabProfile = async () => {
        try {
            const settings = await window.api.getSystemSettings();
            if (settings.lab_name) {
                setLabInfo({
                    name: settings.lab_name || '',
                    tagline: settings.lab_tagline || 'Advanced Clinical Diagnostics',
                    address: settings.lab_address || '',
                    phone: settings.lab_phone || '',
                    email: settings.lab_email || '',
                    license: settings.lab_license || 'MCN-LIC-2024-001',
                    logo: settings.lab_logo || '',
                    accentColor: settings.lab_accent_color || '#14b8a6'
                });
            }
        } catch (e) { }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await window.api.saveSystemSetting('lab_name', labInfo.name);
            await window.api.saveSystemSetting('lab_tagline', labInfo.tagline);
            await window.api.saveSystemSetting('lab_address', labInfo.address);
            await window.api.saveSystemSetting('lab_phone', labInfo.phone);
            await window.api.saveSystemSetting('lab_email', labInfo.email);
            await window.api.saveSystemSetting('lab_accent_color', labInfo.accentColor);
            await window.api.saveSystemSetting('lab_logo', labInfo.logo);

            // Critical: Refresh global store so Billing/Results update immediately
            if (refreshGlobalProfile) await refreshGlobalProfile();

            alert("Clinical Environment Profile Synchronized.");
        } catch (e) {
            alert("Synchronization Protocol Failed.");
        } finally {
            setLoading(false);
        }
    };

    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserQuery, setNewUserQuery] = useState({ username: '', password: '', role: 'User' });

    const handleAddUser = async () => {
        if (!newUserQuery.username || !newUserQuery.password) return alert("System requires unique identity and security payload.");
        try {
            await window.api.registerUser(newUserQuery);
            loadUsers();
            setIsAddingUser(false);
            setNewUserQuery({ username: '', password: '', role: 'User' });
        } catch (e) {
            alert("Identity Conflict: Duplicate operator ID detected.");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Permanently revoke authority for this operator?")) return;
        try {
            await window.api.deleteUser(id);
            loadUsers();
        } catch (e) {
            alert("Security Protocol: Revoke command denied.");
        }
    };

    const handleToggleMachine = (machineId) => {
        if (!permModalUser) return;
        const authStr = permModalUser.authorized_machines || '';
        const currentPerms = authStr.split(',').filter(Boolean);
        let newPerms;
        if (currentPerms.includes(machineId)) {
            newPerms = currentPerms.filter(id => id !== machineId);
        } else {
            newPerms = [...currentPerms, machineId];
        }
        setPermModalUser({ ...permModalUser, authorized_machines: newPerms.join(',') });
    };

    const handleSavePermissions = async () => {
        if (!permModalUser) return;
        try {
            const machineIds = permModalUser.authorized_machines ? permModalUser.authorized_machines.split(',').filter(Boolean) : [];
            await window.api.updateUserPermissions(permModalUser.id, machineIds);
            setPermModalUser(null);
            loadUsers();
            alert("Authority Matrix Successfully Re-mapped.");
        } catch (e) {
            alert("Security Matrix Update Failed.");
        }
    };

    const [isAddingCatalog, setIsAddingCatalog] = useState(false);
    const [newCatalogItem, setNewCatalogItem] = useState({ code: '', name: '', category: 'Biochemistry', price: '' });
    const [editingCatalogItem, setEditingCatalogItem] = useState(null);
    const [catalogItemReagents, setCatalogItemReagents] = useState([]);

    const handleAddCatalog = async () => {
        if (!newCatalogItem.code || !newCatalogItem.name || !newCatalogItem.price) return alert("System requires complete clinical nomenclature.");
        try {
            await window.api.addCatalogItem({
                ...newCatalogItem,
                price: parseFloat(newCatalogItem.price)
            });
            loadCatalog();
            setIsAddingCatalog(false);
            setNewCatalogItem({ code: '', name: '', category: 'Biochemistry', price: '' });
        } catch (e) {
            alert("Registry Fault: Failed to commit new catalog node.");
        }
    };

    const handleEditCatalog = async (item) => {
        setEditingCatalogItem({ ...item, price: item.price.toString() });
        try {
            const mappings = await window.api.getTestReagents(item.code);
            setCatalogItemReagents(mappings || []);
        } catch (e) {
            setCatalogItemReagents([]);
        }
    };

    const handleUpdateCatalog = async () => {
        if (!editingCatalogItem.name || !editingCatalogItem.price) return alert("Complete metadata payload required.");
        try {
            await window.api.updateCatalogItem({
                ...editingCatalogItem,
                price: parseFloat(editingCatalogItem.price)
            });
            loadCatalog();
            setEditingCatalogItem(null);
        } catch (e) {
            alert("Catalog Update Failed: " + e.message);
        }
    };

    const handleDeleteCatalog = async (code) => {
        if (!confirm("Permanently purge this clinical node from primary catalog?")) return;
        try {
            await window.api.deleteCatalogItem(code);
            loadCatalog();
        } catch (e) {
            alert("Delete protocol failed.");
        }
    };

    const loadReferenceRanges = async (testCode) => {
        try {
            const ranges = await window.api.getTestReferenceRanges(testCode);
            setDynamicRanges(ranges || []);
        } catch (e) { console.error(e); }
    };

    const handleSaveRange = async () => {
        if (!newRange.ref_range) return alert("Biometry payload required.");
        try {
            await window.api.saveTestReferenceRange({
                ...newRange,
                test_code: editingCatalogItem.code,
                id: editingRange?.id
            });
            loadReferenceRanges(editingCatalogItem.code);
            setShowRangeModal(false);
            setEditingRange(null);
            setNewRange({ gender: 'Both', age_min: 0, age_max: 150, ref_range: '', is_active: true });
        } catch (e) { alert("Matrix Insertion Error"); }
    };

    const handleDeleteRange = async (id) => {
        if (confirm("Purge demographic threshold?")) {
            await window.api.deleteTestReferenceRange(id);
            loadReferenceRanges(editingCatalogItem.code);
        }
    };

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-1000 pb-32 font-sans selection:bg-teal-500/30">

            {/* 1. Cinematic Header Architecture */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 bg-white/40 p-10 rounded-[2.5rem] border border-white shadow-sm backdrop-blur-xl group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
                    <Settings2 size={180} />
                </div>

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
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse shadow-[0_0_10px_rgba(20,184,166,1)]"></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Integrated System Command</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
                            Control <span className="text-teal-600">Parameters</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-600 uppercase tracking-widest max-w-xl">
                            Universal infrastructure management for clinical nodes, personnel authority, and diagnostic catalogs.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap bg-slate-100/50 p-1.5 rounded-2xl relative z-10 border border-slate-200 shadow-inner">
                    {isDeveloper && <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<Building2 size={16} />} label="Environment Profile" />}
                    <TabButton active={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} icon={<CreditCard size={16} />} label="Subscription" />
                    {isDeveloper && (
                        <>
                            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={16} />} label="Identity Matrix" />
                            <TabButton active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={<Table size={16} />} label="Clinical Catalog" />
                            <TabButton active={activeTab === 'comm'} onClick={() => setActiveTab('comm')} icon={<MessagesSquare size={16} />} label="Communications" />
                            <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<DatabaseZap size={16} />} label="Node Security" />
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                {/* 2. Side Telemetry & Security Hub */}
                <div className="lg:col-span-3 space-y-8 h-full sticky top-10">

                    {isDeveloper && (
                        <div className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 h-64 w-64 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-3 text-teal-400 mb-2">
                                    <ShieldCheck size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Security Signature</span>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-2">Hardware UUID Link</label>
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 font-mono text-[11px] font-black tracking-tighter text-teal-100 group-hover:text-white transition-colors break-all leading-relaxed uppercase">
                                        {hwid}
                                    </div>
                                </div>

                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${isAuthorized ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                    <div className={`h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)] ${isAuthorized ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isAuthorized ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        Node Status: {isAuthorized ? 'AUTHENTICATED' : 'UNLINKED NODE'}
                                    </span>
                                </div>

                                {!isAuthorized && (
                                    <button
                                        onClick={handleAuthorizeHardware}
                                        className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 group/auth transition-all active:scale-95"
                                    >
                                        <Zap size={14} className="group-hover/auth:fill-current" /> Initialize Linkage
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-white/60 p-10 rounded-[3rem] border border-white shadow-sm backdrop-blur-xl group overflow-hidden relative">
                        <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                            <Activity size={180} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3 text-slate-600 border-b border-slate-100 pb-6">
                                <Network size={16} className="text-teal-500" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Matrix Probes</h4>
                            </div>
                            <div className="space-y-6">
                                <TelemetryRow label="Identity Nodes" value={users.length} icon={<Users size={12} />} />
                                <TelemetryRow label="Clinical Protocols" value={catalog.length} icon={<FlaskConical size={12} />} />
                                <TelemetryRow label="Hardware Links" value={machines.length} icon={<Cpu size={12} />} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Primary Controller Workspace */}
                <div className="lg:col-span-9">

                    {/* A. ENVIRONMENT PROFILE TERMINAL */}
                    {activeTab === 'profile' && (
                        <div className="bg-white/60 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-xl p-12 space-y-12 animate-in slide-in-from-right-8 duration-700 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 opacity-[0.02] rotate-12 pointer-events-none">
                                <Building2 size={350} />
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-2 block">Site Configuration</h2>
                                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Environment Profile</h3>
                                </div>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="h-18 px-12 bg-slate-950 text-white rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:bg-teal-600 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50"
                                >
                                    <Save size={20} /> {loading ? 'Committing...' : 'Synchronize Identity'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <InputField label="Principal Nomenclature" icon={<Globe size={20} />} value={labInfo.name} onChange={v => setLabInfo({ ...labInfo, name: v })} />
                                <InputField label="Clinical Slogan / Tagline" icon={<Star size={20} />} value={labInfo.tagline} onChange={v => setLabInfo({ ...labInfo, tagline: v })} />

                                {isDeveloper && (
                                    <InputField label="Global License / HWID-Link" icon={<Fingerprint size={20} />} value={labInfo.license} disabled={true} />
                                )}

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block px-2">Visual Identity Accent</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="color"
                                            className="h-14 w-28 bg-white border border-slate-100 rounded-2xl cursor-pointer p-2 shadow-sm"
                                            value={labInfo.accentColor}
                                            onChange={e => setLabInfo({ ...labInfo, accentColor: e.target.value })}
                                        />
                                        <span className="font-mono font-black text-slate-900 uppercase tracking-widest">{labInfo.accentColor}</span>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <InputField label="Primary Site Coordinates (Address)" icon={<Building2 size={20} />} value={labInfo.address} onChange={v => setLabInfo({ ...labInfo, address: v })} />
                                </div>
                                <InputField label="Technical Support Line" icon={<Zap size={20} />} value={labInfo.phone} onChange={v => setLabInfo({ ...labInfo, phone: v })} />
                                <InputField label="Transmission Node Email" icon={<Server size={20} />} value={labInfo.email} onChange={v => setLabInfo({ ...labInfo, email: v })} />

                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block px-2">Corporate Artifact (Logo URL / Base64)</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            placeholder="Paste URL or Base64 here..."
                                            className="flex-1 h-14 bg-white/50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:bg-white focus:ring-10 focus:ring-teal-500/5 transition-all outline-none"
                                            value={labInfo.logo}
                                            onChange={e => setLabInfo({ ...labInfo, logo: e.target.value })}
                                        />
                                        {labInfo.logo && (
                                            <div className="h-14 w-14 bg-white border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-2 shadow-sm">
                                                <img src={labInfo.logo} alt="Preview" className="max-w-full max-h-full object-contain" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-teal-50/50 rounded-[2.5rem] border border-teal-100/50 flex items-start gap-6 relative overflow-hidden group/notice">
                                <div className="h-14 w-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-teal-100 group-hover/notice:scale-110 transition-transform duration-500">
                                    <InfoIcon size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-teal-900 uppercase tracking-tight">Systemic Integrity Protocol</h4>
                                    <p className="text-[12px] text-teal-700/70 font-bold leading-relaxed mt-2 uppercase tracking-wide">
                                        These parameters are hard-coded into clinical output and report headers. Modification of these nodes is recorded in the master audit log with an atomic timestamp.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* B. IDENTITY MATRIX TERMINAL */}
                    {activeTab === 'users' && isDeveloper && (
                        <div className="bg-white/60 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-xl overflow-hidden animate-in slide-in-from-right-8 duration-700 flex flex-col min-h-[700px]">
                            <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white/40">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse shadow-[0_0_8px_rgba(20,184,166,1)]"></div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Integrated Authority Matrix</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Personnel Registry</h2>
                                </div>
                                <button onClick={() => setIsAddingUser(true)} className="h-16 px-10 bg-teal-600 text-white rounded-2xl shadow-3xl shadow-teal-500/20 hover:bg-teal-500 transition-all flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 group">
                                    <Plus size={22} className="group-hover:rotate-90 transition-transform duration-500" /> Provision Node
                                </button>
                            </div>

                            <div className="flex-1 overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-600 tracking-[0.4em] border-b border-slate-100">
                                            <th className="px-12 py-8">Operator Identity</th>
                                            <th className="px-12 py-8 text-center">Security Tier</th>
                                            <th className="px-12 py-8 text-center">Sync Protocol</th>
                                            <th className="px-12 py-8 text-right">Access Controls</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white/20">
                                        {users.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-40 opacity-30 flex flex-col items-center gap-6">
                                                <Users size={80} className="text-slate-600 border-2 border-dashed border-slate-200 rounded-2xl p-4" />
                                                <div className="space-y-2">
                                                    <p className="font-black text-[12px] uppercase tracking-[0.5em]">No Personnel Nodes Active</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Initialize registry to begin provisioning</p>
                                                </div>
                                            </td></tr>
                                        ) : users.map(u => (
                                            <tr key={u.id} className="group hover:bg-teal-50/50 transition-all duration-500 relative">
                                                <td className="px-12 py-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 bg-gradient-to-br from-slate-950 to-slate-800 rounded-2xl flex items-center justify-center text-white font-black uppercase text-xl shadow-2xl border border-white/10 group-hover:from-teal-600 group-hover:to-emerald-600 transition-all duration-700 group-hover:scale-110">
                                                            {u.username.substring(0, 1)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-[17px] tracking-tight uppercase group-hover:text-teal-600 transition-colors leading-none mb-2">{u.username}</p>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase opacity-80">System Operator Node</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-12 py-10 text-center">
                                                    <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${u.role === 'Developer'
                                                        ? 'bg-slate-950 text-teal-400 border-slate-800 shadow-xl shadow-teal-500/10'
                                                        : 'bg-white text-slate-600 border-slate-200'
                                                        }`}>
                                                        {u.role === 'Developer' ? 'ROOT_CMD' : 'STANDARD_IO'}
                                                    </span>
                                                </td>
                                                <td className="px-12 py-10 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Encrypted</span>
                                                    </div>
                                                </td>
                                                <td className="px-12 py-10 text-right">
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0">
                                                        <button onClick={() => setPermModalUser(u)} className="h-12 px-6 bg-white border border-slate-100 text-teal-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all flex items-center gap-3 shadow-md">
                                                            <Lock size={16} /> Matrix Authority
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u.id)} className="h-12 w-12 flex items-center justify-center bg-white border border-slate-100 text-slate-600 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-all shadow-md active:scale-95">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* C. CLINICAL CATALOG TERMINAL */}
                    {activeTab === 'catalog' && isDeveloper && (
                        <div className="bg-white/60 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-xl overflow-hidden animate-in slide-in-from-right-8 duration-700 flex flex-col min-h-[700px]">
                            <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white/40">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse shadow-[0_0_8px_rgba(20,184,166,1)]"></div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Clinical Core Catalogs</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Price Matrix Registry</h2>
                                </div>
                                <button onClick={() => setIsAddingCatalog(true)} className="h-16 px-10 bg-teal-600 text-white rounded-2xl shadow-3xl shadow-teal-500/20 hover:bg-teal-500 transition-all flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 group">
                                    <Plus size={22} className="group-hover:rotate-90 transition-transform duration-500" /> Insert Node
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 h-full">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-20">
                                        <tr className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] border-b-2 border-slate-950 pb-6">
                                            <th className="px-8 py-6">Protocol ID</th>
                                            <th className="px-8 py-6">Machine Trace</th>
                                            <th className="px-8 py-6">Clinical NOMENCLATURE</th>
                                            <th className="px-8 py-6 text-right">Value (LKR)</th>
                                            <th className="px-8 py-6 w-32"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white/20">
                                        {catalog.map(t => (
                                            <tr key={t.code} className="hover:bg-teal-50/50 transition-all duration-500 group relative">
                                                <td className="px-8 py-10">
                                                    <span className="font-black font-mono text-[12px] text-teal-600 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 shadow-sm">{t.code}</span>
                                                </td>
                                                <td className="px-8 py-10">
                                                    <div className="flex items-center gap-3 text-slate-600">
                                                        <Cpu size={16} className="text-teal-400" />
                                                        <span className="font-black font-mono text-[11px] uppercase tracking-widest">{t.analyzer_code || t.code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 tracking-tight text-[17px] group-hover:text-teal-600 transition-colors uppercase leading-none mb-2">{t.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{t.category} Cluster Node</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10 text-right">
                                                    <div className="inline-flex flex-col items-end">
                                                        <span className={`text-3xl font-black tracking-tighter tabular-nums leading-none font-mono ${t.price === 0 ? 'text-rose-600' : 'text-slate-950'}`}>
                                                            {t.price === 0 ? 'ERR_N/A' : t.price.toLocaleString()}
                                                        </span>
                                                        <div className="h-1 w-12 bg-teal-100 rounded-full mt-2"></div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10 text-right">
                                                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all justify-end -translate-x-4 group-hover:translate-x-0">
                                                        <button onClick={() => handleEditCatalog(t)} className="h-12 w-12 flex items-center justify-center bg-white border border-slate-100 text-slate-600 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 rounded-xl shadow-md transition-all active:scale-95">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button onClick={() => handleDeleteCatalog(t.code)} className="h-12 w-12 flex items-center justify-center bg-white border border-slate-100 text-slate-600 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 rounded-xl shadow-md transition-all active:scale-95">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* E. NEURAL COMMUNICATIONS HUB */}
                    {activeTab === 'comm' && (
                        <div className="bg-white/60 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-xl p-12 space-y-12 animate-in slide-in-from-right-8 duration-700 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 opacity-[0.02] rotate-12 pointer-events-none">
                                <MessagesSquare size={350} />
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-2 block">Messaging Architecture</h2>
                                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Intelligence Dispatch</h3>
                                </div>
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            await window.api.saveSystemSetting('comm_whatsapp_enabled', commSettings.whatsappEnabled.toString());
                                            await window.api.saveSystemSetting('comm_whatsapp_api', commSettings.whatsappApi);
                                            await window.api.saveSystemSetting('comm_email_enabled', commSettings.emailEnabled.toString());
                                            await window.api.saveSystemSetting('comm_email_smtp', commSettings.emailSmtp);
                                            await window.api.saveSystemSetting('comm_auto_dispatch', commSettings.autoDispatch.toString());
                                            alert("Communication Vectors Tuned.");
                                        } catch (e) { alert("Matrix Fault: Save Failed"); }
                                        setLoading(false);
                                    }}
                                    disabled={loading}
                                    className="h-18 px-12 bg-slate-950 text-white rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:bg-teal-600 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50"
                                >
                                    <Save size={20} /> {loading ? 'Syncing...' : 'Commit Communication Matrix'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                {/* WhatsApp Node */}
                                <div className="p-10 bg-white/40 border border-white rounded-[3rem] shadow-sm space-y-8 group/wa hover:border-emerald-200 transition-all">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-500/10 group-hover/wa:scale-110 transition-transform">
                                                <Smartphone size={24} />
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 uppercase italic">WhatsApp Gateway</h4>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={commSettings.whatsappEnabled} onChange={e => setCommSettings({ ...commSettings, whatsappEnabled: e.target.checked })} className="sr-only peer" />
                                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                    <InputField label="API Gateway Endpoint" icon={<Globe size={20} />} value={commSettings.whatsappApi} onChange={v => setCommSettings({ ...commSettings, whatsappApi: v })} placeholder="https://api.gateway.link/v1" />
                                    <div className="bg-emerald-50/50 p-6 rounded-2xl flex items-center gap-4">
                                        <ShieldCheck size={18} className="text-emerald-500" />
                                        <p className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-widest">Supports LIS-Direct protocol and standard HL7 templates.</p>
                                    </div>
                                </div>

                                {/* Email Node */}
                                <div className="p-10 bg-white/40 border border-white rounded-[3rem] shadow-sm space-y-8 group/em hover:border-teal-200 transition-all">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-teal-500/10 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-500/10 group-hover/em:scale-110 transition-transform">
                                                <Send size={24} />
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 uppercase italic">Email SMTP Matrix</h4>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={commSettings.emailEnabled} onChange={e => setCommSettings({ ...commSettings, emailEnabled: e.target.checked })} className="sr-only peer" />
                                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-teal-600"></div>
                                        </label>
                                    </div>
                                    <InputField label="SMTP Relayer Host" icon={<Server size={20} />} value={commSettings.emailSmtp} onChange={v => setCommSettings({ ...commSettings, emailSmtp: v })} placeholder="smtp.mediccon.lk:587" />
                                    <div className="bg-teal-50/50 p-6 rounded-2xl flex items-center gap-4">
                                        <Zap size={18} className="text-teal-500" />
                                        <p className="text-[10px] font-bold text-teal-700/70 uppercase tracking-widest">TLS 1.3 Encryption node enabled by default.</p>
                                    </div>
                                </div>

                                {/* Autopilot Node */}
                                <div className="md:col-span-2 p-12 bg-slate-950 rounded-[3rem] border border-slate-800 relative overflow-hidden group/auto">
                                    <div className="absolute inset-0 bg-teal-600 opacity-0 group-hover/auto:opacity-[0.03] transition-opacity duration-1000"></div>
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                                        <div className="flex items-center gap-8">
                                            <div className="h-20 w-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-teal-400 shadow-inner group-hover/auto:scale-110 transition-transform animate-pulse">
                                                <Zap size={32} />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black text-white uppercase italic tracking-tight">Autopilot Dispatch Node</h4>
                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest max-w-lg">Automatically initialize dispatch vectors the second all diagnostic nodes for a visit are validated.</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer scale-125">
                                            <input type="checkbox" checked={commSettings.autoDispatch} onChange={e => setCommSettings({ ...commSettings, autoDispatch: e.target.checked })} className="sr-only peer" />
                                            <div className="w-16 h-8 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-7 after:transition-all peer-checked:bg-teal-500 shadow-xl"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* D. NODE SECURITY TERMINAL */}
                    {activeTab === 'data' && isDeveloper && (
                        <div className="bg-white/60 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-xl p-16 space-y-16 animate-in slide-in-from-right-8 duration-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-24 opacity-[0.02] rotate-12 pointer-events-none">
                                <DatabaseZap size={500} />
                            </div>

                            <div className="flex items-center gap-10 mb-6 relative z-10">
                                <div className="h-24 w-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-teal-500 shadow-3xl border border-slate-800 animate-pulse">
                                    <DatabaseZap size={48} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Security Architecture</h2>
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Database Integrity & Core Protocol Extraction</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <SecurityMetric icon={<Server size={28} />} label="Active Cluster Hub" value="Better-SQLite3 / WAL-Sync" status="SECURE" />
                                <SecurityMetric icon={<Lock size={28} />} label="Transmission Protocol" value="HL7-Direct / IPC-Link" status="ACTIVE" />
                                <SecurityMetric icon={<Cpu size={28} />} label="Native Interface" value="Node_x64 Engine Core" status="NOMINAL" />
                                <SecurityMetric icon={<ShieldAlert size={28} />} label="Firewall Node" value="Authorization Matrix V2" status="ON_LINK" />
                            </div>

                            <div className="bg-rose-50/50 rounded-[2.5rem] p-12 border border-rose-100 flex items-start gap-8 relative overflow-hidden group/alert">
                                <div className="absolute inset-0 bg-rose-500 opacity-0 group-hover:opacity-[0.02] transition-opacity"></div>
                                <div className="h-16 w-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-rose-200 group-hover:scale-110 transition-transform duration-500">
                                    <Zap size={32} className="fill-current" />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xl font-black text-rose-950 uppercase tracking-tight">Systemic Integrity Warning</h4>
                                    <p className="text-[13px] text-rose-800 font-bold leading-relaxed uppercase tracking-wide">
                                        Database pruning and node synchronization are controlled via the master terminal. Unauthorized packet intervention or data manipulation may lead to irrevocable clinical corruption. Ensure all analyzer probes are OFFLINE before executing global catalog overrides.
                                    </p>
                                </div>
                            </div>

                            {/* CLINICAL DATA ARCHIVAL (BACKUP) HUB */}
                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Longitudinal Archival Sequence</h3>
                                    <button
                                        onClick={handleManualBackup}
                                        disabled={isBackingUp}
                                        className="h-14 px-8 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4"
                                    >
                                        <DatabaseZap size={18} className={isBackingUp ? 'animate-spin' : ''} />
                                        {isBackingUp ? 'ARCHIVING...' : 'CAPTURE REDUNDANCY POINT'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                                    {backups.map((b, i) => (
                                        <div key={i} className="bg-white/80 border border-slate-100 p-8 rounded-[2.5rem] flex justify-between items-center group/backup hover:border-teal-500 transition-all duration-500 hover:shadow-2xl">
                                            <div className="flex items-center gap-8">
                                                <div className="h-16 w-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-teal-400 group-hover/backup:bg-teal-600 group-hover/backup:text-white transition-all">
                                                    <ArchiveIcon size={28} />
                                                </div>
                                                <div>
                                                    <p className="text-[15px] font-black text-slate-900 uppercase tracking-tight mb-1">{b.name}</p>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(b.date).toLocaleString()}</span>
                                                        <div className="h-1 w-1 rounded-full bg-slate-200"></div>
                                                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Payload: {(b.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Integrity Secure</span>
                                            </div>
                                        </div>
                                    ))}
                                    {backups.length === 0 && (
                                        <div className="py-20 text-center opacity-20 italic font-black uppercase tracking-[0.3em] text-[10px]">Zero historical snapshots detected</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* E. SUBSCRIPTION & UPDATES */}
                    {activeTab === 'subscription' && (
                        <SubscriptionTab subscription={subscription} hwid={hwid} isAuthorized={isAuthorized} handleActivateLicense={handleActivateLicense} licenseInput={licenseInput} setLicenseInput={setLicenseInput} licenseActivating={licenseActivating} licenseMsg={licenseMsg} isDeveloper={isDeveloper} />
                    )}
                </div>
            </div>

            {/* --- CORE INTERFACE MODALS --- */}

            {/* 1. Authority Matrix Control Modal */}
            {permModalUser && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-700 font-sans">
                    <div className="bg-white/95 w-full max-w-2xl rounded-[4rem] shadow-[0_0_150px_rgba(37,99,235,0.2)] overflow-hidden animate-in zoom-in-95 duration-700 border border-white/20">
                        <div className="p-12 border-b border-slate-100 bg-white/40 flex justify-between items-center relative gap-8">
                            <div className="absolute top-0 right-10 p-12 opacity-[0.02] pointer-events-none rotate-12"><Lock size={200} /></div>
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="h-16 w-16 bg-teal-600 rounded-[1.75rem] flex items-center justify-center text-white shadow-3xl shadow-teal-500/30">
                                    <ShieldCheck size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] leading-none mb-2">Access Provisioning</h3>
                                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Authority Re-map</h4>
                                    <p className="text-[10px] font-black text-slate-600 font-mono tracking-widest mt-2">TARGET: {permModalUser.username.toUpperCase()} NODE</p>
                                </div>
                            </div>
                            <button onClick={() => setPermModalUser(null)} className="h-16 w-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm relative z-10">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="p-12 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar bg-slate-100/30">
                            {machines.map(m => {
                                const authMachines = permModalUser.authorized_machines || '';
                                const isSelected = authMachines.split(',').includes(m.id);
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => handleToggleMachine(m.id)}
                                        className={`w-full flex items-center justify-between p-7 rounded-[2.5rem] border-4 transition-all group relative overflow-hidden backdrop-blur-md ${isSelected
                                            ? 'bg-teal-600 border-teal-600 shadow-3xl shadow-teal-500/20 text-white'
                                            : 'bg-white border-white hover:border-teal-100 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-6 text-left relative z-10">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600'}`}>
                                                <Microscope size={28} />
                                            </div>
                                            <div>
                                                <p className={`text-lg font-black uppercase tracking-tight leading-none mb-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{m.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-teal-100' : 'text-slate-600'}`}>{m.type} Node • Cluster {m.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-white text-teal-600 shadow-inner' : 'bg-slate-100 text-transparent'}`}>
                                            <CheckCircle2 size={24} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-12 bg-white border-t border-slate-100 flex gap-6">
                            <button onClick={() => setPermModalUser(null)} className="flex-1 h-20 bg-slate-100 text-slate-600 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all active:scale-95">Abort Trace</button>
                            <button
                                onClick={handleSavePermissions}
                                className="flex-[2] h-20 bg-slate-950 text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-3xl hover:bg-teal-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-teal-500/20"
                            >
                                <Save size={24} /> Deploy Access Matrix
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. New Identity Provisioning Modal */}
            {isAddingUser && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-700 font-sans">
                    <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-700 border border-white/20">
                        <div className="p-12 border-b border-slate-100 bg-white/40 flex justify-between items-center relative">
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] leading-none mb-2">Registry Control</h3>
                                <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Provision Node</h4>
                            </div>
                            <button onClick={() => setIsAddingUser(false)} className="h-16 w-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                <X size={28} />
                            </button>
                        </div>
                        <div className="p-12 space-y-8 bg-slate-50/50">
                            <InputField label="Operator Universal Username" icon={<Users size={20} />} placeholder="Enter Identity Hash..." value={newUserQuery.username} onChange={v => setNewUserQuery({ ...newUserQuery, username: v })} autoFocus={true} />
                            <InputField label="Secure Passkey Protocol" icon={<Key size={20} />} placeholder="••••••••" type="password" value={newUserQuery.password} onChange={v => setNewUserQuery({ ...newUserQuery, password: v })} />

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2">Authority Level Cluster</label>
                                <div className="relative group/select">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-500">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <select
                                        className="w-full bg-white border-4 border-white rounded-[2.5rem] py-7 pl-16 pr-10 text-lg font-black text-slate-950 shadow-xl focus:ring-[15px] focus:ring-teal-500/5 transition-all outline-none appearance-none cursor-pointer"
                                        value={newUserQuery.role}
                                        onChange={e => setNewUserQuery({ ...newUserQuery, role: e.target.value })}
                                    >
                                        <option value="User">Standard Clinical Operator</option>
                                        <option value="Developer">Root System Architect</option>
                                    </select>
                                    <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="p-12 bg-white">
                            <button
                                onClick={handleAddUser}
                                className="w-full h-24 bg-slate-950 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-4xl hover:bg-teal-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-teal-500/20"
                            >
                                <Plus size={24} /> Incorporate Identity Node
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Catalog Definition Matrix (Add / Edit) */}
            {(isAddingCatalog || editingCatalogItem) && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-700 overflow-y-auto font-sans">
                    <div className="bg-white w-full max-w-3xl my-auto rounded-[4.5rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-700 border border-white/20">

                        <div className="p-12 border-b border-slate-100 bg-white/40 flex justify-between items-center relative">
                            <div className="relative z-10 flex items-center gap-8">
                                <div className="h-20 w-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-teal-500 shadow-3xl border border-slate-800">
                                    <Terminal size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] leading-none mb-2">Inversion Protocol</h3>
                                    <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                                        {isAddingCatalog ? 'Define Test Node' : 'Override Protocol'}
                                    </h4>
                                </div>
                            </div>
                            <button onClick={() => { setIsAddingCatalog(false); setEditingCatalogItem(null); }} className="h-16 w-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm relative z-10">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="p-16 space-y-12 bg-slate-50/50">
                            <div className="grid grid-cols-2 gap-10">
                                <InputField
                                    label="Protocol Trace Code"
                                    icon={<QrCode size={20} />}
                                    value={isAddingCatalog ? newCatalogItem.code : editingCatalogItem.code}
                                    onChange={v => isAddingCatalog ? setNewCatalogItem({ ...newCatalogItem, code: v.toUpperCase() }) : null}
                                    disabled={!!editingCatalogItem}
                                    placeholder="GLU_F_01"
                                    className="font-mono"
                                />
                                <InputField
                                    label="Analyzer Telemetry Link"
                                    icon={<Cpu size={20} />}
                                    value={isAddingCatalog ? newCatalogItem.analyzer_code || '' : editingCatalogItem.analyzer_code || ''}
                                    onChange={v => isAddingCatalog ? setNewCatalogItem({ ...newCatalogItem, analyzer_code: v }) : setEditingCatalogItem({ ...editingCatalogItem, analyzer_code: v })}
                                    placeholder="MAP_ID_742"
                                    className="font-mono text-teal-600"
                                />
                            </div>

                            <InputField
                                label="Clinical Nomenclature"
                                icon={<Beaker size={20} />}
                                value={isAddingCatalog ? newCatalogItem.name : editingCatalogItem.name}
                                onChange={v => isAddingCatalog ? setNewCatalogItem({ ...newCatalogItem, name: v }) : setEditingCatalogItem({ ...editingCatalogItem, name: v })}
                                placeholder="FASTING PLASMA GLUCOSE..."
                            />

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2">Diagnostic Category</label>
                                    <div className="relative group/select">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-500">
                                            <Activity size={20} />
                                        </div>
                                        <select
                                            className="w-full bg-white border-4 border-white rounded-[2.5rem] py-7 pl-16 pr-10 text-lg font-black text-slate-950 shadow-xl focus:ring-[15px] focus:ring-teal-500/5 transition-all outline-none appearance-none cursor-pointer"
                                            value={isAddingCatalog ? newCatalogItem.category : editingCatalogItem.category}
                                            onChange={e => isAddingCatalog ? setNewCatalogItem({ ...newCatalogItem, category: e.target.value }) : setEditingCatalogItem({ ...editingCatalogItem, category: e.target.value })}
                                        >
                                            <option value="Biochemistry">Biochemistry Node</option>
                                            <option value="Hematology">Hematology Node</option>
                                            <option value="Electrolyte">Electrolyte Node</option>
                                            <option value="Hormone">Hormone Node</option>
                                            <option value="Serology">Serology Node</option>
                                            <option value="Microbiology">Microbiology Node</option>
                                            <option value="Clinical Pathology">Pathology Node</option>
                                        </select>
                                        <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" size={20} />
                                    </div>
                                </div>
                                <InputField
                                    label="Billing Matrix (LKR)"
                                    type="number"
                                    icon={<Smartphone size={20} />}
                                    value={isAddingCatalog ? newCatalogItem.price : editingCatalogItem.price}
                                    onChange={v => isAddingCatalog ? setNewCatalogItem({ ...newCatalogItem, price: v }) : setEditingCatalogItem({ ...editingCatalogItem, price: v })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <InputField
                                    label="Diagnostic Metric Unit"
                                    icon={<Terminal size={20} />}
                                    value={isAddingCatalog ? newCatalogItem.unit || '' : editingCatalogItem.unit || ''}
                                    onChange={v => isAddingCatalog ? setNewCatalogItem({ ...newCatalogItem, unit: v }) : setEditingCatalogItem({ ...editingCatalogItem, unit: v })}
                                    placeholder="mg / dL"
                                />
                                <InputField
                                    label="Standard Reference Cluster"
                                    icon={<InfoIcon size={20} />}
                                    value={isAddingCatalog ? newCatalogItem.ref_range || '' : editingCatalogItem.ref_range || ''}
                                    onChange={v => isAddingCatalog ? setNewCatalogItem({ ...newCatalogItem, ref_range: v }) : setEditingCatalogItem({ ...editingCatalogItem, ref_range: v })}
                                    placeholder="70.00 - 110.00"
                                    className="text-teal-600 font-mono tracking-tighter"
                                />
                            </div>

                            {/* REAGENT STOCK INJECTION SCREEN */}
                            {editingCatalogItem && (
                                <div className="space-y-10">
                                    <div className="p-10 bg-teal-50/50 rounded-[3.5rem] border-4 border-blue-50 relative group/reagent space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h4 className="text-xl font-black text-teal-900 uppercase tracking-tight">Supply Chain Linkage</h4>
                                                <p className="text-[10px] font-black text-teal-600/60 uppercase tracking-[0.3em] italic">Automated Asset Depletion Protocol</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const invItems = await window.api.getInventory();
                                                    const options = invItems.map(i => `${i.id}: ${i.name}`).join('\n');
                                                    const idInput = prompt(`Available Supply Nodes:\n${options}\n\nInput Supply ID to Probe:`);
                                                    if (!idInput) return;
                                                    const amt = prompt("Standard consumption per terminal run:");
                                                    if (!amt) return;

                                                    try {
                                                        await window.api.saveTestReagent({ testCode: editingCatalogItem.code, itemId: parseInt(idInput), usageAmount: parseFloat(amt) });
                                                        const updated = await window.api.getTestReagents(editingCatalogItem.code);
                                                        setCatalogItemReagents(updated);
                                                    } catch (e) { alert("Registry Link Failed."); }
                                                }}
                                                className="h-14 px-8 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-3xl shadow-teal-500/30 hover:bg-teal-700 transition-all active:scale-95 flex items-center gap-3"
                                            >
                                                <Plus size={18} /> Link Resource Node
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {catalogItemReagents.length === 0 ? (
                                                <div className="py-12 text-center border-4 border-dashed border-teal-100/50 rounded-[2.5rem] bg-white/20">
                                                    <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em]">Zero supply proxy links established</p>
                                                </div>
                                            ) : catalogItemReagents.map(r => (
                                                <div key={r.id} className="flex items-center justify-between bg-white p-6 rounded-[2rem] border-2 border-blue-50 shadow-sm group/item hover:scale-[1.02] transition-all duration-500">
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-14 w-14 bg-teal-50 text-teal-500 rounded-2xl flex items-center justify-center border border-teal-100 shadow-inner group-hover/item:bg-teal-600 group-hover/item:text-white transition-all">
                                                            <Package size={22} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[15px] font-black text-slate-800 uppercase tracking-tight mb-1">{r.reagent_name}</p>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest italic">Consumption Payload: {r.usage_amount} Units</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            await window.api.deleteTestReagent(r.id);
                                                            const updated = await window.api.getTestReagents(editingCatalogItem.code);
                                                            setCatalogItemReagents(updated);
                                                        }}
                                                        className="h-12 w-12 flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* DYNAMIC REFERENCE RANGES SECTION */}
                                    <div className="p-10 bg-slate-900 rounded-[3.5rem] border-4 border-slate-800 relative group/ranges space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h4 className="text-xl font-black text-white uppercase tracking-tight">Biological Threshold Matrix</h4>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Demographic-aware reference intervals</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    loadReferenceRanges(editingCatalogItem.code);
                                                    setEditingRange(null);
                                                    setNewRange({ gender: 'Both', age_min: 0, age_max: 150, ref_range: '', is_active: true });
                                                    setShowRangeModal(true);
                                                }}
                                                className="h-14 px-8 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-3xl hover:bg-teal-500 hover:text-white transition-all active:scale-95 flex items-center gap-3"
                                            >
                                                <Plus size={18} /> Insert Demographic Node
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {dynamicRanges.length === 0 ? (
                                                <div className="py-12 text-center border-4 border-dashed border-slate-800 rounded-[2.5rem] text-slate-500">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.4em]">Using global static threshold only</p>
                                                </div>
                                            ) : dynamicRanges.map(range => (
                                                <div key={range.id} className="flex items-center justify-between bg-slate-800/50 p-6 rounded-[2rem] border-2 border-slate-700/50 group/range hover:border-teal-500 transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-12 w-12 bg-slate-700 rounded-xl flex items-center justify-center text-teal-400 font-black text-xs">
                                                            {range.gender === 'Both' ? 'B' : range.gender[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-black uppercase tracking-tight text-sm">Age: {range.age_min} - {range.age_max} Years</p>
                                                            <p className="text-teal-400 font-mono font-black text-xs uppercase tracking-widest">{range.ref_range}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => { setEditingRange(range); setNewRange(range); setShowRangeModal(true); }}
                                                            className="text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRange(range.id)}
                                                            className="text-slate-500 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-16 bg-white border-t border-slate-100 flex gap-8">
                            <button onClick={() => { setIsAddingCatalog(false); setEditingCatalogItem(null); }} className="flex-1 h-24 bg-slate-100 text-slate-600 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all active:scale-95">Abort Trace</button>
                            <button
                                onClick={isAddingCatalog ? handleAddCatalog : handleUpdateCatalog}
                                className="flex-[2] h-24 bg-slate-950 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-4xl hover:bg-teal-600 transition-all flex items-center justify-center gap-5 active:scale-95 shadow-teal-500/20"
                            >
                                <Zap size={24} className="fill-current" /> {isAddingCatalog ? 'Commit Node Definition' : 'Synchronize Registry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Biological Threshold Modal */}
            {showRangeModal && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-6 animate-in zoom-in-95 duration-700">
                    <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden border border-white">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Threshold Definition</h3>
                            <button onClick={() => setShowRangeModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Biological Gender Axis</label>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                    {['Male', 'Female', 'Both'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setNewRange({ ...newRange, gender: g })}
                                            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${newRange.gender === g ? 'bg-white text-teal-600 shadow-xl' : 'text-slate-500'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <InputField label="Age Min" type="number" value={newRange.age_min} onChange={v => setNewRange({ ...newRange, age_min: parseInt(v) })} />
                                <InputField label="Age Max" type="number" value={newRange.age_max} onChange={v => setNewRange({ ...newRange, age_max: parseInt(v) })} />
                            </div>
                            <InputField label="Biometry Range (String)" value={newRange.ref_range} onChange={v => setNewRange({ ...newRange, ref_range: v })} placeholder="e.g. 10.0 - 20.0" />
                        </div>
                        <div className="p-10 bg-slate-50 flex gap-6">
                            <button onClick={() => setShowRangeModal(false)} className="flex-1 h-16 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest">Abort</button>
                            <button onClick={handleSaveRange} className="flex-[2] h-16 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-500/20">Commit Mapping</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


/* --- HIGH-FIDELITY SUBCOMPS --- */

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all duration-500 relative ${active
            ? 'bg-white text-teal-600 shadow-xl border border-white -translate-y-0.5'
            : 'text-slate-600 hover:text-slate-800'
            }`}
    >
        {icon} {label}
        {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-teal-600 rounded-full"></div>}
    </button>
);

const InputField = ({ label, icon, value, onChange, disabled = false, type = "text", placeholder = "", autoFocus = false, className = "" }) => (
    <div className="space-y-4 group">
        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2 group-focus-within:text-teal-600 transition-colors uppercase italic">{label}</label>
        <div className="relative">
            <div className={`absolute left-7 top-1/2 -translate-y-1/2 transition-all duration-500 ${disabled ? 'text-slate-600' : 'text-slate-600 group-focus-within:text-teal-600 group-focus-within:scale-110'}`}>
                {icon}
            </div>
            <input
                type={type}
                className={`w-full bg-white/50 border-4 rounded-[2.5rem] py-7 pl-20 pr-10 text-xl font-black text-slate-950 shadow-sm focus:ring-[15px] focus:ring-teal-500/5 transition-all outline-none placeholder:text-slate-600 ${disabled
                    ? 'bg-slate-50 border-slate-50 cursor-not-allowed opacity-40'
                    : 'border-white focus:bg-white focus:border-teal-100/50'
                    } ${className} uppercase tracking-tight`}
                value={value}
                onChange={e => onChange ? onChange(e.target.value) : null}
                disabled={disabled}
                placeholder={placeholder}
                autoFocus={autoFocus}
            />
        </div>
    </div>
);

const SecurityMetric = ({ icon, label, value, status }) => (
    <div className="bg-white/80 p-8 rounded-[3rem] border border-white flex items-center gap-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
            {React.cloneElement(icon, { size: 120 })}
        </div>
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-700 bg-slate-50 text-teal-500 border border-slate-100`}>
            {React.cloneElement(icon, { size: 28 })}
        </div>
        <div className="space-y-2 relative z-10">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] leading-none">{label}</p>
            <p className="text-xl font-black text-slate-950 tracking-tighter uppercase leading-none">{value}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 rounded-lg border border-teal-100/50">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-600 shadow-[0_0_8px_rgba(37,99,235,1)]"></div>
                <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{status}</span>
            </div>
        </div>
    </div>
);

const TelemetryRow = ({ label, value, icon }) => (
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

const SubscriptionTab = ({ subscription, hwid, isAuthorized, handleActivateLicense, licenseInput, setLicenseInput, licenseActivating, licenseMsg, isDeveloper }) => {
    const today = new Date();
    const expiry = subscription.expiryDate ? new Date(subscription.expiryDate) : null;
    const daysLeft = expiry ? Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) : null;
    const progressPct = daysLeft !== null ? Math.max(0, Math.min(100, (daysLeft / 365) * 100)) : 0;
    const isExpired = daysLeft !== null && daysLeft <= 0;
    const isWarning = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
    const planThemes = {
        STANDARD: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: <Star size={32} /> },
        PROFESSIONAL: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <BadgeCheck size={32} /> },
        ENTERPRISE: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', icon: <Zap size={32} /> }
    };
    const theme = planThemes[subscription.plan] || planThemes.STANDARD;
    return (
        <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
            <div className="bg-slate-950 rounded-[3.5rem] p-12 relative overflow-hidden border border-slate-800 group shadow-[0_60px_120px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 via-transparent to-cyan-600/10 pointer-events-none"></div>
                <div className="absolute -top-20 -right-20 h-80 w-80 bg-teal-600/10 rounded-full blur-[120px] group-hover:bg-teal-600/20 transition-all duration-1000 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className={`h-20 w-20 ${theme.bg} ${theme.border} border rounded-3xl flex items-center justify-center ${theme.color} shadow-inner`}>{theme.icon}</div>
                            <div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-1">Current Plan</p>
                                <h2 className="text-4xl font-black text-white tracking-tighter leading-none">{subscription.plan}</h2>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                                <CalendarDays size={13} className="text-teal-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subscription.activatedOn ? `Activated: ${subscription.activatedOn}` : 'Not Activated'}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                                <CalendarDays size={13} className={isExpired ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-400'}`}>{subscription.expiryDate ? `Expires: ${subscription.expiryDate}` : 'No Expiry Set'}</span>
                            </div>
                        </div>
                    </div>
                    {daysLeft !== null && (
                        <div className="text-right shrink-0">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Days Remaining</p>
                            <p className={`text-7xl font-black tabular-nums tracking-tighter leading-none ${isExpired ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-white'}`}>{Math.max(0, daysLeft)}</p>
                            {isExpired && <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-2">LICENSE EXPIRED</p>}
                            {isWarning && <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-2">RENEWAL REQUIRED SOON</p>}
                        </div>
                    )}
                </div>
                {daysLeft !== null && (
                    <div className="relative z-10 mt-10">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">License Validity</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isExpired ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>{Math.round(progressPct)}% Remaining</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${isExpired ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_12px_rgba(16,185,129,0.5)]`} style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {isExpired && (
                <div className="flex items-center gap-6 p-8 bg-rose-50 border border-rose-100 rounded-3xl">
                    <AlertTriangle size={28} className="text-rose-500 shrink-0" />
                    <div>
                        <p className="font-black text-rose-600 uppercase tracking-wide text-sm">License Expired</p>
                        <p className="text-sm text-rose-500 font-medium mt-1">Enter a new license key below to restore full access.</p>
                    </div>
                </div>
            )}
            {isWarning && (
                <div className="flex items-center gap-6 p-8 bg-amber-50 border border-amber-100 rounded-3xl">
                    <AlertTriangle size={28} className="text-amber-500 shrink-0" />
                    <div>
                        <p className="font-black text-amber-600 uppercase tracking-wide text-sm">Renewal Recommended</p>
                        <p className="text-sm text-amber-600 font-medium mt-1">Your license expires in {daysLeft} days. Renew now to avoid interruptions.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Patient Registry', included: true },
                    { label: 'Analyzer Integration', included: true },
                    { label: 'Financial Matrix', included: true },
                    { label: 'Inventory Management', included: true },
                    { label: 'Multi-User Access', included: subscription.plan !== 'STANDARD' },
                    { label: 'Priority Support', included: subscription.plan === 'ENTERPRISE' }
                ].map(f => (
                    <div key={f.label} className={`flex items-center gap-4 p-6 rounded-2xl border transition-all ${f.included ? 'bg-emerald-50/60 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        <CheckCircle2 size={18} className={f.included ? 'text-emerald-500' : 'text-slate-300'} />
                        <span className="text-[11px] font-black uppercase tracking-wider">{f.label}</span>
                    </div>
                ))}
            </div>

            {isDeveloper && (
                <div className="bg-white/60 rounded-[3.5rem] border border-white shadow-sm backdrop-blur-xl p-12 space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em]">License Activation Terminal</h3>
                        <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Activate / Renew</h4>
                        <p className="text-sm text-slate-600 font-medium">Enter your Mediccon license key. Format: <code className="font-mono text-teal-600 bg-teal-50 px-2 py-0.5 rounded">MCN-PRO-20270101-XXXX</code></p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 relative group">
                            <Key size={20} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-teal-600 transition-colors" />
                            <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-6 pl-16 pr-8 font-mono text-lg font-black text-slate-950 focus:bg-white focus:border-teal-500/30 focus:ring-[15px] focus:ring-teal-500/5 outline-none transition-all uppercase tracking-widest placeholder:text-slate-600 placeholder:normal-case placeholder:tracking-normal" placeholder="MCN-PRO-20270101-XXXX" value={licenseInput} onChange={e => setLicenseInput(e.target.value.toUpperCase())} />
                        </div>
                        <button onClick={handleActivateLicense} disabled={licenseActivating || !licenseInput.trim()} className="h-[74px] px-10 bg-slate-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-teal-600 transition-all flex items-center gap-4 shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                            {licenseActivating ? <RefreshCw size={18} className="animate-spin" /> : <BadgeCheck size={18} />}
                            {licenseActivating ? 'Activating...' : 'Activate'}
                        </button>
                    </div>
                    {licenseMsg && (
                        <div className={`flex items-center gap-4 p-6 rounded-2xl border text-sm font-bold ${licenseMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                            {licenseMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                            {licenseMsg.text}
                        </div>
                    )}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-4">
                        <div className="h-1.5 w-1.5 rounded-full bg-teal-600"></div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">License keys are stored locally and bound to your hardware ID</span>
                    </div>
                </div>
            )}

            <div className="bg-slate-950 rounded-[3rem] p-10 flex items-center gap-8 border border-slate-800">
                <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0"><Cpu size={28} className="text-teal-400" /></div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Hardware-Bound License</p>
                    <p className="font-black text-white text-sm uppercase tracking-tight">HWID: {hwid}</p>
                </div>
                <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${isAuthorized ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    <div className={`h-2 w-2 rounded-full animate-pulse ${isAuthorized ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                    {isAuthorized ? 'Node Authenticated' : 'Unlinked'}
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;

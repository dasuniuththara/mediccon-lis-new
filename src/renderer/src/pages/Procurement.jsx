import React, { useState, useEffect } from 'react';
import {
    Truck,
    ShoppingCart,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowRight,
    Plus,
    RefreshCw,
    Download,
    Package,
    ShieldAlert,
    Zap,
    History
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';

const Procurement = () => {
    const { navigateBack, navigateNext } = useGlobalStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAutoPiloting, setIsAutoPiloting] = useState(false);
    const [userMachines, setUserMachines] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await window.api.getProcurementOrders();
            const machines = await window.api.getMachines(user);
            const items = await window.api.getInventoryItems();
            setOrders(res || []);
            setUserMachines(machines || []);
            setInventoryItems(items || []);
        } catch (e) {
            console.error("Procurement Stream Fault:", e);
        }
        setLoading(false);
    };

    const handleAutoProcure = async () => {
        setIsAutoPiloting(true);
        try {
            const res = await window.api.triggerAutoProcurement();
            if (res.success && res.count > 0) {
                alert(`AI Core triggered protocol for ${res.count} critical assets.`);
                loadOrders();
            } else {
                alert("Supply chain nodes are currently optimized.");
            }
        } catch (e) {
            alert("Auto-Pilot Protocol Failure.");
        }
        setIsAutoPiloting(false);
    };

    const handleUpdateStatus = async (id, status, qtyReceived = 0) => {
        try {
            const res = await window.api.updateProcurementStatus({ id, status, qtyReceived });
            if (res.success) {
                loadOrders();
            }
        } catch (e) {
            alert("Protocol Update Failed.");
        }
    };

    const statusColors = {
        PENDING: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        ORDERED: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        RECEIVED: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        CANCELLED: 'text-slate-500 bg-slate-500/10 border-slate-500/20'
    };

    const priorityColors = {
        CRITICAL: 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse',
        URGENT: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        NORMAL: 'text-teal-500 bg-teal-500/10 border-teal-500/20'
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">

            {/* 1. Procurement Header Hub */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 bg-white/40 p-10 rounded-[3rem] border border-white shadow-sm backdrop-blur-xl group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
                    <Truck size={200} />
                </div>

                <div className="flex items-center gap-8 relative z-10 w-full">
                    <div className="flex items-center gap-3">
                        <button onClick={navigateBack} className="h-14 w-14 bg-white border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95 shrink-0">
                            <ArrowRight size={24} className="rotate-180" />
                        </button>
                        <button onClick={navigateNext} className="h-14 w-14 bg-white border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95 shrink-0">
                            <ArrowRight size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 flex-1">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse shadow-[0_0_12px_rgba(20,184,166,0.6)]"></div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Supply Chain Command Node</span>
                            </div>
                            <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none flex items-center gap-6">
                                Procurement <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 uppercase italic">Matrix</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleAutoProcure}
                                disabled={isAutoPiloting}
                                className="flex items-center gap-3 px-10 py-5 bg-slate-950 text-teal-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                            >
                                <Zap size={20} className={isAutoPiloting ? 'animate-ping' : ''} />
                                {isAutoPiloting ? 'Autonomous Execution...' : 'Trigger AI Auto-Pilot'}
                            </button>
                            <button onClick={loadOrders} className="h-14 w-14 bg-white border border-slate-100 text-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Active Orders Stream */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">

                {/* Primary Ledger */}
                <div className="xl:col-span-12 space-y-8">
                    <div className="flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-900 shadow-sm">
                                <History size={20} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">Replenishment Ledger</h2>
                        </div>
                        <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-4 py-2 rounded-full border border-teal-100">{orders.filter(o => {
                            if (user?.role === 'developer') return true;
                            if (userMachines.length === 0) return true;
                            const item = inventoryItems.find(i => i.id === o.item_id);
                            if (!item) return false;
                            const myCategories = userMachines.map(m => m.category);
                            return myCategories.includes(item.category) || item.category === 'Consumable';
                        }).length} ACTIVE ORDERS</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 pb-32">
                        {orders.filter(o => {
                            if (user?.role === 'developer') return true;
                            if (userMachines.length === 0) return true;
                            const item = inventoryItems.find(i => i.id === o.item_id);
                            if (!item) return false;
                            const myCategories = userMachines.map(m => m.category);
                            return myCategories.includes(item.category) || item.category === 'Consumable';
                        }).map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onStatusUpdate={handleUpdateStatus}
                                statusColors={statusColors}
                                priorityColors={priorityColors}
                            />
                        ))}

                        {orders.length === 0 && (
                            <div className="col-span-3 py-40 bg-white/40 border-2 border-dashed border-white rounded-[3rem] flex flex-col items-center justify-center text-slate-400 backdrop-blur-xl">
                                <Package size={80} className="mb-6 opacity-20" />
                                <p className="font-black text-[11px] uppercase tracking-[0.4em]">Zero Procurement Instances Logged</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const OrderCard = ({ order, onStatusUpdate, statusColors, priorityColors }) => {
    const isPending = order.status === 'PENDING';
    const isOrdered = order.status === 'ORDERED';
    const [receivedQty, setReceivedQty] = useState(order.quantity);

    return (
        <div className="bg-white/60 p-10 rounded-[3rem] border border-white shadow-sm transition-all duration-700 group hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
                <ShoppingCart size={120} />
            </div>

            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${priorityColors[order.priority] || priorityColors.NORMAL}`}>
                            {order.priority}
                        </span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-md">
                            ID: #{order.id}
                        </span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none group-hover:text-emerald-600 transition-colors">{order.item_name}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest italic group-hover:text-slate-900 transition-colors">
                        <Package size={12} className="text-teal-500" /> Current Stock: {order.current_stock} {order.unit}
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black border uppercase tracking-widest ${statusColors[order.status] || statusColors.PENDING}`}>
                    {order.status}
                </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl text-white space-y-4 mb-10 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <span>Replenishment Goal</span>
                    <span className="text-emerald-400">Target Reached</span>
                </div>
                <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black tracking-tighter tabular-nums text-white">+{order.quantity}</span>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{order.unit} Node</span>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <Zap size={14} className="text-teal-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Ingress: {order.generated_by}</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 relative z-10">
                {isPending && (
                    <button
                        onClick={() => onStatusUpdate(order.id, 'ORDERED')}
                        className="flex-1 py-4 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-500/20 active:scale-95"
                    >
                        <ShoppingCart size={16} /> Mark Ordered
                    </button>
                )}
                {isOrdered && (
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 bg-white border border-slate-100 rounded-2xl flex items-center px-6 gap-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Qty</span>
                            <input
                                type="number"
                                value={receivedQty}
                                onChange={(e) => setReceivedQty(parseFloat(e.target.value))}
                                className="w-full py-4 text-sm font-black text-slate-950 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => onStatusUpdate(order.id, 'RECEIVED', receivedQty)}
                            className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <CheckCircle2 size={16} /> Fulfill Link
                        </button>
                    </div>
                )}
                {(isPending || isOrdered) && (
                    <button
                        onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
                        className="py-4 px-6 bg-white border border-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95"
                    >
                        <XCircle size={18} />
                    </button>
                )}
                {order.status === 'RECEIVED' && (
                    <div className="w-full flex items-center gap-4 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-8 text-emerald-700">
                        <CheckCircle2 size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Satisfied: Node Synchronized at {new Date(order.received_at).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Procurement;

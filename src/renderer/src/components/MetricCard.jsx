import React from 'react';
import { ShieldCheck } from 'lucide-react';

const MetricCard = ({ label, value, icon, color = "teal", sub, description }) => {
    const themes = {
        teal: 'text-teal-600 bg-teal-50 border-teal-100 shadow-teal-100/50',
        rose: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/50',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/50',
        cyan: 'text-cyan-600 bg-cyan-50 border-cyan-100 shadow-cyan-100/50',
        amber: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100/50'
    };

    return (
        <div className="bg-white/60 rounded-[2.5rem] p-8 border border-white shadow-sm transition-all duration-700 group hover:shadow-[0_40px_100px_rgba(0,0,0,0.06)] hover:-translate-y-1 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                {React.cloneElement(icon, { size: 140 })}
            </div>

            <div className="flex items-center gap-6 relative z-10">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform duration-700 ${themes[color]}`}>
                    {React.cloneElement(icon, { size: 28 })}
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{label}</p>
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none font-mono">
                            {value}
                        </span>
                        {sub && <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{sub}</span>}
                    </div>
                </div>
            </div>
            {description && (
                <div className="mt-6 pt-6 border-t border-slate-100/50 flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${themes[color].split(' ')[0].replace('text-', 'bg-')}`}></div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest opacity-80">{description}</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;

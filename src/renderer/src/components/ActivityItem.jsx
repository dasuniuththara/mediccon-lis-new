import React from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';

const ActivityItem = ({ item, timeAgo, onClick }) => {
    const isCompleted = item.status === 'Completed' || item.status === 'VALIDATED';
    const isRegistration = item.type === 'REGISTRATION';

    return (
        <div
            onClick={onClick}
            className="group p-5 rounded-[2rem] bg-white/80 border border-white shadow-sm hover:bg-white hover:shadow-xl hover:translate-x-1 transition-all duration-300 flex gap-5 cursor-pointer backdrop-blur-sm"
        >
            <div className="relative mt-1">
                <div className={`h-3 w-3 rounded-full shadow-lg ${isRegistration ? 'bg-teal-500 shadow-teal-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
                <div className={`absolute -top-1 -left-1 h-5 w-5 rounded-full animate-ping opacity-20 ${isRegistration ? 'bg-teal-500' : 'bg-emerald-500'}`} />
                <div className={`absolute top-8 left-1.5 w-px h-full bg-slate-100 group-last:hidden`}></div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1.5">
                    <p className="text-sm font-black text-slate-800 group-hover:text-teal-600 truncate uppercase tracking-tight leading-none transition-colors">{item.patient}</p>
                    <span className="text-[9px] font-bold text-slate-600 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 font-mono tracking-tight">{timeAgo}</span>
                </div>

                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest truncate mb-3">
                    {item.subtext}
                </p>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${isCompleted
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-teal-50 text-teal-600 border-teal-100'
                        }`}>
                        {isCompleted && <ShieldCheck size={10} />}
                        {item.status}
                    </div>
                    <span className="text-[8px] font-black text-slate-600 group-hover:text-slate-700 uppercase tracking-[0.2em] transition-colors">{item.type}</span>
                </div>
            </div>

            <div className="self-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                    <ChevronRight size={14} />
                </div>
            </div>
        </div>
    );
};

export default ActivityItem;

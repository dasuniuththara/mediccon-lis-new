import React from 'react';

const ActionButton = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-4 p-6 min-h-[160px] w-full bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 hover:border-white/10 transition-all group/btn active:scale-95 shadow-xl"
    >
        <div className="h-16 w-16 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-[0_15px_40px_rgba(20,184,166,0.35)] group-hover/btn:scale-110 transition-all duration-500">
            {React.cloneElement(icon, { size: 32 })}
        </div>
        <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] group-hover/btn:text-white transition-colors text-center leading-tight">
            {label}
        </span>
    </button>
);

export default ActionButton;

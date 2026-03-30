import React, { useEffect, useRef } from 'react';

const AmbientMatrix = () => {
    // Highly optimized, static-first background to prevent "stucking" on clinical workstations.
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/50">
            {/* Soft Gradient Anchors instead of real-time waves */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse delay-700"></div>

            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>

            {/* Geometric Grid (Static) */}
            <div className="absolute inset-0 bg-[radial-gradient(#14b8a610_1.5px,transparent_1.5px)] [background-size:60px_60px] opacity-20"></div>
        </div>
    );
};

export default AmbientMatrix;

export default AmbientMatrix;

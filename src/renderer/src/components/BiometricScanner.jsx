import React, { useEffect, useState } from 'react';
import { Fingerprint, Scan } from 'lucide-react';
import { playVoiceAlert } from '../utils/voiceSynth';

const BiometricScanner = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Trigger voice on mount
        playVoiceAlert("Biometric authorization sequence initiated.");

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    playVoiceAlert("Identity matrix verified.");
                    setTimeout(onComplete, 600); // Trigger complete after 100%
                    return 100;
                }
                return prev + 4; // roughly 1.5 seconds total
            });
        }, 50);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[600] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            <div className="relative">
                {/* Holographic Fingerprint */}
                <div className="relative text-teal-500/40">
                    <Fingerprint size={180} strokeWidth={0.5} />

                    {/* Scanner line passing over */}
                    <div
                        className="absolute left-0 right-0 h-[2px] bg-teal-400 shadow-[0_0_15px_3px_#14b8a6] transition-all duration-[50ms]"
                        style={{ top: `${progress}%` }}
                    />

                    {/* Glowing highlight indicating scan area */}
                    <div
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/30 to-transparent transition-all duration-[50ms]"
                        style={{ height: '30%', top: `${Math.max(0, progress - 15)}%` }}
                    />
                </div>

                {/* Reticle UI Elements around scanner */}
                <div className="absolute -top-12 -left-12 h-10 w-10 border-t-2 border-l-2 border-teal-500/50 rounded-tl-2xl opacity-70" />
                <div className="absolute -top-12 -right-12 h-10 w-10 border-t-2 border-r-2 border-teal-500/50 rounded-tr-2xl opacity-70" />
                <div className="absolute -bottom-12 -left-12 h-10 w-10 border-b-2 border-l-2 border-teal-500/50 rounded-bl-2xl opacity-70" />
                <div className="absolute -bottom-12 -right-12 h-10 w-10 border-b-2 border-r-2 border-teal-500/50 rounded-br-2xl opacity-70" />

                <div className="absolute -right-36 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                    <div className="text-[10px] font-mono text-teal-400/80 uppercase tracking-widest">
                        SYS_CHK: <span className="text-emerald-400">OK</span>
                    </div>
                    <div className="text-[10px] font-mono text-teal-400/80 uppercase tracking-widest">
                        BIO_SIG: <span className="text-teal-200">VERIFYING</span>
                    </div>
                    <div className="text-[10px] font-mono text-teal-400/80 uppercase tracking-widest flex items-center justify-between">
                        PROGRESS: <span className="text-white font-black">{progress}%</span>
                    </div>
                </div>
            </div>

            <div className="mt-20 text-center space-y-3">
                <div className="flex items-center justify-center gap-4 text-teal-400">
                    <Scan className="animate-spin-slow" size={20} />
                    <h3 className="text-sm font-black uppercase tracking-[0.5em] shadow-teal-500 drop-shadow-lg">BIOMETRIC AUTHORIZATION</h3>
                </div>
                <p className="text-[10px] text-teal-500/60 font-mono uppercase tracking-[0.3em] animate-pulse">
                    Decrypting clinical identity matrix...
                </p>
            </div>
        </div>
    );
};

export default BiometricScanner;

import React, { useEffect, useRef } from 'react';

const InteractiveNodeMap = ({ machines, onNodeClick }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        const updateCanvasSize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = 360; // Fixed height container
        };

        window.addEventListener('resize', updateCanvasSize);
        updateCanvasSize();

        const machineNames = Object.values(machines || {}).map(m => {
            const rawName = m.analyzer_name || m.analyzer_code || m.name || m.id || "Unknown";
            return {
                name: String(rawName).substring(0, 15),
                status: m.status || 'Offline'
            };
        });

        // Always have a central 'Mother Node'
        machineNames.unshift({ name: 'HOST CORE', status: 'Online', isRoot: true });

        const nodePositions = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Distribute nodes in an orbital ring to prevent overlapping
        for (let i = 0; i < machineNames.length; i++) {
            let baseX, baseY;
            if (i === 0) {
                baseX = centerX;
                baseY = centerY;
            } else {
                const angle = ((i - 1) / (machineNames.length - 1)) * Math.PI * 2;
                const radiusX = canvas.width * 0.38;
                const radiusY = canvas.height * 0.32;
                baseX = centerX + Math.cos(angle) * radiusX;
                baseY = centerY + Math.sin(angle) * Math.max(90, radiusY);
            }

            nodePositions.push({
                x: baseX,
                y: baseY,
                baseX: baseX,
                baseY: baseY,
                timeOffsetX: Math.random() * Math.PI * 2,
                timeOffsetY: Math.random() * Math.PI * 2,
                speedX: Math.random() * 0.01 + 0.005,
                speedY: Math.random() * 0.01 + 0.005,
                data: machineNames[i],
                pulse: Math.random() // Start data packet at random position on line
            });
        }

        let frameTime = 0;
        const animate = () => {
            frameTime++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connecting lines to root
            const rootNode = nodePositions[0];

            for (let i = 1; i < nodePositions.length; i++) {
                const node = nodePositions[i];

                // Organic hovering around tethered base positions
                node.x = node.baseX + Math.sin(frameTime * node.speedX + node.timeOffsetX) * 15;
                node.y = node.baseY + Math.cos(frameTime * node.speedY + node.timeOffsetY) * 15;

                // Draw line to root
                ctx.beginPath();
                const isOnline = node.data.status === 'Online';
                ctx.strokeStyle = isOnline ? 'rgba(20, 184, 166, 0.4)' : 'rgba(225, 29, 72, 0.1)';
                ctx.lineWidth = isOnline ? 1 : 0.5;
                if (isOnline) ctx.setLineDash([4, 4]);
                else ctx.setLineDash([]);
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(rootNode.x, rootNode.y);
                ctx.stroke();

                // Data packet travelling along the line (if online)
                if (isOnline) {
                    node.pulse = (node.pulse + 0.005) % 1;
                    const pktX = node.x + (rootNode.x - node.x) * node.pulse;
                    const pktY = node.y + (rootNode.y - node.y) * node.pulse;

                    ctx.beginPath();
                    ctx.fillStyle = '#14b8a6';
                    ctx.arc(pktX, pktY, 3, 0, Math.PI * 2);
                    ctx.fill();

                    // Small trailing glow for the packet
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(20, 184, 166, 0.5)';
                    ctx.arc(pktX, pktY, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw nodes
            for (let i = 0; i < nodePositions.length; i++) {
                const node = nodePositions[i];
                const isOnline = node.data.status === 'Online';

                // Outer Glow ring
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.data.isRoot ? 35 : 20, 0, Math.PI * 2);
                ctx.fillStyle = node.data.isRoot ? 'rgba(16, 185, 129, 0.1)' : (isOnline ? 'rgba(20, 184, 166, 0.1)' : 'rgba(225, 29, 72, 0.1)');
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.data.isRoot ? 6 : 4, 0, Math.PI * 2);
                ctx.fillStyle = node.data.isRoot ? '#10b981' : (isOnline ? '#14b8a6' : '#e11d48');
                ctx.fill();

                // Label Text
                ctx.fillStyle = node.data.isRoot ? '#10b981' : (isOnline ? '#0f172a' : '#64748b'); // slate-900 or slate-500
                ctx.font = '900 11px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(node.data.name.toUpperCase(), node.x, node.y - (node.data.isRoot ? 45 : 30));

                if (!node.data.isRoot) {
                    ctx.fillStyle = isOnline ? '#14b8a6' : '#e11d48'; // teal-500 or rose-600
                    ctx.font = '900 8px monospace';
                    ctx.fillText(node.data.status.toUpperCase(), node.x, node.y + 25);
                }
            }

            animId = requestAnimationFrame(animate);
        };

        const handleCanvasClick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Check if any node was clicked
            for (const node of nodePositions) {
                const dist = Math.sqrt((clickX - node.x) ** 2 + (clickY - node.y) ** 2);
                const hitRadius = node.data.isRoot ? 40 : 25;

                if (dist < hitRadius) {
                    if (node.data.isRoot) {
                        // Root node - maybe link to Mother UI or Google Maps of the main lab?
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Mediccon Healthcare, 1134, Denzil Kobbekaduwa Mawatha, Battaramulla')}`, '_blank');
                    } else {
                        // Regular machine node - link to machine monitor/config
                        // We need a way to communicate this back to the Dashboard page.
                        // Since we don't have a callback prop here, we can trigger a custom event or use a global store action if available.
                        // However, a simpler way is to check if there's an 'onNodeClick' prop.
                        if (onNodeClick) onNodeClick(node.data);
                    }
                    break;
                }
            }
        };

        canvas.addEventListener('click', handleCanvasClick);
        animate();

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            canvas.removeEventListener('click', handleCanvasClick);
            cancelAnimationFrame(animId);
        };
    }, [machines, onNodeClick]);

    return (
        <div className="w-full relative h-[360px] bg-slate-50/80 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-inner flex flex-col justify-end p-6">
            {Object.keys(machines || {}).length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-50 z-10">
                    <p className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-500">NETWORK DISCONNECTED: AWAITING NODE INITIALIZATION</p>
                </div>
            ) : null}
            <canvas ref={canvasRef} className="absolute inset-0 z-0 bg-transparent"></canvas>

            <div className="relative z-10 flex justify-between items-end pointer-events-none opacity-50">
                <div className="flex flex-col">
                    <span className="font-mono text-[9px] font-black text-slate-500">NETWORK NODE GRAPH</span>
                    <span className="font-mono text-[8px] font-black text-teal-500 uppercase tracking-widest leading-none">REAL-TIME TELEMETRY</span>
                </div>
                <div className="flex items-center gap-4 border border-slate-200/50 bg-white/50 px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-teal-500"></div><span className="text-[8px] font-black text-slate-600 uppercase">HL7 LINK OK</span></div>
                    <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div><span className="text-[8px] font-black text-slate-600 uppercase">NODE SECURED/OFF</span></div>
                </div>
            </div>
        </div>
    );
};

export default InteractiveNodeMap;

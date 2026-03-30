import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';

/**
 * Mediccon LIS Barcode Generator Component
 * Generates medical-standard barcodes for patient sample labeling.
 * 
 * @param {string} value - The NIC number or Lab ID to encode
 */
const BarcodeGenerator = ({ value }) => {
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (value && barcodeRef.current) {
            JsBarcode(barcodeRef.current, value, {
                format: "CODE128",     // Industrial medical standard
                width: 2,              // Thickness of bars
                height: 50,            // Height suitable for test tubes
                displayValue: true,    // Shows the NIC/ID text below the bars
                fontSize: 14,
                font: "monospace",
                lineColor: "#000000",
                background: "#ffffff",
                margin: 10
            });
        }
    }, [value]);

    const handlePrint = () => {
        const svg = barcodeRef.current;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const svgSize = svg.getBBox();
        canvas.width = svgSize.width;
        canvas.height = svgSize.height;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL("image/png");

            // Open a small print window
            const printWin = window.open('', '_blank', 'width=300,height=200');
            printWin.document.write(`
                <html>
                    <body style="text-align:center; margin:0; padding:10px;">
                        <img src="${pngUrl}" style="width:100%;" />
                        <script>window.onload = function() { window.print(); window.close(); }</script>
                    </body>
                </html>
            `);
            printWin.document.close();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Sample ID / NIC</h4>

            {/* The actual Barcode SVG */}
            <svg ref={barcodeRef}></svg>

            {value && (
                <button
                    onClick={handlePrint}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors"
                >
                    <Printer size={16} /> Print Sample Label
                </button>
            )}

            {!value && (
                <p className="text-slate-600 text-xs mt-2 italic">Enter NIC to generate barcode</p>
            )}
        </div>
    );
};

export default BarcodeGenerator;
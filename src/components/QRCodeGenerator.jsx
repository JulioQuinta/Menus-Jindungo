import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeGenerator = ({ url, restaurantName }) => {
    const qrRef = useRef();
    const [tableNumber, setTableNumber] = React.useState('');

    // Generate URL with optional table parameter
    const finalUrl = tableNumber ? `${url}?mesa=${tableNumber}` : url;
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');

    const downloadQRCode = () => {
        const canvas = qrRef.current.querySelector('canvas');
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        // Filename includes table number if present
        link.download = `${restaurantName || 'menu'}${tableNumber ? `-mesa-${tableNumber}` : ''}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 sm:p-8 bg-black/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center gap-6 max-w-md mx-auto w-full transition-all">
            <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                {tableNumber ? `QR Code - Mesa ${tableNumber}` : 'QR Code Geral'}
            </h3>

            <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] border border-white/20 transition-transform hover:scale-105 duration-300">
                <QRCodeCanvas
                    value={finalUrl}
                    size={220}
                    level={"H"}
                    includeMargin={true}
                    imageSettings={{
                        src: "/jindungo_icon.png", // Prefer a square icon if possible, or omit safely
                        x: undefined,
                        y: undefined,
                        height: 30, // smaller to avoid scanning errors
                        width: 30,
                        excavate: true,
                    }}
                />
            </div>

            <div className="w-full space-y-5 mt-2">
                {/* Table Input */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mesa Específica (Opcional)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🍽️</span>
                        <input
                            type="number"
                            placeholder="Ex: 5"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white font-medium shadow-inner"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                        Ao preencher, o cliente abrirá o menu diretamente na mesa.
                    </p>
                </div>

                {isLocalhost && (
                    <div className="text-xs p-4 bg-yellow-900/20 text-yellow-400 border border-yellow-500/20 rounded-xl font-bold shadow-sm flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <span>
                            <strong>Aviso de Teste Local:</strong> Este QR Code aponta para "localhost". O seu celular não vai conseguir abri-lo automaticamente na mesma rede sem o IP da máquina.
                        </span>
                    </div>
                )}

                <div className="text-center p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 break-all select-all font-mono">
                    🔗 <span className="text-[#D4AF37]">{finalUrl}</span>
                </div>

                <button
                    onClick={downloadQRCode}
                    className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black rounded-xl hover:brightness-110 font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 transform active:scale-95 hover:-translate-y-0.5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Baixar QR Code {tableNumber && `(Mesa ${tableNumber})`}
                </button>
            </div>
        </div>
    );
};

export default QRCodeGenerator;

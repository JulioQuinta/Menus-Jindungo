import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeShare = ({ slug, restaurantName, isOpen, onClose }) => {
    const qrRef = useRef();

    if (!isOpen) return null;

    const url = `${window.location.origin}/${slug}`;

    const downloadQRCode = () => {
        const canvas = qrRef.current.querySelector('canvas');
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `qrcode-${slug}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(url);
        alert("Link copiado!");
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-center">
                    <h3 className="text-white font-bold text-xl mb-1">Compartilhe seu Menu</h3>
                    <p className="text-white/80 text-sm">Leve seus clientes direto para a mesa</p>
                </div>

                <div className="p-8 flex flex-col items-center gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100" ref={qrRef}>
                        <QRCodeCanvas
                            value={url}
                            size={200}
                            level={"H"}
                            includeMargin={true}
                            imageSettings={{
                                src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=64&q=80",
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            }}
                        />
                    </div>

                    <div className="text-center">
                        <p className="font-mono text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded border mb-4 break-all">
                            {url}
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={copyLink}
                                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
                            >
                                Copiar Link
                            </button>
                            <button
                                onClick={downloadQRCode}
                                className="flex-1 py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <span>⬇️</span> PNG
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-sm font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRCodeShare;

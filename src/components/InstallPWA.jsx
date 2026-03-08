import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showButton, setShowButton] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowButton(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setShowButton(false);
    };

    if (!showButton || isDismissed) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
            <div className="bg-black/70 backdrop-blur-xl text-white px-5 py-4 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-between border border-white/10 animate-slide-up">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-tr from-[#D4AF37] to-yellow-500 p-2.5 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base tracking-wide text-white">Instalar App</span>
                        <span className="text-xs text-gray-400 font-medium">Acesso rápido estilo nativo</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="p-2 text-gray-500 hover:text-white transition-colors text-sm font-bold tracking-wide"
                    >
                        Agora Não
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 active:scale-95"
                    >
                        Instalar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;

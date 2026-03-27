import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showButton, setShowButton] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
        setIsStandalone(isAppStandalone);

        if (isAppStandalone) return;

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            setShowButton(true);
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowButton(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            if (isIOS) {
                setShowIOSInstructions(true);
            } else {
                alert('A instalação direta não é suportada por este browser. Por favor, utilize a opção "Adicionar ao ecrã principal" no menu do seu browser.');
            }
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setShowButton(false);
    };

    if (isStandalone) return null;

    if (showIOSInstructions) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                <div className="bg-[#1a1a1a] p-6 rounded-3xl w-full max-w-sm text-center border border-white/10 animate-slide-up">
                    <div className="bg-gradient-to-tr from-[#D4AF37] to-yellow-500 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Instalar no iOS</h3>
                    <p className="text-gray-400 mb-6 text-sm">
                        Para instalar, toque no botão de <span className="text-white font-bold inline-flex items-center justify-center px-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Partilha</span> no menu inferior do Safari e depois escolha <span className="text-white font-bold">Adicionar ao Ecrã principal</span>.
                    </p>
                    <button
                        onClick={() => { setShowIOSInstructions(false); setIsDismissed(true); setShowButton(false); }}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        );
    }

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

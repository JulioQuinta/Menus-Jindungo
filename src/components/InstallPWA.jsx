import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showButton, setShowButton] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [browserInfo, setBrowserInfo] = useState({
        isIOS: false,
        isSafari: false,
        isSamsung: false,
        isFirefox: false,
        isDesktop: false
    });
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
        setIsStandalone(isAppStandalone);

        if (isAppStandalone) return;

        // Check if dismissed recently (7 days)
        const dismissedAt = localStorage.getItem('pwa_dismissed_at');
        if (dismissedAt) {
            const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) {
                setIsDismissed(true);
                return;
            }
        }

        // Browser Detection
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome|crios/.test(userAgent);
        const isSamsung = /samsungbrowser/.test(userAgent);
        const isFirefox = /firefox/.test(userAgent);
        const isDesktop = !/mobile|android|iphone|ipad|ipod/.test(userAgent);

        setBrowserInfo({
            isIOS: isIOSDevice,
            isSafari: isSafari,
            isSamsung: isSamsung,
            isFirefox: isFirefox,
            isDesktop: isDesktop
        });

        // Browsers that don't support beforeinstallprompt but can be installed manually
        if (isIOSDevice || isSafari || isSamsung || isFirefox) {
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

    const handleDismiss = () => {
        localStorage.setItem('pwa_dismissed_at', Date.now().toString());
        setIsDismissed(true);
        setShowInstructions(false);
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            setShowInstructions(true);
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setShowButton(false);
    };

    if (isStandalone) return null;

    if (showInstructions) {
        if (browserInfo.isIOS) {
            return (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 px-4 pb-8 backdrop-blur-sm" onClick={() => { setShowInstructions(false); setIsDismissed(true); }}>
                    <div className="bg-[#1a1a1a] p-6 rounded-3xl w-full max-w-sm text-center border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.2)] animate-slide-up relative mb-4" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#1a1a1a] border-b border-r border-[#D4AF37]/30 transform rotate-45"></div>
                        
                        <div className="bg-white/10 w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 text-[#D4AF37]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        
                        <h3 className="text-xl font-serif font-bold text-white mb-2">Quase lá!</h3>
                        <p className="text-sm text-gray-300 mb-4 whitespace-pre-line leading-relaxed">
                            1. Toque no ícone de <strong className="text-[#D4AF37]">Partilha</strong> aqui em baixo<br />
                            2. Deslize o menu para baixo e escolha<br />
                            <strong className="text-white bg-white/10 px-2 py-1 rounded inline-block mt-2 tracking-wide text-xs">➕ Adicionar ao Ecrã Principal</strong>
                        </p>
                        <div className="text-[10px] text-red-300 font-bold uppercase tracking-wider mb-5 border border-red-500/20 bg-red-500/10 p-2.5 rounded-xl leading-tight">
                            ⚠️ Atenção: Não escolha "Adicionar aos Favoritos" (Bookmark)! Isso apenas guarda o link. Escolha "Ecrã Principal" para obter a App!
                        </div>
                        
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Já entendi
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-4 backdrop-blur-md">
                <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] w-full max-w-sm text-center border border-white/10 animate-scale-in relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="bg-gradient-to-tr from-[#D4AF37] to-yellow-500 w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(212,175,55,0.3)] relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-serif font-bold text-white mb-3">Como Instalar</h3>
                    
                    <div className="text-gray-400 mb-8 text-sm space-y-4 leading-relaxed text-left bg-white/5 p-5 rounded-2xl border border-white/5">
                        {browserInfo.isSamsung && (
                            <p>Toque no ícone de <span className="text-[#D4AF37] font-bold">Menu (☰)</span> no canto inferior e selecione <span className="text-white font-bold">"Adicionar página a &gt; Ecrã Principal"</span>.</p>
                        )}
                        {browserInfo.isFirefox && (
                            <p>Toque nos <span className="text-[#D4AF37] font-bold">três pontos (⋮)</span> na barra de endereço e selecione <span className="text-white font-bold">"Instalar"</span> ou <span className="text-white font-bold">"Adicionar ao ecrã principal"</span>.</p>
                        )}
                        {!browserInfo.isIOS && !browserInfo.isSamsung && !browserInfo.isFirefox && (
                            <p>Abra o menu do seu navegador (geralmente <span className="text-[#D4AF37] font-bold">⋮</span> ou <span className="text-[#D4AF37] font-bold">☰</span>) e procure por <span className="text-white font-bold">"Instalar Aplicação"</span> ou <span className="text-white font-bold">"Adicionar ao Ecrã Principal"</span>.</p>
                        )}
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="w-full bg-[#D4AF37] text-black font-black py-4 rounded-2xl hover:bg-[#b5952f] transition-all shadow-[0_5px_15px_rgba(212,175,55,0.3)] active:scale-95 uppercase tracking-widest text-xs"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        );
    }

    if (!showButton || isDismissed) return null;

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[90] w-[92%] max-w-sm">
            <div className="bg-[#141414]/90 backdrop-blur-2xl text-white px-6 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-between border border-white/10 animate-slide-up relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-20"></div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-tr from-[#D4AF37] to-yellow-600 p-3 rounded-2xl shadow-[0_5px_15px_rgba(212,175,55,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-serif font-bold text-base tracking-tight text-white leading-tight">Instalar Jindungos</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">App nativa no seu ecrã</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDismiss}
                        className="p-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                    >
                        Ignorar
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-black text-xs font-black px-5 py-3 rounded-xl hover:bg-gray-100 transition-all shadow-xl shadow-white/5 active:scale-95 uppercase tracking-widest"
                    >
                        Instalar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;

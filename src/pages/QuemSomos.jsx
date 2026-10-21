import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import {
    Sparkles, Shield, Heart, Award, ChefHat, ArrowRight,
    CheckCircle2, Users, Flame, Rocket, ArrowLeft, FileCheck,
    Monitor, QrCode, Navigation, WifiOff
} from 'lucide-react';

const QuemSomos = () => {
    const { logoUrl } = useSettings();
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#0D0B09] text-white font-sans selection:bg-[#D4AF37] selection:text-black relative overflow-x-hidden">
            
            {/* Atmospheric Warm Hospitality Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] h-[60vh] bg-gradient-to-b from-amber-500/15 via-[#D4AF37]/12 to-transparent blur-[160px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute top-1/2 right-[-10%] w-[50vw] h-[50vw] bg-[#EAB308]/10 blur-[180px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen pointer-events-none"></div>

            {/* Premium Floating Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${
                isScrolled ? 'bg-[#120F0C]/95 backdrop-blur-xl border-b border-[#D4AF37]/20 shadow-2xl' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/')} 
                            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] text-white transition-all flex items-center justify-center shadow-lg cursor-pointer"
                            title="Voltar ao Início"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        
                        <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className="w-12 h-12 bg-black/80 rounded-full flex items-center justify-center border border-[#D4AF37]/40 group-hover:border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all overflow-hidden shrink-0 duration-300">
                                <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-[1.23]" />
                            </div>
                            <div>
                                <span className="font-serif font-black text-xl tracking-tight text-white group-hover:text-[#D4AF37] transition-colors uppercase block leading-none">
                                    Menús<span className="text-[#D4AF37]">Jindungo</span>
                                </span>
                                <span className="text-[9px] text-amber-200/70 font-bold uppercase tracking-widest block mt-0.5">
                                    Restauração & Facturação AGT
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/explorar')} 
                            className="text-gray-300 hover:text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition-colors hidden sm:inline-block cursor-pointer"
                        >
                            Explorar Restaurantes
                        </button>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-black font-black text-xs px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] uppercase tracking-wider cursor-pointer"
                        >
                            Entrar no Painel
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section: Manifesto Institucional */}
            <section className="relative pt-36 sm:pt-44 pb-16 px-6 z-10 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#181410]/90 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-8 shadow-lg">
                    <Flame size={14} className="animate-bounce" /> Quem Somos • Identidade & Inovação Angolana
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black mb-6 tracking-tight leading-tight text-white drop-shadow-2xl">
                    Nascidos em Luanda, <br />
                    Dedicados à <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic">Gastronomia.</span>
                </h1>

                <p className="text-gray-300 text-base sm:text-xl mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                    A <strong className="text-white font-semibold">Menús Jindungo</strong> é a plataforma angolana especializada a 100% em <strong className="text-[#F3E5AB]">Restauração e Hospitalidade</strong> — unindo Menus Digitais QR Code interactivos, Terminais Operacionais separados para Garçom, Cozinha e Caixa, Rastreio de Encomendas ao Vivo e <strong className="text-emerald-400">Facturação Electrónica Certificada pela AGT (N.º FE/305/AGT/2026)</strong>.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-amber-300">
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">🇦🇴 Engenharia 100% Angolana</span>
                    <span className="px-4 py-2 bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/30 flex items-center gap-2">
                        <FileCheck size={14} /> Certificado AGT N.º FE/305/AGT/2026
                    </span>
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">⚡ Cloud + App Desktop Offline</span>
                </div>
            </section>

            {/* A Nossa História & Arquitectura Actualizada */}
            <section className="max-w-7xl mx-auto px-6 py-14 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Medallion Showcase */}
                    <div className="lg:col-span-5 relative group">
                        <div className="absolute -inset-[1px] bg-gradient-to-tr from-[#D4AF37] to-amber-600 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
                        <div className="relative bg-[#17130F] border border-[#D4AF37]/30 rounded-[2.5rem] p-8 sm:p-10 overflow-hidden shadow-2xl flex flex-col items-center text-center">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#2A2415] via-[#121214] to-[#1A160C] border-4 border-[#D4AF37] flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.5)] mb-6 relative overflow-hidden">
                                <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo Menús Jindungo" className="w-full h-full object-contain scale-[1.18]" />
                            </div>

                            <h3 className="text-2xl font-serif font-black text-white mb-3">A Essência Jindungo</h3>
                            <p className="text-sm text-gray-300 font-light leading-relaxed mb-6">
                                O jindungo representa o tempero, a hospitalidade calorosa e o carácter inconfundível da nossa terra. Concentrámos todo o nosso foco naquilo que fazemos de melhor: <strong className="text-white">servir restaurantes, pastelarias, churrasqueiras, esplanadas e lounges</strong> com rigor e paixão.
                            </p>

                            <div className="w-full bg-black/40 border border-emerald-500/30 rounded-2xl p-4 mb-6 text-left">
                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Conformidade Fiscal Oficial</div>
                                <div className="text-sm font-black text-white">Processado por Programa Validado N.º FE/305/AGT/2026</div>
                                <div className="text-[11px] text-gray-400 mt-1">Assinatura criptográfica JWS RS256 • Exportação SAF-T (AO) v1.01_01</div>
                            </div>

                            <div className="w-full pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-xs text-gray-300 font-bold">
                                <div>
                                    <span className="text-[#D4AF37] font-serif font-black text-xl block">100%</span>
                                    <span>Restauração</span>
                                </div>
                                <div>
                                    <span className="text-[#D4AF37] font-serif font-black text-xl block">3 Modos</span>
                                    <span>Mesa • Take-Away • Entrega</span>
                                </div>
                                <div>
                                    <span className="text-[#D4AF37] font-serif font-black text-xl block">30 Dias</span>
                                    <span>Sessão Offline</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Narrative Text */}
                    <div className="lg:col-span-7 space-y-6">
                        <div>
                            <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block mb-2">A Nossa História & Propósito</span>
                            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight">
                                Porque nos dedicamos exclusivamente à Restauração?
                            </h2>
                        </div>

                        <p className="text-gray-300 text-base leading-relaxed font-light">
                            Um restaurante não funciona como uma loja comum. Na restauração existe a emoção do cliente à mesa, a sincronização ao segundo entre o garçom e o chefe de cozinha, o cliente que levanta uma encomenda <strong className="text-white">Take-Away com senha digital</strong> e o estafeta que leva uma refeição quente até à porta do cliente.
                        </p>
                        
                        <p className="text-gray-300 text-base leading-relaxed font-light">
                            Por isso, na <strong className="text-white">Menús Jindungo</strong> redesenhámos toda a nossa arquitectura para responder exactamente ao fluxo real dos melhores sistemas de restauração do mundo: <strong className="text-[#F3E5AB]">separando o painel estratégico do proprietário dos terminais operacionais da equipa</strong>, e garantindo que cada pedido é acompanhado em tempo real do primeiro clique até à emissão da factura certificada pela AGT.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="bg-[#17130F] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">Terminais Separados por Função</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        O garçom, o cozinheiro e o caixa entram seleccionando o seu nome + PIN num ecrã limpo e focado, sem acesso aos relatórios financeiros do gerente.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-[#17130F] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                                    <Navigation size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">Rastreio ao Vivo nas 3 Modalidades</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Acompanhamento em tempo real no telemóvel do cliente para pedidos na Mesa, Take-Away (com senha de recolha) e Entrega ao Domicílio com GPS.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-[#17130F] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                                    <FileCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">Facturação Electrónica AGT</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Emissão imediata de Factura-Recibo (FR), Factura (FT) e Nota de Crédito (NC) sob o Certificado N.º FE/305/AGT/2026.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-[#17130F] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                                    <WifiOff size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">App Desktop & Modo Offline</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Aplicação instalável para Windows (<code className="text-[#D4AF37]">MenusJindungo.exe</code>) que continua a facturar mesmo sem internet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Os 4 Pilares da Excelência Jindungo */}
            <section className="max-w-7xl mx-auto px-6 py-16 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                    <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block">Os Nossos Valores</span>
                    <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight">
                        Os 4 Pilares da Excelência Jindungo
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#17130F] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 shadow-xl">
                        <div>
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black mb-5 shadow-lg">
                                <Award size={26} />
                            </div>
                            <h3 className="text-xl font-serif font-black text-white mb-2.5">
                                1. Orgulho Angolano
                            </h3>
                            <p className="text-sm text-gray-400 font-light leading-relaxed">
                                Honramos a nossa cultura gastronómica e criamos tecnologia pensada para a realidade operacional dos restaurantes em Angola.
                            </p>
                        </div>
                        <div className="pt-5 mt-5 border-t border-white/5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                            Identidade & Rigor <CheckCircle2 size={14} />
                        </div>
                    </div>

                    <div className="bg-[#17130F] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 shadow-xl">
                        <div>
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black mb-5 shadow-lg">
                                <Sparkles size={26} />
                            </div>
                            <h3 className="text-xl font-serif font-black text-white mb-2.5">
                                2. Rapidez no Atendimento
                            </h3>
                            <p className="text-sm text-gray-400 font-light leading-relaxed">
                                Código ultraleve optimizado para abrir instantaneamente em qualquer telemóvel 4G sem obrigar o cliente a descarregar aplicações.
                            </p>
                        </div>
                        <div className="pt-5 mt-5 border-t border-white/5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                            Zero Fricção na Mesa <CheckCircle2 size={14} />
                        </div>
                    </div>

                    <div className="bg-[#17130F] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 shadow-xl">
                        <div>
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black mb-5 shadow-lg">
                                <Heart size={26} />
                            </div>
                            <h3 className="text-xl font-serif font-black text-white mb-2.5">
                                3. Hospitalidade Acolhedora
                            </h3>
                            <p className="text-sm text-gray-400 font-light leading-relaxed">
                                Menus fotográficos apelativos, chamada de garçom com um toque e actualização ao vivo do estado do prato para encantar o cliente.
                            </p>
                        </div>
                        <div className="pt-5 mt-5 border-t border-white/5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                            Experiência Gastronómica <CheckCircle2 size={14} />
                        </div>
                    </div>

                    <div className="bg-[#17130F] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 shadow-xl">
                        <div>
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black mb-5 shadow-lg">
                                <Shield size={26} />
                            </div>
                            <h3 className="text-xl font-serif font-black text-white mb-2.5">
                                4. Conformidade & Segurança
                            </h3>
                            <p className="text-sm text-gray-400 font-light leading-relaxed">
                                Facturação electrónica validada pela AGT (FE/305/AGT/2026), controlo de acessos por função e protecção criptográfica de dados.
                            </p>
                        </div>
                        <div className="pt-5 mt-5 border-t border-white/5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                            Certificação Oficial AGT <CheckCircle2 size={14} />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="max-w-5xl mx-auto px-6 py-16 relative z-10 text-center">
                <div className="bg-gradient-to-r from-[#241D14] via-[#17130E] to-[#241D14] border border-[#D4AF37]/40 rounded-[2.5rem] p-10 sm:p-14 shadow-[0_0_80px_rgba(212,175,55,0.18)] relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl sm:text-5xl font-serif font-black text-white">
                            Pronto para Modernizar o Seu Restaurante?
                        </h2>
                        <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed">
                            Planos claros e acessíveis a partir de <strong className="text-[#D4AF37]">15.000 Kz / mês</strong> (Start), <strong className="text-[#D4AF37]">25.000 Kz / mês</strong> (Business e Facturação Electrónica) e <strong className="text-[#D4AF37]">40.000 Kz / mês</strong> (Corporate).
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-black font-black px-8 py-4 rounded-full text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                Registar o Meu Restaurante <ArrowRight size={14} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="bg-white/10 hover:bg-white/15 text-white font-black px-8 py-4 rounded-full text-xs uppercase tracking-widest border border-white/20 transition-all cursor-pointer"
                            >
                                Ver Planos e Preços
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#090806] border-t border-white/10 py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3 select-none">
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-[#D4AF37]/40 overflow-hidden shrink-0">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain scale-[1.18]" />
                        </div>
                        <div>
                            <span className="font-serif font-black text-lg uppercase tracking-tight text-white block leading-none">
                                Menús<span className="text-[#D4AF37]">Jindungo</span>
                            </span>
                            <span className="text-[10px] text-gray-500">Certificado AGT N.º FE/305/AGT/2026 • Luanda, Angola</span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs">
                        © 2026 Menús Jindungo. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default QuemSomos;

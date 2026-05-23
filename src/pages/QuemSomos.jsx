import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Sparkles, Globe, Shield, Heart, Award, Compass, ChefHat, MapPin, ArrowRight, CheckCircle2, Users, Flame, Rocket } from 'lucide-react';

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
        <div className="min-h-screen bg-[#0B0B0C] text-white font-sans selection:bg-[#D4AF37] selection:text-black relative overflow-x-hidden">
            
            {/* Hypnotic Stardust & Atmospheric Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] h-[60vh] bg-gradient-to-b from-amber-500/10 via-[#D4AF37]/15 to-transparent blur-[160px] rounded-full pointer-events-none animate-pulse-slow z-0"></div>
            <div className="absolute top-1/2 right-[-10%] w-[50vw] h-[50vw] bg-[#EAB308]/10 blur-[180px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-25 mix-blend-screen pointer-events-none"></div>

            {/* Premium Floating Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${
                isScrolled ? 'bg-[#121214]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group select-none">
                        <div className="w-12 h-12 bg-black/80 rounded-full flex items-center justify-center border border-[#D4AF37]/40 group-hover:border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] shadow-2xl transition-all overflow-hidden shrink-0 transition-all duration-300">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-[1.23]" />
                        </div>
                        <span className="font-serif font-black text-xl tracking-tight text-white group-hover:text-[#D4AF37] transition-colors uppercase">
                            Menus<span className="text-[#D4AF37]">Jindungo</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/explorar')} 
                            className="text-gray-300 hover:text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition-colors hidden sm:inline-block"
                        >
                            Explorar
                        </button>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-black font-black text-xs px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] uppercase tracking-wider"
                        >
                            Acesso Admin
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section: The Brand Anthem */}
            <section className="relative pt-36 sm:pt-48 pb-20 px-6 z-10 text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#181511]/90 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-8 shadow-lg">
                    <Flame size={14} className="animate-bounce" /> Manifesto Institucional
                </div>

                <h1 className="text-4xl sm:text-7xl font-serif font-black mb-6 tracking-tight leading-tight text-white drop-shadow-2xl">
                    Nascidos em Luanda, <br />
                    Criados para o <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic">Mundo.</span>
                </h1>

                <p className="text-gray-400 text-base sm:text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                    A <strong className="text-white font-medium">Menús Jindungo Plataforma Global</strong> é a fusão definitiva entre o calor, a hospitalidade e a rica herança cultural de Angola com o estado da arte em engenharia de software cloud e arquitetura SaaS de elite.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-amber-300">
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">🇦🇴 Tecnologia Angolana</span>
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">⚡ Nitro Performance 4G</span>
                    <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">🔒 Criptografia 256-BIT</span>
                </div>
            </section>

            {/* The Story & Vision Section */}
            <section className="max-w-7xl mx-auto px-6 py-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Picture / Medallion Showcase */}
                    <div className="lg:col-span-5 relative group">
                        <div className="absolute -inset-[1px] bg-gradient-to-tr from-[#D4AF37] to-amber-600 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
                        <div className="relative bg-[#181511] border border-[#D4AF37]/30 rounded-[2.5rem] p-8 sm:p-12 overflow-hidden shadow-2xl flex flex-col items-center text-center">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>
                            
                            {/* Giant Center Chili Crest */}
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#2A2415] via-[#121214] to-[#1A160C] border-4 border-[#D4AF37] p-0 flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.6)] mb-8 relative group-hover:rotate-12 transition-transform duration-700 overflow-hidden">
                                <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 animate-pulse"></div>
                                <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Piri-piri" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_15px_rgba(212,175,55,0.9)] relative z-10 transition-transform duration-500 group-hover:scale-[1.23]" />
                            </div>

                            <h3 className="text-2xl font-serif font-black text-white mb-2">A Essência Jindungo</h3>
                            <p className="text-sm text-gray-400 font-light leading-relaxed max-w-sm mb-6">
                                O jindungo (piri-piri) representa o tempero, a ousadia, a energia e o caráter inconfundível da nossa terra. Levamos esse mesmo espírito vibrante para transformar cada restaurante num caso de sucesso digital.
                            </p>

                            <div className="w-full pt-6 border-t border-white/10 flex items-center justify-around text-xs text-gray-300 font-bold">
                                <div>
                                    <span className="text-[#D4AF37] font-serif font-black text-xl block">21+</span>
                                    <span>Províncias</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div>
                                    <span className="text-[#D4AF37] font-serif font-black text-xl block">100%</span>
                                    <span>Autónomo</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div>
                                    <span className="text-[#D4AF37] font-serif font-black text-xl block">0s</span>
                                    <span>Fricção</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Narrative Text */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-4">
                            <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block">Nossa História & Propósito</span>
                            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight">
                                Democratizar a Alta Tecnologia para a Restauração
                            </h2>
                        </div>

                        <p className="text-gray-300 text-base leading-relaxed font-light">
                            Nascida no vibrante coração de Luanda, a Menús Jindungo identificou uma lacuna crítica no mercado de restauração e hospitalidade: sistemas de gestão pesados, obsoletos, dependentes de hardware dispendioso e desconectados da realidade de conectividade móvel e das redes sociais em África.
                        </p>
                        
                        <p className="text-gray-300 text-base leading-relaxed font-light">
                            Concebemos uma plataforma cloud ultraleve, otimizada para conexões 4G difíceis, que não exige instalação de aplicações para o cliente final. O utilizador aponta a câmara para o QR Code na mesa ou acede através do WhatsApp, explora um menu fotográfico espetacular, faz o pedido diretamente para o ecrã da cozinha (*Kitchen Kanban*) e finaliza tudo em segundos.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 mt-1">
                                    <Rocket size={20} />
                                </div>
                                <div>
                                    <h4 className="font-serif font-bold text-white text-lg mb-1">Expansão Global</h4>
                                    <p className="text-xs text-gray-400 font-light leading-relaxed">Arquitetura multi-idioma e multi-moeda preparada para escalar de Luanda para Lisboa, São Paulo ou Nova Iorque.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 mt-1">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h4 className="font-serif font-bold text-white text-lg mb-1">Centrado no Cliente</h4>
                                    <p className="text-xs text-gray-400 font-light leading-relaxed">Ferramentas avançadas de fidelização VIP, cupões e recolha de feedback privado via WhatsApp para proteger a sua reputação.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The 4 Golden Pillars */}
            <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block">Os Nossos Valores</span>
                    <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight">
                        Os 4 Pilares da Excelência Jindungo
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Pillar 1 */}
                    <div className="bg-[#181511]/90 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37] rounded-3xl p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 group shadow-xl">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black mb-6 shadow-[0_0_20px_rgba(212,175,55,0.5)] group-hover:rotate-6 transition-transform">
                                <Award size={28} />
                            </div>
                            <h3 className="text-xl font-serif font-black text-white mb-3 group-hover:text-[#D4AF37] transition-colors">
                                1. Orgulho Angolano
                            </h3>
                            <p className="text-sm text-gray-400 font-light leading-relaxed">
                                Honramos as nossas raízes e cultura gastronómica. Criamos tecnologia que orgulha o país e impulsiona o empreendedorismo nacional.
                            </p>
                        </div>
                        <div className="pt-6 mt-6 border-t border-white/5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                            Identidade e Soberania <CheckCircle2 size={14} />
                        </div>
                    </div>

                    {/* Pillar 2 */}
                    <div className="bg-[#181511]/90 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37] rounded-3xl p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 group shadow-xl">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black mb-6 shadow-[0_0_20px_rgba(212,175,55,0.5)] group-hover:rotate-6 transition-transform">
                                <Sparkles size={28} />
                            </div>
                            <h3 className="text-xl font-serif font-black text-white mb-3 group-hover:text-[#D4AF37] transition-colors">
                                2. Nitro Performance
                            </h3>
                            <p className="text-sm text-gray-400 font-light leading-relaxed">
                                Sem tempos de espera ou carregamentos lentos. Código ultraleve otimizado para abrir instantaneamente em qualquer smartphone ou ligação de rede.
                            </p>
                        </div>
                        <div className="pt-6 mt-6 border-t border-white/5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                            Velocidade Extrema <CheckCircle2 size={14} />
                        </div>
                    </div>

                    {/* Pillar 3 */}
                    <div className="bg-[#181511]/90 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37] rounded-3xl p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 group shadow-xl">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black mb-6 shadow-[0_0_20px_rgba(212,175,55,0.5)] group-hover:rotate-6 transition-transform">
                                <Heart size={28} />
                            </div>
                            <h3 className="text-xl font-serif font-black text-white mb-3 group-hover:text-[#D4AF37] transition-colors">
                                3. O Tempero da Paixão
                            </h3>
                            <p className="text-sm text-gray-400 font-light leading-relaxed">
                                A restauração é feita de emoção e partilha. Os nossos menus fotográficos cativam o olhar e despertam o apetite ao primeiro segundo.
                            </p>
                        </div>
                        <div className="pt-6 mt-6 border-t border-white/5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                            Estética e Sabor <CheckCircle2 size={14} />
                        </div>
                    </div>

                    {/* Pillar 4 */}
                    <div className="bg-[#181511]/90 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37] rounded-3xl p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 group shadow-xl">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black mb-6 shadow-[0_0_20px_rgba(212,175,55,0.5)] group-hover:rotate-6 transition-transform">
                                <Shield size={28} />
                            </div>
                            <h3 className="text-xl font-serif font-black text-white mb-3 group-hover:text-[#D4AF37] transition-colors">
                                4. Segurança Blindada
                            </h3>
                            <p className="text-sm text-gray-400 font-light leading-relaxed">
                                Os dados do seu restaurante e dos seus clientes protegidos por encriptação militar de ponta a ponta e gestão de permissões biométricas rigorosas.
                            </p>
                        </div>
                        <div className="pt-6 mt-6 border-t border-white/5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                            Criptografia 256-BIT <CheckCircle2 size={14} />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="max-w-5xl mx-auto px-6 py-20 relative z-10 text-center">
                <div className="bg-gradient-to-r from-[#2A2415] via-[#1A160C] to-[#2A2415] border border-[#D4AF37]/40 rounded-[3rem] p-12 sm:p-16 shadow-[0_0_80px_rgba(212,175,55,0.2)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#D4AF37]/5 animate-pulse"></div>
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl sm:text-5xl font-serif font-black text-white">
                            Faça Parte Desta Revolução Gastronómica
                        </h2>
                        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
                            Quer seja proprietário de um pequeno bistrô em Luanda ou de uma grande cadeia internacional, a Menús Jindungo tem a solução certa para impulsionar o seu negócio.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-black font-black px-8 py-4 rounded-full text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                Solicitar Adesão <ArrowRight size={14} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => navigate('/explorar')}
                                className="bg-white/10 hover:bg-white/20 text-white font-black px-8 py-4 rounded-full text-xs uppercase tracking-widest border border-white/20 transition-all"
                            >
                                Explorar Marketplace
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#121214] border-t border-white/10 py-16 px-6 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    <div className="md:col-span-5 space-y-4">
                        <div className="flex items-center gap-3 select-none">
                            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-[#D4AF37]/40 shadow-2xl overflow-hidden shrink-0">
                                <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                            </div>
                            <span className="font-serif font-black text-xl uppercase tracking-tight text-white">
                                Menus<span className="text-[#D4AF37]">Jindungo</span>
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs font-light leading-relaxed max-w-sm">
                            © 2026 Menus Jindungo Plataforma Global. Orgulhosamente concebida e desenvolvida em Angola para todo o globo com excelência e sofisticação.
                        </p>
                    </div>

                    <div className="md:col-span-4 grid grid-cols-3 gap-6 text-xs text-gray-400 font-light">
                        <div className="space-y-2">
                            <span className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px] block mb-3">Sobre</span>
                            <span onClick={() => navigate('/quem-somos')} className="block hover:text-white transition-colors cursor-pointer text-[#D4AF37] font-bold">Quem Somos</span>
                            <span onClick={() => navigate('/explorar')} className="block hover:text-white transition-colors cursor-pointer">Restaurantes</span>
                            <span onClick={() => navigate('/login')} className="block hover:text-white transition-colors cursor-pointer">Acesso Admin</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px] block mb-3">Partners</span>
                            <a href="#" className="block hover:text-white transition-colors">Motoboy</a>
                            <a href="#" className="block hover:text-white transition-colors">Pratos VIP</a>
                            <a href="#" className="block hover:text-white transition-colors">Afiliados</a>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px] block mb-3">Legal</span>
                            <a href="#" className="block hover:text-white transition-colors">Termos</a>
                            <a href="#" className="block hover:text-white transition-colors">Privacidade</a>
                            <a href="#" className="block hover:text-white transition-colors">Contacto</a>
                        </div>
                    </div>

                    <div className="md:col-span-3 rounded-2xl overflow-hidden border border-white/10 shadow-xl h-36 relative group cursor-pointer" onClick={() => navigate('/explorar')}>
                        <img 
                            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=600" 
                            alt="Mapa de Luanda" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 text-center">
                            <span className="bg-[#18181B]/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/30 shadow-lg">
                                📍 Luanda - Angola
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default QuemSomos;

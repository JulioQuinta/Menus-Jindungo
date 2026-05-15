import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Star, Clock, Utensils, Search, Calendar, MapPin, 
    ArrowRight, CheckCircle2, Shield, Zap, Smartphone, 
    Globe, ChevronRight, Menu, X, TrendingUp, Mail, Instagram
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <div 
        className="glass-dark border border-white/5 p-8 rounded-[2rem] hover:border-[#D4AF37]/30 transition-all duration-500 group hover:-translate-y-2"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
            <Icon size={28} />
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const { logoUrl } = useSettings();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
            
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-4 ${scrolled ? 'bg-black/80 backdrop-blur-2xl border-b border-white/5 py-3' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37]/50 transition-all overflow-hidden">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <span className="font-serif font-bold text-xl tracking-tight hidden sm:block">
                            Menus <span className="text-[#D4AF37]">Jindungo</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-display">
                        <a href="#features" className="text-gray-400 hover:text-white transition-colors">Funcionalidades</a>
                        <a href="#about" className="text-gray-400 hover:text-white transition-colors">Sobre</a>
                        <Link to="/explorar" className="text-gray-400 hover:text-white transition-colors">Explorar</Link>
                        <Link to="/login" className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all">Entrar</Link>
                        <Link to="/register" className="bg-[#D4AF37] text-black px-5 py-2.5 rounded-xl font-bold hover:scale-105 transition-all shadow-[0_10px_20px_rgba(212,175,55,0.2)]">Criar Conta</Link>
                    </div>

                    <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
                        <Menu size={24} />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl p-8 flex flex-col items-center justify-center gap-8 animate-in fade-in duration-300">
                    <button className="absolute top-8 right-8 text-white" onClick={() => setMobileMenuOpen(false)}>
                        <X size={32} />
                    </button>
                    <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-serif">Funcionalidades</a>
                    <Link to="/explorar" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-serif">Explorar</Link>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-serif">Entrar</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-[#D4AF37] text-black px-10 py-4 rounded-2xl font-bold text-xl">Começar Agora</Link>
                </div>
            )}

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 px-6 overflow-hidden">
                {/* Ambient Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/10 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full"></div>
                
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-display mb-8 animate-slide-up">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
                        A REVOLUÇÃO GASTRONÓMICA EM ANGOLA
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl font-serif font-black mb-6 tracking-tighter leading-tight animate-slide-up">
                        O Menu do <span className="text-[#D4AF37] italic">Futuro</span>,<br />
                        Hoje no seu <span className="bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Restaurante</span>.
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-12 leading-relaxed animate-slide-up delay-100">
                        Transforme a sua operação com o sistema mais sofisticado de Angola. 
                        Menus digitais QR, KDS profissional e gestão inteligente em tempo real.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
                        <Link to="/register" className="w-full sm:w-auto bg-[#D4AF37] text-black px-10 py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 group hover:scale-105 transition-all shadow-[0_20px_40px_rgba(212,175,55,0.25)]">
                            Criar Conta Grátis <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/explorar" className="w-full sm:w-auto bg-white/5 border border-white/10 px-10 py-5 rounded-[1.5rem] font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md">
                            Explorar Restaurantes
                        </Link>
                    </div>

                    {/* Dashboard Mockup Preview */}
                    <div className="mt-24 relative max-w-5xl mx-auto animate-slide-up delay-300">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/20 via-white/10 to-[#D4AF37]/20 rounded-[2.5rem] blur-xl opacity-50"></div>
                        <div className="relative bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
                            </div>
                            <img 
                                src="https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=2000" 
                                alt="Dashboard Preview" 
                                className="w-full grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-[10px] font-display text-[#D4AF37] mb-4">EXPERIÊNCIA COMPLETA</h2>
                        <h3 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">Tudo o que precisa num só lugar.</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={Smartphone}
                            title="Menu Digital QR"
                            description="Substitua o papel por uma experiência interativa premium que carrega instantaneamente."
                            delay={100}
                        />
                        <FeatureCard 
                            icon={Zap}
                            title="Pedidos em Tempo Real"
                            description="Receba pedidos diretamente na cozinha sem atrasos ou erros de comunicação."
                            delay={200}
                        />
                        <FeatureCard 
                            icon={TrendingUp}
                            title="Análise de Vendas"
                            description="Dashboards inteligentes para acompanhar a performance do seu negócio em tempo real."
                            delay={300}
                        />
                        <FeatureCard 
                            icon={Shield}
                            title="Segurança Garantida"
                            description="Dados protegidos com tecnologia cloud de última geração e backups automáticos."
                            delay={400}
                        />
                        <FeatureCard 
                            icon={Globe}
                            title="Multi-Idioma"
                            description="Tradução automática para atender clientes de todo o mundo com elegância."
                            delay={500}
                        />
                        <FeatureCard 
                            icon={Utensils}
                            title="Gestão de Reservas"
                            description="Aceite reservas de mesa online e organize o seu salão com eficiência máxima."
                            delay={600}
                        />
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="py-24 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 right-0 w-[30%] h-[30%] bg-[#D4AF37]/5 blur-[100px] rounded-full"></div>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#D4AF37]/10 rounded-[3rem] blur-2xl"></div>
                            <img 
                                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200" 
                                alt="Experiência Gastronómica" 
                                className="relative rounded-[2.5rem] border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
                            />
                            <div className="absolute bottom-8 left-8 right-8 glass-dark p-6 rounded-2xl border border-white/10">
                                <p className="text-[#D4AF37] font-serif font-bold text-xl mb-1 italic">"Modernidade em cada detalhe."</p>
                                <p className="text-gray-400 text-xs uppercase tracking-widest">Equipa Jindungo</p>
                            </div>
                        </div>
                        
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-[10px] font-display text-[#D4AF37] mb-4 uppercase tracking-[0.3em]">Quem Somos</h2>
                                <h3 className="text-4xl md:text-5xl font-serif font-black text-white leading-tight">
                                    Nascidos em Luanda,<br />
                                    Criados para o <span className="text-[#D4AF37]">Mundo</span>.
                                </h3>
                            </div>
                            
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Os **Menus Jindungo** nasceram da necessidade urgente de modernizar o setor da restauração em Angola. Somos uma plataforma tecnológica premium dedicada a transformar a forma como os restaurantes interagem com os seus clientes.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#D4AF37]">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <h4 className="font-bold text-white">Nossa Missão</h4>
                                    <p className="text-gray-500 text-sm">Eliminar a fricção operacional e elevar o padrão de serviço em toda Angola.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#D4AF37]">
                                        <Star size={20} />
                                    </div>
                                    <h4 className="font-bold text-white">Excelência</h4>
                                    <p className="text-gray-500 text-sm">Desenvolvemos ferramentas que não só funcionam, mas que encantam ao primeiro toque.</p>
                                </div>
                            </div>

                            <p className="text-gray-500 text-xs italic border-l-2 border-[#D4AF37] pl-4">
                                Orgulhosamente desenvolvido pela SUMBA AQUI COMÉRCIO E SERVIÇOS (SU), LDA.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Footer */}
            <section className="py-24 px-6 relative overflow-hidden border-t border-white/5">
                <div className="absolute inset-0 bg-[#D4AF37]/5 animate-pulse"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 leading-tight">
                        Pronto para elevar o seu <span className="text-[#D4AF37]">Padrão</span>?
                    </h2>
                    <p className="text-gray-400 text-lg mb-12">
                        Junte-se a centenas de restaurantes que já modernizaram a sua operação com o Jindungo.
                    </p>
                    <div className="flex flex-col items-center gap-10">
                        <Link to="/register" className="w-full sm:w-auto bg-[#D4AF37] text-black px-16 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:scale-105 hover:shadow-[0_20px_50px_rgba(212,175,55,0.4)] transition-all duration-500 shadow-2xl relative overflow-hidden group">
                            <span className="relative z-10">Começar Agora</span>
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        </Link>
                        
                        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                            <a href="https://wa.me/244931045991" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-3">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/10 transition-all duration-500 group-hover:-translate-y-1 shadow-lg">
                                    <Smartphone className="text-gray-400 group-hover:text-[#D4AF37]" size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">WhatsApp</p>
                                    <p className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">+244 931 045 991</p>
                                </div>
                            </a>

                            <a href="mailto:comercial@menusjindungo.ao" className="group flex flex-col items-center gap-3">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/10 transition-all duration-500 group-hover:-translate-y-1 shadow-lg">
                                    <Mail className="text-gray-400 group-hover:text-[#D4AF37]" size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">E-mail</p>
                                    <p className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">comercial@menusjindungo.ao</p>
                                </div>
                            </a>

                            <a href="#" className="group flex flex-col items-center gap-3">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/10 transition-all duration-500 group-hover:-translate-y-1 shadow-lg">
                                    <Instagram className="text-gray-400 group-hover:text-[#D4AF37]" size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Instagram</p>
                                    <p className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">@menusjindungo</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 text-center">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <img src="/jindungo_logo_v3.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="font-serif font-bold text-sm">Menus Jindungo</span>
                    </div>
                    <p className="text-gray-600 text-[10px] font-display tracking-widest leading-relaxed max-w-md">
                        © 2026 MENUS JINDUNGO APP • SUMBA AQUI COMÉRCIO E SERVIÇOS (SU), LDA. <br /> LUANDA - ANGOLA
                    </p>
                    <div className="flex gap-6 text-gray-500 text-xs">
                        <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors">Termos</a>
                        <a href="#" className="hover:text-white transition-colors">Suporte</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

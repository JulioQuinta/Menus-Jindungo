import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Smartphone, Zap, TrendingUp, Shield, Globe, Utensils, 
    ArrowRight, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Music, Check, Star,
    DollarSign, Clock, Users, Award, CheckCircle, XCircle, AlertTriangle, Flame,
    Truck, Compass, Calendar, ShoppingBag
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-[#18181B]/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-500 group hover:-translate-y-1 shadow-lg hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] flex flex-col justify-between">
        <div>
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-[#D4AF37]/20">
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-white mb-2 tracking-tight group-hover:text-[#D4AF37] transition-colors">{title}</h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">{description}</p>
        </div>
    </div>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const { logoUrl } = useSettings();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState('mensal');

    const getPrice = (basePrice) => {
        if (billingCycle === 'trimestral') return { total: (basePrice * 3 * 0.95).toLocaleString('pt-AO'), monthly: (basePrice * 0.95).toLocaleString('pt-AO'), tag: 'Poupa 5%', mult: '3 meses' };
        if (billingCycle === 'semestral') return { total: (basePrice * 6 * 0.90).toLocaleString('pt-AO'), monthly: (basePrice * 0.90).toLocaleString('pt-AO'), tag: 'Poupa 10%', mult: '6 meses' };
        if (billingCycle === 'anual') return { total: (basePrice * 12 * 0.80).toLocaleString('pt-AO'), monthly: (basePrice * 0.80).toLocaleString('pt-AO'), tag: '2 Meses Grátis', mult: '1 ano' };
        return { total: basePrice.toLocaleString('pt-AO'), monthly: basePrice.toLocaleString('pt-AO'), tag: null, mult: '1 mês' };
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden font-sans relative">
            
            {/* Ambient Golden Stardust Wave Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vh] bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/15 to-amber-600/10 blur-[140px] rounded-full pointer-events-none animate-pulse-slow z-0"></div>
            <div className="absolute top-2/3 right-10 w-[40vw] h-[40vw] bg-[#D4AF37]/10 blur-[160px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute bottom-10 left-10 w-[30vw] h-[30vw] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>

            {/* Navigation Header */}
            <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-50 transition-all duration-500">
                <nav className={`rounded-full px-6 py-3.5 flex justify-between items-center transition-all duration-500 border ${
                    scrolled 
                        ? 'bg-[#18181B]/90 backdrop-blur-2xl border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.8)]' 
                        : 'bg-[#18181B]/70 backdrop-blur-xl border-white/10 shadow-2xl'
                }`}>
                    {/* Logo */}
                    <div className="flex items-center gap-3 cursor-pointer group select-none" onClick={() => navigate('/')}>
                        <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center border border-[#D4AF37]/40 group-hover:border-[#D4AF37] transition-all overflow-hidden shadow-2xl transition-all duration-300">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-[1.23]" />
                        </div>
                        <span className="font-serif font-black text-lg tracking-tight">
                            Menu <span className="text-[#D4AF37]">Jindungo</span>
                        </span>
                    </div>

                    {/* Middle Links */}
                    <div className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest uppercase text-gray-300">
                        <a href="#funcionalidades" className="hover:text-[#D4AF37] transition-colors">Funcionalidades</a>
                        <Link to="/explorar" className="hover:text-[#D4AF37] transition-colors">Explorar</Link>
                        <Link to="/r/demo-restaurant" className="hover:text-[#D4AF37] transition-colors">Demo</Link>
                        <a href="#precos" className="hover:text-[#D4AF37] transition-colors">Preços</a>
                        <Link to="/quem-somos" className="hover:text-[#D4AF37] transition-colors">Quem Somos</Link>
                        <Link to="/login" className="hover:text-white transition-colors py-1 px-3 rounded-full hover:bg-white/10">Entrar</Link>
                    </div>

                    {/* CTA Button */}
                    <div className="hidden md:block">
                        <Link 
                            to="/register" 
                            className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-amber-300"
                        >
                            Criar Conta
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-white hover:text-[#D4AF37] transition-colors" onClick={() => setMobileMenuOpen(true)}>
                        <Menu size={26} />
                    </button>
                </nav>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[100] bg-[#0B0B0C]/95 backdrop-blur-3xl p-8 flex flex-col items-center justify-center gap-8 animate-in fade-in duration-300">
                    <button className="absolute top-8 right-8 text-white p-2 rounded-full border border-white/20 hover:text-[#D4AF37]" onClick={() => setMobileMenuOpen(false)}>
                        <X size={28} />
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-black/40 rounded-full flex items-center justify-center border border-[#D4AF37]/40 overflow-hidden shadow-2xl">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                        </div>
                        <span className="font-serif font-black text-2xl">Menu Jindungo</span>
                    </div>
                    <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide hover:text-[#D4AF37]">Funcionalidades</a>
                    <Link to="/explorar" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide hover:text-[#D4AF37]">Explorar Restaurantes</Link>
                    <Link to="/r/demo-restaurant" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide hover:text-[#D4AF37]">Ver Demo</Link>
                    <a href="#precos" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide hover:text-[#D4AF37]">Preços</a>
                    <Link to="/quem-somos" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide hover:text-[#D4AF37]">Quem Somos</Link>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide text-gray-400 hover:text-white">Entrar</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-gradient-to-r from-[#D4AF37] to-amber-600 text-gray-950 px-10 py-4 rounded-full font-black text-lg uppercase tracking-wider w-full max-w-xs text-center shadow-[0_10px_30px_rgba(212,175,55,0.4)]">Criar Conta Grátis</Link>
                </div>
            )}

            {/* Hero Section */}
            <section className="pt-36 sm:pt-48 pb-20 px-6 relative z-10 text-center max-w-5xl mx-auto">
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight leading-[1.1] mb-6 text-white">
                    O Menu do <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic font-black">Futuro</span>,<br />
                    Hoje no seu <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic font-black">Restaurante</span>.
                </h1>
                
                <p className="max-w-2xl mx-auto text-gray-400 text-sm sm:text-base md:text-lg mb-10 leading-relaxed font-light">
                    Transforme a sua operação com o sistema mais avançado de Angola. Menus digitais QR interativos, gestão de pedidos fluida e controlo em tempo real.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-24">
                    <Link 
                        to="/register" 
                        className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_35px_rgba(212,175,55,0.4)] border border-amber-300 flex items-center justify-center gap-2 group"
                    >
                        Começar Agora <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link 
                        to="/explorar" 
                        className="w-full sm:w-auto bg-white/5 backdrop-blur-md text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest border border-white/10 hover:bg-white/10 hover:border-[#D4AF37]/50 transition-all text-center"
                    >
                        Explorar Restaurantes
                    </Link>
                </div>

                {/* Main Split Content: Left Vertical Photo & Right 2x3 Grid */}
                <div id="funcionalidades" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto text-left">
                    {/* Left: Professional Chef Photo Card matching screenshot */}
                    <div className="lg:col-span-5 relative rounded-[2.5rem] overflow-hidden border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)] group min-h-[400px] lg:min-h-[580px]">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-transparent to-transparent opacity-60 z-10"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1577106263724-2c8e03bfe9cf?auto=format&fit=crop&q=80&w=800" 
                            alt="Chef Profissional na Cozinha" 
                            className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 absolute inset-0"
                        />
                        <div className="absolute bottom-8 left-8 right-8 z-20 bg-[#18181B]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
                            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-black block mb-1">Padrão de Elite</span>
                            <p className="font-serif font-bold text-white text-base sm:text-lg leading-snug">"A precisão que a sua cozinha merece e a agilidade que o seu cliente exige."</p>
                        </div>
                    </div>

                    {/* Right: 2x3 Feature Card Grid matching screenshot */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                        <FeatureCard 
                            icon={Smartphone}
                            title="Menu Digital QR"
                            description="Carregamento instantâneo, visual premium e experiência de utilizador imersiva sem necessidade de instalar apps."
                        />
                        <FeatureCard 
                            icon={Zap}
                            title="Pedidos em Tempo Real"
                            description="Gestão fluida dos pedidos da mesa diretamente para o ecrã da cozinha, eliminando esperas e falhas."
                        />
                        <FeatureCard 
                            icon={TrendingUp}
                            title="Análise de Vendas"
                            description="Dashboards analíticos detalhados para monitorizar receitas, pratos mais vendidos e picos de ocupação ao vivo."
                        />
                        <FeatureCard 
                            icon={Shield}
                            title="Segurança Garantida"
                            description="Infraestrutura cloud robusta, blindada contra falhas e com sincronização automática e backups contínuos."
                        />
                        <FeatureCard 
                            icon={Globe}
                            title="Multi-idiomas"
                            description="Tradução instantânea do menu por inteligência artificial para acolher turistas e clientes internacionais."
                        />
                        <FeatureCard 
                            icon={Utensils}
                            title="Gestão de Reservas"
                            description="Otimização do espaço, receção de reservas online e controlo total da rotação das mesas do restaurante."
                        />
                    </div>
                </div>

                {/* Brand Anthem Card matching screenshot */}
                <div id="sobre" className="mt-16 bg-gradient-to-r from-[#161618] via-[#1C1A17] to-[#141414] border border-[#D4AF37]/30 rounded-[2.5rem] p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-8 shadow-2xl text-left relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#D4AF37]/10 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="w-full sm:w-1/3 h-52 sm:h-64 rounded-2xl overflow-hidden relative shadow-xl shrink-0 border border-white/10">
                        <img 
                            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600" 
                            alt="Gastronomia Premium" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    </div>
                    <div className="flex-1 space-y-3">
                        <span className="text-[10px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase block">Nossa Identidade</span>
                        <h3 className="text-2xl sm:text-4xl font-serif font-black text-white leading-tight">
                            Nascidos em Luanda,<br />
                            Criados para o <span className="bg-gradient-to-r from-[#D4AF37] to-amber-500 bg-clip-text text-transparent">Mundo</span>.
                        </h3>
                        <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-light">
                            Os Menus Jindungo nasceram para impulsionar a transformação digital da restauração em Angola, aliando design de classe mundial a uma engenharia de software desenhada para a realidade local.
                        </p>
                    </div>
                </div>

                {/* 10X ROI / Why Buy Section Masterpiece */}
                <div className="mt-36 max-w-6xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <Flame size={14} className="animate-bounce" /> A Verdade Nua e Crua da Restauração
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-serif font-black text-white mb-6 tracking-tight leading-tight">
                        O Seu Restaurante Está a <span className="underline decoration-red-500 decoration-wavy text-red-400">Perder Dinheiro</span> Todos os Dias. <br />
                        <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic text-2xl sm:text-4xl block mt-3">Veja como os Menús Jindungo estancam as perdas e multiplicam os seus lucros.</span>
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base max-w-3xl mx-auto font-light leading-relaxed mb-16">
                        A gestão tradicional de restaurantes é exaustiva, suscetível a desvios no fecho de caixa e propensa a erros na cozinha. A nossa plataforma assume o papel do gerente financeiro e do empregado mais rápido da sua equipa — trabalhando 24/7 sem reclamar.
                    </p>

                    {/* Visceral Comparison Table: Hoje vs Menús Jindungo */}
                    <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-20 text-left grid grid-cols-1 md:grid-cols-2">
                        {/* O Modo Antigo */}
                        <div className="p-8 sm:p-12 border-b md:border-b-0 md:border-r border-white/10 bg-gradient-to-b from-red-950/20 to-transparent relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                                    <XCircle size={20} />
                                </div>
                                <div>
                                    <span className="text-red-400 text-xs font-bold uppercase tracking-wider block">O Modelo Tradicional</span>
                                    <h3 className="text-2xl font-serif font-bold text-white">O Seu Restaurante Hoje</h3>
                                </div>
                            </div>
                            <ul className="space-y-4 text-sm text-gray-300 font-light">
                                <li className="flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-white font-medium">Perdas no Fecho de Caixa:</strong> Notas rasuradas em papel, pedidos esquecidos e divergências misteriosas de dinheiro ao fim da noite.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-white font-medium">Desperdício e Devoluções:</strong> Caligrafia confusa ou salão ruidoso fazem com que o prato saia com o ingrediente errado. Custo total assumido pelo restaurante.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-white font-medium">Clientes Cansados de Esperar:</strong> 15 minutos até que o empregado traga o ementário físico e mais 15 para pedir a conta. Clientes vão embora ou deixam más críticas.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-white font-medium">Comissões Abusivas nas Entregas:</strong> Submissão a plataformas agregadoras que retiram 30% do seu lucro, sem lhe dar acesso direto à base de contactos dos seus clientes.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-white font-medium">Invisibilidade Digital:</strong> Clientes não sabem se o seu espaço está aberto, não podem ver o menu de casa nem reservar mesa ou encomendar antecipadamente.</span>
                                </li>
                            </ul>
                        </div>

                        {/* O Padrão Jindungo */}
                        <div className="p-8 sm:p-12 bg-gradient-to-b from-[#1C1814] via-[#12100E] to-black relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-[100px] pointer-events-none"></div>
                            <div className="flex items-center gap-3 mb-6 relative">
                                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                    <CheckCircle size={20} strokeWidth={3} />
                                </div>
                                <div>
                                    <span className="text-[#D4AF37] text-xs font-black uppercase tracking-wider block">O Padrão Ouro</span>
                                    <h3 className="text-2xl font-serif font-black text-white">Com Menús Jindungo</h3>
                                </div>
                            </div>
                            <ul className="space-y-4 text-sm text-gray-200 font-light relative">
                                <li className="flex items-start gap-3">
                                    <Check size={18} className="text-[#D4AF37] shrink-0 mt-0.5" strokeWidth={3} />
                                    <span><strong className="text-white font-bold text-[#D4AF37]">Controlo Financeiro Blindado:</strong> Pedidos digitais com encriptação e fecho de caixa ao cêntimo em tempo real. Cada Kwanza faturado entra na sua conta.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check size={18} className="text-[#D4AF37] shrink-0 mt-0.5" strokeWidth={3} />
                                    <span><strong className="text-white font-bold text-[#D4AF37]">Cozinha Kanban Impecável:</strong> O *KitchenBoard* organiza os pratos por ordem cronológica. A cozinha trabalha em silêncio, sem erros e com precisão cirúrgica.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check size={18} className="text-[#D4AF37] shrink-0 mt-0.5" strokeWidth={3} />
                                    <span><strong className="text-white font-bold text-[#D4AF37]">Upselling e +28% de Faturação:</strong> IA sugere acompanhamentos e bebidas premium visualmente irresistíveis. O ticket médio por mesa aumenta sem esforço.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check size={18} className="text-[#D4AF37] shrink-0 mt-0.5" strokeWidth={3} />
                                    <span><strong className="text-white font-bold text-[#D4AF37]">Independência no Delivery:</strong> Opere entregas com os seus próprios estafetas/motoboys particulares. 100% da taxa de entrega fica no cofre do seu restaurante.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check size={18} className="text-[#D4AF37] shrink-0 mt-0.5" strokeWidth={3} />
                                    <span><strong className="text-white font-bold text-[#D4AF37]">Portal Explorar & Reservas:</strong> O cliente visualiza o seu estado ao vivo (Aberto/Fechado), explora pratos, faz encomendas diretas ou reserva mesa antecipadamente.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* 6 Pillars Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                        {/* 1. Blindagem */}
                        <div className="bg-gradient-to-b from-[#1C1A17] to-[#121214] border border-[#D4AF37]/30 rounded-3xl p-7 relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-500 shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
                                    <Shield size={24} strokeWidth={2.5} />
                                </div>
                                <div className="text-3xl font-serif font-black text-[#D4AF37] mb-1">Caixa 100% Exato</div>
                                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">Fim dos Desvios Financeiros</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-light mb-4">
                                    Registo inviolável na nuvem. Tenha controlo absoluto de todas as mesas abertas, consumos e fecho de caixa sincronizado a partir do seu telemóvel.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-3 mt-4 text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> Paz de espírito total para o dono.
                            </div>
                        </div>

                        {/* 2. Empregado Perfeito */}
                        <div className="bg-gradient-to-b from-[#1C1A17] to-[#121214] border border-[#D4AF37]/30 rounded-3xl p-7 relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-500 shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={24} strokeWidth={2.5} />
                                </div>
                                <div className="text-3xl font-serif font-black text-[#D4AF37] mb-1">Atende 100 Mesas</div>
                                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">O Empregado Mais Rápido</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-light mb-4">
                                    O menu digital trabalha 24/7, não falta, não reclama e sugere sobremesas e bebidas automaticamente, gerando +28% de ticket médio por mesa.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-3 mt-4 text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> Zero custos laborais extra.
                            </div>
                        </div>

                        {/* 3. Cozinha */}
                        <div className="bg-gradient-to-b from-[#1C1A17] to-[#121214] border border-[#D4AF37]/30 rounded-3xl p-7 relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-500 shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
                                    <Clock size={24} strokeWidth={2.5} />
                                </div>
                                <div className="text-3xl font-serif font-black text-[#D4AF37] mb-1">Pratos Quentes na Hora</div>
                                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">Cozinha Silenciosa & Veloz</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-light mb-4">
                                    Fim da gritaria e comandas perdidas. O *KitchenBoard* organiza por tempo e alerta os cozinheiros. Menos tempo de espera = clientes apaixonados e rotação 3x mais rápida.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-3 mt-4 text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> -99% de devoluções por erros.
                            </div>
                        </div>

                        {/* 4. WhatsApp */}
                        <div className="bg-gradient-to-b from-[#1C1A17] to-[#121214] border border-[#D4AF37]/30 rounded-3xl p-7 relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-500 shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
                                    <Users size={24} strokeWidth={2.5} />
                                </div>
                                <div className="text-3xl font-serif font-black text-[#D4AF37] mb-1">Zero Comissões</div>
                                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">Domínio de Clientes no WhatsApp</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-light mb-4">
                                    Porquê dar 30% do seu esforço a plataformas externas? Os pedidos entram no seu WhatsApp e o restaurante guarda o número do cliente para disparar campanhas promocionais VIP.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-3 mt-4 text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> 100% de margem no seu bolso.
                            </div>
                        </div>

                        {/* 5. Delivery Frota Própria */}
                        <div className="bg-gradient-to-b from-[#1C1A17] to-[#121214] border border-[#D4AF37]/30 rounded-3xl p-7 relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-500 shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
                                    <Truck size={24} strokeWidth={2.5} />
                                </div>
                                <div className="text-3xl font-serif font-black text-[#D4AF37] mb-1">Frota Própria</div>
                                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">Independência Total no Delivery</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-light mb-4">
                                    Opere as suas entregas com os seus próprios estafetas ou motoboys particulares. Controle toda a logística e retenha 100% da receita de entrega sem intermediários.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-3 mt-4 text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> Autonomia e controlo da taxa de entrega.
                            </div>
                        </div>

                        {/* 6. Explorar & Reservas Antecipadas */}
                        <div className="bg-gradient-to-b from-[#1C1A17] to-[#121214] border border-[#D4AF37]/30 rounded-3xl p-7 relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-500 shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-colors"></div>
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
                                    <Compass size={24} strokeWidth={2.5} />
                                </div>
                                <div className="text-3xl font-serif font-black text-[#D4AF37] mb-1">Visibilidade ao Vivo</div>
                                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">Portal Explorar & Reservas Online</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-light mb-4">
                                    Milhares de clientes acedem ao marketplace para verificar o seu estado ao vivo (Aberto/Fechado), fazer encomendas com antecedência ou reservar mesa instantaneamente.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-3 mt-4 text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> O seu restaurante destacado 24 horas/dia.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final CTA & Pricing Section matching user request */}
                <div id="precos" className="mt-32 mb-24 text-center max-w-6xl mx-auto px-4">
                    <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block mb-3">Investimento Inteligente</span>
                    <h2 className="text-3xl sm:text-5xl font-serif font-black text-white mb-4 tracking-tight leading-tight">
                        Escolha o Plano do seu <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic">Sucesso</span>
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed mb-16">
                        Transparência total e flexibilidade para acompanhar o crescimento do seu restaurante desde o primeiro dia.
                    </p>

                    {/* Billing Cycle Selector */}
                    <div className="flex justify-center mb-16">
                        <div className="bg-[#18181B]/90 backdrop-blur-xl p-1.5 rounded-full border border-white/10 flex items-center gap-1 sm:gap-2 shadow-2xl overflow-x-auto max-w-full">
                            <button
                                onClick={() => setBillingCycle('mensal')}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                                    billingCycle === 'mensal' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Mensal
                            </button>
                            <button
                                onClick={() => setBillingCycle('trimestral')}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all relative whitespace-nowrap ${
                                    billingCycle === 'trimestral' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Trimestral <span className="absolute -top-2.5 right-0 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full shadow hidden sm:inline-block">-5%</span>
                            </button>
                            <button
                                onClick={() => setBillingCycle('semestral')}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all relative whitespace-nowrap ${
                                    billingCycle === 'semestral' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Semestral <span className="absolute -top-2.5 right-0 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full shadow hidden sm:inline-block">-10%</span>
                            </button>
                            <button
                                onClick={() => setBillingCycle('anual')}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all relative whitespace-nowrap ${
                                    billingCycle === 'anual' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] font-black' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Anual <span className="absolute -top-2.5 -right-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow animate-pulse hidden sm:inline-block">2 Meses Grátis</span>
                            </button>
                        </div>
                    </div>

                    {/* Pricing Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20 text-left">
                        {/* 1. Plano Start */}
                        <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37]/50 rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 shadow-xl relative overflow-hidden group">
                            <div>
                                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider mb-6 inline-block">Start</span>
                                <h3 className="text-2xl font-serif font-black text-white mb-2">Plano Start</h3>
                                <p className="text-xs text-gray-400 font-light mb-6">Ideal para pequenos bistrôs, cafés e roulottes gourmet emergentes.</p>
                                
                                {(() => {
                                    const { total, monthly, tag, mult } = getPrice(25000);
                                    return (
                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl sm:text-5xl font-serif font-black text-white">{total}</span>
                                                <span className="text-[#D4AF37] font-bold text-lg">Kz</span>
                                                <span className="text-xs text-gray-500 ml-1">/{mult}</span>
                                            </div>
                                            {tag && <span className="inline-block mt-2 text-[10px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">{tag} (~{monthly} Kz/mês)</span>}
                                        </div>
                                    );
                                })()}

                                <ul className="space-y-3.5 text-xs text-gray-300 font-light mb-8">
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Menu Digital QR Code interativo</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Pedidos ilimitados via WhatsApp</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Até 50 pratos e categorias organizadas</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Personalização com logótipo e cores</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-500 font-light">
                                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0"><Check size={12} /></div>
                                        <span>Suporte por E-mail em horário comercial</span>
                                    </li>
                                </ul>
                            </div>

                            <Link 
                                to={`/register?plan=start&cycle=${billingCycle}`} 
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-full uppercase tracking-wider text-xs border border-white/10 transition-all block text-center"
                            >
                                Selecionar Start
                            </Link>
                        </div>

                        {/* 2. Plano Business (Gold Highlighted) */}
                        <div className="bg-gradient-to-b from-[#1C1814] to-[#12100E] backdrop-blur-3xl border-2 border-[#D4AF37] rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 shadow-[0_0_40px_rgba(212,175,55,0.25)] relative overflow-hidden group md:-translate-y-4">
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black text-[10px] font-black uppercase px-6 py-1.5 rounded-bl-2xl shadow-lg flex items-center gap-1 tracking-widest">
                                <Star size={12} fill="black" /> Mais Escolhido
                            </div>

                            <div>
                                <span className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-6 inline-block">Popular</span>
                                <h3 className="text-2xl font-serif font-black text-white mb-2">Plano Business</h3>
                                <p className="text-xs text-gray-400 font-light mb-6">A escolha perfeita para restaurantes dinâmicos com forte volume de clientes.</p>
                                
                                {(() => {
                                    const { total, monthly, tag, mult } = getPrice(45000);
                                    return (
                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl sm:text-5xl font-serif font-black bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent">{total}</span>
                                                <span className="text-[#D4AF37] font-bold text-lg">Kz</span>
                                                <span className="text-xs text-gray-500 ml-1">/{mult}</span>
                                            </div>
                                            {tag && <span className="inline-block mt-2 text-[10px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">{tag} (~{monthly} Kz/mês)</span>}
                                        </div>
                                    );
                                })()}

                                <ul className="space-y-3.5 text-xs text-gray-200 font-medium mb-8">
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Pratos e categorias totalmente ilimitados</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Ecrã Kanban de Cozinha ao vivo (KitchenBoard)</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Tradução multi-idioma automática por IA</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Gestão de estafetas / Motoboys e entregas</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Estatísticas financeiras e fecho de caixa ao vivo</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Suporte prioritário VIP 24/7 via WhatsApp</span>
                                    </li>
                                </ul>
                            </div>

                            <Link 
                                to={`/register?plan=business&cycle=${billingCycle}`} 
                                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 font-black py-3.5 rounded-full uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-95 transition-all block text-center"
                            >
                                Selecionar Business
                            </Link>
                        </div>

                        {/* 3. Plano Corporate */}
                        <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37]/50 rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 shadow-xl relative overflow-hidden group">
                            <div>
                                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider mb-6 inline-block">VIP</span>
                                <h3 className="text-2xl font-serif font-black text-white mb-2">Plano Corporate</h3>
                                <p className="text-xs text-gray-400 font-light mb-6">Desenhado para hotéis de luxo, redes de restaurantes e operações complexas.</p>
                                
                                {(() => {
                                    const { total, monthly, tag, mult } = getPrice(65000);
                                    return (
                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl sm:text-5xl font-serif font-black text-white">{total}</span>
                                                <span className="text-[#D4AF37] font-bold text-lg">Kz</span>
                                                <span className="text-xs text-gray-500 ml-1">/{mult}</span>
                                            </div>
                                            {tag && <span className="inline-block mt-2 text-[10px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">{tag} (~{monthly} Kz/mês)</span>}
                                        </div>
                                    );
                                })()}

                                <ul className="space-y-3.5 text-xs text-gray-300 font-light mb-8">
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Tudo do Plano Business ilimitado</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Link e subdomínio VIP personalizado</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Gestão multi-utilizador e PIN para empregados</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Baixa automática de ingredientes e stock ao vivo</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Gestor de Conta dedicado e apoio presencial</span>
                                    </li>
                                </ul>
                            </div>

                            <Link 
                                to={`/register?plan=corporate&cycle=${billingCycle}`} 
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-full uppercase tracking-wider text-xs border border-white/10 transition-all block text-center"
                            >
                                Selecionar Corporate
                            </Link>
                        </div>
                    </div>

                    {/* Bottom Contacts and Social Links matching screenshot */}
                    <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-left">
                        <div className="flex flex-wrap items-center gap-8 text-xs font-light text-gray-400">
                            <a href="https://wa.me/244931045991" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#D4AF37] transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37] transition-colors text-white group-hover:text-[#D4AF37]">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">WhatsApp</span>
                                    <span className="font-bold text-white group-hover:text-[#D4AF37]">+244 931 045 991</span>
                                </div>
                            </a>

                            <a href="mailto:comercial@menusjindungo.ao" className="flex items-center gap-3 hover:text-[#D4AF37] transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37] transition-colors text-white group-hover:text-[#D4AF37]">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">E-mail</span>
                                    <span className="font-bold text-white group-hover:text-[#D4AF37]">comercial@menusjindungo.ao</span>
                                </div>
                            </a>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Localização</span>
                                    <span className="font-bold text-white">Luanda - Angola</span>
                                </div>
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] transition-all">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] transition-all">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] transition-all">
                                <Music size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final Copyright Footer */}
            <footer className="py-8 px-6 border-t border-white/5 text-center text-xs text-gray-500 relative z-10 font-light tracking-wider">
                <p>© 2026 MENUS JINDUNGO APP • SUMBA AQUI COMÉRCIO E SERVIÇOS (SU), LDA. TODOS OS DIREITOS RESERVADOS.</p>
            </footer>
        </div>
    );
};

export default LandingPage;

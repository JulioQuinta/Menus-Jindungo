import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Smartphone, Zap, TrendingUp, Shield, Globe, Utensils, 
    ArrowRight, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Music, Check, Star,
    DollarSign, Clock, Users, Award, CheckCircle, XCircle, AlertTriangle, Flame,
    Truck, Compass, Calendar, ShoppingBag, ArrowUp, FileText, Building2, Sparkles, Store,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const FeatureCard = ({ icon: Icon, title, description, badge }) => (
    <div className="bg-[#18181B]/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-500 group hover:-translate-y-1 shadow-lg hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] flex flex-col justify-between">
        <div>
            <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-[#D4AF37]/20">
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                {badge && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-white mb-2 tracking-tight group-hover:text-[#D4AF37] transition-colors">{title}</h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">{description}</p>
        </div>
    </div>
);

const InteractiveDashboardAnalyticsPreview = () => {
    const [activeTab, setActiveTab] = useState('vendas');

    return (
        <div className="bg-[#0D0D0F] border-2 border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            Painel de Tomada de Decisão Executiva
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">EM TEMPO REAL</span>
                        </h4>
                        <p className="text-xs text-gray-400 font-light">Visão consolidada do fluxo financeiro e indicadores estratégicos</p>
                    </div>
                </div>

                {/* Sub-tabs inside preview */}
                <div className="flex flex-wrap gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10 text-xs">
                    {[
                        { id: 'vendas', label: '📈 Vendas & Fluxo' },
                        { id: 'produtos', label: '🏆 Produtos Top' },
                        { id: 'pagamentos', label: '💳 Meios de Pagamento' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-[#D4AF37] text-black shadow-md scale-105'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Faturação do Mês</span>
                    <div className="text-xl sm:text-2xl font-serif font-black text-emerald-400">12.850.000 Kz</div>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">↑ +34.8% vs mês anterior</span>
                </div>

                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Lucro Líquido Estimado</span>
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#D4AF37]">4.280.000 Kz</div>
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mt-1">Margem Média ~33.3%</span>
                </div>

                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Total de Faturas AGT</span>
                    <div className="text-xl sm:text-2xl font-serif font-black text-white">1.482</div>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-1">Certificadas sem erro</span>
                </div>

                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Ticket Médio / Cliente</span>
                    <div className="text-xl sm:text-2xl font-serif font-black text-blue-400">8.670 Kz</div>
                    <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 mt-1">↑ +8.2% de aumento</span>
                </div>
            </div>

            {/* Interactive Tab Content / Graphic Representation */}
            {activeTab === 'vendas' && (
                <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-300">📊 Gráfico de Vendas Semanais (Segunda a Domingo)</span>
                        <span className="text-[#D4AF37]">Pico de Vendas: Sábado (3.400.000 Kz)</span>
                    </div>

                    {/* SVG Graphic Bar Chart */}
                    <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-white/10 pb-2">
                        {[
                            { day: 'Seg', val: 1200000, height: '40%', color: 'from-amber-600 to-[#D4AF37]' },
                            { day: 'Ter', val: 1450000, height: '50%', color: 'from-amber-600 to-[#D4AF37]' },
                            { day: 'Qua', val: 1300000, height: '45%', color: 'from-amber-600 to-[#D4AF37]' },
                            { day: 'Qui', val: 1800000, height: '60%', color: 'from-amber-600 to-[#D4AF37]' },
                            { day: 'Sex', val: 2600000, height: '85%', color: 'from-emerald-600 to-emerald-400' },
                            { day: 'Sáb', val: 3400000, height: '100%', color: 'from-emerald-600 to-emerald-400' },
                            { day: 'Dom', val: 2100000, height: '70%', color: 'from-amber-600 to-[#D4AF37]' }
                        ].map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                <span className="text-[10px] text-gray-400 group-hover:text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                    {(item.val / 1000000).toFixed(1)}M
                                </span>
                                <div className="w-full bg-white/5 rounded-t-xl overflow-hidden h-36 flex items-end p-0.5">
                                    <div 
                                        style={{ height: item.height }} 
                                        className={`w-full rounded-t-lg bg-gradient-to-t ${item.color} group-hover:brightness-125 transition-all shadow-lg`}
                                    />
                                </div>
                                <span className="text-[11px] font-bold text-gray-400 group-hover:text-[#D4AF37] transition-colors">{item.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'produtos' && (
                <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-gray-300 block mb-2">🏆 Artigos / Produtos Mais Vendidos e Margem de Lucro</span>
                    {[
                        { name: 'Prato do Dia / Restauração', qty: '482 vendas', total: '2.890.000 Kz', pct: '85%' },
                        { name: 'Medicamentos & Saúde (FEFO)', qty: '640 vendas', total: '3.200.000 Kz', pct: '95%' },
                        { name: 'Artigos Eletrónicos & Acessórios', qty: '310 vendas', total: '2.170.000 Kz', pct: '78%' },
                        { name: 'Fornadas de Pão & Pastelaria', qty: '1.250 vendas', total: '1.250.000 Kz', pct: '60%' }
                    ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-white">{item.name} <span className="text-gray-400 font-normal">({item.qty})</span></span>
                                <span className="text-[#D4AF37] font-bold">{item.total}</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div style={{ width: item.pct }} className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-500 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'pagamentos' && (
                <div className="bg-black/40 border border-white/10 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center space-y-1">
                        <span className="text-xs font-bold text-blue-400 block">MULTICAIXA EXPRESS</span>
                        <div className="text-2xl font-bold text-white">48%</div>
                        <span className="text-[10px] text-gray-400">6.168.000 Kz</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center space-y-1">
                        <span className="text-xs font-bold text-emerald-400 block">TPA / CARTÃO FÍSICO</span>
                        <div className="text-2xl font-bold text-white">37%</div>
                        <span className="text-[10px] text-gray-400">4.754.500 Kz</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center space-y-1">
                        <span className="text-xs font-bold text-amber-400 block">NUMERÁRIO / ESPÉCIE</span>
                        <div className="text-2xl font-bold text-white">15%</div>
                        <span className="text-[10px] text-gray-400">1.927.500 Kz</span>
                    </div>
                </div>
            )}

            {/* Live Ticker Stream */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-400 font-mono">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <strong>Fluxo ao Vivo:</strong> Factura nº FT 2026/9021 emitida com sucesso à AGT • Luanda, Angola
                </span>
                <span className="font-bold hidden sm:inline">38.000 Kz</span>
            </div>
        </div>
    );
};

const RestaurantShowcaseCarousel = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: '⭐ Ambiência & Sala Gourmet 5 Estrelas',
            subtitle: 'Atendimento de luxo para salão de refeições, clientes e lounges com controlo de mesas.',
            image: '/restaurant_dining_african.png',
            badge: '🍽️ Salão de Refeições & Lounges',
            metric: '🔥 +148 Pedidos Hoje'
        },
        {
            title: '📱 Menu Digital QR Code na Mesa (Mesa 04)',
            subtitle: 'Exibição elegante do suporte de QR Code com o número da mesa (Mesa 04), permitindo leitura instantânea pelo telemóvel.',
            image: '/qr_table_menu.png',
            badge: '📱 Mesa 04 • QR Code Ativo',
            metric: '📍 Mesa 04 • Scanned'
        },
        {
            title: '👨‍🍳 Monitor KitchenBoard KDS de Cozinha (ao Vivo)',
            subtitle: 'Ecrã digital de cozinha KDS montado para os chefes com cartões de comandas organizados em tempo real.',
            image: '/kitchenboard_kds_display.png',
            badge: '⚡ KDS Cozinha Conectado',
            metric: '⏱️ Tempo Médio: 12 min'
        },
        {
            title: '🥩 Gastronomia & Pratos Deliciosos Servidos',
            subtitle: 'Apresentação irresistível de pratos, carnes e receitas gourmet com fotos HD no Menu QR.',
            image: '/login_bg_bitoque.png',
            badge: '🍖 Gastronomia Servida à Mesa',
            metric: '✨ Satisfação 99.4%'
        },
        {
            title: '🍹 Bar, Cocktails & Lounges de Luxo',
            subtitle: 'Gestão integrada de balcão de bar, bebidas finas e faturação eletrónica rápida AGT.',
            image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1000',
            badge: '🍹 Bar & Cocktails',
            metric: '🧾 Faturação AGT 100%'
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    const active = slides[currentSlide];

    return (
        <div className="lg:col-span-5 h-[380px] sm:h-[460px] rounded-3xl overflow-hidden border-2 border-[#D4AF37] relative shadow-[0_0_40px_rgba(212,175,55,0.35)] group">
            {/* Animated Photo Stack with Cross-Fade */}
            {slides.map((s, idx) => (
                <div 
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                >
                    <img 
                        src={s.image} 
                        alt={s.title} 
                        className="w-full h-full object-cover filter brightness-105 contrast-105 transform scale-100 group-hover:scale-105 transition-transform duration-1000"
                    />
                </div>
            ))}

            {/* Floating Glassmorphism Metric Badge */}
            <div className="absolute top-4 left-4 z-20 bg-black/75 backdrop-blur-md border border-[#D4AF37]/50 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold text-emerald-400 shadow-2xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {active.metric}
            </div>

            {/* Slide Counter Badge */}
            <div className="absolute top-4 right-4 z-20 bg-black/75 backdrop-blur-md border border-[#D4AF37]/50 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#D4AF37] shadow-2xl">
                {currentSlide + 1} / {slides.length}
            </div>

            {/* Manual Navigation Arrows */}
            <button 
                onClick={prevSlide}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-[#D4AF37] text-white hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-70 hover:opacity-100 shadow-xl"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={nextSlide}
                aria-label="Próxima foto"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-[#D4AF37] text-white hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer opacity-70 hover:opacity-100 shadow-xl"
            >
                <ChevronRight size={20} />
            </button>

            {/* Overlay Gradient & Slide Metadata Info */}
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-6 pointer-events-none">
                <span className="bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-[10px] px-3.5 py-1 rounded-full uppercase tracking-widest w-max mb-2 shadow-lg">
                    {active.badge}
                </span>
                <h4 className="text-lg sm:text-xl font-serif font-black text-white drop-shadow-md">
                    {active.title}
                </h4>
                <p className="text-xs text-gray-300 font-light mt-1 max-w-md">
                    {active.subtitle}
                </p>

                {/* Dot Indicators */}
                <div className="flex items-center gap-1.5 mt-3 pointer-events-auto">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            aria-label={`Slide ${idx + 1}`}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                idx === currentSlide 
                                    ? 'w-7 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]' 
                                    : 'w-1.5 bg-white/40 hover:bg-white'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();
    const { logoUrl } = useSettings();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState('mensal');
    const [activeSectorTab, setActiveSectorTab] = useState('restaurante');

    const getPrice = (basePrice) => {
        if (billingCycle === 'trimestral') return { total: (basePrice * 3 * 0.95).toLocaleString('pt-AO'), monthly: (basePrice * 0.95).toLocaleString('pt-AO'), tag: 'Poupa 5%', mult: '3 meses' };
        if (billingCycle === 'semestral') return { total: (basePrice * 6 * 0.90).toLocaleString('pt-AO'), monthly: (basePrice * 0.90).toLocaleString('pt-AO'), tag: 'Poupa 10%', mult: '6 meses' };
        if (billingCycle === 'anual') return { total: (basePrice * 12 * 0.80).toLocaleString('pt-AO'), monthly: (basePrice * 0.80).toLocaleString('pt-AO'), tag: '2 Meses Grátis', mult: '1 ano' };
        return { total: basePrice.toLocaleString('pt-AO'), monthly: basePrice.toLocaleString('pt-AO'), tag: null, mult: '1 mês' };
    };

    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [selectedGalleryImages, setSelectedGalleryImages] = useState({});

    const getActiveImage = (secId, defaultImg) => selectedGalleryImages[secId] || defaultImg;

    const sectorDetails = {
        restaurante: {
            title: '⭐ Menús Jindungos — Solução Completa para Restauração',
            subtitle: 'Menu Digital QR Code interativo na mesa, Ecrã Kanban de Cozinha (KitchenBoard), gestão de comandas, mesas, entregas e faturação eletrónica certificada AGT.',
            image: '/restaurant_dining_african.png',
            badge: 'Flagship Menús Jindungos',
            gallery: [
                { label: '🍽️ Restauração Gourmet & Mesas', url: '/restaurant_dining_african.png' },
                { label: '📱 Menu Digital QR na Mesa (Mesa 04)', url: '/qr_table_menu.png' },
                { label: '👨‍🍳 KitchenBoard KDS Cozinha (Board)', url: '/kitchenboard_kds_display.png' },
                { label: '🥩 Gastronomia & Pratos Servidos', url: '/login_bg_bitoque.png' }
            ],
            features: [
                'Menu Digital QR Code Interativo na Mesa',
                'Ecrã Kanban de Cozinha em Tempo Real (KitchenBoard)',
                'Faturação Eletrónica Certificada AGT & Talão 80mm',
                'Gestão de Mesas, Contas Divididas & Comandas',
                'Módulo de Entregas & Motoboys Próprios (Takeaway)'
            ]
        },
        farmacia: {
            title: 'ERP de Farmácia & Saúde de Nível Mundial',
            subtitle: 'Controlo total de lotes FEFO, validade próxima (<90 dias), comparticipação de seguros (ENSA/ORMED) e balcão POS com faturação eletrónica AGT.',
            image: '/pharmacy_erp_showcase.png',
            badge: 'Módulo Especializado',
            gallery: [
                { label: '💊 Dashboard de Saúde', url: '/pharmacy_erp_showcase.png' },
                { label: '📦 Lotes FEFO & Validade', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800' },
                { label: '🧾 POS & Faturação AGT', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800' }
            ],
            features: [
                'Gestão de Lotes & Validade FEFO (<90 dias)',
                'Comparticipação com Seguradoras (ENSA/ORMED)',
                'Faturação Eletrónica AGT & Talão 80mm',
                'Diagnóstico de Impressoras e BT',
                'Escala de Farmacêuticos & Operadores POS'
            ]
        },
        padaria: {
            title: 'Gestão para Padarias & Pastelarias',
            subtitle: 'Controlo de produção diária, fornadas ao vivo, balcão de vendas rápido e faturação eletrónica certificada AGT.',
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1000',
            badge: 'Módulo Especializado',
            gallery: [
                { label: '🥖 Padaria Artesanal & Pão Quente', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1000' },
                { label: '🥐 Vitrine de Pastelaria & Croissants', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1000' },
                { label: '🍞 Fornadas & Balcão POS AGT', url: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&q=80&w=1000' }
            ],
            features: [
                'Venda rápida de Balcão & Peso',
                'Controlo de Fornadas & Matérias-Primas',
                'Faturação Eletrónica Simplificada AGT',
                'Turnos de Caixa & Fecho Diário',
                'Menu QR para Encomendas Especiais'
            ]
        },
        supermercado: {
            title: 'Supermercados & Lojas de Conveniência',
            subtitle: 'Leitura ultrarrápida de código de barras, gestão de stock em grande escala e inventário em tempo real.',
            image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800',
            badge: 'Módulo Especializado',
            gallery: [
                { label: '🛒 Multicaixa POS', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800' },
                { label: '📦 Leitura de Código de Barras', url: 'https://images.unsplash.com/photo-1580674285054-91553f454247?auto=format&fit=crop&q=80&w=800' },
                { label: '📊 Relatório de Turnos', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800' }
            ],
            features: [
                'Ponto de Venda POS Multicaixa',
                'Leitor Tridimensional de Código de Barras',
                'Inventário Automático & Alertas de Rutura',
                'Emissão de Faturas Eletrónicas Certificadas AGT',
                'Relatório de Caixa & Vendas por Turno'
            ]
        },
        eletronicos: {
            title: 'Lojas de Eletrónicos & Tecnologia',
            subtitle: 'Registo de números de série/IMEI, prazos de garantia, faturação certificada AGT e gestão de stock de acessórios.',
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800',
            badge: 'Faturação Eletrónica',
            gallery: [
                { label: '📱 Gestão de Dispositivos', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800' },
                { label: '🔍 Registo de IMEI & Séries', url: 'https://images.unsplash.com/photo-1530319067432-f2a729c03db5?auto=format&fit=crop&q=80&w=800' },
                { label: '🧾 Faturação Certificada AGT', url: 'https://images.unsplash.com/photo-1556742049-0a67ed81d5b1?auto=format&fit=crop&q=80&w=800' }
            ],
            features: [
                'Registo de IMEI & Números de Série',
                'Gestão de Garantias & Assistência Técnica',
                'Faturação Eletrónica Certificada AGT',
                'Controlo de Margens por Produto',
                'POS Rápido de Balcão'
            ]
        },
        boutique: {
            title: 'Boutiques, Roupa & Moda',
            subtitle: 'Gestão por grade de tamanhos e cores, impressão de etiquetas com código de barras e faturação AGT.',
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
            badge: 'Faturação Eletrónica',
            gallery: [
                { label: '👕 Moda & Boutiques', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800' },
                { label: '🏷️ Etiqueta de Códigos de Barras', url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=800' },
                { label: '📊 Gestão por Tamanho e Cor', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800' }
            ],
            features: [
                'Grade de Stock (Tamanho / Cor / Coleção)',
                'Etiquetagem Personalizada com Código de Barras',
                'Faturação Eletrónica AGT & Talão 80mm',
                'Trocas e Devoluções Simplificadas',
                'Relatórios de Artigos Mais Vendidos'
            ]
        },
        auto: {
            title: 'Oficinas, Peças & Stand Auto',
            subtitle: 'Ordens de reparação com matrícula do veículo, peças utilizadas, mão de obra e faturação eletrónica AGT.',
            image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
            badge: 'Faturação Eletrónica',
            gallery: [
                { label: '🚗 Oficina & Diagnóstico', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800' },
                { label: '📋 Ordens de Reparação (OR)', url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80&w=800' },
                { label: '⚙️ Peças & Mão de Obra', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800' }
            ],
            features: [
                'Ordens de Reparação (OR) por Matrícula',
                'Controlo de Peças & Mão de Obra',
                'Faturação AGT de Serviços & Artigos',
                'Histórico de Manutenção do Veículo',
                'Orçamentos & Notas de Encomenda'
            ]
        },
        beleza: {
            title: 'Salões de Beleza, Barbearias & Spas',
            subtitle: 'Gestão de serviços por profissional, comissões de barbeiros/cabeleireiros e faturação rápida AGT.',
            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800',
            badge: 'Faturação Eletrónica',
            gallery: [
                { label: '💇 Salão & Barbearia', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800' },
                { label: '✂️ Comissões por Profissional', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800' },
                { label: '🧾 POS Balcão Rápido', url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800' }
            ],
            features: [
                'Cálculo de Comissões por Profissional',
                'Venda de Produtos & Tratamentos',
                'Faturação Simplificada AGT',
                'Controlo de Caixas Individuais',
                'Marcações e Histórico do Cliente'
            ]
        },
        distribuidora: {
            title: 'Distribuidoras, Grossistas & Armazéns',
            subtitle: 'Faturação A4 em lote, guias de transporte certificadas, vendas a crédito e conta corrente de clientes.',
            image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
            badge: 'Faturação Eletrónica',
            gallery: [
                { label: '📦 Armazéns & Logística', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800' },
                { label: '🚚 Guias de Transporte AGT', url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800' },
                { label: '📑 Clientes a Crédito & A4', url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800' }
            ],
            features: [
                'Emissão de Faturas A4 & Guias de Transporte AGT',
                'Gestão de Clientes a Crédito & Contas Correntes',
                'Tabelas de Preços por Categoria de Cliente',
                'Controlo de Armazéns Múltiplos',
                'Recibos Automáticos & Liquidação'
            ]
        },
        servicos: {
            title: 'Prestadores de Serviços, Consultorias & Escritórios',
            subtitle: 'Emissão rápida de faturas A4, avenças mensais recorrentes, faturas de adiantamento e recibos à medida.',
            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
            badge: 'Faturação Eletrónica',
            gallery: [
                { label: '🏢 Serviços & Consultoria', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800' },
                { label: '📝 Avenças Mensais Recorrentes', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800' },
                { label: '📄 Faturas A4 & PDF Direto', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800' }
            ],
            features: [
                'Faturação Direta de Serviços em A4 / PDF',
                'Avenças Mensais Recorrentes Automáticas',
                'Faturas-Recibo & Notas de Crédito AGT',
                'Gestão de Retenção na Fonte (IRT/II)',
                'Envio de Faturas diretamente por E-mail'
            ]
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden font-sans relative">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vh] bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/15 to-emerald-500/10 blur-[140px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute top-2/3 right-10 w-[40vw] h-[40vw] bg-[#D4AF37]/10 blur-[160px] rounded-full pointer-events-none z-0"></div>

            {/* Navigation Header */}
            <header className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[96%] xl:w-[94%] max-w-7xl z-50 transition-all duration-500">
                <nav className={`rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center transition-all duration-500 border ${
                    scrolled 
                        ? 'bg-[#18181B]/95 backdrop-blur-2xl border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.85)]' 
                        : 'bg-[#18181B]/80 backdrop-blur-xl border-white/10 shadow-2xl'
                }`}>
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-black/40 rounded-full flex items-center justify-center border border-[#D4AF37]/40 group-hover:border-[#D4AF37] overflow-hidden shadow-2xl transition-all duration-300">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-[1.23]" />
                        </div>
                        <span className="font-serif font-black text-base sm:text-lg tracking-tight flex items-center gap-2 whitespace-nowrap">
                            Menu <span className="text-[#D4AF37]">Jindungo</span>
                            <span className="text-[9px] font-sans font-black bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black px-2 py-0.5 rounded-full uppercase tracking-wider hidden xl:inline-block shadow-md whitespace-nowrap">
                                Restauração &amp; Faturação
                            </span>
                        </span>
                    </div>

                    {/* Middle Links */}
                    <div className="hidden lg:flex items-center gap-3 xl:gap-6 text-[11px] xl:text-xs font-bold tracking-wider uppercase text-gray-300 whitespace-nowrap">
                        <a href="#restauracao" className="hover:text-[#D4AF37] transition-colors text-[#D4AF37] whitespace-nowrap">Restauração</a>
                        <a href="#setores" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">Setores</a>
                        <a href="#dashboard" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">Dashboard</a>
                        <a href="#precos" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">Planos &amp; Preços</a>
                        <Link to="/explorar" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">Explorar</Link>
                        <Link to="/quem-somos" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">Quem Somos</Link>
                        <Link to="/login" className="hover:text-white transition-colors py-1 px-3 rounded-full hover:bg-white/10 whitespace-nowrap">Entrar</Link>
                    </div>

                    {/* CTA Button */}
                    <div className="hidden lg:block shrink-0">
                        <Link 
                            to="/register" 
                            className="whitespace-nowrap inline-flex items-center justify-center bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-amber-300"
                        >
                            Criar Conta
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="lg:hidden text-white hover:text-[#D4AF37] transition-colors p-1" onClick={() => setMobileMenuOpen(true)}>
                        <Menu size={24} />
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
                    <a href="#restauracao" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide text-[#D4AF37] font-bold">⭐ Restauração Premium</a>
                    <a href="#setores" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide hover:text-[#D4AF37]">Outros Setores</a>
                    <a href="#dashboard" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide hover:text-[#D4AF37]">Dashboard &amp; Decisão</a>
                    <a href="#precos" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide hover:text-[#D4AF37]">Planos &amp; Preços</a>
                    <Link to="/explorar" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide hover:text-[#D4AF37]">Explorar Lojas</Link>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-xl font-serif tracking-wide text-gray-400 hover:text-white">Entrar</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-gradient-to-r from-[#D4AF37] to-amber-600 text-gray-950 px-10 py-4 rounded-full font-black text-lg uppercase tracking-wider w-full max-w-xs text-center shadow-[0_10px_30px_rgba(212,175,55,0.4)]">Criar Conta Grátis</Link>
                </div>
            )}

            {/* Hero Section */}
            <section className="pt-36 sm:pt-48 pb-20 px-6 relative z-10 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                    <Flame size={16} className="text-[#D4AF37] animate-pulse" /> O Ecossistema Nº 1 para Restauração &amp; Faturação Eletrónica em Angola
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight leading-[1.1] mb-6 text-white">
                    Faturação Certificada AGT para <br />
                    <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic font-black">Qualquer Ramo de Negócio</span>.
                </h1>
                
                <p className="max-w-3xl mx-auto text-gray-300 text-base sm:text-lg md:text-xl mb-10 leading-relaxed font-light">
                    Solução de <strong className="text-white font-semibold">Faturação Eletrónica Certificada AGT</strong> com Dashboard Inteligente para Acompanhar o Fluxo Financeiro e Tomada de Decisão em Restaurantes, Farmácias, Padarias, Eletrónica, Boutiques, Oficinas, Salões de Beleza, Distribuidoras e Serviços.
                </p>

                {/* Extended Sector Badges */}
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-10 text-xs font-bold font-mono max-w-4xl mx-auto">
                    <span className="px-3.5 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                        🍽️ Restauração &amp; Bares
                    </span>
                    <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center gap-1.5 shadow-md">
                        💊 Farmácia &amp; Saúde
                    </span>
                    <span className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center gap-1.5 shadow-md">
                        🥖 Padaria &amp; Pastelaria
                    </span>
                    <span className="px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full flex items-center gap-1.5 shadow-md">
                        🛒 Supermercado &amp; Retail
                    </span>
                    <span className="px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full flex items-center gap-1.5 shadow-md">
                        📱 Eletrónicos &amp; Telemóveis
                    </span>
                    <span className="px-3.5 py-1.5 bg-pink-500/10 border border-pink-500/30 text-pink-400 rounded-full flex items-center gap-1.5 shadow-md">
                        👕 Boutiques &amp; Moda
                    </span>
                    <span className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center gap-1.5 shadow-md">
                        🚗 Oficinas &amp; Peças Auto
                    </span>
                    <span className="px-3.5 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full flex items-center gap-1.5 shadow-md">
                        💇 Salões de Beleza &amp; Spas
                    </span>
                    <span className="px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center gap-1.5 shadow-md">
                        📦 Distribuidoras &amp; Armazéns
                    </span>
                    <span className="px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full flex items-center gap-1.5 shadow-md">
                        🏢 Prestadores de Serviços
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-24">
                    <Link 
                        to="/register" 
                        className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_35px_rgba(212,175,55,0.4)] border border-amber-300 flex items-center justify-center gap-2 group"
                    >
                        Criar Conta Grátis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a 
                        href="#precos" 
                        className="w-full sm:w-auto bg-white/5 backdrop-blur-md text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest border border-white/10 hover:bg-white/10 hover:border-[#D4AF37]/50 transition-all text-center"
                    >
                        Ver Preços &amp; Planos
                    </a>
                </div>

                {/* Restauração Flagship Showcase Banner */}
                <div id="restauracao" className="mb-20 text-left bg-gradient-to-br from-[#1F1810] via-[#141210] to-black border-2 border-[#D4AF37] rounded-[3rem] p-8 sm:p-14 shadow-[0_0_60px_rgba(212,175,55,0.2)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 blur-[120px] rounded-full pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-black uppercase tracking-widest">
                                <Utensils size={14} /> Especialidade Menús Jindungos
                            </div>
                            
                            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight">
                                A Experiência Suprema para <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic">Restaurantes &amp; Bares</span>
                            </h2>

                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                                Transforme o atendimento do seu restaurante com o **Menu Jindungo**. Os clientes leem o QR Code na mesa, fazem pedidos interativos e as solicitações entram imediatamente no ecrã de cozinha (**KitchenBoard**). Faturação eletrónica automática certificada pela AGT.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-black">
                                        <Smartphone size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">Menu Digital na Mesa</h4>
                                        <p className="text-[11px] text-gray-400 font-light">Fotos HD, modificadores e pedidos diretos</p>
                                    </div>
                                </div>
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-black">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">Ecrã Kanban de Cozinha</h4>
                                        <p className="text-[11px] text-gray-400 font-light">Gestão de tempos e pedidos sem papéis</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-wrap items-center gap-4">
                                <Link 
                                    to="/register?plan=business&cycle=mensal" 
                                    className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 font-black px-8 py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2"
                                >
                                    Ativar Restauração (Plano Business) <ArrowRight size={16} />
                                </Link>
                                <a 
                                    href="#precos-restauracao" 
                                    className="text-[#D4AF37] hover:underline text-xs font-bold uppercase tracking-wider"
                                >
                                    Ver Planos de Restauração (20k, 40k, 70k) →
                                </a>
                            </div>
                        </div>

                        {/* Animated Photo Slideshow Component (5 Photos: Ambience, Dishes, Kitchen KDS, QR Menu, Bar Cocktails) */}
                        <RestaurantShowcaseCarousel />
                    </div>
                </div>

                {/* Sector Tabs Section */}
                <div id="setores" className="mt-16 text-left max-w-6xl mx-auto space-y-8">
                    <div className="text-center">
                        <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block mb-2">Engenharia Adaptada ao Seu Setor</span>
                        <h2 className="text-3xl sm:text-5xl font-serif font-black text-white tracking-tight">
                            Soluções Especializadas para <span className="bg-gradient-to-r from-[#D4AF37] to-amber-500 bg-clip-text text-transparent italic">Todos os Ramos de Negócio</span>
                        </h2>
                    </div>

                    {/* Extended Sector Tabs - Multi-line Flex Wrap (Visibilidade 100% Total & Sem Cortes) */}
                    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
                        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 p-4 sm:p-6 rounded-3xl bg-[#121214]/90 border border-[#D4AF37]/30 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                            {[
                                { id: 'restaurante', label: '🍽️ Restauração' },
                                { id: 'farmacia', label: '💊 Farmácia' },
                                { id: 'padaria', label: '🥖 Padaria' },
                                { id: 'supermercado', label: '🛒 Supermercado' },
                                { id: 'eletronicos', label: '📱 Eletrónicos' },
                                { id: 'boutique', label: '👕 Boutiques & Moda' },
                                { id: 'auto', label: '🚗 Oficinas Auto' },
                                { id: 'beleza', label: '💇 Salões de Beleza' },
                                { id: 'distribuidora', label: '📦 Distribuidoras' },
                                { id: 'servicos', label: '🏢 Serviços & Consultorias' }
                            ].map((sec) => (
                                <button
                                    key={sec.id}
                                    onClick={() => setActiveSectorTab(sec.id)}
                                    className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border cursor-pointer ${
                                        activeSectorTab === sec.id
                                            ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.6)] scale-105 z-10 font-black'
                                            : 'bg-black/60 text-gray-300 border-white/10 hover:text-white hover:border-[#D4AF37]/40 hover:bg-white/5'
                                    }`}
                                >
                                    {sec.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Sector Card Showcase with Image Preview Toggle Buttons */}
                    {(() => {
                        const sec = sectorDetails[activeSectorTab];
                        const currentImage = getActiveImage(activeSectorTab, sec.image);
                        return (
                            <div className="bg-[#121214]/95 backdrop-blur-2xl border border-[#D4AF37]/30 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 blur-[120px] rounded-full pointer-events-none" />

                                <div className="lg:col-span-6 space-y-6 relative z-10">
                                    <span className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-black uppercase tracking-widest inline-block">
                                        {sec.badge}
                                    </span>
                                    <h3 className="text-2xl sm:text-4xl font-serif font-black text-white leading-tight">
                                        {sec.title}
                                    </h3>
                                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                                        {sec.subtitle}
                                    </p>

                                    <ul className="space-y-3 pt-2">
                                        {sec.features.map((feat, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-gray-200 font-bold">
                                                <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0">
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="pt-4">
                                        <Link 
                                            to={`/register?sector=${activeSectorTab}`} 
                                            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-gray-950 font-black px-8 py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                                        >
                                            Ativar Módulo {sec.title.split(' ')[0]} <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>

                                {/* Interactive Preview Image & Gallery Switcher */}
                                <div className="lg:col-span-6 flex flex-col gap-3">
                                    {sec.gallery && sec.gallery.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 mb-1 z-10">
                                            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mr-1 flex items-center gap-1">
                                                <Sparkles size={12} /> Vistas do Módulo:
                                            </span>
                                            {sec.gallery.map((g, idx) => {
                                                const isSelected = currentImage === g.url;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedGalleryImages(prev => ({ ...prev, [activeSectorTab]: g.url }))}
                                                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                                                            isSelected
                                                                ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-105'
                                                                : 'bg-black/60 text-gray-300 border-white/10 hover:border-white/40 hover:text-white'
                                                        }`}
                                                    >
                                                        {g.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="h-[340px] sm:h-[420px] rounded-3xl overflow-hidden border border-[#D4AF37]/30 relative shadow-2xl group-hover:border-[#D4AF37] transition-all duration-700">
                                        <img 
                                            src={currentImage} 
                                            alt={sec.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95 filter brightness-105"
                                        />

                                        {/* Creative Dynamic Overlay Badges */}
                                        {currentImage.includes('qr_table_menu') && (
                                            <div className="absolute top-4 left-4 z-10 bg-black/85 backdrop-blur-md border border-[#D4AF37] px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-[#D4AF37] shadow-2xl">
                                                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping" />
                                                📍 Suporte com QR Code &amp; Mesa 04 Ativo
                                            </div>
                                        )}

                                        {currentImage.includes('kitchenboard_kds') && (
                                            <div className="absolute top-4 left-4 z-10 bg-black/85 backdrop-blur-md border border-emerald-500 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-emerald-400 shadow-2xl">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                                                👨‍🍳 Ecrã Monitor KitchenBoard KDS (ao Vivo)
                                            </div>
                                        )}

                                        {currentImage.includes('bitoque') && (
                                            <div className="absolute top-4 left-4 z-10 bg-black/85 backdrop-blur-md border border-amber-400 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-amber-300 shadow-2xl">
                                                🥩 Gastronomia &amp; Pratos Servidos à Mesa
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                                            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                                                {sec.badge}
                                            </span>
                                            <h4 className="text-lg font-serif font-black text-white">{sec.title}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* EXECUTIVE DASHBOARD & DECISION MAKING SECTION */}
<div id="dashboard" className="mt-28 mb-20 text-left max-w-6xl mx-auto space-y-8">
    <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-3">
            <TrendingUp size={16} /> Inteligência de Negócio &amp; Tomada de Decisão
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight mb-4">
            Dashboard Executivo com <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic">Gráficos em Tempo Real</span>
        </h2>

        <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
            O **Menús Jindungos** fornece ao proprietário do negócio o controlo financeiro e operacional absoluto: acompanhe o fluxo de vendas diário, margens de lucro, artigos mais vendidos, picos de movimento e desempenho dos funcionários para tomar as **melhores decisões estratégicas**.
        </p>
    </div>

    {/* Interactive Real Dashboard Preview Component */}
    <InteractiveDashboardAnalyticsPreview />
</div>

                {/* PRICING & PLANS SECTION (Restauração Start 20k / Business 40k / Corporate 70k + Faturação Geral 35k) */}
                <div id="precos" className="mt-36 mb-24 text-center max-w-6xl mx-auto px-4">
                    <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block mb-3">Tabela de Preços Oficial para o Mercado Angolano</span>
                    <h2 className="text-3xl sm:text-5xl font-serif font-black text-white mb-4 tracking-tight leading-tight">
                        Planos Transparentes em <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic">Kwanzas (Kz)</span>
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base max-w-3xl mx-auto font-light leading-relaxed mb-16">
                        Solução 100% em nuvem com <strong className="text-white">Faturação Eletrónica Certificada AGT</strong>. Escolha os pacotes consagrados de <strong className="text-[#D4AF37]">Restauração</strong> ou o módulo universal de <strong className="text-emerald-400">Faturação Geral</strong>.
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

                    {/* SECTION A: RESTAURAÇÃO (Start 20k, Business 40k, Corporate 70k) */}
                    <div id="precos-restauracao" className="text-center mb-8">
                        <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block mb-1">⭐ DESTAQUE PRINCIPAL</span>
                        <h3 className="text-3xl sm:text-4xl font-serif font-black text-white flex items-center justify-center gap-3">
                            <Utensils className="text-[#D4AF37]" /> Planos de Restauração (Start, Business e Corporate)
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto mt-2 font-light">
                            Desenvolvidos especificamente para Restaurantes, Cafés, Bares, Pastularias e Lounges com Menu QR Code e Faturação AGT.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24 text-left">
                        
                        {/* 1. Plano Start (Apenas Menu QR - 20.000 Kz) */}
                        <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37]/50 rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 shadow-xl relative overflow-hidden group">
                            <div>
                                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider mb-6 inline-block">Start (Menu QR Apenas)</span>
                                <h3 className="text-2xl font-serif font-black text-white mb-2">Plano Start</h3>
                                <p className="text-xs text-gray-400 font-light mb-6">Menu Digital QR Code interativo na mesa e catálogo WhatsApp (Sem Faturação AGT).</p>
                                
                                {(() => {
                                    const { total, monthly, tag, mult } = getPrice(20000);
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
                                        <span>Menu Digital QR Code Interativo</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Pedidos direcionados para WhatsApp</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Até 100 pratos/bebidas e categorias</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Personalização com Logótipo e Cores</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-500 font-light">
                                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0"><XCircle size={12} /></div>
                                        <span>Sem módulo de faturação eletrónica AGT</span>
                                    </li>
                                </ul>
                            </div>

                            <Link 
                                to={`/register?plan=start&cycle=${billingCycle}`} 
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-full uppercase tracking-wider text-xs border border-white/10 transition-all block text-center"
                            >
                                Selecionar Start (20.000 Kz)
                            </Link>
                        </div>

                        {/* 2. Plano Business (Menu QR + Faturação AGT - 40.000 Kz) - Popular */}
                        <div className="bg-gradient-to-b from-[#1C1814] to-[#12100E] backdrop-blur-3xl border-2 border-[#D4AF37] rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 shadow-[0_0_50px_rgba(212,175,55,0.3)] relative overflow-hidden group md:-translate-y-4">
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black text-[10px] font-black uppercase px-6 py-1.5 rounded-bl-2xl shadow-lg flex items-center gap-1 tracking-widest">
                                <Star size={12} fill="black" /> O Rei da Restauração
                            </div>

                            <div>
                                <span className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-6 inline-block">Menu QR + Faturação AGT</span>
                                <h3 className="text-2xl font-serif font-black text-white mb-2">Plano Business</h3>
                                <p className="text-xs text-gray-300 font-light mb-6">A combinação ideal de Menu QR na Mesa com Faturação Eletrónica Certificada AGT e Cozinha.</p>
                                
                                {(() => {
                                    const { total, monthly, tag, mult } = getPrice(40000);
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
                                        <span><strong>Menu QR Code + Faturação Eletrónica AGT</strong></span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Ecrã Kanban de Cozinha (KitchenBoard)</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Pratos e categorias ilimitadas</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Ponto de Venda POS Balcão &amp; Talão 80mm</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                        <span>Suporte prioritário 24/7 via WhatsApp</span>
                                    </li>
                                </ul>
                            </div>

                            <Link 
                                to={`/register?plan=business&cycle=${billingCycle}`} 
                                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 font-black py-3.5 rounded-full uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-95 transition-all block text-center"
                            >
                                Selecionar Business (40.000 Kz)
                            </Link>
                        </div>

                        {/* 3. Plano Corporate / 360 (Tudo Incluído - 70.000 Kz) */}
                        <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37]/50 rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 hover:scale-105 shadow-xl relative overflow-hidden group">
                            <div>
                                <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider mb-6 inline-block">360 (Tudo Incluído)</span>
                                <h3 className="text-2xl font-serif font-black text-white mb-2">Plano Corporate 360</h3>
                                <p className="text-xs text-gray-400 font-light mb-6">Para hotéis, redes de restaurantes e operações complexas com múltiplos módulos.</p>
                                
                                {(() => {
                                    const { total, monthly, tag, mult } = getPrice(70000);
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
                                        <span>Módulos adicionais (Entregas/Motoboys, CRM)</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Fidelização de Clientes &amp; Cartões VIP</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                        <span>Assistente IA &amp; Gestor de Conta Dedicado</span>
                                    </li>
                                </ul>
                            </div>

                            <Link 
                                to={`/register?plan=corporate&cycle=${billingCycle}`} 
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-full uppercase tracking-wider text-xs border border-white/10 transition-all block text-center"
                            >
                                Selecionar Corporate (70.000 Kz)
                            </Link>
                        </div>
                    </div>

                    {/* SECTION B: Faturação Geral AGT (Para Farmácias, Padarias, Supermercados & Comércio Geral - 35.000 Kz) */}
                    <div className="mb-20 text-left bg-gradient-to-br from-[#0B1A20] via-[#121214] to-black border-2 border-emerald-500/40 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] pointer-events-none" />

                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
                            <div className="space-y-4 max-w-2xl">
                                <div className="flex items-center gap-3">
                                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black uppercase tracking-widest">
                                        Módulo Geral de Faturação
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono">Farmácias • Padarias • Supermercados • Lojas</span>
                                </div>

                                <h3 className="text-3xl sm:text-4xl font-serif font-black text-white">
                                    Faturação Geral AGT <span className="text-emerald-400 font-sans font-bold text-xl block sm:inline sm:ml-2">(Sem Menu QR)</span>
                                </h3>

                                <p className="text-gray-300 text-sm leading-relaxed font-light">
                                    Sistema universal de faturação eletrónica certificada pela AGT para estabelecimentos comerciais gerais. Inclui Ponto de Venda POS, emissão de faturas de 80mm e A4, controlo de caixas por operador e gestão de stock (Lotes/FEFO para farmácias e fornadas para padarias).
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-gray-200 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                                        <span>Faturação Eletrónica Certificada AGT</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                                        <span>POS Balcão &amp; Impressão Térmica 80mm</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                                        <span>Gestão de Lotes FEFO &amp; Caducidades</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                                        <span>Controlo de Caixas e PINs por Operador</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-auto bg-black/60 border border-white/10 p-8 rounded-3xl text-center shrink-0 space-y-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Investimento Faturação</span>
                                {(() => {
                                    const { total, monthly, tag, mult } = getPrice(35000);
                                    return (
                                        <div>
                                            <div className="flex items-baseline justify-center gap-1">
                                                <span className="text-4xl sm:text-5xl font-serif font-black text-emerald-400">{total}</span>
                                                <span className="text-emerald-400 font-bold text-lg">Kz</span>
                                                <span className="text-xs text-gray-500 ml-1">/{mult}</span>
                                            </div>
                                            {tag && <span className="inline-block mt-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">{tag} (~{monthly} Kz/mês)</span>}
                                        </div>
                                    );
                                })()}

                                <Link 
                                    to={`/register?module=invoicing_general&cycle=${billingCycle}`}
                                    className="block w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-gray-950 font-black px-8 py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 transition-all text-center"
                                >
                                    Ativar Faturação Geral (35.000 Kz)
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Contacts and Social Links */}
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

            {/* Floating Back to Top Button */}
            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-[#D4AF37] text-black hover:bg-[#E5C27B] hover:scale-110 active:scale-95 transition-all shadow-[0_4px_20px_rgba(212,175,55,0.4)] flex items-center justify-center animate-in fade-in slide-in-from-bottom-5 duration-300"
                    title="Voltar ao Topo"
                >
                    <ArrowUp size={20} strokeWidth={3} />
                </button>
            )}
        </div>
    );
};

export default LandingPage;

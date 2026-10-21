import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Smartphone, Zap, TrendingUp, Shield, Utensils,
    ArrowRight, Menu, X, Phone, Mail, MapPin, Check, Star,
    Clock, Users, Award, CheckCircle, Flame,
    Truck, ShoppingBag, ArrowUp, FileText, Sparkles,
    ChefHat, ShieldCheck, Monitor, WifiOff, Heart,
    QrCode, Bell, Navigation, Receipt, Layers, Play
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const HERO_GALLERY = [
    {
        id: 'mesa',
        tag: '📱 Menu QR na Mesa',
        title: 'O cliente pede na mesa em 15 segundos',
        desc: 'Aponta a câmara do telemóvel, vê fotos reais dos pratos e envia o pedido directo para a cozinha.',
        image: '/qr_table_menu.png',
        orderBadge: 'Mesa 08 • Mufete da Ilha + Sumo Natural',
        priceBadge: '14.500 Kz',
        statusBadge: '👨‍🍳 Enviado para o Ecrã da Cozinha'
    },
    {
        id: 'cozinha',
        tag: '👨‍🍳 Ecrã KDS da Cozinha',
        title: 'Zero papel e zero gritos na cozinha',
        desc: 'O Chef recebe as comandas organizadas por ordem de chegada com alerta sonoro e cronómetro.',
        image: '/kitchenboard_kds_display.png',
        orderBadge: 'Comanda #4092 • 2x Bitoque Jindungo',
        priceBadge: 'Em Preparação (06:14)',
        statusBadge: '🔔 1 Toque avisa o Garçom no Passe'
    },
    {
        id: 'salao',
        tag: '🍽️ Hospitalidade & Salão',
        title: 'Atendimento caloroso e mesas sempre cheias',
        desc: 'O garçom recebe o alerta no seu terminal exclusivo por PIN assim que o prato está pronto a servir.',
        image: '/restaurant_dining_african.png',
        orderBadge: 'Terminal do Garçom • Paulo (PIN Activo)',
        priceBadge: 'Prato Pronto no Passe!',
        statusBadge: '✨ +35% Rotação de Mesas'
    },
    {
        id: 'gastronomia',
        tag: '🥩 Take-Away & Delivery GPS',
        title: 'Rastreio ao vivo dentro e fora do restaurante',
        desc: 'Senha digital de levantamento (#XXXX) para Take-Away e mapa GPS em tempo real para entregas.',
        image: '/login_bg_bitoque.png',
        orderBadge: 'Senha Take-Away #3841 • Pronto no Balcão',
        priceBadge: 'Factura AGT Emitida',
        statusBadge: '🧾 Certificado N.º FE/305/AGT/2026'
    }
];

const InteractiveDashboardAnalyticsPreview = () => {
    const [activeTab, setActiveTab] = useState('vendas');

    return (
        <div className="bg-[#12100E] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.7)] space-y-6 text-left font-sans">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black shadow-lg">
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-base sm:text-lg font-display font-extrabold text-white tracking-tight">
                                Painel Executivo do Proprietário &amp; Gerente
                            </h4>
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Tempo Real
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Visão financeira exclusiva da gerência — totalmente oculta nos terminais de Garçom e Cozinha
                        </p>
                    </div>
                </div>

                {/* Sub-tabs inside preview */}
                <div className="flex flex-wrap gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10">
                    {[
                        { id: 'vendas', label: '📈 Facturação Semanal' },
                        { id: 'produtos', label: '🍽️ Pratos Mais Vendidos' },
                        { id: 'pagamentos', label: '💳 Meios de Pagamento' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-[#D4AF37] text-black shadow-md'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Facturação Mensal</span>
                    <div className="text-xl sm:text-2xl font-display font-extrabold text-emerald-400">12.850.000 Kz</div>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">↑ +34,8% vs. mês anterior</span>
                </div>

                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Lucro Líquido Estimado</span>
                    <div className="text-xl sm:text-2xl font-display font-extrabold text-[#D4AF37]">4.280.000 Kz</div>
                    <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 mt-1">Margem Média ~33,3%</span>
                </div>

                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Facturas Emitidas (AGT)</span>
                    <div className="text-xl sm:text-2xl font-display font-extrabold text-white">1.482</div>
                    <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1 mt-1">Certificado FE/305/AGT/2026</span>
                </div>

                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Ticket Médio / Mesa</span>
                    <div className="text-xl sm:text-2xl font-display font-extrabold text-sky-400">8.670 Kz</div>
                    <span className="text-[11px] text-sky-400 font-semibold flex items-center gap-1 mt-1">↑ +28% com Fotos no Menu QR</span>
                </div>
            </div>

            {/* Interactive Tab Content */}
            {activeTab === 'vendas' && (
                <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-bold">
                        <span className="text-gray-300">📊 Facturação Semanal do Restaurante (Segunda a Domingo)</span>
                        <span className="text-[#D4AF37]">Pico de Movimento: Sábado (3.400.000 Kz)</span>
                    </div>

                    <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-white/10 pb-2">
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
                                <span className="text-[10px] text-gray-300 font-mono font-bold">
                                    {(item.val / 1000000).toFixed(1)}M
                                </span>
                                <div className="w-full bg-white/5 rounded-t-xl overflow-hidden h-32 flex items-end p-0.5">
                                    <div
                                        style={{ height: item.height }}
                                        className={`w-full rounded-t-lg bg-gradient-to-t ${item.color} group-hover:brightness-125 transition-all shadow-lg`}
                                    />
                                </div>
                                <span className="text-xs font-display font-bold text-gray-400 group-hover:text-[#D4AF37] transition-colors">{item.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'produtos' && (
                <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-3.5">
                    <span className="text-xs font-bold text-gray-300 block mb-2">🏆 Pratos &amp; Especialidades Mais Vendidos</span>
                    {[
                        { name: 'Mufete Tradicional da Ilha c/ Feijão de Óleo de Palma', qty: '640 pedidos', total: '4.160.000 Kz', pct: '95%' },
                        { name: 'Bitoque Especial Jindungo na Brasa', qty: '512 pedidos', total: '3.072.000 Kz', pct: '85%' },
                        { name: 'Funge Misto c/ Calulu de Peixe & Carne Seca', qty: '430 pedidos', total: '2.580.000 Kz', pct: '76%' },
                        { name: 'Cocktails Tropicais, Sumos Naturais & Bebidas', qty: '1.280 pedidos', total: '3.038.000 Kz', pct: '88%' }
                    ].map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
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
                        <span className="text-xs font-bold text-sky-400 block">MULTICAIXA EXPRESS</span>
                        <div className="text-2xl font-display font-extrabold text-white">48%</div>
                        <span className="text-xs text-gray-400">6.168.000 Kz</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center space-y-1">
                        <span className="text-xs font-bold text-emerald-400 block">TPA / CARTÃO MULTICAIXA</span>
                        <div className="text-2xl font-display font-extrabold text-white">37%</div>
                        <span className="text-xs text-gray-400">4.754.500 Kz</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center space-y-1">
                        <span className="text-xs font-bold text-amber-400 block">NUMERÁRIO (KWANZAS)</span>
                        <div className="text-2xl font-display font-extrabold text-white">15%</div>
                        <span className="text-xs text-gray-400">1.927.500 Kz</span>
                    </div>
                </div>
            )}

            {/* Live Ticker Stream */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span><strong>Fluxo Fiscal ao Vivo:</strong> Factura-Recibo FR 2026/9021 validada pela AGT (<strong className="text-white">FE/305/AGT/2026</strong>) • Luanda</span>
                </span>
                <span className="font-display font-extrabold text-emerald-400 hidden sm:inline">38.000 Kz</span>
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
    const [activeFlowTab, setActiveFlowTab] = useState('garcom');
    const [heroSlide, setHeroSlide] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const getPrice = (basePrice) => {
        if (billingCycle === 'trimestral') return { total: (basePrice * 3 * 0.95).toLocaleString('pt-AO'), monthly: (basePrice * 0.95).toLocaleString('pt-AO'), tag: 'Poupa 5%', mult: '3 meses' };
        if (billingCycle === 'semestral') return { total: (basePrice * 6 * 0.90).toLocaleString('pt-AO'), monthly: (basePrice * 0.90).toLocaleString('pt-AO'), tag: 'Poupa 10%', mult: '6 meses' };
        if (billingCycle === 'anual') return { total: (basePrice * 12 * 0.80).toLocaleString('pt-AO'), monthly: (basePrice * 0.80).toLocaleString('pt-AO'), tag: '2 Meses Grátis', mult: '1 ano' };
        return { total: basePrice.toLocaleString('pt-AO'), monthly: basePrice.toLocaleString('pt-AO'), tag: null, mult: 'mês' };
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 30);
            setShowScrollTop(window.scrollY > 350);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setHeroSlide((prev) => (prev + 1) % HERO_GALLERY.length);
        }, 4800);
        return () => clearInterval(interval);
    }, []);

    const operationalFlows = {
        garcom: {
            badge: '🤵 1. Terminal Exclusivo do Garçom (Login por PIN)',
            title: 'O Garçom Vê Apenas o Seu Trabalho de Sala — Nunca os Gráficos do Gerente',
            subtitle: 'Inspirado nos maiores sistemas mundiais de restauração (Toast, Square e Lightspeed): o colaborador selecciona o seu nome na lista da equipa e introduz o seu PIN individual de 4 dígitos, entrando num terminal limpo de ecrã inteiro.',
            image: '/qr_table_menu.png',
            metrics: [
                { value: '2 Passos', label: 'Nome + PIN Único' },
                { value: '0 Acesso', label: 'A Dados Financeiros' },
                { value: 'Instantâneo', label: 'Alerta de Prato Pronto' }
            ],
            highlights: [
                'Login de Equipa sem conflitos: cada colaborador escolhe o seu próprio perfil antes de digitar o PIN',
                'Passe da Cozinha ao Vivo: recebe alerta sonoro e visual assim que o Chef dá o prato como pronto',
                'Anotar Pedido na Mesa: lança comandas em segundos directamente para o ecrã da cozinha',
                'Fecho de Conta Rápido: emite talão de conferência de mesa ou factura certificada de 80mm'
            ]
        },
        cozinha: {
            badge: '👨‍🍳 2. Ecrã KDS Dedicado da Cozinha',
            title: 'Comandas Organizadas por Tempo e Modalidade no Ecrã do Chef',
            subtitle: 'Acabe com os talões de papel perdidos na cozinha e com as confusões entre pratos de salão e encomendas para fora. Tudo aparece em colunas claras com cronómetro ao vivo.',
            image: '/kitchenboard_kds_display.png',
            metrics: [
                { value: '100% Digital', label: 'Sem Papel na Cozinha' },
                { value: '3 Etiquetas', label: 'Mesa • Take-Away • Entrega' },
                { value: '1 Toque', label: 'Chama o Garçom ao Passe' }
            ],
            highlights: [
                'Coluna "Novos Pedidos" com sinal sonoro imediato quando o cliente pede pelo QR Code ou pelo Garçom',
                'Coluna "Em Preparação no Fogo" com contagem do tempo exacto de cada comanda',
                'Etiquetas visuais automáticas: 🍽️ Servir na Mesa, 🛍️ Embalar p/ Take-Away e 🛵 Embalar p/ Estafeta',
                'Botão "🔔 Prato Pronto!": notifica simultaneamente o telemóvel do cliente e o terminal do garçom'
            ]
        },
        rastreio: {
            badge: '🛰️ 3. Rastreio ao Vivo: Mesa, Take-Away & Delivery',
            title: 'O Cliente Acompanha o Estado Real do Prato Dentro e Fora do Restaurante',
            subtitle: 'Quer esteja sentado à mesa, a caminho do restaurante para levantar um Take-Away ou em casa à espera do estafeta, o cliente acompanha cada etapa no seu telemóvel.',
            image: '/login_bg_bitoque.png',
            metrics: [
                { value: 'Na Mesa', label: '4 Etapas de Salão' },
                { value: '#Senha', label: 'Cartão Digital Take-Away' },
                { value: 'Mapa GPS', label: 'Estafeta em Tempo Real' }
            ],
            highlights: [
                '🍽️ Consumo no Salão: Pedido Recebido → Em Preparação no Fogo → Pronto no Passe → Servido na Mesa',
                '🛍️ Take-Away Online: gera um Cartão de Senha Digital (#XXXX) para recolha rápida no balcão sem filas',
                '🛵 Entrega ao Domicílio (Delivery): mapa GPS interactivo com a posição do estafeta e contacto directo',
                'Avaliação Privada de 1 a 5 Estrelas e Cartão de Fidelização VIP integrados no final do pedido'
            ]
        },
        offline: {
            badge: '💻 4. Aplicação Desktop Windows + 30 Dias Offline',
            title: 'A Internet Falhou? O Seu Restaurante Continua a Vender e a Facturar',
            subtitle: 'Sabemos que um restaurante cheio não pode parar por falhas de rede. A aplicação instalável MenusJindungo.exe guarda os dados localmente e mantém a facturação AGT activa sem interrupções.',
            image: '/restaurant_dining_african.png',
            metrics: [
                { value: '30 Dias', label: 'Sessão Offline Activa' },
                { value: 'Automática', label: 'Sincronização Cloud' },
                { value: 'Windows', label: 'Instalador Nativo .EXE' }
            ],
            highlights: [
                'Pacote instalador pronto para computadores e terminais POS Touch (MenusJindungo.exe)',
                'Emissão contínua de Factura-Recibo (FR) com assinatura criptográfica mesmo sem ligação à internet',
                'Fila inteligente de sincronização: assim que a rede volta, todos os pedidos sobem para a nuvem',
                'O proprietário acompanha as vendas em tempo real no seu telemóvel onde quer que esteja'
            ]
        }
    };

    const currentHero = HERO_GALLERY[heroSlide];
    const currentFlow = operationalFlows[activeFlowTab];

    return (
        <div className="min-h-screen bg-[#0B0907] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden font-sans relative">
            
            {/* Warm Ambient Lighting */}
            <div className="absolute top-0 left-1/4 w-[65vw] h-[55vh] bg-gradient-to-br from-[#D4AF37]/15 via-amber-600/10 to-transparent blur-[150px] rounded-full pointer-events-none z-0" />
            <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] bg-amber-500/10 blur-[170px] rounded-full pointer-events-none z-0" />

            {/* =====================================================================
                NAVIGATION HEADER — BEM ESTRUTURADO, ALINHADO E CENTRALIZADO
               ===================================================================== */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-[#0E0C0A]/95 backdrop-blur-2xl border-b border-[#D4AF37]/25 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)]'
                    : 'bg-gradient-to-b from-black/85 via-black/50 to-transparent py-4 sm:py-5'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    
                    {/* Left: Brand Logo */}
                    <div
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
                    >
                        <div className="w-11 h-11 bg-[#14110D] rounded-2xl flex items-center justify-center border border-[#D4AF37]/50 group-hover:border-[#D4AF37] overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all">
                            <img
                                src={logoUrl || "/jindungo_logo_v3.png"}
                                alt="Menús Jindungo"
                                className="w-full h-full object-contain scale-[1.15] transition-transform duration-300 group-hover:scale-[1.22]"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white leading-none">
                                Menús <span className="text-[#D4AF37]">Jindungo</span>
                            </span>
                            <span className="text-[10px] font-sans font-bold text-amber-200/80 uppercase tracking-widest mt-1">
                                Restauração &amp; Facturação AGT
                            </span>
                        </div>
                    </div>

                    {/* Center: Clean Navigation Links */}
                    <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 text-xs font-display font-bold uppercase tracking-wider text-gray-300">
                        <a href="#como-funciona" className="hover:text-[#D4AF37] transition-colors">Como Funciona</a>
                        <a href="#ecossistema" className="hover:text-[#D4AF37] transition-colors">Terminais &amp; KDS</a>
                        <a href="#facturacao-agt" className="hover:text-[#D4AF37] transition-colors">Facturação AGT</a>
                        <a href="#precos" className="hover:text-[#D4AF37] transition-colors">Preços</a>
                        <a href="#quem-somos" className="hover:text-[#D4AF37] transition-colors">Quem Somos</a>
                        <Link to="/explorar" className="hover:text-[#D4AF37] transition-colors text-[#F3E5AB]">Explorar</Link>
                    </nav>

                    {/* Right: Actions (Perfectly Centered Buttons) */}
                    <div className="hidden lg:flex items-center justify-end gap-3 shrink-0">
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center text-center px-4 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider text-gray-200 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15 transition-all"
                        >
                            Entrar
                        </Link>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center text-center bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-5 py-2.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_6px_25px_rgba(212,175,55,0.35)] leading-none"
                        >
                            Criar Restaurante
                        </Link>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/15 text-white hover:text-[#D4AF37] transition-colors"
                        aria-label="Abrir Menu"
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[100] bg-[#0B0907]/98 backdrop-blur-2xl p-6 flex flex-col justify-between animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-10 h-10 rounded-xl border border-[#D4AF37]/40" />
                            <span className="font-display font-extrabold text-xl text-white">Menús <span className="text-[#D4AF37]">Jindungo</span></span>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center text-white"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 my-auto py-6 text-center font-display font-bold text-lg">
                        <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#D4AF37]">Como Funciona</a>
                        <a href="#ecossistema" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#D4AF37]">Terminais &amp; Cozinha KDS</a>
                        <a href="#facturacao-agt" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#D4AF37]">Facturação Electrónica AGT</a>
                        <a href="#precos" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#D4AF37]">Planos &amp; Preços</a>
                        <a href="#quem-somos" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#D4AF37]">Quem Somos</a>
                        <Link to="/explorar" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#D4AF37]">Explorar Restaurantes</Link>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full py-3.5 rounded-xl bg-white/5 border border-white/15 font-display font-bold text-sm uppercase tracking-wider text-center text-white"
                        >
                            Entrar no Painel
                        </Link>
                        <Link
                            to="/register"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] font-display font-extrabold text-sm uppercase tracking-wider text-center text-gray-950 shadow-lg"
                        >
                            Criar Restaurante
                        </Link>
                    </div>
                </div>
            )}

            {/* =====================================================================
                1. HERO SECTION COMERCIAL (SPLIT LAYOUT + FOTOS REAIS + UI AO VIVO)
               ===================================================================== */}
            <section className="relative pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
                    
                    {/* Left Column: High-Converting Marketing Copy */}
                    <div className="lg:col-span-6 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#1A150E] border border-[#D4AF37]/40 shadow-[0_0_25px_rgba(212,175,55,0.15)]">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span className="text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider text-[#F3E5AB]">
                                Plataforma N.º 1 de Restauração • Certificado AGT FE/305/AGT/2026
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl xl:text-6xl font-display font-extrabold tracking-tight leading-[1.08] text-white">
                            Transforme Cada Mesa num Pedido Rápido e{' '}
                            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#E5A93C] bg-clip-text text-transparent">
                                Aumente as Vendas do Seu Restaurante.
                            </span>
                        </h1>

                        <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-normal max-w-2xl">
                            O sistema completo e acolhedor que une o <strong className="text-white font-semibold">Menu Digital QR Code na Mesa</strong>, o <strong className="text-white font-semibold">Terminal do Garçom por PIN</strong>, o <strong className="text-white font-semibold">Ecrã KDS da Cozinha</strong>, o <strong className="text-white font-semibold">Rastreio de Take-Away e Delivery</strong> e a <strong className="text-emerald-400 font-semibold">Facturação Electrónica Certificada pela AGT</strong> — com funcionamento garantido mesmo sem internet.
                        </p>

                        {/* Primary & Secondary CTAs — Perfectly Centered */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-8 py-4 rounded-2xl font-display font-extrabold text-sm uppercase tracking-wider hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_12px_35px_rgba(212,175,55,0.35)] text-center"
                            >
                                <span>Criar Restaurante Agora</span>
                                <ArrowRight size={18} strokeWidth={2.5} />
                            </Link>
                            <a
                                href="#precos"
                                className="inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] text-white px-7 py-4 rounded-2xl font-display font-bold text-sm uppercase tracking-wider border border-white/15 hover:border-[#D4AF37]/50 transition-all text-center"
                            >
                                <span>Ver Planos (Desde 15.000 Kz)</span>
                            </a>
                        </div>

                        {/* Key Business Metrics Row */}
                        <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#D4AF37]">+35%</div>
                                <p className="text-xs text-gray-400 mt-0.5 leading-snug">Rotação de mesas e pedidos por turno</p>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-display font-extrabold text-white">100%</div>
                                <p className="text-xs text-gray-400 mt-0.5 leading-snug">Focado em Restauração e Hospitalidade</p>
                            </div>
                            <div>
                                <div className="text-xl sm:text-2xl font-display font-extrabold text-emerald-400">FE/305/AGT</div>
                                <p className="text-xs text-gray-400 mt-0.5 leading-snug">Facturação Electrónica Validada AGT</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Rich Photographic Showcase + Floating Live UI Cards */}
                    <div className="lg:col-span-6 relative">
                        <div className="relative mx-auto max-w-xl lg:max-w-none">
                            
                            {/* Glow Behind Image */}
                            <div className="absolute -inset-3 bg-gradient-to-tr from-[#D4AF37]/30 via-amber-500/15 to-emerald-500/15 rounded-[2.5rem] blur-2xl opacity-70 pointer-events-none" />

                            {/* Main Interactive Photo Card */}
                            <div className="relative rounded-[2.2rem] overflow-hidden border-2 border-[#D4AF37]/50 bg-[#14110E] shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
                                <div className="relative h-[380px] sm:h-[450px] w-full overflow-hidden">
                                    {HERO_GALLERY.map((slide, index) => (
                                        <img
                                            key={slide.id}
                                            src={slide.image}
                                            alt={slide.title}
                                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                                                index === heroSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                                            }`}
                                        />
                                    ))}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0907] via-[#0B0907]/40 to-black/20" />

                                    {/* Top Floating Live Status Pill */}
                                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-20">
                                        <span className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#D4AF37]/50 text-[#F3E5AB] font-display font-bold text-xs shadow-lg">
                                            {currentHero.tag}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-400/40 text-emerald-300 font-display font-bold text-[11px] flex items-center gap-1.5 shadow-lg">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                            {currentHero.statusBadge}
                                        </span>
                                    </div>

                                    {/* Bottom Overlay Inside Photo */}
                                    <div className="absolute bottom-0 inset-x-0 p-6 z-20 space-y-3">
                                        <div className="bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xl">
                                            <div>
                                                <div className="text-[11px] font-display font-bold uppercase tracking-wider text-[#D4AF37]">
                                                    {currentHero.orderBadge}
                                                </div>
                                                <div className="text-base sm:text-lg font-display font-extrabold text-white mt-0.5">
                                                    {currentHero.title}
                                                </div>
                                                <p className="text-xs text-gray-300 mt-0.5 line-clamp-2">
                                                    {currentHero.desc}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3.5 py-2 rounded-xl">
                                                <span className="text-[10px] text-gray-300 block uppercase">Estado / Valor</span>
                                                <span className="text-xs sm:text-sm font-display font-extrabold text-[#F3E5AB]">
                                                    {currentHero.priceBadge}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Selector Pills for Hero Showcase */}
                                        <div className="grid grid-cols-4 gap-2 pt-1">
                                            {HERO_GALLERY.map((item, idx) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setHeroSlide(idx)}
                                                    className={`py-2 px-2 rounded-xl font-display font-bold text-[11px] transition-all cursor-pointer truncate border ${
                                                        idx === heroSlide
                                                            ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md'
                                                            : 'bg-black/60 text-gray-300 border-white/10 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {item.tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </section>

            {/* =====================================================================
                2. GALERIA VISUAL DE CONCEITOS GASTRONÓMICOS (FOTOS CONVIDATIVAS)
               ===================================================================== */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    <span className="text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest block">
                        Especialização 100% Gastronómica
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight">
                        Desenhado à Medida do Seu Espaço Gastronómico
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                        Do restaurante tradicional angolano ao lounge moderno, a Menús Jindungo adapta-se ao ritmo da sua sala, da sua cozinha e das suas entregas.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            title: 'Restaurantes & Casas de Grelhados',
                            desc: 'Menu QR por mesa, divisão de contas, comandas directas para a grelha e cozinha e fecho de caixa fiscal AGT.',
                            image: '/login_bg_bitoque.png',
                            badge: '🍽️ Salão & Mesas'
                        },
                        {
                            title: 'Esplanadas, Roças & Beach Clubs',
                            desc: 'O cliente pede bebidas e petiscos sem esperar que o garçom passe, aumentando o consumo por mesa em +35%.',
                            image: '/restaurant_dining_african.png',
                            badge: '🍹 Atendimento Rápido'
                        },
                        {
                            title: 'Pastelarias, Cafés & Brunch',
                            desc: 'Venda rápida ao balcão no POS Touch, emissão de factura térmica de 80mm em 2 segundos e controlo de stock.',
                            image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=900',
                            badge: '☕ Balcão & Esplanada'
                        },
                        {
                            title: 'Churrasqueiras, Take-Away & Delivery',
                            desc: 'Encomendas online com Senha Digital (#XXXX) para recolha no balcão e rastreio com Mapa GPS ao vivo do estafeta.',
                            image: '/login_bg_food.png',
                            badge: '🛵 Take-Away & Entrega'
                        }
                    ].map((card, i) => (
                        <div
                            key={i}
                            className="group bg-[#14110E] border border-white/10 hover:border-[#D4AF37]/60 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="relative h-52 overflow-hidden">
                                    <img
                                        src={card.image}
                                        alt={card.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#14110E] via-transparent to-black/30" />
                                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#D4AF37]/40 text-[#F3E5AB] font-display font-bold text-[11px]">
                                        {card.badge}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-display font-extrabold text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                                        {card.desc}
                                    </p>
                                </div>
                            </div>
                            <div className="px-6 pb-5">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-[#D4AF37] hover:underline"
                                >
                                    <span>Usar no meu restaurante</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* =====================================================================
                3. COMO FUNCIONA NA PRÁTICA (4 PASSOS VISUAIS COM FOTOGRAFIA)
               ===================================================================== */}
            <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="bg-gradient-to-b from-[#17130E] to-[#110E0B] border border-[#D4AF37]/25 rounded-[2.5rem] p-6 sm:p-12 lg:p-14 shadow-2xl">
                    <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                        <span className="px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest inline-block">
                            Fluxo Completo de Ponta a Ponta
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight">
                            Do Pedido na Mesa à Factura AGT em 4 Passos
                        </h2>
                        <p className="text-gray-300 text-sm sm:text-base">
                            Veja como a Menús Jindungo organiza a sua equipa, elimina filas de espera e encanta os seus clientes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                step: '01',
                                title: 'Menu QR na Mesa ou Encomenda Online',
                                desc: 'O cliente lê o QR Code na mesa (ou abre o link no WhatsApp para Take-Away/Delivery), vê fotos reais dos pratos e faz o pedido sem instalar nada.',
                                benefit: '+28% Aumento no Pedido Médio',
                                image: '/qr_table_menu.png'
                            },
                            {
                                step: '02',
                                title: 'A Cozinha Recebe no Ecrã KDS',
                                desc: 'O pedido toca imediatamente no ecrã KDS da cozinha com etiqueta clara: Servir na Mesa, Embalar p/ Take-Away ou Entregar ao Estafeta.',
                                benefit: 'Zero Erros de Comanda',
                                image: '/kitchenboard_kds_display.png'
                            },
                            {
                                step: '03',
                                title: 'Garçom Notificado & Rastreio ao Vivo',
                                desc: 'Quando o Chef clica em "Prato Pronto", o garçom recebe o alerta no seu terminal exclusivo por PIN e o cliente vê o estado ao vivo no telemóvel.',
                                benefit: 'Atendimento 3x Mais Rápido',
                                image: '/restaurant_dining_african.png'
                            },
                            {
                                step: '04',
                                title: 'Pagamento & Factura Electrónica AGT',
                                desc: 'No fecho da conta (Multicaixa Express, TPA ou Numerário), o Caixa emite a Factura-Recibo certificada (FE/305/AGT/2026) mesmo sem internet.',
                                benefit: '100% Legalizado na AGT',
                                image: '/login_bg_bitoque.png'
                            }
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-[#0D0B09] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl overflow-hidden flex flex-col justify-between transition-all shadow-lg"
                            >
                                <div>
                                    <div className="relative h-40 overflow-hidden">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0B09] via-black/30 to-transparent" />
                                        <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-[#D4AF37] text-black font-display font-extrabold text-sm flex items-center justify-center shadow-lg">
                                            {item.step}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-base font-display font-extrabold text-white mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                                <div className="px-5 pb-5">
                                    <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-display font-bold text-[11px] text-center">
                                        ✓ {item.benefit}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* =====================================================================
                4. OS 4 TERMINAIS OPERACIONAIS (DEMONSTRADOR INTERACTIVO)
               ===================================================================== */}
            <section id="ecossistema" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    <span className="text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest block">
                        Organização Profissional de Equipa
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight">
                        Cada Membro da Equipa Vê Apenas o Seu Terminal
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                        Tal como nos maiores sistemas de restauração do mundo, separámos o painel estratégico do proprietário dos ecrãs operacionais do Garçom, da Cozinha e do Caixa.
                    </p>
                </div>

                {/* Selector Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
                    {[
                        { id: 'garcom', icon: '🤵', title: '1. Terminal do Garçom', sub: 'Login Nome + PIN • Sala & Mesas' },
                        { id: 'cozinha', icon: '👨‍🍳', title: '2. Ecrã KDS Cozinha', sub: 'Comandas ao Vivo • Sem Preços' },
                        { id: 'rastreio', icon: '🛰️', title: '3. Rastreio 3 Modalidades', sub: 'Mesa • Senha Take-Away • GPS' },
                        { id: 'offline', icon: '💻', title: '4. App Desktop Offline', sub: 'MenusJindungo.exe • 30 Dias' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFlowTab(tab.id)}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                                activeFlowTab === tab.id
                                    ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-gray-950 border-[#D4AF37] shadow-[0_10px_30px_rgba(212,175,55,0.3)] scale-[1.01]'
                                    : 'bg-[#15120E] text-white border-white/10 hover:border-[#D4AF37]/40'
                            }`}
                        >
                            <span className="text-2xl shrink-0">{tab.icon}</span>
                            <div className="min-w-0">
                                <div className="font-display font-extrabold text-xs sm:text-sm truncate">{tab.title}</div>
                                <div className={`text-[11px] truncate ${activeFlowTab === tab.id ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                                    {tab.sub}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Active Terminal Showcase Box */}
                <div className="bg-[#14110E] border border-[#D4AF37]/35 rounded-[2.5rem] p-6 sm:p-10 lg:p-12 shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        
                        {/* Image & Metrics */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="relative h-72 sm:h-80 rounded-3xl overflow-hidden border border-[#D4AF37]/40 shadow-xl">
                                <img
                                    src={currentFlow.image}
                                    alt={currentFlow.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-black font-display font-extrabold text-[11px] uppercase tracking-wider">
                                        {currentFlow.badge}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {currentFlow.metrics.map((m, idx) => (
                                    <div key={idx} className="bg-black/50 border border-white/10 rounded-2xl p-3 text-center">
                                        <div className="font-display font-extrabold text-sm sm:text-base text-[#D4AF37]">{m.value}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{m.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Description & Bullet Points */}
                        <div className="lg:col-span-7 space-y-6 text-left">
                            <h3 className="text-2xl sm:text-4xl font-display font-extrabold text-white leading-tight">
                                {currentFlow.title}
                            </h3>
                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                {currentFlow.subtitle}
                            </p>

                            <div className="space-y-3">
                                {currentFlow.highlights.map((h, i) => (
                                    <div key={i} className="flex items-start gap-3 bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                                        <CheckCircle size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm text-gray-200 leading-relaxed">{h}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 flex flex-wrap gap-3">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-gray-950 px-7 py-3.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-lg"
                                >
                                    <span>Activar no Meu Restaurante</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* =====================================================================
                5. FACTURAÇÃO ELECTRÓNICA CERTIFICADA PELA AGT (FE/305/AGT/2026)
               ===================================================================== */}
            <section id="facturacao-agt" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="bg-gradient-to-br from-[#121A16] via-[#111512] to-[#0D0B09] border-2 border-emerald-500/35 rounded-[2.5rem] p-6 sm:p-12 lg:p-14 shadow-[0_20px_70px_rgba(16,185,129,0.12)]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        
                        {/* Left Content */}
                        <div className="lg:col-span-7 space-y-6 text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-display font-bold text-xs uppercase tracking-wider">
                                <ShieldCheck size={16} /> Conformidade Fiscal Oficial em Angola
                            </div>

                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
                                Facturação Electrónica Validada pela AGT:{' '}
                                <span className="text-emerald-400">Certificado N.º FE/305/AGT/2026</span>
                            </h2>

                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                Emita <strong className="text-white">Facturas-Recibo (FR)</strong>, <strong className="text-white">Facturas (FT)</strong>, <strong className="text-white">Facturas Proforma (PP)</strong> e <strong className="text-white">Notas de Crédito (NC)</strong> em total conformidade com o Regime Jurídico das Facturas em Angola. Cada documento inclui assinatura criptográfica <strong className="text-emerald-400">JWS RS256</strong> e exportação do ficheiro oficial <strong className="text-emerald-400">SAF-T (AO)</strong>.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                    <div className="text-xs font-display font-extrabold text-emerald-400 uppercase mb-1">
                                        ✓ Impressão Térmica 80mm &amp; PDF A4
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Compatível com qualquer impressora térmica de balcão (USB, Rede ou Bluetooth) e envio directo da factura por WhatsApp.
                                    </p>
                                </div>
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                    <div className="text-xs font-display font-extrabold text-emerald-400 uppercase mb-1">
                                        ✓ Validação Automática de NIF
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Consulta instantânea de contribuintes colectivos e singulares ou emissão rápida para Consumidor Final.
                                    </p>
                                </div>
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                    <div className="text-xs font-display font-extrabold text-emerald-400 uppercase mb-1">
                                        ✓ Gestão de Turnos &amp; Fecho de Caixa
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Abertura e fecho de caixa cego por operador com reconciliação de Numerário, TPA e Multicaixa Express.
                                    </p>
                                </div>
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                    <div className="text-xs font-display font-extrabold text-emerald-400 uppercase mb-1">
                                        ✓ Ficha Técnica &amp; Baixa de Stock
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Cada prato facturado desconta automaticamente os ingredientes no inventário do restaurante.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Visual Thermal Receipt Mockup with AGT Certificate */}
                        <div className="lg:col-span-5">
                            <div className="bg-white text-gray-900 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-sm mx-auto font-mono text-xs border-4 border-emerald-500/40 relative">
                                <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                                    <div className="font-sans font-black text-base uppercase tracking-tight text-gray-950">RESTAURANTE SABOR DE LUANDA</div>
                                    <div className="text-[11px] text-gray-600">NIF: 5417892031 • Ilha de Luanda</div>
                                    <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-sans font-extrabold text-[10px]">
                                        FACTURA-RECIBO • FR 2026/1482
                                    </div>
                                </div>

                                <div className="space-y-2 border-b border-dashed border-gray-300 pb-4 mb-4">
                                    <div className="flex justify-between">
                                        <span>2x Mufete Tradicional</span>
                                        <span className="font-bold">13.000 Kz</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>1x Bitoque Jindungo</span>
                                        <span className="font-bold">6.500 Kz</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>3x Sumo Natural Múcua</span>
                                        <span className="font-bold">4.500 Kz</span>
                                    </div>
                                </div>

                                <div className="space-y-1 border-b border-dashed border-gray-300 pb-4 mb-4">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal Líquido:</span>
                                        <span>21.052,63 Kz</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>IVA (14%):</span>
                                        <span>2.947,37 Kz</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-sans font-black text-gray-950 pt-1">
                                        <span>TOTAL PAGO (MCX):</span>
                                        <span>24.000,00 Kz</span>
                                    </div>
                                </div>

                                <div className="text-center space-y-1.5 bg-gray-100 p-3 rounded-xl">
                                    <div className="font-sans font-extrabold text-[10px] text-emerald-800 uppercase">
                                        9f8a-Processado por programa validado n.º FE/305/AGT/2026
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                        Menús Jindungo v3.1 • Assinatura JWS RS256
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* =====================================================================
                6. PAINEL EXECUTIVO DO PROPRIETÁRIO (PREVIEW INTERACTIVO)
               ===================================================================== */}
            <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                    <span className="text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest block">
                        Controlo Total no Telemóvel ou Computador
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                        Saiba Exactamente Quanto o Seu Restaurante Factura e Lucra
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                        Enquanto a equipa trabalha nos terminais operacionais, o proprietário acompanha as vendas, os pratos mais rentáveis e o fecho de caixa em tempo real.
                    </p>
                </div>

                <InteractiveDashboardAnalyticsPreview />
            </section>

            {/* =====================================================================
                7. PLANOS & PREÇOS ACTUALIZADOS (15.000 / 25.000 / 40.000 / 25.000 KZ)
               ===================================================================== */}
            <section id="precos" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
                    <span className="px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest inline-block">
                        Investimento Acessível &amp; Retorno Imediato
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
                        Planos Claros para Cada Fase do Seu Restaurante
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base">
                        Sem taxas escondidas e sem comissões sobre os seus pratos. Escolha o ciclo de pagamento e comece hoje mesmo.
                    </p>

                    {/* Billing Cycle Selector */}
                    <div className="inline-flex flex-wrap items-center justify-center gap-1.5 bg-[#15120E] p-1.5 rounded-2xl border border-white/10 mt-4">
                        {[
                            { id: 'mensal', label: 'Mensal' },
                            { id: 'trimestral', label: 'Trimestral (-5%)' },
                            { id: 'semestral', label: 'Semestral (-10%)' },
                            { id: 'anual', label: 'Anual (2 Meses Grátis)' }
                        ].map((cycle) => (
                            <button
                                key={cycle.id}
                                onClick={() => setBillingCycle(cycle.id)}
                                className={`px-4 py-2 rounded-xl font-display font-bold text-xs transition-all cursor-pointer ${
                                    billingCycle === cycle.id
                                        ? 'bg-[#D4AF37] text-black shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {cycle.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4 Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
                    
                    {/* 1. PLANO START — 15.000 KZ */}
                    <div className="bg-[#14110E] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-display font-extrabold uppercase tracking-wider text-gray-400">Plano Start</span>
                                <span className="px-2.5 py-1 rounded-full bg-white/5 text-gray-300 text-[10px] font-bold">Iniciação Digital</span>
                            </div>
                            <h3 className="text-xl font-display font-extrabold text-white mb-2">Menu QR &amp; WhatsApp</h3>
                            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                                Ideal para cafés, quiosques e pequenos restaurantes que querem modernizar o cardápio na mesa.
                            </p>

                            <div className="mb-6 pb-6 border-b border-white/10">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                                        {getPrice(15000).monthly}
                                    </span>
                                    <span className="text-sm font-display font-bold text-[#D4AF37]">Kz / mês</span>
                                </div>
                                {getPrice(15000).tag && (
                                    <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                                        {getPrice(15000).tag} • Total: {getPrice(15000).total} Kz / {getPrice(15000).mult}
                                    </span>
                                )}
                            </div>

                            <ul className="space-y-3 text-xs text-gray-300 mb-8">
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Menu Digital QR Code ilimitado</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Fotos reais, categorias e pratos do dia</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Pedidos rápidos na mesa e via WhatsApp</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Botão de chamar garçom na mesa</li>
                            </ul>
                        </div>

                        <Link
                            to="/register"
                            className="w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-[#D4AF37] text-white hover:text-black font-display font-extrabold text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center text-center"
                        >
                            Começar com Start
                        </Link>
                    </div>

                    {/* 2. PLANO BUSINESS — 25.000 KZ (MAIS POPULAR) */}
                    <div className="bg-gradient-to-b from-[#221B11] to-[#14110E] border-2 border-[#D4AF37] rounded-3xl p-7 flex flex-col justify-between transition-all shadow-[0_15px_50px_rgba(212,175,55,0.22)] relative">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-display font-extrabold text-[10px] uppercase tracking-widest shadow-lg whitespace-nowrap">
                            ⭐ Mais Escolhido
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4 mt-1">
                                <span className="text-xs font-display font-extrabold uppercase tracking-wider text-[#D4AF37]">Plano Business</span>
                                <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 text-[#F3E5AB] text-[10px] font-bold">Salão + KDS + Rastreio</span>
                            </div>
                            <h3 className="text-xl font-display font-extrabold text-white mb-2">Operação Completa de Sala</h3>
                            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                                Para restaurantes em crescimento que precisam de Cozinha KDS, Terminal de Garçom e Rastreio de Encomendas.
                            </p>

                            <div className="mb-6 pb-6 border-b border-white/10">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-4xl font-display font-extrabold text-[#F3E5AB]">
                                        {getPrice(25000).monthly}
                                    </span>
                                    <span className="text-sm font-display font-bold text-[#D4AF37]">Kz / mês</span>
                                </div>
                                {getPrice(25000).tag && (
                                    <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                                        {getPrice(25000).tag} • Total: {getPrice(25000).total} Kz / {getPrice(25000).mult}
                                    </span>
                                )}
                            </div>

                            <ul className="space-y-3 text-xs text-gray-200 mb-8">
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Tudo do Plano Start incluído</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> <strong>Terminal do Garçom</strong> (Login Nome + PIN)</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> <strong>Ecrã KDS da Cozinha</strong> em tempo real</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> <strong>Rastreio ao Vivo:</strong> Mesa, Senha Take-Away e Delivery c/ GPS</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Cartão de Fidelização VIP, Cupões e Reservas</li>
                            </ul>
                        </div>

                        <Link
                            to="/register"
                            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 font-display font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-lg inline-flex items-center justify-center text-center"
                        >
                            Escolher Plano Business
                        </Link>
                    </div>

                    {/* 3. PLANO CORPORATE — 40.000 KZ */}
                    <div className="bg-[#14110E] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-display font-extrabold uppercase tracking-wider text-amber-300">Plano Corporate</span>
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold">Tudo Incluído 360º</span>
                            </div>
                            <h3 className="text-xl font-display font-extrabold text-white mb-2">Restauração + Facturação AGT</h3>
                            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                                A solução total para restaurantes estruturados: Menu QR, KDS, Rastreio GPS, Stock, App Desktop Offline e Facturação AGT.
                            </p>

                            <div className="mb-6 pb-6 border-b border-white/10">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                                        {getPrice(40000).monthly}
                                    </span>
                                    <span className="text-sm font-display font-bold text-[#D4AF37]">Kz / mês</span>
                                </div>
                                {getPrice(40000).tag && (
                                    <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                                        {getPrice(40000).tag} • Total: {getPrice(40000).total} Kz / {getPrice(40000).mult}
                                    </span>
                                )}
                            </div>

                            <ul className="space-y-3 text-xs text-gray-300 mb-8">
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Tudo do Plano Business incluído</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> <strong>Facturação Electrónica AGT (FE/305/AGT/2026)</strong></li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> <strong>App Desktop Windows (.EXE)</strong> c/ 30 dias Offline</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Controlo de Stock, Receitas (Ficha Técnica) e Turnos</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Exportação SAF-T (AO) e apoio prioritário 24/7</li>
                            </ul>
                        </div>

                        <Link
                            to="/register"
                            className="w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-[#D4AF37] text-white hover:text-black font-display font-extrabold text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center text-center"
                        >
                            Escolher Plano Corporate
                        </Link>
                    </div>

                    {/* 4. FACTURAÇÃO ELECTRÓNICA MENSAL — 25.000 KZ */}
                    <div className="bg-gradient-to-b from-[#111C16] to-[#14110E] border border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-display font-extrabold uppercase tracking-wider text-emerald-400">Facturação Electrónica</span>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">FE/305/AGT/2026</span>
                            </div>
                            <h3 className="text-xl font-display font-extrabold text-white mb-2">Módulo POS &amp; Facturação AGT</h3>
                            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                                Para restaurantes que pretendem focar-se na emissão de facturas certificadas pela AGT no balcão, gestão de caixa e inventário.
                            </p>

                            <div className="mb-6 pb-6 border-b border-white/10">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-4xl font-display font-extrabold text-emerald-400">
                                        {getPrice(25000).monthly}
                                    </span>
                                    <span className="text-sm font-display font-bold text-emerald-300">Kz / mês</span>
                                </div>
                                {getPrice(25000).tag && (
                                    <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                                        {getPrice(25000).tag} • Total: {getPrice(25000).total} Kz / {getPrice(25000).mult}
                                    </span>
                                )}
                            </div>

                            <ul className="space-y-3 text-xs text-gray-200 mb-8">
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> <strong>Certificado AGT N.º FE/305/AGT/2026</strong></li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> Emissão de FR, FT, Proforma e Nota de Crédito</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> Talão Térmico 80mm, PDF A4 e ficheiro SAF-T (AO)</li>
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> Terminal de Caixa POS + App Desktop Offline</li>
                            </ul>
                        </div>

                        <Link
                            to="/register"
                            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-display font-extrabold text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center text-center shadow-lg"
                        >
                            Activar Facturação AGT
                        </Link>
                    </div>

                </div>
            </section>

            {/* =====================================================================
                8. SECÇÃO QUEM SOMOS (HISTÓRIA, CREDIBILIDADE E ORGULHO ANGOLANO)
               ===================================================================== */}
            <section id="quem-somos" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="bg-[#14110E] border border-white/10 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        
                        <div className="lg:col-span-5 space-y-6">
                            <div className="relative rounded-3xl overflow-hidden border border-[#D4AF37]/40 shadow-2xl h-80">
                                <img
                                    src="/restaurant_dining_african.png"
                                    alt="Hospitalidade Angolana Menús Jindungo"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                <div className="absolute bottom-5 left-5 right-5">
                                    <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-black font-display font-extrabold text-[10px] uppercase tracking-wider">
                                        🇦🇴 Tecnologia Angolana para a Restauração
                                    </span>
                                    <h4 className="text-xl font-display font-extrabold text-white mt-2">
                                        O Tempero da Inovação na Sua Mesa
                                    </h4>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7 space-y-5 text-left">
                            <span className="text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest block">
                                Quem Somos • A Nossa Missão
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
                                Nascidos em Luanda para Elevar a Restauração Angolana ao Padrão Mundial
                            </h2>
                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                A <strong className="text-white">Menús Jindungo</strong> nasceu com um propósito claro: substituir os sistemas pesados, confusos e genéricos por uma plataforma feita <strong className="text-[#F3E5AB]">exclusivamente para quem vive da gastronomia e da hospitalidade</strong>.
                            </p>
                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                Combinamos a simplicidade do <strong className="text-white">Menu QR Code na mesa</strong> com a disciplina operacional dos grandes restaurantes internacionais — onde o garçom, o cozinheiro e o caixa têm os seus próprios terminais dedicados — e a segurança jurídica da <strong className="text-emerald-400">Facturação Electrónica Certificada pela AGT (N.º FE/305/AGT/2026)</strong>.
                            </p>

                            <div className="pt-3 flex flex-wrap items-center gap-4">
                                <Link
                                    to="/quem-somos"
                                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider border border-white/15 transition-all"
                                >
                                    <span>Conhecer a Nossa História Completa</span>
                                    <ArrowRight size={15} />
                                </Link>
                                <Link
                                    to="/explorar"
                                    className="inline-flex items-center justify-center gap-2 text-[#D4AF37] font-display font-bold text-xs uppercase tracking-wider hover:underline px-3 py-2"
                                >
                                    <span>Ver Restaurantes Parceiros</span>
                                    <ArrowRight size={15} />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* =====================================================================
                9. CTA FINAL DE CONVERSÃO
               ===================================================================== */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
                <div className="bg-gradient-to-r from-[#231B10] via-[#18130C] to-[#231B10] border-2 border-[#D4AF37]/50 rounded-[2.5rem] p-8 sm:p-14 text-center shadow-[0_20px_70px_rgba(212,175,55,0.2)] space-y-6">
                    <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
                        Pronto para Modernizar o Atendimento e a Facturação do Seu Restaurante?
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
                        Crie a conta do seu restaurante em menos de 2 minutos. A nossa equipa apoia toda a configuração das mesas, da cozinha e da certificação AGT.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-9 py-4 rounded-2xl font-display font-extrabold text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-xl text-center"
                        >
                            <span>Criar Conta do Restaurante</span>
                            <ArrowRight size={18} />
                        </Link>
                        <a
                            href="https://wa.me/244923000000"
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-8 py-4 rounded-2xl font-display font-bold text-sm uppercase tracking-wider border border-white/15 transition-all text-center"
                        >
                            <Phone size={16} className="text-[#D4AF37]" />
                            <span>Falar com Consultor Comercial</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* =====================================================================
                10. FOOTER PROFISSIONAL
               ===================================================================== */}
            <footer className="bg-[#080705] border-t border-white/10 py-14 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/10">
                    <div className="md:col-span-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-11 h-11 rounded-xl border border-[#D4AF37]/40" />
                            <div>
                                <span className="font-display font-extrabold text-xl text-white block leading-none">
                                    Menús <span className="text-[#D4AF37]">Jindungo</span>
                                </span>
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                    Programa Certificado AGT N.º FE/305/AGT/2026
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                            Plataforma especializada em Restauração e Hospitalidade em Angola: Menu Digital QR Code na Mesa, Terminal de Garçom, Ecrã KDS de Cozinha, Rastreio de Take-Away &amp; Delivery e Facturação Electrónica Certificada pela AGT.
                        </p>
                    </div>

                    <div className="md:col-span-4 grid grid-cols-2 gap-6 text-xs text-gray-400">
                        <div className="space-y-2.5">
                            <span className="font-display font-bold text-white uppercase tracking-wider block">Plataforma</span>
                            <a href="#como-funciona" className="block hover:text-[#D4AF37]">Como Funciona</a>
                            <a href="#ecossistema" className="block hover:text-[#D4AF37]">Terminais &amp; Cozinha KDS</a>
                            <a href="#facturacao-agt" className="block hover:text-[#D4AF37]">Facturação AGT</a>
                            <a href="#precos" className="block hover:text-[#D4AF37]">Planos &amp; Preços</a>
                        </div>
                        <div className="space-y-2.5">
                            <span className="font-display font-bold text-white uppercase tracking-wider block">Institucional</span>
                            <Link to="/quem-somos" className="block hover:text-[#D4AF37]">Quem Somos</Link>
                            <Link to="/explorar" className="block hover:text-[#D4AF37]">Restaurantes Activos</Link>
                            <Link to="/login" className="block hover:text-[#D4AF37]">Entrar no Painel</Link>
                            <Link to="/register" className="block hover:text-[#D4AF37]">Criar Restaurante</Link>
                        </div>
                    </div>

                    <div className="md:col-span-3 space-y-3 text-xs text-gray-400">
                        <span className="font-display font-bold text-white uppercase tracking-wider block">Planos Mensais</span>
                        <div className="space-y-1.5 bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                            <div className="flex justify-between"><span>Plano Start:</span><strong className="text-white">15.000 Kz</strong></div>
                            <div className="flex justify-between"><span>Plano Business:</span><strong className="text-[#D4AF37]">25.000 Kz</strong></div>
                            <div className="flex justify-between"><span>Plano Corporate:</span><strong className="text-white">40.000 Kz</strong></div>
                            <div className="flex justify-between"><span>Facturação AGT:</span><strong className="text-emerald-400">25.000 Kz</strong></div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                    <span>© 2026 Menús Jindungo • Luanda, Angola. Todos os direitos reservados.</span>
                    <span>Processado por programa validado n.º FE/305/AGT/2026</span>
                </div>
            </footer>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl bg-[#D4AF37] text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-all cursor-pointer"
                    aria-label="Voltar ao topo"
                >
                    <ArrowUp size={20} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
};

export default LandingPage;

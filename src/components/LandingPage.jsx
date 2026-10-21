import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Smartphone, Zap, TrendingUp, Shield, Utensils,
    ArrowRight, Menu, X, Phone, Mail, MapPin, Check, Star,
    Clock, Users, Award, CheckCircle, XCircle, Flame,
    Truck, ShoppingBag, ArrowUp, FileText, Sparkles,
    ChefHat, ShieldCheck, Monitor, WifiOff, Heart,
    QrCode, Bell, Navigation, Receipt, Play, Pause, ChevronDown
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const HERO_GALLERY = [
    {
        id: 'mesa',
        tag: '📱 Menu QR na Mesa',
        title: 'O cliente pede na mesa em 15 segundos',
        desc: 'Aponta a câmara do telemóvel, explora fotos reais que abrem o apetite e envia o pedido directo para a cozinha.',
        image: '/qr_table_menu.png',
        orderBadge: 'Mesa 08 • Mufete da Ilha + Sumo Natural',
        priceBadge: '14.500 Kz',
        statusBadge: '👨‍🍳 Enviado para o Ecrã da Cozinha',
        liveStep: '1/4 • Pedido na Mesa'
    },
    {
        id: 'cozinha',
        tag: '👨‍🍳 Ecrã KDS da Cozinha',
        title: 'Zero papel e zero gritos na cozinha',
        desc: 'O Chef recebe as comandas organizadas por ordem de chegada com alerta sonoro, cronómetro e etiqueta de serviço.',
        image: '/kitchenboard_kds_display.png',
        orderBadge: 'Comanda #4092 • 2x Bitoque Jindungo',
        priceBadge: 'No Fogo (06:14)',
        statusBadge: '🔔 1 Toque chama o Garçom ao Passe',
        liveStep: '2/4 • Preparação KDS'
    },
    {
        id: 'salao',
        tag: '🤵 Terminal do Garçom',
        title: 'Equipa rápida com acesso por Nome + PIN',
        desc: 'Cada garçom entra no seu próprio terminal sem ver os gráficos financeiros do gerente e recebe alertas de pratos prontos.',
        image: '/restaurant_dining_african.png',
        orderBadge: 'Terminal de Sala • Paulo (PIN Activo)',
        priceBadge: 'Prato Pronto no Passe!',
        statusBadge: '✨ +35% Rotação de Mesas',
        liveStep: '3/4 • Serviço de Sala'
    },
    {
        id: 'gastronomia',
        tag: '🧾 Factura AGT & Rastreio',
        title: 'Take-Away, Delivery GPS e Factura AGT',
        desc: 'Senha digital (#XXXX) para recolha no balcão, mapa GPS do estafeta e emissão imediata de Factura-Recibo AGT.',
        image: '/login_bg_bitoque.png',
        orderBadge: 'Factura-Recibo FR 2026/1482 • MCX Express',
        priceBadge: '24.000 Kz Pago',
        statusBadge: '🧾 Certificado FE/305/AGT/2026',
        liveStep: '4/4 • Facturado AGT'
    }
];

const LIVE_SIMULATOR_STEPS = [
    {
        step: 1,
        role: 'Cliente na Mesa / Online',
        badge: '📱 Passo 1 • Menu Digital QR Code',
        title: 'O Cliente Escolhe os Pratos pelo Telemóvel (Sem Instalar Aplicação)',
        description: 'Na mesa do restaurante (via QR Code) ou em casa (via link do WhatsApp/Instagram), o cliente vê fotografias apelativas, escolhe acompanhamentos e envia o pedido em segundos.',
        image: '/qr_table_menu.png',
        screenTitle: 'Ecrã do Telemóvel do Cliente',
        screenStatus: 'Pedido #3841 Confirmado • Mesa 08',
        screenItems: [
            { label: '1x Mufete Tradicional da Ilha (Ponto Médio)', val: '8.500 Kz' },
            { label: '1x Bitoque Especial Jindungo na Brasa', val: '6.500 Kz' },
            { label: '2x Sumo Natural de Múcua Fresco', val: '3.000 Kz' }
        ],
        screenFooter: 'Estado no Telemóvel: "O seu pedido foi recebido pela cozinha!"',
        highlightColor: 'border-[#D4AF37] text-[#D4AF37]'
    },
    {
        step: 2,
        role: 'Cozinha & Chef (KDS)',
        badge: '👨‍🍳 Passo 2 • Ecrã KDS da Cozinha',
        title: 'A Cozinha Recebe a Comanda com Alerta Sonoro e Etiqueta Clara',
        description: 'Sem papel e sem confusões: o ecrã KDS mostra exactamente o que preparar, há quanto tempo o pedido entrou e se é para Servir na Mesa, Embalar para Take-Away ou Entregar ao Estafeta.',
        image: '/kitchenboard_kds_display.png',
        screenTitle: 'Ecrã KDS Puro da Cozinha (Sem Preços)',
        screenStatus: '🔥 EM PREPARAÇÃO NO FOGO • 04m 18s',
        screenItems: [
            { label: '🍽️ SERVIR NA MESA 08', val: 'Prioridade Normal' },
            { label: '• 1x Mufete Tradicional da Ilha (Ponto Médio)', val: 'Grelha' },
            { label: '• 1x Bitoque Especial Jindungo na Brasa', val: 'Fogão' }
        ],
        screenFooter: 'Acção do Chef: Botão [🔔 Prato Pronto! Chamar Garçom]',
        highlightColor: 'border-cyan-400 text-cyan-300'
    },
    {
        step: 3,
        role: 'Garçom & Rastreio ao Vivo',
        badge: '🤵 Passo 3 • Terminal do Garçom + Rastreio',
        title: 'O Garçom é Chamado ao Passe e o Cliente Acompanha Tudo ao Vivo',
        description: 'Assim que o Chef clica em "Prato Pronto", o terminal do garçom (autenticado por Nome + PIN único) vibra com o aviso de recolha no Passe, e o telemóvel do cliente actualiza automaticamente.',
        image: '/restaurant_dining_african.png',
        screenTitle: 'Terminal Exclusivo do Garçom (Paulo • PIN ****)',
        screenStatus: '🔔 PRATO PRONTO NO PASSE DA COZINHA!',
        screenItems: [
            { label: 'Mesa 08 — Levantar no Balcão da Cozinha', val: 'Pronto Agora' },
            { label: 'Se for Take-Away: Senha Digital #3841 chamada no ecrã', val: 'Balcão' },
            { label: 'Se for Delivery: Estafeta rastreado por Mapa GPS ao vivo', val: 'Em Rota' }
        ],
        screenFooter: 'Acção do Garçom: Botão [✅ Confirmar Entrega na Mesa 08]',
        highlightColor: 'border-amber-400 text-amber-300'
    },
    {
        step: 4,
        role: 'Caixa POS & Facturação AGT',
        badge: '🧾 Passo 4 • Facturação Electrónica AGT',
        title: 'Emissão Instantânea da Factura Certificada (Com ou Sem Internet)',
        description: 'No fecho da conta (Multicaixa Express, TPA ou Numerário), o terminal de Caixa emite o talão térmico de 80mm ou PDF A4 com assinatura criptográfica JWS e baixa automática no stock.',
        image: '/login_bg_bitoque.png',
        screenTitle: 'Terminal de Caixa POS • Certificado FE/305/AGT/2026',
        screenStatus: '✅ FACTURA-RECIBO FR 2026/1482 EMITIDA',
        screenItems: [
            { label: 'Total Facturado (IVA 14% Incluído)', val: '18.000,00 Kz' },
            { label: 'Meio de Pagamento: Multicaixa Express', val: 'Confirmado' },
            { label: 'Assinatura JWS RS256 + Facturação Electrónica AGT', val: 'Validado AGT' }
        ],
        screenFooter: 'Processado por programa validado n.º FE/305/AGT/2026 | Menus Jindungo v3.1',
        highlightColor: 'border-emerald-400 text-emerald-300'
    }
];

const InteractiveDashboardAnalyticsPreview = () => {
    const [activeTab, setActiveTab] = useState('vendas');

    return (
        <div className="bg-[#12100E] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.7)] space-y-6 text-left font-sans">
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
    const [heroSlide, setHeroSlide] = useState(0);
    const [simStep, setSimStep] = useState(0);
    const [simPlaying, setSimPlaying] = useState(true);
    const [trackingMode, setTrackingMode] = useState('mesa'); // 'mesa' | 'takeaway' | 'delivery'
    const [invoiceFormat, setInvoiceFormat] = useState('80mm'); // '80mm' | 'a4'
    const [openFaq, setOpenFaq] = useState(0);
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

    useEffect(() => {
        if (!simPlaying) return;
        const timer = setInterval(() => {
            setSimStep((prev) => (prev + 1) % LIVE_SIMULATOR_STEPS.length);
        }, 4200);
        return () => clearInterval(timer);
    }, [simPlaying]);

    const currentHero = HERO_GALLERY[heroSlide];
    const currentSim = LIVE_SIMULATOR_STEPS[simStep];

    const faqs = [
        {
            q: 'O cliente precisa de instalar alguma aplicação no telemóvel para ver o Menu QR?',
            a: 'Não! Basta apontar a câmara do telemóvel para o QR Code na mesa (ou clicar no link do WhatsApp/Instagram). O menu abre instantaneamente no navegador, pronto a fazer pedidos e a acompanhar o estado do prato em tempo real.'
        },
        {
            q: 'O garçom e o cozinheiro conseguem ver quanto dinheiro o restaurante facturou?',
            a: 'Não. Na Menús Jindungo cada colaborador faz login seleccionando o seu Nome e introduzindo o seu PIN individual de 4 dígitos. O Garçom vê apenas o terminal de mesas e o Passe; a Cozinha vê apenas o ecrã KDS de preparação; os relatórios financeiros ficam exclusivos para o Proprietário/Gerente.'
        },
        {
            q: 'Como funciona o rastreio de encomendas em Take-Away e Delivery?',
            a: 'Para pedidos na Mesa, o cliente vê as 4 etapas de salão. Para Take-Away, o sistema gera automaticamente um Cartão de Senha Digital (#XXXX) no telemóvel do cliente e avisa quando o saco está pronto no balcão. Para Delivery, o cliente vê um Mapa GPS ao vivo com a localização do estafeta e botões para ligar ou falar no WhatsApp.'
        },
        {
            q: 'E se a internet do restaurante falhar a meio do almoço ou jantar?',
            a: 'O seu restaurante não pára! Com o pacote instalável para Windows (MenusJindungo.exe) e o motor de persistência offline de 30 dias, continua a lançar pedidos e a emitir facturas certificadas pela AGT normalmente. Quando a internet regressa, tudo sincroniza sozinho com a nuvem.'
        },
        {
            q: 'A Facturação Electrónica está certificada pela AGT em Angola?',
            a: 'Sim! Todas as Facturas-Recibo (FR), Facturas (FT), Facturas Proforma (PP) e Notas de Crédito (NC) são emitidas através do sistema de Facturação Electrónica certificado pela AGT sob o N.º FE/305/AGT/2026 (Versão v3.1), com assinatura criptográfica JWS RS256 e submissão directa de Facturação Electrónica.'
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B0907] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden font-sans relative">
            
            {/* Warm Hospitality Ambient Lighting */}
            <div className="absolute top-0 left-1/4 w-[65vw] h-[55vh] bg-gradient-to-br from-[#D4AF37]/18 via-amber-600/10 to-transparent blur-[150px] rounded-full pointer-events-none z-0" />
            <div className="absolute top-[38%] right-[-10%] w-[45vw] h-[45vw] bg-amber-500/10 blur-[170px] rounded-full pointer-events-none z-0" />

            {/* =====================================================================
                NAVIGATION HEADER + TOP TRUST BAR — CENTRALIZADO E EQUILIBRADO
               ===================================================================== */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-[#0E0C0A]/95 backdrop-blur-2xl border-b border-[#D4AF37]/25 shadow-[0_10px_35px_rgba(0,0,0,0.85)]'
                    : 'bg-gradient-to-b from-black/95 via-black/70 to-transparent'
            }`}>
                {/* Top Official Trust Ribbon (collapses smoothly on scroll) */}
                <div className={`hidden md:block border-b border-white/10 bg-[#14110D]/90 transition-all duration-300 overflow-hidden ${
                    scrolled ? 'max-h-0 opacity-0 border-none' : 'max-h-10 py-1.5 opacity-100'
                }`}>
                    <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[11px] font-display font-semibold text-gray-300">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                <ShieldCheck size={13} /> Certificado Oficial AGT N.º FE/305/AGT/2026
                            </span>
                            <span className="flex items-center gap-1.5 text-amber-200/90">
                                <WifiOff size={13} /> Funciona Com e Sem Internet (Modo Offline 30 Dias)
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-400">🇦🇴 Luanda &amp; Todas as Províncias</span>
                            <a href="#precos" className="text-[#D4AF37] font-bold hover:underline">Planos desde 15.000 Kz/mês →</a>
                        </div>
                    </div>
                </div>

                {/* Main Navbar Row */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
                    
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
                    <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-7 text-xs font-display font-bold uppercase tracking-wider text-gray-300">
                        <a href="#simulador" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 text-[#F3E5AB]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Simulador ao Vivo
                        </a>
                        <a href="#rastreio-360" className="hover:text-[#D4AF37] transition-colors">Rastreio &amp; KDS</a>
                        <a href="#facturacao-agt" className="hover:text-[#D4AF37] transition-colors">Facturação AGT</a>
                        <a href="#precos" className="hover:text-[#D4AF37] transition-colors">Preços</a>
                        <a href="#quem-somos" className="hover:text-[#D4AF37] transition-colors">Quem Somos</a>
                        <Link to="/explorar" className="hover:text-[#D4AF37] transition-colors">Restaurantes</Link>
                    </nav>

                    {/* Right: Actions (Perfectly Centered Buttons) */}
                    <div className="hidden lg:flex items-center justify-end gap-3 shrink-0">
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center text-center px-4 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider text-gray-200 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/25 transition-all leading-none"
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
                        <a href="#simulador" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#D4AF37]">▶ Simulador de Pedido ao Vivo</a>
                        <a href="#rastreio-360" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#D4AF37]">Rastreio Mesa, Take-Away &amp; GPS</a>
                        <a href="#facturacao-agt" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#D4AF37]">Facturação Electrónica AGT</a>
                        <a href="#precos" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#D4AF37]">Planos &amp; Preços</a>
                        <a href="#quem-somos" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[#D4AF37]">Quem Somos</a>
                        <Link to="/explorar" onClick={() => setMobileMenuOpen(false)} className="py-2 text-amber-300">Explorar Restaurantes</Link>
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
                1. HERO SECTION COMERCIAL DE ALTO IMPACTO (ACIMA DA DOBRA)
               ===================================================================== */}
            <section className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
                    
                    {/* Left Column: Direct, High-Converting Value Proposition */}
                    <div className="lg:col-span-6 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#18130D] border border-[#D4AF37]/45 shadow-[0_0_25px_rgba(212,175,55,0.18)]">
                            <Flame size={15} className="text-[#D4AF37]" />
                            <span className="text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider text-[#F3E5AB]">
                                100% Especializado em Restauração • Certificado FE/305/AGT/2026
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl xl:text-[3.55rem] font-display font-extrabold tracking-tight leading-[1.07] text-white">
                            Mesas Cheias, Cozinha Sincronizada e{' '}
                            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#E5A93C] bg-clip-text text-transparent">
                                Facturação AGT num Único Sistema.
                            </span>
                        </h1>

                        <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-normal max-w-2xl">
                            A plataforma angolana criada para <strong className="text-white font-semibold">Restaurantes, Esplanadas, Pastelarias, Churrasqueiras e Lounges</strong>. Ligue o <strong className="text-[#F3E5AB] font-semibold">Menu QR Code na Mesa</strong> ao <strong className="text-white font-semibold">Ecrã KDS da Cozinha</strong>, dê a cada <strong className="text-white font-semibold">Garçom o seu Terminal por PIN</strong>, ofereça <strong className="text-white font-semibold">Rastreio de Take-Away e Delivery GPS</strong> e emita <strong className="text-emerald-400 font-semibold">Facturas Certificadas pela AGT</strong> — mesmo quando a internet falha.
                        </p>

                        {/* Primary & Secondary Action Buttons — Perfectly Centered */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-8 py-4 rounded-2xl font-display font-extrabold text-sm uppercase tracking-wider hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_12px_35px_rgba(212,175,55,0.4)] text-center"
                            >
                                <span>Criar Restaurante Agora</span>
                                <ArrowRight size={18} strokeWidth={2.5} />
                            </Link>
                            <a
                                href="#simulador"
                                className="inline-flex items-center justify-center gap-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-white px-7 py-4 rounded-2xl font-display font-bold text-sm uppercase tracking-wider border border-white/15 hover:border-[#D4AF37]/50 transition-all text-center"
                            >
                                <Play size={16} className="text-[#D4AF37] fill-[#D4AF37]" />
                                <span>Ver Simulador ao Vivo</span>
                            </a>
                        </div>

                        {/* Social Proof + ROI Trust Bar */}
                        <div className="pt-5 border-t border-white/10 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex -space-x-2">
                                    <img src="/restaurant_dining_african.png" alt="Cliente" className="w-8 h-8 rounded-full object-cover border-2 border-[#D4AF37]" />
                                    <img src="/login_bg_bitoque.png" alt="Cliente" className="w-8 h-8 rounded-full object-cover border-2 border-[#D4AF37]" />
                                    <img src="/qr_table_menu.png" alt="Cliente" className="w-8 h-8 rounded-full object-cover border-2 border-[#D4AF37]" />
                                    <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-black font-display font-extrabold text-[10px] flex items-center justify-center border-2 border-black">
                                        +50
                                    </div>
                                </div>
                                <div className="text-xs text-gray-300">
                                    <span className="text-[#D4AF37] font-bold">★★★★★ 4,9/5</span> • Escolhido por restaurantes de referência em Angola
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3">
                                    <div className="text-xl sm:text-2xl font-display font-extrabold text-[#D4AF37]">+35%</div>
                                    <p className="text-[11px] text-gray-400">Rotação de mesas</p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3">
                                    <div className="text-xl sm:text-2xl font-display font-extrabold text-white">0 Papel</div>
                                    <p className="text-[11px] text-gray-400">Na cozinha (KDS)</p>
                                </div>
                                <div className="bg-white/[0.03] border border-emerald-500/25 rounded-2xl p-3">
                                    <div className="text-base sm:text-xl font-display font-extrabold text-emerald-400">FE/305/AGT</div>
                                    <p className="text-[11px] text-gray-400">Validado pela AGT</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Multi-Layered Visual Command Center Showcase */}
                    <div className="lg:col-span-6 relative">
                        <div className="relative mx-auto max-w-xl lg:max-w-none">
                            
                            {/* Ambient Golden Halo */}
                            <div className="absolute -inset-4 bg-gradient-to-tr from-[#D4AF37]/30 via-amber-500/15 to-emerald-500/15 rounded-[2.8rem] blur-2xl opacity-75 pointer-events-none" />

                            {/* Floating Top-Right Badge: Kitchen Pass Notification */}
                            <div className="hidden sm:flex absolute -top-5 -right-3 z-30 bg-[#14110D]/95 backdrop-blur-xl border-2 border-[#D4AF37] rounded-2xl px-4 py-3 items-center gap-3 shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
                                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
                                    <Bell size={20} className="animate-bounce" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] font-display font-extrabold uppercase tracking-wider text-[#D4AF37]">
                                        Passe da Cozinha • Ao Vivo
                                    </div>
                                    <div className="text-xs font-display font-bold text-white">
                                        Mesa 08 pronta a servir! (Garçom Paulo)
                                    </div>
                                </div>
                            </div>

                            {/* Main Interactive Photo Showcase Card */}
                            <div className="relative rounded-[2.2rem] overflow-hidden border-2 border-[#D4AF37]/50 bg-[#14110E] shadow-[0_25px_70px_rgba(0,0,0,0.9)]">
                                <div className="relative h-[400px] sm:h-[470px] w-full overflow-hidden">
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0907] via-[#0B0907]/35 to-black/25" />

                                    {/* Top-Left Step Indicator */}
                                    <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                                        <span className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#D4AF37]/50 text-[#F3E5AB] font-display font-bold text-xs shadow-lg">
                                            {currentHero.tag}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-400/40 text-emerald-300 font-display font-bold text-[11px] flex items-center gap-1.5 shadow-lg">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                            {currentHero.liveStep}
                                        </span>
                                    </div>

                                    {/* Bottom Interactive Card Overlay */}
                                    <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-20 space-y-3">
                                        <div className="bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xl">
                                            <div className="text-left">
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
                                            <div className="shrink-0 text-right bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3.5 py-2.5 rounded-xl">
                                                <span className="text-[10px] text-emerald-300 font-bold block uppercase">{currentHero.statusBadge}</span>
                                                <span className="text-xs sm:text-sm font-display font-extrabold text-[#F3E5AB] mt-0.5 block">
                                                    {currentHero.priceBadge}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 4-Mode Interactive Selector */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                            {HERO_GALLERY.map((item, idx) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setHeroSlide(idx)}
                                                    className={`py-2.5 px-2.5 rounded-xl font-display font-bold text-[11px] transition-all cursor-pointer truncate border text-center ${
                                                        idx === heroSlide
                                                            ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md'
                                                            : 'bg-black/70 text-gray-300 border-white/15 hover:bg-white/10'
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
                2. SIMULADOR AO VIVO — VEJA UM PEDIDO A FLUIR NOS 4 ECRÃS
               ===================================================================== */}
            <section id="simulador" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="bg-gradient-to-b from-[#17130E] to-[#100D0A] border-2 border-[#D4AF37]/35 rounded-[2.5rem] p-6 sm:p-10 lg:p-12 shadow-[0_25px_80px_rgba(0,0,0,0.85)]">
                    
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                        <div className="text-left space-y-2 max-w-2xl">
                            <span className="px-3.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest inline-block">
                                Demonstração Interactiva em Tempo Real
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                                Veja Como um Pedido Percorre Todo o Restaurante em Segundos
                            </h2>
                            <p className="text-gray-300 text-sm sm:text-base">
                                Clique em qualquer etapa abaixo (ou deixe o simulador avançar) para ver o que aparece no ecrã do <strong className="text-white">Cliente</strong>, da <strong className="text-white">Cozinha KDS</strong>, do <strong className="text-white">Garçom</strong> e do <strong className="text-white">Caixa AGT</strong>.
                            </p>
                        </div>

                        <button
                            onClick={() => setSimPlaying(!simPlaying)}
                            className="self-start lg:self-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 font-display font-bold text-xs uppercase tracking-wider text-[#F3E5AB] cursor-pointer transition-all shrink-0"
                        >
                            {simPlaying ? <Pause size={15} /> : <Play size={15} />}
                            <span>{simPlaying ? 'Pausar Simulação Automática' : 'Retomar Simulação Automática'}</span>
                        </button>
                    </div>

                    {/* 4 Interactive Step Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                        {LIVE_SIMULATOR_STEPS.map((s, idx) => (
                            <button
                                key={s.step}
                                onClick={() => {
                                    setSimStep(idx);
                                    setSimPlaying(false);
                                }}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                    simStep === idx
                                        ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-gray-950 border-[#D4AF37] shadow-[0_10px_30px_rgba(212,175,55,0.3)] scale-[1.01]'
                                        : 'bg-[#0D0B09] text-white border-white/10 hover:border-[#D4AF37]/40'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full mb-1.5">
                                    <span className={`text-[11px] font-display font-extrabold uppercase tracking-wider ${
                                        simStep === idx ? 'text-gray-900' : 'text-[#D4AF37]'
                                    }`}>
                                        Passo 0{s.step}
                                    </span>
                                    {simStep === idx && <span className="w-2 h-2 rounded-full bg-gray-950 animate-ping" />}
                                </div>
                                <div className="font-display font-extrabold text-sm">{s.role}</div>
                            </button>
                        ))}
                    </div>

                    {/* Active Simulator Screen Display */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0B0907] border border-white/10 rounded-3xl p-6 sm:p-8">
                        
                        {/* Left: Photo + Live Device Mockup */}
                        <div className="lg:col-span-5 relative">
                            <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-xl">
                                <img
                                    src={currentSim.image}
                                    alt={currentSim.title}
                                    className="w-full h-full object-cover transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-black font-display font-extrabold text-[11px] uppercase">
                                        {currentSim.badge}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Simulated Terminal Screen & Explanation */}
                        <div className="lg:col-span-7 space-y-5 text-left">
                            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white leading-tight">
                                {currentSim.title}
                            </h3>
                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                {currentSim.description}
                            </p>

                            {/* Simulated Terminal UI Box */}
                            <div className="bg-[#15120E] border border-white/15 rounded-2xl p-5 space-y-3 shadow-inner">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                                    <span className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                                        🖥️ {currentSim.screenTitle}
                                    </span>
                                    <span className={`text-xs font-display font-extrabold px-3 py-1 rounded-full border bg-black/50 ${currentSim.highlightColor}`}>
                                        {currentSim.screenStatus}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {currentSim.screenItems.map((it, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs sm:text-sm bg-black/40 px-3.5 py-2.5 rounded-xl border border-white/5">
                                            <span className="text-gray-200 font-medium">{it.label}</span>
                                            <span className="font-display font-bold text-[#F3E5AB]">{it.val}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 text-xs font-display font-bold text-emerald-400 flex items-center justify-between">
                                    <span>✓ {currentSim.screenFooter}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* =====================================================================
                3. RASTREIO 360º DENTRO E FORA DO RESTAURANTE (MESA, TAKE-AWAY & GPS)
               ===================================================================== */}
            <section id="rastreio-360" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    <span className="text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest block">
                        Rastreio Online nas 3 Modalidades
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight">
                        O Seu Cliente Sabem Sempre Onde Está o Pedido
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                        Quer o cliente esteja sentado na sua esplanada, venha levantar uma encomenda ao balcão ou peça entrega em casa, o telemóvel mostra o estado real sem precisar de perguntar.
                    </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {[
                        { id: 'mesa', label: '🍽️ 1. Na Mesa (Consumo no Salão)' },
                        { id: 'takeaway', label: '🛍️ 2. Take-Away (Senha Digital no Balcão)' },
                        { id: 'delivery', label: '🛵 3. Delivery (Mapa GPS do Estafeta ao Vivo)' }
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setTrackingMode(m.id)}
                            className={`px-6 py-3.5 rounded-2xl font-display font-extrabold text-xs sm:text-sm transition-all cursor-pointer border ${
                                trackingMode === m.id
                                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_10px_30px_rgba(212,175,55,0.3)]'
                                    : 'bg-[#14110E] text-gray-300 border-white/10 hover:border-[#D4AF37]/40'
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* 3-Modality Visual Preview */}
                <div className="bg-[#14110E] border border-[#D4AF37]/30 rounded-[2.5rem] p-6 sm:p-10 lg:p-12 shadow-2xl">
                    {trackingMode === 'mesa' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
                            <div className="lg:col-span-6 space-y-5">
                                <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-display font-bold text-xs uppercase">
                                    🍽️ Rastreio Dentro do Restaurante (Na Mesa)
                                </span>
                                <h3 className="text-2xl sm:text-4xl font-display font-extrabold text-white leading-tight">
                                    Transparência Total entre a Mesa, a Cozinha e o Garçom
                                </h3>
                                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                    Depois de pedir pelo QR Code na mesa, o cliente acompanha no telemóvel as 4 etapas da sua refeição e pode chamar o garçom ou pedir a conta com um único toque.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    {[
                                        { step: '1', label: 'Enviado p/ Cozinha', active: true },
                                        { step: '2', label: 'No Fogo (Chef)', active: true },
                                        { step: '3', label: 'Pronto no Passe!', active: true },
                                        { step: '4', label: 'Servido na Mesa', active: false }
                                    ].map((st, i) => (
                                        <div key={i} className={`p-3.5 rounded-2xl border text-center ${st.active ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white' : 'bg-black/40 border-white/10 text-gray-500'}`}>
                                            <div className="font-display font-extrabold text-sm text-[#D4AF37]">Etapa {st.step}</div>
                                            <div className="text-xs font-bold mt-1">{st.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-6">
                                <div className="relative h-72 sm:h-80 rounded-3xl overflow-hidden border border-[#D4AF37]/40">
                                    <img src="/qr_table_menu.png" alt="Rastreio na Mesa" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-6">
                                        <div className="bg-black/80 backdrop-blur-md border border-[#D4AF37]/50 rounded-2xl p-4 w-full flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-display font-bold text-[#D4AF37]">MESA 08 • SALÃO PRINCIPAL</div>
                                                <div className="text-sm font-display font-extrabold text-white">🔔 O seu prato saiu para o Passe! O garçom já vem servir.</div>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-emerald-500 text-black font-display font-extrabold text-xs">Ao Vivo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {trackingMode === 'takeaway' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
                            <div className="lg:col-span-6 space-y-5">
                                <span className="px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-display font-bold text-xs uppercase">
                                    🛍️ Rastreio Take-Away (Levantamento no Balcão)
                                </span>
                                <h3 className="text-2xl sm:text-4xl font-display font-extrabold text-white leading-tight">
                                    Cartão de Senha Digital (#XXXX) para Recolha Rápida sem Filas
                                </h3>
                                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                    O cliente encomenda antes de chegar ao restaurante, recebe uma <strong className="text-white">Senha Digital de Levantamento</strong> no telemóvel e é avisado com alerta sonoro assim que a embalagem está pronta no balcão.
                                </p>
                                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-200">
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-400" /> Senha digital destacada no ecrã do cliente para apresentar no balcão</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-400" /> Botão "Abrir Direcções GPS até ao Restaurante" integrado</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-400" /> Etiqueta automática "🛍️ EMBALAR P/ TAKE-AWAY" no ecrã da cozinha</li>
                                </ul>
                            </div>
                            <div className="lg:col-span-6">
                                <div className="bg-gradient-to-br from-purple-950/60 via-[#120E1A] to-black border-2 border-purple-400/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl max-w-md mx-auto">
                                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-display font-bold text-xs uppercase">
                                        🛍️ Senha de Levantamento no Balcão
                                    </span>
                                    <div className="text-5xl sm:text-6xl font-display font-black text-white tracking-wider py-2">
                                        #3841
                                    </div>
                                    <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-display font-extrabold text-xs uppercase">
                                        ✅ Pronto a Levantar no Balcão! Apresente esta senha.
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        Restaurante Sabor de Luanda • 2x Bitoque Jindungo + 2x Sumo Natural
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {trackingMode === 'delivery' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
                            <div className="lg:col-span-6 space-y-5">
                                <span className="px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-display font-bold text-xs uppercase">
                                    🛵 Rastreio Delivery (Entrega ao Domicílio c/ GPS)
                                </span>
                                <h3 className="text-2xl sm:text-4xl font-display font-extrabold text-white leading-tight">
                                    Mapa GPS em Tempo Real com a Posição do Estafeta
                                </h3>
                                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                    Quando o estafeta sai do restaurante, o cliente vê a mota a deslocar-se em tempo real no mapa até à sua morada, com botões directos para ligar ou enviar mensagem no WhatsApp.
                                </p>
                                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-200">
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-sky-400" /> 5 etapas claras: Recebido → Na Cozinha → Embalado → Estafeta a Caminho → Entregue</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-sky-400" /> Painel do Motoboy com botão GPS e rota directa para a casa do cliente</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-sky-400" /> Cálculo automático de taxa de entrega por zona ou distância</li>
                                </ul>
                            </div>
                            <div className="lg:col-span-6">
                                <div className="relative h-72 sm:h-80 rounded-3xl overflow-hidden border-2 border-sky-400/40 bg-[#0D131A] p-6 flex flex-col justify-between">
                                    <img src="/login_bg_food.png" alt="Delivery GPS" className="absolute inset-0 w-full h-full object-cover opacity-35" />
                                    <div className="relative z-10 flex items-center justify-between">
                                        <span className="px-3.5 py-1.5 rounded-full bg-sky-500 text-black font-display font-extrabold text-xs">
                                            🛵 Estafeta a Caminho (GPS Activo)
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-black/80 text-white font-mono text-xs border border-white/15">
                                            Chegada: ~8 min
                                        </span>
                                    </div>
                                    <div className="relative z-10 bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-xs font-display font-bold text-sky-400">ESTAFETA: MATEUS JOÃO</div>
                                            <div className="text-sm font-display font-extrabold text-white">A aproximar-se de Talatona / Luanda Sul</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-2 rounded-xl bg-emerald-500 text-black font-display font-extrabold text-xs">WhatsApp</span>
                                            <span className="px-3 py-2 rounded-xl bg-white/10 text-white font-display font-bold text-xs">Ligar</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* =====================================================================
                4. COMPARAÇÃO DE NEGÓCIO: ANTES VS. DEPOIS DA MENÚS JINDUNGO
               ===================================================================== */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    <span className="text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest block">
                        Impacto Directo na Rentabilidade
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                        Porque os Restaurantes Estão a Mudar para a Menús Jindungo?
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Antes */}
                    <div className="bg-[#140F0F] border border-red-500/25 rounded-3xl p-7 sm:p-9 space-y-5 text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/15 text-red-300 font-display font-bold text-xs uppercase">
                            <XCircle size={15} /> Gestão Antiga &amp; Improvisada
                        </div>
                        <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                            Onde os Restaurantes Perdem Clientes e Dinheiro
                        </h3>
                        <ul className="space-y-3.5 text-xs sm:text-sm text-gray-300">
                            <li className="flex items-start gap-3"><X size={17} className="text-red-400 shrink-0 mt-0.5" /> Clientes sentados à espera de cardápios de papel gastos ou desactualizados</li>
                            <li className="flex items-start gap-3"><X size={17} className="text-red-400 shrink-0 mt-0.5" /> Talões de papel perdidos na cozinha e confusão entre pedidos de mesa e Take-Away</li>
                            <li className="flex items-start gap-3"><X size={17} className="text-red-400 shrink-0 mt-0.5" /> Funcionários com acesso ao mesmo ecrã financeiro e relatórios do proprietário</li>
                            <li className="flex items-start gap-3"><X size={17} className="text-red-400 shrink-0 mt-0.5" /> Paragem total das vendas sempre que a ligação à internet falha</li>
                            <li className="flex items-start gap-3"><X size={17} className="text-red-400 shrink-0 mt-0.5" /> Sistemas não certificados pela AGT que expõem o restaurante a multas pesadas</li>
                        </ul>
                    </div>

                    {/* Depois */}
                    <div className="bg-gradient-to-br from-[#1C170F] to-[#111813] border-2 border-[#D4AF37]/60 rounded-3xl p-7 sm:p-9 space-y-5 text-left shadow-[0_15px_50px_rgba(212,175,55,0.15)]">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 text-[#F3E5AB] font-display font-bold text-xs uppercase">
                            <CheckCircle size={15} /> Com a Plataforma Menús Jindungo
                        </div>
                        <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                            Um Restaurante Rápido, Organizado e 100% Legalizado
                        </h3>
                        <ul className="space-y-3.5 text-xs sm:text-sm text-gray-100">
                            <li className="flex items-start gap-3"><Check size={17} className="text-[#D4AF37] shrink-0 mt-0.5" /> <strong>Menu Digital QR na Mesa</strong> com fotos reais que aumentam o ticket médio em +28%</li>
                            <li className="flex items-start gap-3"><Check size={17} className="text-[#D4AF37] shrink-0 mt-0.5" /> <strong>Ecrã KDS na Cozinha</strong> em tempo real com etiquetas de Mesa, Take-Away e Delivery</li>
                            <li className="flex items-start gap-3"><Check size={17} className="text-[#D4AF37] shrink-0 mt-0.5" /> <strong>Terminais Separados por PIN:</strong> Garçom, Cozinha e Caixa vêem apenas a sua função</li>
                            <li className="flex items-start gap-3"><Check size={17} className="text-[#D4AF37] shrink-0 mt-0.5" /> <strong>App Desktop Windows (.EXE)</strong> que continua a vender e facturar 30 dias sem internet</li>
                            <li className="flex items-start gap-3"><Check size={17} className="text-emerald-400 shrink-0 mt-0.5" /> <strong>Certificado Oficial AGT N.º FE/305/AGT/2026</strong> de Facturação Electrónica com assinatura JWS</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* =====================================================================
                5. GALERIA DE FORMATOS GASTRONÓMICOS (FOTOGRAFIA CONVIDATIVA)
               ===================================================================== */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    <span className="text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest block">
                        Feito para a Gastronomia
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                        Perfeito para Todos os Conceitos de Restauração
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            title: 'Restaurantes & Casas de Grelhados',
                            desc: 'Gestão completa de salão, comandas por mesa para a grelha e cozinha, divisão de contas e fecho fiscal AGT.',
                            image: '/login_bg_bitoque.png',
                            badge: '🍽️ Salão & Grelhados'
                        },
                        {
                            title: 'Esplanadas, Roças & Beach Clubs',
                            desc: 'O cliente pede bebidas e petiscos pelo QR Code na mesa sem esperar, aumentando a rotação em +35%.',
                            image: '/restaurant_dining_african.png',
                            badge: '🍹 Esplanadas & Lounges'
                        },
                        {
                            title: 'Pastelarias, Cafés & Brunch',
                            desc: 'Caixa POS Touch ultrarrápido de balcão, impressão térmica de 80mm em 2 segundos e controlo de stock.',
                            image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=900',
                            badge: '☕ Cafés & Pastelarias'
                        },
                        {
                            title: 'Churrasqueiras, Take-Away & Delivery',
                            desc: 'Encomendas online com Senha Digital (#XXXX) no balcão e rastreio com Mapa GPS ao vivo do estafeta.',
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
                                <div className="p-6 text-left">
                                    <h3 className="text-lg font-display font-extrabold text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                                        {card.desc}
                                    </p>
                                </div>
                            </div>
                            <div className="px-6 pb-5 text-left">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-[#D4AF37] hover:underline"
                                >
                                    <span>Criar conta para este formato</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* =====================================================================
                6. FACTURAÇÃO ELECTRÓNICA CERTIFICADA PELA AGT (FE/305/AGT/2026)
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
                                Emita <strong className="text-white">Facturas-Recibo (FR)</strong>, <strong className="text-white">Facturas (FT)</strong>, <strong className="text-white">Facturas Proforma (PP)</strong> e <strong className="text-white">Notas de Crédito (NC)</strong> em total conformidade com a Administração Geral Tributária. Cada documento inclui assinatura criptográfica <strong className="text-emerald-400">JWS RS256</strong> e comunicação oficial de <strong className="text-emerald-400">Facturação Electrónica</strong>.
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

                        {/* Right: Interactive Invoice Preview (80mm vs A4) */}
                        <div className="lg:col-span-5 space-y-3">
                            <div className="flex justify-center gap-2 mb-2">
                                <button
                                    onClick={() => setInvoiceFormat('80mm')}
                                    className={`px-4 py-1.5 rounded-xl font-display font-bold text-xs cursor-pointer transition-all ${
                                        invoiceFormat === '80mm'
                                            ? 'bg-emerald-400 text-black'
                                            : 'bg-white/10 text-gray-300'
                                    }`}
                                >
                                    🧾 Talão Térmico 80mm
                                </button>
                                <button
                                    onClick={() => setInvoiceFormat('a4')}
                                    className={`px-4 py-1.5 rounded-xl font-display font-bold text-xs cursor-pointer transition-all ${
                                        invoiceFormat === 'a4'
                                            ? 'bg-emerald-400 text-black'
                                            : 'bg-white/10 text-gray-300'
                                    }`}
                                >
                                    📄 Factura Comercial A4
                                </button>
                            </div>

                            <div className="bg-white text-gray-900 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-sm mx-auto font-mono text-xs border-4 border-emerald-500/40 relative">
                                <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                                    <div className="font-sans font-black text-base uppercase tracking-tight text-gray-950">RESTAURANTE SABOR DE LUANDA</div>
                                    <div className="text-[11px] text-gray-600">NIF: 5417892031 • Ilha de Luanda</div>
                                    <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-sans font-extrabold text-[10px]">
                                        {invoiceFormat === '80mm' ? 'FACTURA-RECIBO (80MM) • FR 2026/1482' : 'FACTURA COMERCIAL A4 • FT 2026/0891'}
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
                                        <span>Incidência Líquida:</span>
                                        <span>21.052,63 Kz</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>IVA (14%):</span>
                                        <span>2.947,37 Kz</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-sans font-black text-gray-950 pt-1">
                                        <span>TOTAL GERAL:</span>
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
                7. PAINEL EXECUTIVO DO PROPRIETÁRIO (PREVIEW INTERACTIVO)
               ===================================================================== */}
            <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                    <span className="text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest block">
                        Controlo Total no Telemóvel ou Computador
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                        Acompanhe as Vendas e o Lucro do Seu Restaurante em Tempo Real
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                        Enquanto a equipa trabalha nos terminais operacionais, o proprietário acompanha as vendas, os pratos mais rentáveis e o fecho de caixa em qualquer lugar.
                    </p>
                </div>

                <InteractiveDashboardAnalyticsPreview />
            </section>

            {/* =====================================================================
                8. PLANOS & PREÇOS ACTUALIZADOS (15.000 / 25.000 / 40.000 / 25.000 KZ)
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
                        Sem taxas escondidas e sem comissões sobre os seus pratos. Escolha o plano ideal para o seu restaurante.
                    </p>

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
                    <div className="bg-[#14110E] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl text-left">
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

                    {/* 2. PLANO BUSINESS — 25.000 KZ */}
                    <div className="bg-gradient-to-b from-[#221B11] to-[#14110E] border-2 border-[#D4AF37] rounded-3xl p-7 flex flex-col justify-between transition-all shadow-[0_15px_50px_rgba(212,175,55,0.22)] relative text-left">
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
                    <div className="bg-[#14110E] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl text-left">
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
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-[#D4AF37] shrink-0 mt-0.5" /> Facturação Electrónica certificada e apoio prioritário 24/7</li>
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
                    <div className="bg-gradient-to-b from-[#111C16] to-[#14110E] border border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-7 flex flex-col justify-between transition-all shadow-xl text-left">
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
                                <li className="flex items-start gap-2.5"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> Talão Térmico 80mm, PDF A4 e Facturação Electrónica AGT</li>
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
                9. QUEM SOMOS + PERGUNTAS FREQUENTES (FAQ DE NEGÓCIO)
               ===================================================================== */}
            <section id="quem-somos" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Left: Quem Somos Card */}
                    <div className="lg:col-span-5 bg-[#14110E] border border-[#D4AF37]/30 rounded-3xl overflow-hidden shadow-2xl text-left">
                        <div className="relative h-64 overflow-hidden">
                            <img src="/restaurant_dining_african.png" alt="Quem Somos Menús Jindungo" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#14110E] via-black/30 to-transparent" />
                            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#D4AF37] text-black font-display font-extrabold text-[11px] uppercase">
                                🇦🇴 Quem Somos
                            </span>
                        </div>
                        <div className="p-7 space-y-4">
                            <h3 className="text-2xl font-display font-extrabold text-white leading-tight">
                                Nascidos em Luanda, Criados para Elevar a Restauração
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                                A <strong className="text-white">Menús Jindungo</strong> une o calor da hospitalidade angolana com a mais avançada engenharia de software para restauração. Eliminámos módulos genéricos de outros ramos para entregar um sistema 100% dedicado a restaurantes, bares, pastelarias e esplanadas — certificado pela AGT sob o número <strong className="text-emerald-400">FE/305/AGT/2026</strong>.
                            </p>
                            <div className="pt-2">
                                <Link
                                    to="/quem-somos"
                                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-[#D4AF37] text-white hover:text-black px-5 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    <span>Ler Manifesto Institucional</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right: Business FAQ Accordion */}
                    <div className="lg:col-span-7 space-y-4 text-left">
                        <div className="mb-4">
                            <span className="text-[#D4AF37] font-display font-bold text-xs uppercase tracking-widest block">
                                Dúvidas Frequentes dos Proprietários
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white mt-1">
                                Tudo o Que Precisa de Saber Antes de Começar
                            </h3>
                        </div>

                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-[#14110E] border border-white/10 rounded-2xl overflow-hidden transition-all"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                                >
                                    <span className="font-display font-bold text-sm sm:text-base text-white">
                                        {faq.q}
                                    </span>
                                    <ChevronDown
                                        size={18}
                                        className={`text-[#D4AF37] shrink-0 transition-transform duration-300 ${
                                            openFaq === idx ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-5 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* =====================================================================
                10. CTA FINAL DE CONVERSÃO
               ===================================================================== */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
                <div className="bg-gradient-to-r from-[#231B10] via-[#18130C] to-[#231B10] border-2 border-[#D4AF37]/50 rounded-[2.5rem] p-8 sm:p-14 text-center shadow-[0_20px_70px_rgba(212,175,55,0.2)] space-y-6">
                    <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
                        Pronto para Ver o Seu Restaurante Vender Mais e Trabalhar Melhor?
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
                        Crie a conta do seu restaurante agora. A nossa equipa configura o seu Menu QR, os terminais da cozinha e a Facturação Electrónica AGT consigo passo a passo.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-9 py-4 rounded-2xl font-display font-extrabold text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-xl text-center"
                        >
                            <span>Criar Restaurante Agora</span>
                            <ArrowRight size={18} />
                        </Link>
                        <Link
                            to="/explorar"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-8 py-4 rounded-2xl font-display font-bold text-sm uppercase tracking-wider border border-white/15 transition-all text-center"
                        >
                            <span>Explorar Restaurantes Activos</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* =====================================================================
                11. FOOTER PROFISSIONAL
               ===================================================================== */}
            <footer className="bg-[#080705] border-t border-white/10 py-14 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/10 text-left">
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
                            <a href="#simulador" className="block hover:text-[#D4AF37]">Simulador ao Vivo</a>
                            <a href="#rastreio-360" className="block hover:text-[#D4AF37]">Rastreio &amp; Cozinha KDS</a>
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

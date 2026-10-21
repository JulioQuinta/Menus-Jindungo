import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Smartphone, Zap, TrendingUp, Shield, Globe, Utensils, 
    ArrowRight, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Music, Check, Star,
    Clock, Users, Award, CheckCircle, XCircle, Flame,
    Truck, ShoppingBag, ArrowUp, FileText, Sparkles,
    ChevronLeft, ChevronRight, ChefHat, ShieldCheck, Monitor, WifiOff, Heart, Lock
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

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
                            Painel Exclusivo do Proprietário &amp; Gerente
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">EM TEMPO REAL</span>
                        </h4>
                        <p className="text-xs text-gray-400 font-light">Visão financeira consolidada do restaurante (oculta nos terminais de Garçom e Cozinha)</p>
                    </div>
                </div>

                {/* Sub-tabs inside preview */}
                <div className="flex flex-wrap gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10 text-xs">
                    {[
                        { id: 'vendas', label: '📈 Facturação & Fluxo' },
                        { id: 'produtos', label: '🍽️ Pratos Mais Vendidos' },
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
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Facturação do Mês</span>
                    <div className="text-xl sm:text-2xl font-serif font-black text-emerald-400">12.850.000 Kz</div>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">↑ +34.8% vs mês anterior</span>
                </div>

                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Lucro Líquido Estimado</span>
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#D4AF37]">4.280.000 Kz</div>
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mt-1">Margem Média ~33.3%</span>
                </div>

                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Facturas Emitidas (AGT)</span>
                    <div className="text-xl sm:text-2xl font-serif font-black text-white">1.482</div>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-1">Certificadas FE/305/AGT/2026</span>
                </div>

                <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Ticket Médio / Mesa</span>
                    <div className="text-xl sm:text-2xl font-serif font-black text-blue-400">8.670 Kz</div>
                    <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 mt-1">↑ +8.2% com Sugestão do Chef</span>
                </div>
            </div>

            {/* Interactive Tab Content */}
            {activeTab === 'vendas' && (
                <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-300">📊 Facturação Semanal do Restaurante (Segunda a Domingo)</span>
                        <span className="text-[#D4AF37]">Pico de Movimento: Sábado (3.400.000 Kz)</span>
                    </div>

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
                    <span className="text-xs font-bold text-gray-300 block mb-2">🏆 Pratos &amp; Especialidades Mais Pedidos no Restaurante</span>
                    {[
                        { name: 'Mufete Tradicional da Ilha & Feijão de Óleo de Palma', qty: '640 pedidos', total: '4.160.000 Kz', pct: '95%' },
                        { name: 'Bitoque Especial Jindungo na Brasa', qty: '512 pedidos', total: '3.072.000 Kz', pct: '85%' },
                        { name: 'Funge Misto c/ Calulu de Peixe & Carne Seca', qty: '430 pedidos', total: '2.580.000 Kz', pct: '76%' },
                        { name: 'Cocktails Tropicais, Sumos Naturais & Bebidas', qty: '1.280 pedidos', total: '3.038.000 Kz', pct: '88%' }
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
                        <span className="text-xs font-bold text-emerald-400 block">TPA / CARTÃO MULTICAIXA</span>
                        <div className="text-2xl font-bold text-white">37%</div>
                        <span className="text-[10px] text-gray-400">4.754.500 Kz</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center space-y-1">
                        <span className="text-xs font-bold text-amber-400 block">NUMERÁRIO (KWANZAS)</span>
                        <div className="text-2xl font-bold text-white">15%</div>
                        <span className="text-[10px] text-gray-400">1.927.500 Kz</span>
                    </div>
                </div>
            )}

            {/* Live Ticker Stream */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-400 font-mono">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <strong>Fluxo Fiscal ao Vivo:</strong> Factura-Recibo FR 2026/9021 certificada pela AGT (FE/305/AGT/2026) • Luanda
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
            title: '⭐ Hospitalidade & Salão de Refeições Acolhedor',
            subtitle: 'Uma experiência gastronómica calorosa, onde a tradição angolana encontra a mais moderna tecnologia de atendimento à mesa.',
            image: '/restaurant_dining_african.png',
            badge: '🍽️ Salão de Refeições & Esplanadas',
            metric: '🔥 +148 Mesas Atendidas Hoje'
        },
        {
            title: '📱 Menu Digital QR Code na Mesa (Sem Instalar Apps)',
            subtitle: 'O cliente aponta a câmara do telemóvel para o QR Code na mesa, explora os pratos em alta definição e envia o pedido directamente para a cozinha.',
            image: '/qr_table_menu.png',
            badge: '📱 QR Code Interactivo na Mesa',
            metric: '📍 Pedido Directo em Segundos'
        },
        {
            title: '👨‍🍳 Ecrã KDS Dedicado de Cozinha (Kitchen Display)',
            subtitle: 'O Chef recebe as comandas organizadas por ordem de chegada com distinção automática entre Servir na Mesa, Take-Away e Entrega.',
            image: '/kitchenboard_kds_display.png',
            badge: '⚡ Terminal KDS de Cozinha',
            metric: '⏱️ Tempo Médio de Preparo: 12 min'
        },
        {
            title: '🥩 Gastronomia Angolana & Pratos Servidos no Ponto',
            subtitle: 'Quando o Chef clica em "Prato Pronto", o Garçom recebe o alerta no Balcão de Passe e o cliente acompanha tudo no telemóvel.',
            image: '/login_bg_bitoque.png',
            badge: '🍖 Passe da Cozinha & Garçom',
            metric: '✨ Satisfação dos Clientes 99.4%'
        },
        {
            title: '🧾 Facturação Electrónica Certificada AGT (FE/305/AGT/2026)',
            subtitle: 'Emissão instantânea de talões térmicos de 80mm e facturas A4 com assinatura digital JWS, mesmo quando a internet falha.',
            image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1000',
            badge: '🇦🇴 Certificado AGT FE/305/AGT/2026',
            metric: '🧾 100% Conformidade Fiscal'
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    const active = slides[currentSlide];

    return (
        <div className="lg:col-span-5 h-[380px] sm:h-[460px] rounded-3xl overflow-hidden border-2 border-[#D4AF37] relative shadow-[0_0_40px_rgba(212,175,55,0.35)] group">
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

            <div className="absolute top-4 left-4 z-20 bg-black/75 backdrop-blur-md border border-[#D4AF37]/50 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold text-emerald-400 shadow-2xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {active.metric}
            </div>

            <div className="absolute top-4 right-4 z-20 bg-black/75 backdrop-blur-md border border-[#D4AF37]/50 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#D4AF37] shadow-2xl">
                {currentSlide + 1} / {slides.length}
            </div>

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
    const [activeFlowTab, setActiveFlowTab] = useState('garcom');
    const [showScrollTop, setShowScrollTop] = useState(false);

    const getPrice = (basePrice) => {
        if (billingCycle === 'trimestral') return { total: (basePrice * 3 * 0.95).toLocaleString('pt-AO'), monthly: (basePrice * 0.95).toLocaleString('pt-AO'), tag: 'Poupa 5%', mult: '3 meses' };
        if (billingCycle === 'semestral') return { total: (basePrice * 6 * 0.90).toLocaleString('pt-AO'), monthly: (basePrice * 0.90).toLocaleString('pt-AO'), tag: 'Poupa 10%', mult: '6 meses' };
        if (billingCycle === 'anual') return { total: (basePrice * 12 * 0.80).toLocaleString('pt-AO'), monthly: (basePrice * 0.80).toLocaleString('pt-AO'), tag: '2 Meses Grátis', mult: '1 ano' };
        return { total: basePrice.toLocaleString('pt-AO'), monthly: basePrice.toLocaleString('pt-AO'), tag: null, mult: 'mês' };
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // As 4 Grandes Inovações Operacionais do Menús Jindungo (Substitui os antigos sectores)
    const operationalFlows = {
        garcom: {
            badge: '🤵 Terminal Exclusivo de Sala & Mesas',
            title: 'Painel Dedicado do Garçom (Sem Acesso aos Dados do Gerente)',
            subtitle: 'Inspirado nos maiores sistemas mundiais de restauração: quando o garçom selecciona o seu nome e introduz o seu PIN único, vê apenas o seu terminal de trabalho em ecrã inteiro — nunca os gráficos financeiros ou configurações do proprietário.',
            image: '/qr_table_menu.png',
            highlights: [
                'Login de Equipa em 2 Passos: Escolha do Nome do Colaborador + Código PIN Único (impede duplicações)',
                '1. Passe da Cozinha & Mesas: Recebe alertas de pratos prontos a levantar e chamadas de clientes pelo QR Code',
                '2. Anotar Pedido p/ Cozinha: Lança comandas de Mesa ou Take-Away directamente para o ecrã do Chef',
                '3. Fechar Conta & Recibo: Emite o documento de conferência de mesa ou factura de 80mm na hora',
                'Monitorização em Tempo Real: Consulta se o prato da mesa está na fila ou no fogo sem interferir nos botões do Chef'
            ]
        },
        cozinha: {
            badge: '👨‍🍳 Ecrã KDS Puro de Cozinha',
            title: 'Kitchen Display System (KDS) para o Chef e Cozinheiros',
            subtitle: 'Um ecrã limpo, sem preços, sem facturas e sem barra lateral administrativa. A cozinha foca-se a 100% na confecção dos pratos e no cumprimento dos tempos de preparação.',
            image: '/kitchenboard_kds_display.png',
            highlights: [
                'Coluna 1 (Novos Pedidos — A Iniciar): Comandas enviadas pelo QR Code da mesa ou pelo Garçom com alerta sonoro',
                'Coluna 2 (Em Preparação no Fogo): Cronómetro ao vivo do tempo de preparação de cada mesa',
                'Identificação Visual Automática: Etiquetas distintas para 🍽️ Servir na Mesa, 🛍️ Embalar p/ Take-Away e 🛵 Embalar p/ Estafeta',
                'Botão "🔔 Prato Pronto! (Chamar Garçom)": Notifica imediatamente o terminal do garçom e o telemóvel do cliente',
                'Zero papel e zero gritos na cozinha: comunicação silenciosa e rigorosa entre a sala e o fogão'
            ]
        },
        rastreio: {
            badge: '🛰️ Rastreio ao Vivo nas 3 Modalidades',
            title: 'Acompanhamento Online Dentro do Salão, em Take-Away e em Delivery',
            subtitle: 'O cliente acompanha no seu próprio telemóvel cada etapa da sua refeição, com uma linha temporal adaptada automaticamente à modalidade escolhida.',
            image: '/login_bg_bitoque.png',
            highlights: [
                '🍽️ Dentro do Restaurante (Na Mesa): 4 etapas de salão (Recebido → No Fogo → No Passe! → Servido na Mesa)',
                '🛍️ Take-Away (Recolha no Balcão): Gera um Cartão de Senha Digital (#XXXX), avisa quando o saco está pronto no balcão e abre o Mapa GPS até ao restaurante',
                '🛵 Entrega ao Domicílio (Delivery): 5 etapas + Mapa GPS ao Vivo com a localização do estafeta em movimento e botões para Ligar ou enviar WhatsApp',
                'Avaliação Privada (1 a 5 Estrelas): No final da refeição, o cliente envia a sua opinião directamente para a gerência',
                'Fidelização VIP & Cupões: Cartão digital de selos e descontos automáticos para clientes fiéis'
            ]
        },
        offline: {
            badge: '💻 Aplicação Desktop + Modo Offline 30 Dias',
            title: 'Funciona Com ou Sem Internet (Cloud + Executável Windows)',
            subtitle: 'Sabemos que a ligação à internet pode oscilar nos momentos de maior movimento. O Menús Jindungo combina a nuvem com o executável nativo MenusJindungo.exe para que o seu restaurante nunca pare de facturar.',
            image: '/restaurant_dining_african.png',
            highlights: [
                'Instalador Oficial Windows (MenusJindungo.exe) com atalho directo na Área de Trabalho do restaurante',
                'Base de Dados Local Persistente (30 Dias): Continue a abrir turnos, lançar pedidos e emitir facturas mesmo sem internet',
                'Assinatura Criptográfica em Contingência: As facturas emitidas offline mantêm a numeração sequencial e o código fiscal AGT',
                'Sincronização Automática Inteligente: Assim que a internet regressa, todas as vendas e fechos de caixa sobem automaticamente para a nuvem',
                'Acesso simultâneo: O proprietário pode acompanhar tudo pelo telemóvel a partir de qualquer lugar do mundo'
            ]
        }
    };

    return (
        <div className="min-h-screen bg-[#0D0B09] text-white selection:bg-[#D4AF37] selection:text-black overflow-x-hidden font-sans relative">
            
            {/* Warm Hospitality Ambient Glows */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[85vw] h-[45vh] bg-gradient-to-r from-amber-600/15 via-[#D4AF37]/20 to-orange-500/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute top-1/2 right-0 w-[45vw] h-[45vw] bg-[#D4AF37]/10 blur-[170px] rounded-full pointer-events-none z-0"></div>

            {/* Navigation Header */}
            <header className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[96%] xl:w-[94%] max-w-7xl z-50 transition-all duration-500">
                <nav className={`rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center transition-all duration-500 border ${
                    scrolled 
                        ? 'bg-[#161310]/95 backdrop-blur-2xl border-[#D4AF37]/30 shadow-[0_10px_35px_rgba(0,0,0,0.85)]' 
                        : 'bg-[#161310]/85 backdrop-blur-xl border-white/10 shadow-2xl'
                }`}>
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-black/50 rounded-full flex items-center justify-center border border-[#D4AF37]/50 group-hover:border-[#D4AF37] overflow-hidden shadow-2xl transition-all duration-300">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-[1.23]" />
                        </div>
                        <span className="font-serif font-black text-base sm:text-lg tracking-tight flex items-center gap-2 whitespace-nowrap">
                            Menús <span className="text-[#D4AF37]">Jindungo</span>
                            <span className="text-[9px] font-sans font-black bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black px-2.5 py-0.5 rounded-full uppercase tracking-wider hidden xl:inline-block shadow-md whitespace-nowrap">
                                100% Restauração &amp; Facturação AGT
                            </span>
                        </span>
                    </div>

                    {/* Middle Links */}
                    <div className="hidden lg:flex items-center gap-3 xl:gap-6 text-[11px] xl:text-xs font-bold tracking-wider uppercase text-gray-300 whitespace-nowrap">
                        <a href="#ecossistema" className="hover:text-[#D4AF37] transition-colors text-[#D4AF37] whitespace-nowrap">Terminais &amp; Fluxo</a>
                        <a href="#facturacao-agt" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">Facturação AGT</a>
                        <a href="#quem-somos" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">Quem Somos</a>
                        <a href="#precos" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">Planos &amp; Preços</a>
                        <Link to="/explorar" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">Restaurantes</Link>
                        <Link to="/login" className="hover:text-white transition-colors py-1 px-3 rounded-full hover:bg-white/10 whitespace-nowrap">Entrar</Link>
                    </div>

                    {/* CTA Button */}
                    <div className="hidden lg:block shrink-0">
                        <Link 
                            to="/register" 
                            className="whitespace-nowrap inline-flex items-center justify-center bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-amber-300"
                        >
                            Criar Conta do Restaurante
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
                <div className="fixed inset-0 z-[100] bg-[#0D0B09]/95 backdrop-blur-3xl p-8 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
                    <button className="absolute top-8 right-8 text-white p-2 rounded-full border border-white/20 hover:text-[#D4AF37]" onClick={() => setMobileMenuOpen(false)}>
                        <X size={28} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-14 h-14 bg-black/40 rounded-full flex items-center justify-center border border-[#D4AF37]/40 overflow-hidden shadow-2xl">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18]" />
                        </div>
                        <span className="font-serif font-black text-2xl">Menús Jindungo</span>
                    </div>
                    <a href="#ecossistema" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif tracking-wide text-[#D4AF37] font-bold">🍽️ Terminais &amp; Fluxo QR</a>
                    <a href="#facturacao-agt" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif tracking-wide hover:text-[#D4AF37]">🧾 Facturação Electrónica AGT</a>
                    <a href="#quem-somos" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif tracking-wide hover:text-[#D4AF37]">🌶️ Quem Somos</a>
                    <a href="#precos" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif tracking-wide hover:text-[#D4AF37]">💰 Planos &amp; Preços</a>
                    <Link to="/explorar" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif tracking-wide hover:text-[#D4AF37]">📍 Explorar Restaurantes</Link>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif tracking-wide text-gray-400 hover:text-white">Entrar no Painel</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-gradient-to-r from-[#D4AF37] to-amber-600 text-gray-950 px-10 py-4 rounded-full font-black text-base uppercase tracking-wider w-full max-w-xs text-center shadow-[0_10px_30px_rgba(212,175,55,0.4)]">Registar Restaurante</Link>
                </div>
            )}

            {/* =====================================================================
                1. HERO SECTION ACOLHEDORA — 100% FOCADA NA RESTAURAÇÃO EM ANGOLA
               ===================================================================== */}
            <section className="pt-36 sm:pt-44 pb-16 px-6 relative z-10 max-w-7xl mx-auto">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                        <Flame size={15} className="text-[#D4AF37] animate-pulse" />
                        <span>Bem-vindo à Casa Digital da Gastronomia Angolana • Certificado AGT N.º FE/305/AGT/2026</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight leading-[1.1] mb-6 text-white">
                        O Sabor da Nossa Terra com a <br />
                        <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic font-black">
                            Melhor Tecnologia de Restauração
                        </span>.
                    </h1>
                    
                    <p className="max-w-3xl mx-auto text-gray-300 text-base sm:text-lg md:text-xl mb-8 leading-relaxed font-light">
                        Concebido exclusivamente para <strong className="text-white font-semibold">Restaurantes, Esplanadas, Roças Gastronómicas, Bares e Lounges</strong> em Angola. Una o <strong className="text-[#D4AF37] font-semibold">Menu Digital QR na Mesa</strong>, o <strong className="text-white font-semibold">Ecrã KDS de Cozinha</strong>, o <strong className="text-white font-semibold">Terminal do Garçom</strong>, o <strong className="text-white font-semibold">Rastreio de Take-Away e Delivery</strong> e a <strong className="text-emerald-400 font-semibold">Facturação Electrónica Certificada pela AGT</strong> numa única plataforma acolhedora, rápida e que funciona mesmo sem internet.
                    </p>

                    {/* Badges Exclusivos de Restauração */}
                    <div className="flex flex-wrap justify-center items-center gap-2.5 mb-10 text-xs font-bold font-mono max-w-4xl mx-auto">
                        <span className="px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                            🍽️ Menu QR na Mesa
                        </span>
                        <span className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full flex items-center gap-1.5">
                            🤵 Terminal do Garçom (PIN)
                        </span>
                        <span className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-full flex items-center gap-1.5">
                            👨‍🍳 Ecrã KDS de Cozinha
                        </span>
                        <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full flex items-center gap-1.5">
                            🛍️ Take-Away c/ Senha Online
                        </span>
                        <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full flex items-center gap-1.5">
                            🛵 Delivery c/ Mapa GPS
                        </span>
                        <span className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-full flex items-center gap-1.5">
                            🧾 Certificado AGT: FE/305/AGT/2026
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
                        <Link 
                            to="/register" 
                            className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_35px_rgba(212,175,55,0.4)] border border-amber-300 flex items-center justify-center gap-2 group"
                        >
                            Registar o Meu Restaurante <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a 
                            href="#precos" 
                            className="w-full sm:w-auto bg-white/5 backdrop-blur-md text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest border border-white/15 hover:bg-white/10 hover:border-[#D4AF37]/50 transition-all text-center"
                        >
                            Ver Preços (Desde 15.000 Kz)
                        </a>
                    </div>
                </div>

                {/* Showcase Principal de Hospitalidade & Restauração */}
                <div id="restauracao" className="text-left bg-gradient-to-br from-[#211911] via-[#15120E] to-[#0D0B09] border-2 border-[#D4AF37]/70 rounded-[3rem] p-8 sm:p-14 shadow-[0_0_60px_rgba(212,175,55,0.18)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 blur-[120px] rounded-full pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-black uppercase tracking-widest">
                                <Utensils size={14} /> Hospitalidade &amp; Gastronomia sem Fricção
                            </div>
                            
                            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight">
                                Como Funciona o Novo <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic">Menús Jindungo</span> no Seu Restaurante
                            </h2>

                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                                Quando um cliente se senta à mesa ou encomenda de casa, tudo acontece num fluxo harmonioso. O pedido entra directamente no <strong className="text-white">Ecrã KDS da Cozinha</strong>, o <strong className="text-white">Garçom</strong> é avisado no seu terminal próprio assim que o prato fica pronto no Passe, o cliente acompanha o estado ao vivo no telemóvel e o <strong className="text-white">Caixa POS</strong> emite a factura certificada pela AGT num segundo.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="bg-black/45 border border-white/10 p-4 rounded-2xl flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">Vistas Separadas por Função</h4>
                                        <p className="text-[11px] text-gray-400 font-light mt-1">
                                            O Garçom, o Cozinheiro e o Caixa têm terminais exclusivos e não acedem aos relatórios confidenciais do Gerente.
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-black/45 border border-white/10 p-4 rounded-2xl flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">Facturação AGT Online &amp; Offline</h4>
                                        <p className="text-[11px] text-gray-400 font-light mt-1">
                                            Software certificado (<strong className="text-emerald-400">FE/305/AGT/2026</strong>) com aplicação Desktop que factura mesmo sem internet.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-wrap items-center gap-4">
                                <Link 
                                    to="/register?plan=business&cycle=mensal" 
                                    className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 font-black px-8 py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2"
                                >
                                    Começar Agora (Plano Business — 25.000 Kz) <ArrowRight size={16} />
                                </Link>
                                <Link 
                                    to="/explorar" 
                                    className="text-[#D4AF37] hover:underline text-xs font-bold uppercase tracking-wider"
                                >
                                    Ver Restaurantes Activos →
                                </Link>
                            </div>
                        </div>

                        <RestaurantShowcaseCarousel />
                    </div>
                </div>
            </section>

            {/* =====================================================================
                2. OS 4 PILARES OPERACIONAIS (GARÇOM, COZINHA KDS, RASTREIO 360º E OFFLINE)
               ===================================================================== */}
            <section id="ecossistema" className="py-20 px-6 relative z-10 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block mb-2">
                        Arquitectura dos Grandes Sistemas Mundiais de Restauração
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-serif font-black text-white tracking-tight leading-tight">
                        Cada Membro da Equipa no Seu <span className="bg-gradient-to-r from-[#D4AF37] to-amber-500 bg-clip-text text-transparent italic">Terminal Próprio</span>
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base mt-3 font-light">
                        Clique abaixo em cada área operacional para conhecer as novas funcionalidades do <strong className="text-white">Menús Jindungo</strong>:
                    </p>
                </div>

                {/* Selector dos 4 Módulos Operacionais */}
                <div className="flex flex-wrap items-center justify-center gap-3 p-4 rounded-3xl bg-[#161310]/90 border border-[#D4AF37]/30 backdrop-blur-xl shadow-2xl max-w-5xl mx-auto mb-10">
                    {[
                        { id: 'garcom', label: '🤵 1. Terminal do Garçom & Sala' },
                        { id: 'cozinha', label: '👨‍🍳 2. Ecrã KDS da Cozinha' },
                        { id: 'rastreio', label: '🛰️ 3. Rastreio Mesa, Take-Away & Delivery' },
                        { id: 'offline', label: '💻 4. App Desktop & Modo Offline' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFlowTab(tab.id)}
                            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                activeFlowTab === tab.id
                                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.5)] scale-105'
                                    : 'bg-black/50 text-gray-300 border-white/10 hover:text-white hover:border-[#D4AF37]/40'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Cartão Detalhado do Fluxo Seleccionado */}
                {(() => {
                    const flow = operationalFlows[activeFlowTab];
                    return (
                        <div className="bg-[#15120F]/95 backdrop-blur-2xl border border-[#D4AF37]/30 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-7 space-y-6">
                                <span className="px-4 py-1.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-black uppercase tracking-widest inline-block">
                                    {flow.badge}
                                </span>
                                <h3 className="text-2xl sm:text-4xl font-serif font-black text-white leading-tight">
                                    {flow.title}
                                </h3>
                                <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                                    {flow.subtitle}
                                </p>

                                <ul className="space-y-3.5 pt-2">
                                    {flow.highlights.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-200 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="lg:col-span-5">
                                <div className="h-[340px] sm:h-[400px] rounded-3xl overflow-hidden border-2 border-[#D4AF37]/40 relative shadow-2xl">
                                    <img
                                        src={flow.image}
                                        alt={flow.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                                        <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                                            {flow.badge}
                                        </span>
                                        <h4 className="text-lg font-serif font-black text-white mt-1">
                                            {flow.title}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </section>

            {/* =====================================================================
                3. SECÇÃO DE FACTURAÇÃO ELECTRÓNICA CERTIFICADA AGT (FE/305/AGT/2026)
               ===================================================================== */}
            <section id="facturacao-agt" className="py-20 px-6 relative z-10 max-w-7xl mx-auto">
                <div className="bg-gradient-to-br from-[#0E1F1A] via-[#111514] to-[#0D0B09] border-2 border-emerald-500/40 rounded-[3rem] p-8 sm:p-14 shadow-[0_0_60px_rgba(16,185,129,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={16} /> Facturação Electrónica Homologada em Angola
                                </span>
                                <span className="px-3.5 py-1.5 rounded-full bg-black/60 border border-[#D4AF37]/50 text-[#D4AF37] font-mono text-xs font-black">
                                    Certificado AGT N.º FE/305/AGT/2026
                                </span>
                            </div>

                            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight">
                                Facturação Electrónica <span className="text-emerald-400 italic">Certificada pela AGT</span> para o Seu Restaurante
                            </h2>

                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                                O módulo fiscal do <strong className="text-white">Menús Jindungo (Versão v3.1)</strong> cumpre rigorosamente os requisitos técnicos da <strong className="text-white">Administração Geral Tributária (AGT)</strong> de Angola, sob o número de certificação <strong className="text-[#D4AF37] font-mono">FE/305/AGT/2026</strong>. Emita documentos fiscais com assinatura criptográfica <strong className="text-white">JWS (RS256)</strong> em segundos no balcão ou na mesa.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">
                                        🧾 Talão Térmico 80mm &amp; Factura A4
                                    </h4>
                                    <p className="text-xs text-gray-300 font-light">
                                        Emissão de Factura Simplificada (FS), Factura-Recibo (FR) com NIF do cliente e Documento de Conferência de Mesa.
                                    </p>
                                </div>
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                    <h4 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider mb-1">
                                        🔐 Assinatura JWS &amp; Contingência Offline
                                    </h4>
                                    <p className="text-xs text-gray-300 font-light">
                                        Encadeamento criptográfico de facturas e emissão contínua mesmo durante falhas de internet, com sincronização automática.
                                    </p>
                                </div>
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-1">
                                        💵 Gestão de Turnos de Caixa
                                    </h4>
                                    <p className="text-xs text-gray-300 font-light">
                                        Abertura e fecho de caixa por operador (PIN), registo de sangrias, reforços e conferência cega de numerário e TPA.
                                    </p>
                                </div>
                                <div className="bg-black/40 border border-white/10 p-4 rounded-2xl">
                                    <h4 className="text-xs font-black text-blue-300 uppercase tracking-wider mb-1">
                                        📦 Controlo de Stock &amp; Bebidas
                                    </h4>
                                    <p className="text-xs text-gray-300 font-light">
                                        Baixa automática de stock a cada venda realizada no POS ou no Menu QR, com alertas de reposição.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Selo Oficial de Certificação AGT */}
                        <div className="lg:col-span-5">
                            <div className="bg-[#0B0F0E] border-2 border-[#D4AF37] rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(212,175,55,0.2)] space-y-5 relative overflow-hidden">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center mx-auto shadow-xl">
                                    <FileText size={38} strokeWidth={2.2} />
                                </div>

                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 block">
                                        CONFORMIDADE FISCAL REPÚBLICA DE ANGOLA
                                    </span>
                                    <h3 className="text-2xl font-serif font-black text-white mt-1">
                                        Certificação Oficial AGT
                                    </h3>
                                </div>

                                <div className="bg-black/70 border border-[#D4AF37]/40 rounded-2xl p-4 space-y-2 text-left font-mono text-xs">
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-400">N.º de Certificação:</span>
                                        <strong className="text-[#D4AF37]">FE/305/AGT/2026</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-400">Versão do Software:</span>
                                        <strong className="text-white">Menús Jindungo v3.1</strong>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="text-gray-400">Algoritmo Fiscal:</span>
                                        <strong className="text-emerald-400">JWS RS256 + QR Code</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Regime de IVA / Imposto:</span>
                                        <strong className="text-white">Geral (14%) &amp; Isento</strong>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <span className="text-xs text-gray-400 block mb-1">Módulo de Facturação Electrónica Mensal</span>
                                    <div className="text-3xl font-serif font-black text-emerald-400">
                                        25.000 Kz <span className="text-xs text-gray-400 font-sans font-normal">/ mês</span>
                                    </div>
                                </div>

                                <Link
                                    to="/register?module=invoicing_general&cycle=mensal"
                                    className="block w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
                                >
                                    Activar Facturação Electrónica (25.000 Kz)
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================================
                4. DASHBOARD EXECUTIVO PARA O PROPRIETÁRIO / GERENTE
               ===================================================================== */}
            <section id="dashboard" className="py-16 px-6 relative z-10 max-w-6xl mx-auto space-y-8">
                <div className="text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-3">
                        <TrendingUp size={16} /> Gestão Financeira para o Proprietário
                    </div>

                    <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight mb-4">
                        Controlo Total do Seu Restaurante em <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic">Tempo Real</span>
                    </h2>

                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                        Enquanto a sua equipa trabalha nos terminais dedicados de sala, cozinha e caixa, o proprietário dispõe de um painel executivo privado para acompanhar a facturação, os pratos mais rentáveis, o stock e o desempenho de cada turno.
                    </p>
                </div>

                <InteractiveDashboardAnalyticsPreview />
            </section>

            {/* =====================================================================
                5. QUEM SOMOS — HISTÓRIA, IDENTIDADE ANGOLANA & HOSPITALIDADE
               ===================================================================== */}
            <section id="quem-somos" className="py-20 px-6 relative z-10 max-w-7xl mx-auto">
                <div className="bg-gradient-to-br from-[#1C1610] via-[#13100D] to-[#0D0B09] border border-[#D4AF37]/40 rounded-[3rem] p-8 sm:p-14 shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-5 text-center flex flex-col items-center p-6 bg-black/40 rounded-3xl border border-[#D4AF37]/30">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#2A2415] via-[#121214] to-[#1A160C] border-4 border-[#D4AF37] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.5)] mb-6 overflow-hidden">
                                <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Menús Jindungo" className="w-full h-full object-contain scale-[1.18]" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-1">
                                ORGULHOSAMENTE CONCEBIDO EM ANGOLA 🇦🇴
                            </span>
                            <h3 className="text-2xl font-serif font-black text-white mb-3">
                                Quem Somos — A Essência Jindungo
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed mb-6">
                                O <strong>jindungo</strong> é o símbolo do tempero, do calor humano e da identidade gastronómica da nossa terra. Nascemos em Luanda com a missão de oferecer aos restaurantes angolanos uma tecnologia de nível mundial, acessível, acolhedora e adaptada à nossa realidade.
                            </p>
                            <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-xs">
                                <div>
                                    <strong className="text-[#D4AF37] text-lg font-serif block">100%</strong>
                                    <span className="text-gray-400 text-[11px]">Restauração</span>
                                </div>
                                <div>
                                    <strong className="text-[#D4AF37] text-lg font-serif block">Cloud + PC</strong>
                                    <span className="text-gray-400 text-[11px]">Online &amp; Offline</span>
                                </div>
                                <div>
                                    <strong className="text-[#D4AF37] text-lg font-serif block">AGT</strong>
                                    <span className="text-gray-400 text-[11px]">FE/305/AGT/2026</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7 space-y-6">
                            <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block">
                                Sobre a Nossa Plataforma &amp; Equipa
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-serif font-black text-white leading-tight">
                                Tecnologia Feita por Quem Conhece o Dia-a-Dia de um Restaurante em Angola
                            </h2>
                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                                Desenvolvido pela <strong className="text-white">Sumba Aqui Comércio e Serviços (SU), Lda.</strong>, o <strong className="text-[#D4AF37]">Menús Jindungo</strong> nasceu para resolver os desafios reais dos proprietários de restaurantes, bares, cafés e esplanadas: a demora no atendimento às mesas, os erros nas comandas em papel enviadas para a cozinha, a falta de rastreio nas encomendas de Take-Away e Delivery, e a paragem da facturação sempre que a internet oscila.
                            </p>
                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                                Hoje, entregamos um ecossistema onde o cliente é bem recebido desde o primeiro segundo em que aponta o telemóvel para o QR Code na mesa, o garçom trabalha com rapidez, o Chef organiza a cozinha num ecrã moderno e o proprietário factura com total segurança fiscal perante a AGT.
                            </p>

                            <div className="pt-2 flex flex-wrap gap-4">
                                <Link
                                    to="/quem-somos"
                                    className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider text-white transition-all"
                                >
                                    Conhecer a Nossa História Completa →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================================
                6. TABELA DE PREÇOS ACTUALIZADA (START 15.000 | BUSINESS 25.000 | CORPORATE 40.000 | FACTURAÇÃO 25.000)
               ===================================================================== */}
            <section id="precos" className="py-24 px-6 relative z-10 text-center max-w-7xl mx-auto">
                <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest block mb-3">
                    Tabela de Preços Oficial e Actualizada • Angola
                </span>
                <h2 className="text-3xl sm:text-5xl font-serif font-black text-white mb-4 tracking-tight leading-tight">
                    Planos Claros e Acessíveis em <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic">Kwanzas (Kz)</span>
                </h2>
                <p className="text-gray-300 text-sm sm:text-base max-w-3xl mx-auto font-light leading-relaxed mb-12">
                    Escolha o plano ideal para a dimensão do seu restaurante ou subscreva o módulo dedicado de <strong className="text-emerald-400">Facturação Electrónica AGT (FE/305/AGT/2026)</strong>.
                </p>

                {/* Selector de Ciclo de Facturação */}
                <div className="flex justify-center mb-14">
                    <div className="bg-[#181512]/90 backdrop-blur-xl p-1.5 rounded-full border border-white/10 flex items-center gap-1 sm:gap-2 shadow-2xl overflow-x-auto max-w-full">
                        <button
                            onClick={() => setBillingCycle('mensal')}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                billingCycle === 'mensal' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setBillingCycle('trimestral')}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                                billingCycle === 'trimestral' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Trimestral <span className="ml-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">-5%</span>
                        </button>
                        <button
                            onClick={() => setBillingCycle('semestral')}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                                billingCycle === 'semestral' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Semestral <span className="ml-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">-10%</span>
                        </button>
                        <button
                            onClick={() => setBillingCycle('anual')}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                                billingCycle === 'anual' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] font-black' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Anual <span className="ml-1 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[9px] font-black px-2 py-0.5 rounded-full">2 Meses Grátis</span>
                        </button>
                    </div>
                </div>

                {/* Grelha dos 3 Planos de Restauração: Start (15.000 Kz), Business (25.000 Kz), Corporate (40.000 Kz) */}
                <div id="precos-restauracao" className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16 text-left">
                    
                    {/* 1. PLANO START — 15.000 Kz */}
                    <div className="bg-[#15120F]/90 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37]/50 rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] shadow-xl">
                        <div>
                            <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider mb-5 inline-block">
                                Entrada Digital
                            </span>
                            <h3 className="text-2xl font-serif font-black text-white mb-2">Plano Start</h3>
                            <p className="text-xs text-gray-400 font-light mb-6">
                                Ideal para pequenos cafés, esplanadas e restaurantes que pretendem modernizar o seu cardápio com Menu Digital QR Code e encomendas via WhatsApp.
                            </p>
                            
                            {(() => {
                                const { total, monthly, tag, mult } = getPrice(15000);
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
                                    <span>Menu Digital QR Code Interactivo com fotos</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                    <span>Encomendas direccionadas para o WhatsApp</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                    <span>Até 50 pratos/bebidas e botão de esgotar prato</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                    <span>Personalização com logótipo e horário</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-500">
                                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0"><XCircle size={12} /></div>
                                    <span>Sem KDS de Cozinha e sem Facturação AGT</span>
                                </li>
                            </ul>
                        </div>

                        <Link 
                            to={`/register?plan=start&cycle=${billingCycle}`} 
                            className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 rounded-full uppercase tracking-wider text-xs border border-white/15 transition-all block text-center"
                        >
                            Seleccionar Start (15.000 Kz)
                        </Link>
                    </div>

                    {/* 2. PLANO BUSINESS — 25.000 Kz (Mais Popular) */}
                    <div className="bg-gradient-to-b from-[#211A12] to-[#13100C] backdrop-blur-3xl border-2 border-[#D4AF37] rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 hover:scale-[1.03] shadow-[0_0_50px_rgba(212,175,55,0.3)] relative overflow-hidden md:-translate-y-4">
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black text-[10px] font-black uppercase px-6 py-1.5 rounded-bl-2xl shadow-lg flex items-center gap-1 tracking-widest">
                            <Star size={12} fill="black" /> Mais Escolhido
                        </div>

                        <div>
                            <span className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-5 inline-block">
                                Menu QR + Cozinha KDS + Facturação AGT
                            </span>
                            <h3 className="text-2xl font-serif font-black text-white mb-2">Plano Business</h3>
                            <p className="text-xs text-gray-300 font-light mb-6">
                                O pacote completo para restaurantes em pleno funcionamento: liga as mesas, os garçons, a cozinha e o caixa POS com Facturação Electrónica AGT.
                            </p>
                            
                            {(() => {
                                const { total, monthly, tag, mult } = getPrice(25000);
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
                                    <span><strong>Menu QR na Mesa + Facturação AGT (FE/305/AGT/2026)</strong></span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                    <span>Terminal Dedicado do Garçom (Passe &amp; Comandas)</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                    <span>Ecrã KDS de Cozinha + Rastreio de Mesa e Take-Away</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                    <span>Até 250 pratos/bebidas e até 5 contas de Staff (PIN)</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shrink-0"><Check size={12} strokeWidth={4} /></div>
                                    <span>Talão térmico 80mm, Factura A4 e Controlo de Stock</span>
                                </li>
                            </ul>
                        </div>

                        <Link 
                            to={`/register?plan=business&cycle=${billingCycle}`} 
                            className="w-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-gray-950 font-black py-3.5 rounded-full uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-95 transition-all block text-center"
                        >
                            Seleccionar Business (25.000 Kz)
                        </Link>
                    </div>

                    {/* 3. PLANO CORPORATE — 40.000 Kz */}
                    <div className="bg-[#15120F]/90 backdrop-blur-xl border border-white/10 hover:border-[#D4AF37]/50 rounded-[2.5rem] p-8 flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] shadow-xl">
                        <div>
                            <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider mb-5 inline-block">
                                Potência Máxima 360º
                            </span>
                            <h3 className="text-2xl font-serif font-black text-white mb-2">Plano Corporate</h3>
                            <p className="text-xs text-gray-400 font-light mb-6">
                                Para restaurantes de grande movimento, roças gastronómicas e operações com entrega ao domicílio (GPS ao vivo), fidelização VIP e App Desktop Offline.
                            </p>
                            
                            {(() => {
                                const { total, monthly, tag, mult } = getPrice(40000);
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
                                    <span><strong>Tudo do Plano Business com Pratos e Staff Ilimitados</strong></span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                    <span>Rastreio de Delivery com Mapa GPS ao Vivo do Estafeta</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                    <span>Instalador Desktop Windows Offline (MenusJindungo.exe)</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                    <span>CRM de Clientes, Cartão de Fidelização VIP &amp; Cupões</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>
                                    <span>Assistente IA de Gestão &amp; Apoio Técnico Dedicado</span>
                                </li>
                            </ul>
                        </div>

                        <Link 
                            to={`/register?plan=corporate&cycle=${billingCycle}`} 
                            className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 rounded-full uppercase tracking-wider text-xs border border-white/15 transition-all block text-center"
                        >
                            Seleccionar Corporate (40.000 Kz)
                        </Link>
                    </div>
                </div>

                {/* CARTÃO ESPECIAL: FACTURAÇÃO ELECTRÓNICA MENSAL — 25.000 Kz */}
                <div className="mb-20 text-left bg-gradient-to-br from-[#0B1A20] via-[#121414] to-black border-2 border-emerald-500/40 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] pointer-events-none" />

                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-4 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black uppercase tracking-widest">
                                    Módulo de Facturação Electrónica AGT
                                </span>
                                <span className="text-xs text-[#D4AF37] font-mono font-bold">
                                    Certificado N.º FE/305/AGT/2026
                                </span>
                            </div>

                            <h3 className="text-3xl sm:text-4xl font-serif font-black text-white">
                                Facturação Electrónica POS <span className="text-emerald-400 font-sans font-bold text-xl block sm:inline sm:ml-2">(Balcão &amp; Caixa de Restauração)</span>
                            </h3>

                            <p className="text-gray-300 text-sm leading-relaxed font-light">
                                Para restaurantes, churrasqueiras, pastelarias e espaços gastronómicos que pretendem subscrever directamente a <strong className="text-white">Facturação Electrónica Certificada pela AGT (FE/305/AGT/2026)</strong>. Inclui Ponto de Venda POS rápido, emissão de talões térmicos de 80mm e facturas A4, abertura e fecho de turno por PIN de operador, controlo de stock e funcionamento online e offline.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-gray-200 font-medium">
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                                    <span>Certificação Oficial AGT: FE/305/AGT/2026</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                                    <span>Terminal POS de Caixa &amp; Impressão Térmica 80mm / A4</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                                    <span>Controlo de Stock de Pratos, Carnes e Bebidas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-emerald-400 shrink-0" strokeWidth={3} />
                                    <span>Acesso individual por Nome e PIN Único de Operador</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-auto bg-black/60 border border-white/10 p-8 rounded-3xl text-center shrink-0 space-y-4">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Subscrição Facturação Electrónica</span>
                            {(() => {
                                const { total, monthly, tag, mult } = getPrice(25000);
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
                                Activar Facturação Electrónica (25.000 Kz)
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Contactos e Redes Sociais */}
                <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-left">
                    <div className="flex flex-wrap items-center gap-8 text-xs font-light text-gray-400">
                        <a href="https://wa.me/244931045991" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#D4AF37] transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37] transition-colors text-white group-hover:text-[#D4AF37]">
                                <Phone size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Atendimento &amp; Demonstração (WhatsApp)</span>
                                <span className="font-bold text-white group-hover:text-[#D4AF37]">+244 931 045 991</span>
                            </div>
                        </a>

                        <a href="mailto:comercial@menusjindungo.ao" className="flex items-center gap-3 hover:text-[#D4AF37] transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37] transition-colors text-white group-hover:text-[#D4AF37]">
                                <Mail size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Correio Electrónico</span>
                                <span className="font-bold text-white group-hover:text-[#D4AF37]">comercial@menusjindungo.ao</span>
                            </div>
                        </a>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Sede</span>
                                <span className="font-bold text-white">Luanda — República de Angola</span>
                            </div>
                        </div>
                    </div>

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
            </section>

            {/* Rodapé Institucional */}
            <footer className="py-8 px-6 border-t border-white/5 text-center text-xs text-gray-500 relative z-10 font-light tracking-wider space-y-1">
                <p>© 2026 MENÚS JINDUNGO • SUMBA AQUI COMÉRCIO E SERVIÇOS (SU), LDA. TODOS OS DIREITOS RESERVADOS.</p>
                <p className="text-[10px] text-[#D4AF37]/80 font-mono">
                    SOFTWARE DE FACTURAÇÃO ELECTRÓNICA CERTIFICADO PELA AGT N.º FE/305/AGT/2026 • LUANDA, ANGOLA
                </p>
            </footer>

            {/* Botão Voltar ao Topo */}
            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-[#D4AF37] text-black hover:bg-[#E5C27B] hover:scale-110 active:scale-95 transition-all shadow-[0_4px_20px_rgba(212,175,55,0.4)] flex items-center justify-center animate-in fade-in slide-in-from-bottom-5 duration-300 cursor-pointer"
                    title="Voltar ao Topo"
                >
                    <ArrowUp size={20} strokeWidth={3} />
                </button>
            )}
        </div>
    );
};

export default LandingPage;

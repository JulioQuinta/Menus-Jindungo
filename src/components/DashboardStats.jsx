import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { orderService } from '../services/orderService';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, Download, Printer, Utensils, ClipboardList, QrCode, Mail, ChevronRight, X, Sparkles, Package, Truck, BarChart2, Users, Settings, Calendar } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

// Paleta Ouro Incandescente Vibrante
const COLORS = ['#F5C542', '#EAC775', '#3B82F6', '#8E8E93', '#10B981', '#EC4899'];

const MOCK_PERIOD_DATA = {
    hoje: {
        title: "Evolução Diária (Hoje)",
        revenue: 12450,
        orders: 48,
        avgTicket: 259,
        growth: "+5%",
        chart: [
            { date: '04:00', valor: 200, passado: 300, proj: 250 },
            { date: '09:00', valor: 450, passado: 380, proj: 500 },
            { date: '14:00', valor: 1600, passado: 800, proj: 1650, peak: true },
            { date: '19:00', valor: 1200, passado: 1400, proj: 1300 },
            { date: '23:00', valor: 900, passado: 850, proj: 1000 },
        ]
    },
    ontem: {
        title: "Evolução Diária (Ontem)",
        revenue: 11200,
        orders: 42,
        avgTicket: 266,
        growth: "+2.4%",
        chart: [
            { date: '04:00', valor: 80, passado: 120, proj: 100 },
            { date: '09:00', valor: 390, passado: 350, proj: 420 },
            { date: '14:00', valor: 1450, passado: 750, proj: 1500, peak: true },
            { date: '19:00', valor: 1100, passado: 1250, proj: 1180 },
            { date: '23:00', valor: 850, passado: 800, proj: 900 },
        ]
    },
    semana: {
        title: "Evolução Semanal (Esta Semana)",
        revenue: 84500,
        orders: 310,
        avgTicket: 272,
        growth: "+14.2%",
        chart: [
            { date: 'Seg', valor: 11000, passado: 9500, proj: 12000 },
            { date: 'Ter', valor: 12500, passado: 10200, proj: 13000 },
            { date: 'Qua', valor: 14000, passado: 11000, proj: 14500 },
            { date: 'Qui', valor: 16500, passado: 13000, proj: 17000 },
            { date: 'Sex', valor: 22000, passado: 18000, proj: 23500, peak: true },
            { date: 'Sáb', valor: 28000, passado: 24000, proj: 30000 },
            { date: 'Dom', valor: 21000, passado: 19000, proj: 22500 },
        ]
    },
    semanaPassada: {
        title: "Evolução Semanal (Semana Passada)",
        revenue: 73900,
        orders: 285,
        avgTicket: 259,
        growth: "+8.1%",
        chart: [
            { date: 'Seg', valor: 9500, passado: 8800, proj: 10000 },
            { date: 'Ter', valor: 10200, passado: 9600, proj: 11000 },
            { date: 'Qua', valor: 11000, passado: 10500, proj: 12000 },
            { date: 'Qui', valor: 13000, passado: 12000, proj: 14000 },
            { date: 'Sex', valor: 18000, passado: 16500, proj: 19000 },
            { date: 'Sáb', valor: 24000, passado: 22000, proj: 26000, peak: true },
            { date: 'Dom', valor: 19000, passado: 18000, proj: 20500 },
        ]
    },
    mes: {
        title: "Evolução Mensal (Este Mês)",
        revenue: 345000,
        orders: 1280,
        avgTicket: 269,
        growth: "+18.5%",
        chart: [
            { date: 'Sem 1', valor: 75000, passado: 65000, proj: 80000 },
            { date: 'Sem 2', valor: 88000, passado: 72000, proj: 92000 },
            { date: 'Sem 3', valor: 95000, passado: 81000, proj: 100000 },
            { date: 'Sem 4', valor: 112000, passado: 94000, proj: 120000, peak: true },
        ]
    },
    mesPassado: {
        title: "Evolução Mensal (Mês Passado)",
        revenue: 291000,
        orders: 1120,
        avgTicket: 259,
        growth: "+12.0%",
        chart: [
            { date: 'Sem 1', valor: 65000, passado: 58000, proj: 70000 },
            { date: 'Sem 2', valor: 72000, passado: 66000, proj: 78000 },
            { date: 'Sem 3', valor: 81000, passado: 74000, proj: 86000 },
            { date: 'Sem 4', valor: 94000, passado: 85000, proj: 100000, peak: true },
        ]
    },
    trimestre: {
        title: "Evolução Trimestral (Últimos 3 Meses)",
        revenue: 985000,
        orders: 3750,
        avgTicket: 262,
        growth: "+22.4%",
        chart: [
            { date: 'Mês 1', valor: 290000, passado: 250000, proj: 310000 },
            { date: 'Mês 2', valor: 340000, passado: 280000, proj: 360000 },
            { date: 'Mês 3', valor: 355000, passado: 310000, proj: 380000, peak: true },
        ]
    },
    semestre: {
        title: "Evolução Semestral (Últimos 6 Meses)",
        revenue: 1890000,
        orders: 7200,
        avgTicket: 262,
        growth: "+26.8%",
        chart: [
            { date: 'Jan', valor: 280000, passado: 240000, proj: 300000 },
            { date: 'Fev', valor: 295000, passado: 255000, proj: 315000 },
            { date: 'Mar', valor: 310000, passado: 270000, proj: 330000 },
            { date: 'Abr', valor: 335000, passado: 290000, proj: 355000 },
            { date: 'Mai', valor: 345000, passado: 300000, proj: 370000 },
            { date: 'Jun', valor: 365000, passado: 315000, proj: 390000, peak: true },
        ]
    },
    ano: {
        title: "Evolução Anual (Este Ano)",
        revenue: 3850000,
        orders: 14500,
        avgTicket: 265,
        growth: "+31.5%",
        chart: [
            { date: 'T1', valor: 880000, passado: 750000, proj: 950000 },
            { date: 'T2', valor: 960000, passado: 820000, proj: 1040000 },
            { date: 'T3', valor: 1020000, passado: 890000, proj: 1100000 },
            { date: 'T4', valor: 1150000, passado: 980000, proj: 1250000, peak: true },
        ]
    }
};

const DashboardStats = ({ restaurantId, features = {} }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('hoje');
    const [salesStats, setSalesStats] = useState({
        revenue: 12450,
        ordersCount: 48,
        avgTicket: 259,
        growth: "+5%",
        chartTitle: "Evolução Diária - Vendas & Tendências",
        chartData: MOCK_PERIOD_DATA.hoje.chart,
        discounts: 320,
        cancellationRate: 2.1,
        categoriesMix: [
            { name: 'Pratos Principais', value: 955 },
            { name: 'Bebidas', value: 695 },
            { name: 'Sobremesas', value: 340 },
            { name: 'Entradas', value: 210 },
        ],
        topDishes: [
            { name: 'Pratos Principais', value: 8900 },
            { name: 'Bebidas', value: 5800 },
            { name: 'Sobremesas', value: 4500 },
            { name: 'Entradas', value: 3600 },
            { name: 'Combos', value: 2800 },
        ],
        weeklyTrends: [
            { week: 'Semana 1', value: 42000, isPred: false },
            { week: 'Semana 2', value: 54000, isPred: false },
            { week: 'Semana 3', value: 49000, isPred: false },
            { week: 'Semana 4', value: 68000, isPred: false },
            { week: 'Semana 5', value: 75000, isPred: false },
            { week: 'Semana 6', value: 72000, isPred: false },
            { week: 'Semana 7', value: 89000, isPred: false },
            { week: 'Semana 8', value: 95000, isPred: false },
            { week: 'Previsão', value: 108000, isPred: true },
        ],
        recentOrders: [
            { id: '1042', customer: 'Banto Santos', status: 'Novo', table: '14-05-2026', avatar: '👨🏽' },
            { id: '1043', customer: 'Marta Celione', status: 'Em Preparação', table: '14-05-2026', avatar: '👩🏽' },
            { id: '1044', customer: 'Mario Goles', status: 'Pronto', table: '15-05-2026', avatar: '👨🏼‍🦱' },
            { id: '1045', customer: 'Senior Mateus', status: 'Entregue', table: '16-05-2026', avatar: '👴🏽' },
        ]
    });

    const [showAITips, setShowAITips] = useState(true);
    const [restaurantInfo, setRestaurantInfo] = useState({ name: 'Comidas da Terra' });
    const navigate = useNavigate();
    const reportTemplateRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: reportTemplateRef,
        documentTitle: `Relatorio_VisaoGeral_${new Date().toISOString().split('T')[0]}`,
    });

    const handlePeriodSelect = (periodKey) => {
        setSelectedPeriod(periodKey);
        const data = MOCK_PERIOD_DATA[periodKey];
        if (data) {
            setSalesStats(prev => ({
                ...prev,
                revenue: data.revenue,
                ordersCount: data.orders,
                avgTicket: data.avgTicket,
                growth: data.growth,
                chartTitle: data.title,
                chartData: data.chart
            }));
        }
    };

    useEffect(() => {
        const loadRealData = async () => {
            if (!restaurantId) return;
            try {
                const { data: resData } = await supabase.from('restaurants').select('name').eq('id', restaurantId).single();
                if (resData) setRestaurantInfo(resData);
            } catch (err) {
                console.error("Erro ao carregar restaurante", err);
            }
        };
        loadRealData();
    }, [restaurantId]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
            .format(val)
            .replace('AOA', 'Kz')
            .trim();
    };

    const periods = [
        { key: 'hoje', label: 'Hoje' },
        { key: 'ontem', label: 'Ontem' },
        { key: 'semana', label: 'Semana' },
        { key: 'semanaPassada', label: 'Sem. Passada' },
        { key: 'mes', label: 'Mês' },
        { key: 'mesPassado', label: 'Mês Passado' },
        { key: 'trimestre', label: 'Trimestre' },
        { key: 'semestre', label: 'Semestre' },
        { key: 'ano', label: 'Ano' }
    ];

    return (
        <div className="space-y-6 animate-fade-in font-sans text-gray-100 pb-16 relative">
            {/* PERIOD SELECTION BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-[#161616]/90 backdrop-blur-xl border border-[#2A2A2A] rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2.5 px-3 text-xs font-black text-[#F5C542] uppercase tracking-widest drop-shadow-[0_0_10px_rgba(245,197,66,0.4)]">
                    <Calendar size={18} /> Período de Análise
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {periods.map(p => (
                        <button
                            key={p.key}
                            onClick={() => handlePeriodSelect(p.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                selectedPeriod === p.key
                                    ? 'bg-gradient-to-r from-[#F5C542] via-[#EAC775] to-[#D4AF37] text-gray-950 shadow-[0_0_20px_rgba(245,197,66,0.6)] scale-105 font-black'
                                    : 'bg-[#1C1C1C] text-gray-400 border border-white/5 hover:text-white hover:border-[#F5C542]/50'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TOP ROW: HERO + EVOLUTION CHART + QUICK ACCESS */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* 1. HERO WELCOME CARD */}
                <div className="xl:col-span-4 bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-8 relative flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden group hover:border-[#F5C542]/40 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none select-none">
                        <span className="text-8xl font-serif text-[#F5C542]">Ψ ϼ</span>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5C542] tracking-wide leading-tight drop-shadow-[0_0_25px_rgba(245,197,66,0.3)]">
                            Boas-vindas,<br/>ao seu Jindungo.
                        </h1>
                        <p className="text-xs text-[#A0A0A5] leading-relaxed font-light max-w-sm">
                            O seu menu digital está online e a processar encomendas e métricas de desempenho em tempo real.
                        </p>
                    </div>

                    <div className="relative z-10 pt-8 flex items-center justify-between border-t border-[#262626] mt-6">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#10B981]"></span>
                            <span className="text-xs font-bold text-gray-300">Sistema Operacional Ativo</span>
                        </div>
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#F5C542] bg-[#F5C542]/10 px-3 py-1 rounded-full border border-[#F5C542]/30 shadow-[0_0_15px_rgba(245,197,66,0.2)]">
                            v3.1 Pro
                        </span>
                    </div>
                </div>

                {/* 2. MAIN EVOLUTION CHART CARD */}
                <div className="xl:col-span-5 bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col justify-between relative hover:border-[#F5C542]/40 transition-all">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div>
                            <h3 className="font-serif font-bold text-base sm:text-lg text-white drop-shadow">{salesStats.chartTitle}</h3>
                            <p className="text-[11px] text-gray-400 font-light mt-0.5">Comparação de vendas e volume entre os períodos de análise</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-gray-200 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-[#F5C542] shadow-[0_0_10px_#F5C542]"></span> Atual</span>
                            <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Anterior</span>
                            <span className="flex items-center gap-1.5 text-gray-400 font-mono"><span className="w-3 h-0.5 bg-[#F5C542] border border-dashed"></span> Meta</span>
                            <span className="bg-green-500/20 text-green-400 font-black px-3 py-1 rounded-full text-[10px] border border-green-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]">{salesStats.growth}</span>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesStats.chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="goldIncandescente" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F5C542" stopOpacity={0.55}/>
                                        <stop offset="95%" stopColor="#F5C542" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="blueIncandescente" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#242424" />
                                <XAxis dataKey="date" stroke="#777" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#777" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #F5C542', borderRadius: '14px', color: '#fff', boxShadow: '0 0 20px rgba(245,197,66,0.3)' }} />
                                <Area type="monotone" dataKey="passado" stroke="#3B82F6" strokeWidth={2.5} fill="url(#blueIncandescente)" />
                                <Area type="monotone" dataKey="valor" stroke="#F5C542" strokeWidth={3.5} fill="url(#goldIncandescente)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. QUICK NAVIGATION GRID */}
                <div className="xl:col-span-3 bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col justify-between hover:border-[#F5C542]/40 transition-all">
                    <div className="flex justify-between items-center mb-4 border-b border-[#262626] pb-3">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Acessos Rápidos</h4>
                        <button onClick={() => setShowAITips(!showAITips)} className="text-xs text-[#F5C542] hover:underline flex items-center gap-1 font-black drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]">
                            <Sparkles size={13} /> {showAITips ? 'Ocultar IA' : 'Dicas IA'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 my-auto">
                        <button onClick={() => navigate('/admin/menu')} className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:border-[#F5C542] hover:bg-[#242424] active:scale-95 transition-all group shadow-md hover:shadow-[0_0_15px_rgba(245,197,66,0.25)]">
                            <Utensils size={22} className="text-[#F5C542] group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Restaurante</span>
                        </button>
                        <button onClick={() => navigate('/admin/orders')} className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:border-[#F5C542] hover:bg-[#242424] active:scale-95 transition-all group shadow-md hover:shadow-[0_0_15px_rgba(245,197,66,0.25)]">
                            <ClipboardList size={22} className="text-[#F5C542] group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Cozinha</span>
                        </button>
                        <button onClick={() => navigate('/admin/inventory')} className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:border-[#F5C542] hover:bg-[#242424] active:scale-95 transition-all group shadow-md hover:shadow-[0_0_15px_rgba(245,197,66,0.25)]">
                            <Package size={22} className="text-[#F5C542] group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Stock</span>
                        </button>
                        <button onClick={() => navigate('/admin/orders')} className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:border-[#F5C542] hover:bg-[#242424] active:scale-95 transition-all group shadow-md hover:shadow-[0_0_15px_rgba(245,197,66,0.25)]">
                            <Truck size={22} className="text-[#F5C542] group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Entregas</span>
                        </button>
                        <button onClick={() => navigate('/admin/staff')} className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:border-[#F5C542] hover:bg-[#242424] active:scale-95 transition-all group shadow-md hover:shadow-[0_0_15px_rgba(245,197,66,0.25)]">
                            <Users size={22} className="text-[#F5C542] group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Equipa</span>
                        </button>
                        <button onClick={() => navigate('/admin/settings')} className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:border-[#F5C542] hover:bg-[#242424] active:scale-95 transition-all group shadow-md hover:shadow-[0_0_15px_rgba(245,197,66,0.25)]">
                            <Settings size={22} className="text-[#F5C542] group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Configurações</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* MIDDLE ROW: 4 KEY METRICS + FLOATING AI POPUP OVER TICKET MEDIO AND NOVOS CLIENTES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                {/* Floating AI Popup precisely positioned in front of Ticket Médio / Novos Clientes exactly as in the screenshot */}
                {showAITips && (
                    <div className="absolute right-4 sm:right-16 top-[-30px] z-50 bg-[#1F1F1F]/95 backdrop-blur-2xl border border-[#F5C542]/70 rounded-2xl p-5 shadow-[0_30px_80px_rgba(0,0,0,0.99)] max-w-sm w-full animate-in zoom-in-95 duration-300 border-t-2 border-t-[#F5C542]">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2.5">
                            <h4 className="text-xs font-bold font-serif text-[#F5C542] flex items-center gap-2 drop-shadow-[0_0_10px_rgba(245,197,66,0.4)]">
                                <Sparkles size={15} className="animate-pulse text-[#F5C542]" /> Dicas de Tomada de Decisão
                            </h4>
                            <button onClick={() => setShowAITips(false)} className="text-gray-400 hover:text-white transition-colors p-1" title="Fechar dicas">
                                <X size={16} />
                            </button>
                        </div>
                        <ul className="space-y-2.5 text-xs text-gray-300 font-light list-disc pl-4">
                            <li><strong className="text-white font-semibold">Micro-insights:</strong> Sugestão de aumento de margem em pratos com alta rotatividade durante o pico.</li>
                            <li><strong className="text-white font-semibold">Otimização de Equipa:</strong> Reforçar a cozinha aos fins de semana com base no pico histórico de pedidos.</li>
                            <li><strong className="text-white font-semibold">Campanhas Dinâmicas:</strong> Criar combo promocional para sobremesas e bebidas leves para impulsionar o ticket médio em 15%.</li>
                        </ul>
                    </div>
                )}

                {/* Card 1: Receita Diária */}
                <div className="bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-xl flex flex-col justify-between h-44 relative overflow-hidden group hover:border-[#F5C542]/40 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Faturação do Período</span>
                            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">{formatCurrency(salesStats.revenue)}</h3>
                        </div>
                        <span className="bg-green-500/20 text-green-400 font-black px-3 py-1 rounded-full text-[10px] border border-green-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]">{salesStats.growth}</span>
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#262626] flex items-center justify-between text-xs text-gray-400">
                        <span>Comparação %</span>
                        <span className="text-green-400 font-bold">+1.35%</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none opacity-50">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesStats.chartData}>
                                <Area type="monotone" dataKey="valor" stroke="#F5C542" strokeWidth={2.5} fill="#F5C542" fillOpacity={0.15} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Card 2: Novos Clientes */}
                <div className="bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-xl flex flex-col justify-between h-44 relative hover:border-[#F5C542]/40 transition-all">
                    <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Novos Clientes</span>
                        <h3 className="text-3xl font-serif font-bold text-white tracking-tight">{salesStats.ordersCount}</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-[#222] rounded-full overflow-hidden flex shadow-inner">
                            <div className="bg-[#F5C542] h-full shadow-[0_0_10px_#F5C542]" style={{ width: '45%' }}></div>
                            <div className="bg-gray-400 h-full" style={{ width: '25%' }}></div>
                            <div className="bg-blue-500 h-full" style={{ width: '20%' }}></div>
                            <div className="bg-green-500 h-full" style={{ width: '10%' }}></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 font-medium">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F5C542] shadow-[0_0_6px_#F5C542]"></span> Custonente</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Custenmises</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Pronto</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Entregue</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Ticket Médio */}
                <div className="bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-xl flex flex-col justify-between h-44 relative hover:border-[#F5C542]/40 transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Ticket Médio</span>
                        <span className="text-xs font-serif font-bold text-[#F5C542] drop-shadow-[0_0_8px_rgba(245,197,66,0.4)]">{formatCurrency(salesStats.avgTicket)}</span>
                    </div>
                    {/* Semicircular Gauge Mock matching screenshot */}
                    <div className="flex flex-col items-center justify-center my-auto pt-2">
                        <div className="relative w-32 h-16 overflow-hidden">
                            <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-[#242424] border-t-[#F5C542] border-r-[#F5C542] rotate-45 transition-transform duration-1000 shadow-[0_0_15px_rgba(245,197,66,0.3)]"></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#F5C542] shadow-[0_0_12px_#F5C542]"></div>
                        </div>
                        <span className="text-[10px] uppercase font-black text-gray-400 mt-2 tracking-widest">Trend 1500</span>
                    </div>
                </div>

                {/* Card 4: Custo Médio p/ Prato */}
                <div className="bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-xl flex flex-col justify-between h-44 relative hover:border-[#F5C542]/40 transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Custo Médio p/ Prato</span>
                        <span className="bg-[#F5C542]/10 text-[#F5C542] font-black px-3 py-1 rounded-full text-[10px] border border-[#F5C542]/40 shadow-[0_0_12px_rgba(245,197,66,0.3)]">$3.00</span>
                    </div>
                    <div className="space-y-3 my-auto">
                        <div className="relative h-4 w-full bg-[#222] rounded-full overflow-hidden shadow-inner p-0.5">
                            <div className="bg-gradient-to-r from-amber-600 via-[#F5C542] to-yellow-500 h-full rounded-full shadow-[0_0_10px_#F5C542]" style={{ width: '70%' }}></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono font-medium">
                            <span>Mín: $1.20</span>
                            <span className="text-[#F5C542] font-black drop-shadow-[0_0_8px_rgba(245,197,66,0.4)]">Atual: $3.00</span>
                            <span>Máx: $8.50</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: DONUT + BARS + WEEKLY + ORDERS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 1. MIX DE CATEGORIAS */}
                <div className="lg:col-span-3 bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-80 hover:border-[#F5C542]/40 transition-all">
                    <h3 className="font-serif font-bold text-base text-white mb-2">Mix de Categorias</h3>
                    <div className="h-44 w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={salesStats.categoriesMix} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={4}>
                                    {salesStats.categoriesMix.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #F5C542', borderRadius: '12px', color: '#fff', boxShadow: '0 0 20px rgba(245,197,66,0.3)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs font-black text-white drop-shadow">Peak, 14:00</span>
                            <span className="text-[10px] text-gray-400 font-light">Pratos: 955</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#262626] text-[10px] text-gray-300 font-medium">
                        <span className="flex items-center gap-1.5 truncate"><span className="w-2 h-2 rounded-full bg-[#F5C542] shadow-[0_0_6px_#F5C542]"></span> Pratos Princ.</span>
                        <span className="flex items-center gap-1.5 truncate"><span className="w-2 h-2 rounded-full bg-[#EAC775]"></span> Bebidas</span>
                        <span className="flex items-center gap-1.5 truncate"><span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span> Sobremesas</span>
                        <span className="flex items-center gap-1.5 truncate"><span className="w-2 h-2 rounded-full bg-[#8E8E93]"></span> Entradas</span>
                    </div>
                </div>

                {/* 2. TOP 5 PRATOS */}
                <div className="lg:col-span-3 bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-80 hover:border-[#F5C542]/40 transition-all">
                    <h3 className="font-serif font-bold text-base text-white mb-4">Top 5 Pratos - Vendas p/ Categoria</h3>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesStats.topDishes} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="#242424" />
                                <XAxis dataKey="name" stroke="#777" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis stroke="#777" fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #F5C542', borderRadius: '12px', color: '#fff', boxShadow: '0 0 20px rgba(245,197,66,0.3)' }} />
                                <Bar dataKey="value" fill="#F5C542" radius={[6, 6, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. FATURAÇÃO SEMANAL */}
                <div className="lg:col-span-3 bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-80 hover:border-[#F5C542]/40 transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-serif font-bold text-base text-white truncate">Faturação Semanal</h3>
                        <span className="text-[9px] font-black uppercase text-[#F5C542] border border-[#F5C542]/40 px-2.5 py-0.5 rounded-full bg-[#F5C542]/10 shadow-[0_0_10px_rgba(245,197,66,0.2)]">Previsão</span>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesStats.weeklyTrends} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="#242424" />
                                <XAxis dataKey="week" stroke="#777" fontSize={9} axisLine={false} tickLine={false} />
                                <YAxis stroke="#777" fontSize={9} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #F5C542', borderRadius: '12px', color: '#fff', boxShadow: '0 0 20px rgba(245,197,66,0.3)' }} />
                                <Bar dataKey="value" fill="#F5C542" radius={[6, 6, 0, 0]} barSize={16}>
                                    {salesStats.weeklyTrends.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isPred ? '#8E8E93' : '#F5C542'} fillOpacity={entry.isPred ? 0.6 : 1} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. PEDIDOS RECENTES */}
                <div className="lg:col-span-3 bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-80 overflow-hidden hover:border-[#F5C542]/40 transition-all">
                    <div className="flex justify-between items-center mb-4 border-b border-[#262626] pb-3">
                        <h3 className="font-serif font-bold text-base text-white">Pedidos Recentes</h3>
                        <button onClick={() => navigate('/admin/orders')} className="text-xs text-[#F5C542] hover:underline font-black drop-shadow-[0_0_8px_rgba(245,197,66,0.4)]">Ver todos</button>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                        <div className="space-y-3">
                            {salesStats.recentOrders.map(ord => (
                                <div key={ord.id} onClick={() => navigate('/admin/orders')} className="flex items-center justify-between p-2.5 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] hover:border-[#F5C542]/60 cursor-pointer transition-all shadow-sm hover:shadow-[0_0_15px_rgba(245,197,66,0.2)]">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-sm shadow-inner">{ord.avatar}</span>
                                        <div>
                                            <p className="text-xs font-bold text-white leading-tight">{ord.customer}</p>
                                            <span className="text-[10px] text-gray-400 font-mono">#{ord.id}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                            ord.status === 'Novo' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
                                            ord.status === 'Em Preparação' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                                            ord.status === 'Pronto' ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                                            'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                        }`}>
                                            {ord.status}
                                        </span>
                                        <span className="text-[9px] text-gray-500 font-mono">{ord.table}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Report Template */}
            <div className="hidden">
                <div ref={reportTemplateRef} className="p-12 bg-white text-black min-h-screen">
                    <h1 className="text-4xl font-serif font-black mb-8 border-b-2 border-black pb-4">RELATÓRIO DE GESTÃO - VISÃO GERAL</h1>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="border p-4 rounded-xl"><p className="text-xs uppercase font-bold text-gray-500">Receita do Período</p><p className="text-2xl font-bold">{formatCurrency(salesStats.revenue)}</p></div>
                        <div className="border p-4 rounded-xl"><p className="text-xs uppercase font-bold text-gray-500">Encomendas</p><p className="text-2xl font-bold">{salesStats.ordersCount}</p></div>
                        <div className="border p-4 rounded-xl"><p className="text-xs uppercase font-bold text-gray-500">Ticket Médio</p><p className="text-2xl font-bold">{formatCurrency(salesStats.avgTicket)}</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;

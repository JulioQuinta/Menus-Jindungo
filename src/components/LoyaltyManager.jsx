import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Award, Save, RefreshCw, CheckCircle2, Info, Star, 
    Sparkles, Sliders, ChevronRight, TrendingUp, Users, AlertCircle,
    MessageSquare, Copy, X, Check, Send
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, 
    Cell, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { loyaltyService } from '../services/loyaltyService';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const LoyaltyManager = ({ restaurantId }) => {
    const [config, setConfig] = useState({
        goal: 10,
        reward_text: 'Ganha uma sobremesa grátis!',
        is_active: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [timeframe, setTimeframe] = useState('Semana'); // 'Dia' | 'Semana' | 'Mês'
    const [activeAiTip, setActiveAiTip] = useState(0);

    // Dynamic states for real-time customer data
    const [restaurantName, setRestaurantName] = useState('Menús Jindungos');
    const [inactiveCustomers, setInactiveCustomers] = useState([]);
    const [nearRewardCustomers, setNearRewardCustomers] = useState([]);
    const [vipStats, setVipStats] = useState({ totalVips: 0, gold: 0, silver: 0, bronze: 0 });
    const [activeTab, setActiveTab] = useState('inactive'); // 'inactive' | 'nearReward'
    const [campaignModal, setCampaignModal] = useState({
        isOpen: false,
        customer: null,
        text: '',
        campaignType: ''
    });
    const [copied, setCopied] = useState(false);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        if (restaurantId) {
            // 1. Fetch loyalty config
            const { data, error } = await loyaltyService.getConfig(restaurantId);
            if (data) {
                setConfig({
                    goal: data.goal || 10,
                    reward_text: data.reward_text || 'Ganha uma sobremesa grátis!',
                    is_active: data.is_active || false
                });
            }

            // 2. Fetch restaurant details for campaigns
            try {
                const { data: restData } = await supabase
                    .from('restaurants')
                    .select('name')
                    .eq('id', restaurantId)
                    .single();
                if (restData) {
                    setRestaurantName(restData.name);
                }
            } catch (err) {
                console.error('Error fetching restaurant name:', err);
            }

            // 3. Fetch real customer stats
            const stats = await loyaltyService.getCustomerLoyaltyStats(restaurantId);
            if (stats) {
                setInactiveCustomers(stats.inactiveCustomers || []);
                setNearRewardCustomers(stats.nearRewardCustomers || []);
                setVipStats(stats.vipStats || { totalVips: 0, gold: 0, silver: 0, bronze: 0 });
            }
        }
        setLoading(false);
    }, [restaurantId]);

    useEffect(() => {
        if (restaurantId) {
            fetchConfig();
        }
    }, [fetchConfig, restaurantId]);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await loyaltyService.saveConfig(restaurantId, config);
        if (error) {
            toast.error('Erro ao salvar configuração de fidelidade.');
        } else {
            toast.success('Hub de Fidelidade atualizado com sucesso!');
            // Refresh to ensure everything aligns
            fetchConfig();
        }
        setSaving(false);
    };

    const handleOpenCampaignModal = (customer, type) => {
        let msg = '';
        if (type === 'inactive') {
            msg = `Olá, *${customer.name}*! 🌟\n\nSentimos a sua falta no *${restaurantName}*! Notámos que já não nos faz uma visita há *${customer.daysInactive} dias*... ⏳\n\nPara adoçar o seu regresso, temos um mimo especial à sua espera no seu próximo pedido! 🍳✨\n\nAbra o nosso menu digital e faça o seu pedido: ${window.location.origin}/explorar\n\nAté breve! 🛎️🌶️`;
        } else {
            const missing = config.goal - customer.points;
            msg = `Olá, *${customer.name}*! 🌟\n\nSabia que está a apenas *${missing} ${missing === 1 ? 'pedido' : 'pedidos'}* de ganhar a sua recompensa no *${restaurantName}*? 🪙\n\nPeça já e garanta a sua *${config.reward_text}*! 🛎️🌶️\n\nFaça o seu pedido aqui: ${window.location.origin}/explorar\n\nEstamos à sua espera! 🍳✨`;
        }
        setCampaignModal({
            isOpen: true,
            customer,
            text: msg,
            campaignType: type
        });
    };

    const handleCopyCampaignText = () => {
        navigator.clipboard.writeText(campaignModal.text);
        setCopied(true);
        toast.success('Texto copiado com sucesso!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTriggerCampaignWhatsApp = () => {
        if (!campaignModal.customer) return;
        const phone = campaignModal.customer.phone.replace(/\D/g, ''); // Keep only numbers
        const encodedText = encodeURIComponent(campaignModal.text);
        const url = `https://wa.me/${phone}?text=${encodedText}`;
        window.open(url, '_blank');
        toast.success('WhatsApp aberto com sucesso!');
        setCampaignModal({ isOpen: false, customer: null, text: '', campaignType: '' });
    };

    // Recharts Data matching the screenshot's stunning curves
    const evolutionData = useMemo(() => {
        if (timeframe === 'Dia') {
            return [
                { label: '08h', pontos: 10, recompensas: 2 },
                { label: '12h', pontos: 45, recompensas: 12 },
                { label: '15h', pontos: 25, recompensas: 8 },
                { label: '19h', pontos: 90, recompensas: 30 },
                { label: '22h', pontos: 120, recompensas: 45 },
            ];
        } else if (timeframe === 'Mês') {
            return [
                { label: 'Jan', pontos: 200, recompensas: 40 },
                { label: 'Fev', pontos: 350, recompensas: 80 },
                { label: 'Mar', pontos: 500, recompensas: 120 },
                { label: 'Abr', pontos: 850, recompensas: 210 },
                { label: 'Mai', pontos: 1120, recompensas: 310 },
            ];
        }
        // Default: Semana
        return [
            { label: 'Seg', pontos: 20, recompensas: 5 },
            { label: 'Ter', pontos: 40, recompensas: 12 },
            { label: 'Qua', pontos: 35, recompensas: 10 },
            { label: 'Qui', pontos: 95, recompensas: 28 },
            { label: 'Sex', pontos: 60, recompensas: 15 },
            { label: 'Sáb', pontos: 135, recompensas: 45 },
            { label: 'Dom', pontos: 150, recompensas: 52 },
        ];
    }, [timeframe]);

    // Donut Chart Data dynamic based on real-time VIP Distribution
    const vipDistribution = useMemo(() => {
        const total = vipStats.totalVips || 0;
        if (total === 0) {
            return [
                { name: 'Bronze', value: 0, color: '#CD7F32', count: 0 },
                { name: 'Prata', value: 0, color: '#C0C0C0', count: 0 },
                { name: 'Ouro', value: 0, color: '#D4AF37', count: 0 }
            ];
        }
        return [
            { name: 'Bronze', value: parseFloat(((vipStats.bronze / total) * 100).toFixed(1)), color: '#CD7F32', count: vipStats.bronze },
            { name: 'Prata', value: parseFloat(((vipStats.silver / total) * 100).toFixed(1)), color: '#C0C0C0', count: vipStats.silver },
            { name: 'Ouro', value: parseFloat(((vipStats.gold / total) * 100).toFixed(1)), color: '#D4AF37', count: vipStats.gold }
        ];
    }, [vipStats]);

    // AI Tips Data matching screenshot
    const aiTips = [
        {
            title: "Sugerir Campanha p/ Naivo: Novo Prato",
            desc: "Sugerir Promoção p/ Noites de Sexta e pessoas entrarem com os amigos na ementa de alta gastronomia.",
            badge: "Estratégia VIP"
        },
        {
            title: "Rever Staff p/ Picos de Sábado",
            desc: "Rever Staff p/ Picos e ritmos de Sábado. Sugerimos posicionar ativamente empregados de mesa extra nas mesas de maior consumo VIP.",
            badge: "Logística"
        },
        {
            title: "Sugerir Promoção de Decisão",
            desc: "Sugerir promoção p/ noites de Sexta e rever em concordância com o histórico de resgates de pontos dos clientes frequentes.",
            badge: "Oportunidade"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveAiTip((prev) => (prev + 1) % aiTips.length);
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <RefreshCw className="animate-spin text-[#D4AF37]" size={48} />
                <p className="text-gray-400 font-serif text-sm tracking-widest uppercase">A carregar Hub de Fidelização...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-white font-sans max-w-[1600px] mx-auto">
            
            {/* Top Banner matching screenshot */}
            <div className="bg-gradient-to-r from-[#181818]/95 via-[#141414]/95 to-[#101010]/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 blur-[90px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                <div className="flex items-center gap-5 z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-black rounded-2xl flex items-center justify-center border border-[#D4AF37]/50 shadow-[0_0_25px_rgba(212,175,55,0.25)] shrink-0">
                        <Award className="text-[#D4AF37]" size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
                                Hub de Fidelização
                            </h1>
                            <span className="px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                                Premium VIP
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">Transforme clientes casuais em fãs recorrentes e promotores da sua marca.</p>
                    </div>
                </div>

                {/* Status Switch matching screenshot */}
                <div className="flex items-center gap-4 bg-black/50 p-3 sm:p-4 rounded-2xl border border-white/10 z-10 w-full sm:w-auto justify-between sm:justify-end">
                    <span className={`text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border transition-all ${
                        config.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                            : 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    }`}>
                        {config.is_active ? 'Ativo na Loja' : 'Inativo'}
                    </span>
                    <button
                        onClick={() => setConfig(prev => ({ ...prev, is_active: !prev.is_active }))}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 cursor-pointer p-1 border border-white/20 ${
                            config.is_active ? 'bg-gradient-to-r from-[#F5C542] to-[#D4AF37] shadow-[0_0_20px_#D4AF37]' : 'bg-gray-700'
                        }`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-black shadow-md transition-transform duration-300 ${
                            config.is_active ? 'translate-x-6 bg-gray-950' : 'translate-x-0 bg-gray-300'
                        }`} />
                    </button>
                </div>
            </div>

            {/* Main Content Grid (3 Columns matching screenshot exactly) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Column 1: Evolução de Pontos & Recompensas */}
                <div className="bg-gradient-to-br from-[#1A1A1A]/95 via-[#161616]/95 to-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex flex-col gap-4 pb-6 border-b border-white/5 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-serif font-black text-white tracking-wide">
                                    Evolução de Pontos & Recompensas
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Métricas de engajamento do programa VIP</p>
                            </div>
                        </div>

                        {/* Screenshot Legend */}
                        <div className="flex flex-wrap items-center gap-6 text-xs text-gray-300">
                            <div className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 rounded bg-[#F5C542] shadow-[0_0_10px_#F5C542]" />
                                <div>
                                    <span className="font-bold text-white">Pontos Ganhos</span>
                                    <span className="block text-[10px] text-gray-500">(Total de pontos ganhado)</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 rounded bg-blue-500 shadow-[0_0_10px_#3B82F6]" />
                                <div>
                                    <span className="font-bold text-white">Recompensas</span>
                                    <span className="block text-[10px] text-gray-500">(Mais redimidas)</span>
                                </div>
                            </div>
                        </div>

                        {/* Screenshot Time Selectors: Dia | Semana | Mês */}
                        <div className="flex items-center gap-2 bg-black/50 p-1 rounded-2xl border border-white/5 w-fit mt-2">
                            {['Dia', 'Semana', 'Mês'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        timeframe === t 
                                            ? 'bg-[#D4AF37] text-black shadow-lg font-black' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div className="h-[360px] w-full pt-6 relative z-10">
                        {/* Callout Annotations matching screenshot */}
                        <div className="absolute top-16 left-28 z-20 text-[10px] font-mono font-bold text-[#F5C542] -rotate-12 pointer-events-none drop-shadow-[0_0_8px_#F5C542] flex items-center gap-1">
                            <span>↗ Growth as leads</span>
                        </div>
                        <div className="absolute top-10 right-20 z-20 text-[10px] font-mono font-bold text-[#F5C542] -rotate-12 pointer-events-none drop-shadow-[0_0_8px_#F5C542] flex items-center gap-1">
                            <span>↗ Growth of retention</span>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={evolutionData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F5C542" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#F5C542" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" stroke="#666" fontSize={11} tickLine={false} />
                                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#121212', 
                                        borderColor: '#D4AF37', 
                                        borderRadius: '16px', 
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.8)' 
                                    }}
                                    itemStyle={{ color: '#D4AF37' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="recompensas" 
                                    stroke="#3B82F6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#blueGradient)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="pontos" 
                                    stroke="#F5C542" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#goldGradient)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Column 2: Visualização no Telemóvel + Configuração Rápida */}
                <div className="space-y-6 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between px-4">
                        <h3 className="text-lg font-serif font-bold text-white tracking-wide flex items-center gap-2">
                            <span>📱</span> Visualização no Telemóvel
                        </h3>
                        <span className="text-[10px] bg-white/10 text-gray-400 px-2.5 py-1 rounded-full uppercase font-mono tracking-widest">
                            Preview Ao Vivo
                        </span>
                    </div>

                    {/* Screenshot Phone Mockup */}
                    <div className="relative w-full max-w-[320px] bg-[#0E0E0E] rounded-[3.5rem] border-[10px] border-[#1F1F1F] shadow-[0_25px_70px_rgba(0,0,0,0.9)] aspect-[9/18] overflow-hidden flex flex-col justify-between p-6 relative">
                        {/* Status Bar */}
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mb-4 px-1">
                            <span>9:41</span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>5G</span>
                            </div>
                        </div>

                        {/* Phone Content */}
                        <div className="flex-1 flex flex-col justify-center space-y-6">
                            {/* VIP Card matching screenshot */}
                            <div className="bg-gradient-to-br from-[#1C1C1C] to-[#121212] rounded-3xl p-6 border border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden group">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-xl pointer-events-none" />

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="text-[#D4AF37] font-serif font-black text-sm tracking-widest uppercase">
                                            Cartão VIP
                                        </h4>
                                        <p className="text-white text-xs font-bold mt-1">Status: Próximo Nível</p>
                                    </div>
                                    <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center border border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                                        <Award className="text-[#D4AF37]" size={20} />
                                    </div>
                                </div>

                                {/* Dynamic Stamps Grid matching screenshot */}
                                <div className="grid grid-cols-4 gap-3 mb-6">
                                    {[...Array(Math.min(config.goal, 8))].map((_, idx) => {
                                        const isCompleted = idx < 2; // Mocking first 2 points completed
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                                                    isCompleted 
                                                        ? 'bg-gradient-to-br from-[#F5C542] to-[#D4AF37] text-gray-950 font-black shadow-[0_0_15px_#D4AF37] scale-105 rotate-3' 
                                                        : 'bg-black/60 border border-white/15 text-gray-500'
                                                }`}
                                            >
                                                {isCompleted ? <CheckCircle2 size={16} className="text-gray-950 stroke-[3]" /> : idx + 1}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-4 border-t border-white/10 text-center">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Recompensa Atual</p>
                                    <p className="text-[#D4AF37] font-serif font-black text-sm leading-tight drop-shadow">
                                        {config.reward_text || 'Ganha uma sobremesa grátis!'}
                                    </p>
                                </div>
                            </div>

                            <p className="text-center text-[11px] text-gray-500 px-4 leading-relaxed font-sans">
                                Esta janela aparecerá automaticamente aos seus clientes fiéis no Checkout.
                            </p>
                        </div>

                        {/* Phone Home Bar */}
                        <div className="w-28 h-1 bg-white/20 rounded-full mx-auto mb-1" />
                    </div>

                    {/* Integrated Configuration Control Box */}
                    <div className="w-full bg-[#161616]/90 backdrop-blur-xl border border-[#D4AF37]/30 rounded-[2.5rem] p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                                <Sliders size={16} /> Ajustar Regras VIP
                            </span>
                            <span className="text-[10px] text-gray-400">Configuração Rápida</span>
                        </div>

                        <div>
                            <div className="flex justify-between items-center text-xs font-bold text-gray-300 mb-2">
                                <span>Meta de Pedidos para Prémio</span>
                                <span className="bg-[#D4AF37] text-black px-2.5 py-0.5 rounded-lg font-black text-sm">{config.goal} Pedidos</span>
                            </div>
                            <input 
                                type="range" 
                                min="3" 
                                max="20" 
                                value={config.goal} 
                                onChange={(e) => setConfig(prev => ({ ...prev, goal: parseInt(e.target.value) }))}
                                className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Texto da Recompensa</label>
                            <input 
                                type="text"
                                value={config.reward_text}
                                onChange={(e) => setConfig(prev => ({ ...prev, reward_text: e.target.value }))}
                                placeholder="Ex: Ganha uma sobremesa grátis!"
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-[#D4AF37] outline-none transition-all font-bold"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3.5 bg-gradient-to-r from-[#F5C542] via-[#EAC775] to-[#D4AF37] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                            <span>Guardar Configurações</span>
                        </button>
                    </div>
                </div>

                {/* Column 3: Distribuição de Nível VIP + Gaveta Flutuante IA */}
                <div className="space-y-8">
                    
                    {/* Donut Chart Card matching screenshot exactly */}
                    <div className="bg-gradient-to-br from-[#1A1A1A]/95 via-[#161616]/95 to-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                            <h3 className="text-xl font-serif font-black text-white tracking-wide">
                                Distribuição de Nível VIP
                            </h3>
                            <span className="px-3 py-1 bg-white/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold">
                                Dia
                            </span>
                        </div>

                        {/* Pie Chart Container */}
                        <div className="h-[280px] w-full relative flex items-center justify-center">
                            {/* Center Donut Label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Clientes</span>
                                <span className="text-xl font-serif font-black text-[#D4AF37]">{vipStats.totalVips} VIPs</span>
                                <span className="text-[10px] text-gray-500 font-mono">Ouro: {vipStats.gold} | Prata: {vipStats.silver}</span>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={vipDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={105}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="#121212"
                                        strokeWidth={3}
                                    >
                                        {vipDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#161616', borderColor: '#D4AF37', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend Breakdown matching screenshot */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-white/5 mt-4">
                            {vipDistribution.map(item => (
                                <div key={item.name} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    <div>
                                        <span className="block text-[10px] text-gray-400 font-bold truncate">{item.name} ({item.count || 0})</span>
                                        <span className="text-xs font-black text-white">{item.value}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Screenshot AI Floating Drawer: Dicas de Tomada de Decisão */}
                    <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl border border-[#D4AF37]/40 rounded-[2.5rem] p-7 shadow-[0_0_40px_rgba(212,175,55,0.2)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] text-gray-950 flex items-center justify-center font-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-lg tracking-wide">Dicas de Tomada de Decisão</h3>
                                    <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase font-mono">IA Em Tempo Real</span>
                                </div>
                            </div>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
                            </span>
                        </div>

                        {/* List of Tips matching screenshot */}
                        <div className="space-y-4 relative z-10">
                            {aiTips.map((tip, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setActiveAiTip(idx)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                        idx === activeAiTip 
                                            ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
                                            : 'bg-black/40 border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-serif font-bold text-white text-sm">
                                            {tip.title}
                                        </h4>
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30 font-mono">
                                            {tip.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed font-sans line-clamp-3">
                                        {tip.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                </div>
            </div>
        </div>

            {/* NOVO: Painel de Automação & Campanhas WhatsApp */}
            <div className="bg-gradient-to-br from-[#1A1A1A]/95 via-[#161616]/95 to-[#121212]/95 backdrop-blur-xl border border-[#D4AF37]/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden mt-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-[70px] rounded-full pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-black border border-[#D4AF37]/40 flex items-center justify-center">
                            <Sparkles className="text-[#D4AF37]" size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-black text-white tracking-wide">
                                Campanhas de Re-Engajamento VIP
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">Dispare lembretes altamente personalizados via WhatsApp em um clique</p>
                        </div>
                    </div>

                    {/* Selector de Abas Dourado */}
                    <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10 w-fit">
                        <button
                            onClick={() => setActiveTab('inactive')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                                activeTab === 'inactive'
                                    ? 'bg-gradient-to-r from-[#F5C542] to-[#D4AF37] text-black shadow-lg font-black'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>Clientes Inativos</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                activeTab === 'inactive' ? 'bg-black text-[#D4AF37]' : 'bg-white/10 text-white'
                            }`}>
                                {inactiveCustomers.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('nearReward')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                                activeTab === 'nearReward'
                                    ? 'bg-gradient-to-r from-[#F5C542] to-[#D4AF37] text-black shadow-lg font-black'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>Próximos da Recompensa</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                activeTab === 'nearReward' ? 'bg-black text-[#D4AF37]' : 'bg-white/10 text-white'
                            }`}>
                                {nearRewardCustomers.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Listagem Baseada no Status da Aba */}
                <div className="relative z-10">
                    {activeTab === 'inactive' ? (
                        inactiveCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-4">
                                    <CheckCircle2 className="text-emerald-400" size={32} />
                                </div>
                                <h4 className="text-lg font-serif font-bold text-white mb-1">Todos Ativos e Felizes!</h4>
                                <p className="text-sm text-gray-500 max-w-sm">Nenhum cliente está inativo por mais de 15 dias na sua base atual.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                            <th className="py-4">Nome do Cliente</th>
                                            <th className="py-4">Contacto</th>
                                            <th className="py-4">Nível VIP</th>
                                            <th className="py-4">Pontos Atuais</th>
                                            <th className="py-4">Dias Inativo</th>
                                            <th className="py-4 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {inactiveCustomers.map((cust) => (
                                            <tr key={cust.phone} className="group hover:bg-white/[0.02] transition-all">
                                                <td className="py-4 flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-black border border-red-500/30 flex items-center justify-center font-bold text-red-400 text-sm">
                                                        {cust.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-serif font-bold text-sm text-white group-hover:text-[#D4AF37] transition-colors">{cust.name}</span>
                                                        <span className="block text-[10px] text-gray-500">Última compra: {cust.lastPurchaseDate}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 font-mono text-xs text-gray-400">{cust.phone}</td>
                                                <td className="py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                        cust.tier === 'Ouro' 
                                                            ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/35 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                                                            : cust.tier === 'Prata'
                                                            ? 'bg-gray-300/10 text-gray-300 border-gray-400/20'
                                                            : 'bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/20'
                                                    }`}>
                                                        {cust.tier}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className="bg-black/60 border border-white/10 px-3 py-1 rounded-full text-xs font-black text-[#D4AF37] shadow-inner font-mono">
                                                        {cust.points} 🪙
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className="text-red-400 font-bold text-xs">{cust.daysInactive} dias inativo ⏳</span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button
                                                        onClick={() => handleOpenCampaignModal(cust, 'inactive')}
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-1.5 ml-auto cursor-pointer"
                                                    >
                                                        <MessageSquare size={14} className="stroke-[3]" />
                                                        <span>Enviar Campanha</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        nearRewardCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 mb-4">
                                    <Info className="text-blue-400" size={32} />
                                </div>
                                <h4 className="text-lg font-serif font-bold text-white mb-1">Nenhum Cliente Próximo</h4>
                                <p className="text-sm text-gray-500 max-w-sm">Nenhum cliente está atualmente a 1 ou 2 pedidos de obter o prémio.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                            <th className="py-4">Nome do Cliente</th>
                                            <th className="py-4">Contacto</th>
                                            <th className="py-4">Nível VIP</th>
                                            <th className="py-4">Pontos Atuais</th>
                                            <th className="py-4">Faltam</th>
                                            <th className="py-4 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {nearRewardCustomers.map((cust) => {
                                            const missing = config.goal - cust.points;
                                            return (
                                                <tr key={cust.phone} className="group hover:bg-white/[0.02] transition-all">
                                                    <td className="py-4 flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-black border border-[#D4AF37]/30 flex items-center justify-center font-bold text-[#D4AF37] text-sm">
                                                            {cust.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-serif font-bold text-sm text-white group-hover:text-[#D4AF37] transition-colors">{cust.name}</span>
                                                            <span className="block text-[10px] text-gray-500">Última compra: {cust.lastPurchaseDate}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 font-mono text-xs text-gray-400">{cust.phone}</td>
                                                    <td className="py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                            cust.tier === 'Ouro' 
                                                                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/35 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                                                                : cust.tier === 'Prata'
                                                                ? 'bg-gray-300/10 text-gray-300 border-gray-400/20'
                                                                : 'bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/20'
                                                        }`}>
                                                            {cust.tier}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="bg-black/60 border border-white/10 px-3 py-1 rounded-full text-xs font-black text-[#D4AF37] shadow-inner font-mono">
                                                            {cust.points} / {config.goal} 🪙
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold text-xs">
                                                            Apenas {missing} {missing === 1 ? 'pedido' : 'pedidos'}! ⭐
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            onClick={() => handleOpenCampaignModal(cust, 'nearReward')}
                                                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-1.5 ml-auto cursor-pointer"
                                                        >
                                                            <MessageSquare size={14} className="stroke-[3]" />
                                                            <span>Enviar Campanha</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Modal de Disparo WhatsApp de Alta Fidelidade */}
            {campaignModal.isOpen && campaignModal.customer && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
                    <div className="bg-[#121212] border border-[#D4AF37]/50 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.3)] flex flex-col relative animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 bg-gradient-to-b from-[#1C1C1C] to-black border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                                    <MessageSquare size={20} className="stroke-[2]" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-lg tracking-wide">
                                        Campanha via WhatsApp
                                    </h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Disparo Exclusivo VIP</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCampaignModal({ isOpen: false, customer: null, text: '', campaignType: '' })}
                                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 flex-1">
                            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Cliente Destino:</span>
                                    <span className="font-serif font-bold text-white">{campaignModal.customer.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Telemóvel:</span>
                                    <span className="font-mono text-gray-300">{campaignModal.customer.phone}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Pontos / Nível:</span>
                                    <span className="font-bold text-[#D4AF37]">{campaignModal.customer.points} 🪙 | {campaignModal.customer.tier}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Mensagem da Campanha</label>
                                <textarea
                                    value={campaignModal.text}
                                    onChange={(e) => setCampaignModal(prev => ({ ...prev, text: e.target.value }))}
                                    rows={6}
                                    className="w-full bg-black/80 border border-white/15 rounded-2xl p-4 text-white text-sm focus:border-[#D4AF37] outline-none transition-all font-sans leading-relaxed resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-black/40 border-t border-white/5 flex gap-3">
                            <button
                                onClick={handleCopyCampaignText}
                                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black text-xs text-white uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                {copied ? <Check className="text-emerald-400" size={16} /> : <Copy size={16} />}
                                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                            </button>
                            <button
                                onClick={handleTriggerCampaignWhatsApp}
                                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Send size={16} className="stroke-[3]" />
                                <span>Disparar WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoyaltyManager;

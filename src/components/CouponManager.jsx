import React, { useState, useEffect, useCallback } from 'react';
import { couponService } from '../services/couponService';
import { 
    Ticket, Plus, Trash2, Calendar, Tag, Percent, Banknote, 
    AlertCircle, Sparkles, Award, MapPin, Share2, Instagram, 
    Facebook, Phone, Activity, TrendingUp, ChevronRight, ExternalLink, Target
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, Tooltip 
} from 'recharts';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Demo / default marketing photos matching screenshot
const defaultPhotos = [
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80', // Cocktails
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80', // Restaurant food / Tag
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', // Steak
    'https://images.unsplash.com/photo-1541544537156-7627a7a44b4b?auto=format&fit=crop&w=600&q=80', // Snack platter
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', // Grilled skewers
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80', // Tacos / Pizza
];

const CouponManager = ({ restaurantId }) => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [activeAiTip, setActiveAiTip] = useState(0);

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase: 0,
        valid_until: '',
        usage_limit: '',
        title: '', // e.g. "Bebidas Gratuitas p/ Jantar"
        image_url: '' // optional custom photo
    });

    const [geoConfig, setGeoConfig] = useState({
        radius: 5, // km
        active: true,
        whatsapp_trigger: '931775117',
        maps_url: 'https://maps.app.goo.gl/vo6MNLiEXcwrn1L'
    });

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        if (restaurantId) {
            const { data, error } = await couponService.getRestaurantCoupons(restaurantId);
            if (!error && data && data.length > 0) {
                setCoupons(data);
            } else {
                // If no real coupons in DB, inject demo promotions matching screenshot exactly
                setCoupons([
                    { id: '1', title: 'Bebidas Gratuitas p/ Jantar', code: 'JANTARVIP', discount_type: 'percentage', discount_value: 100, min_purchase: 15000, usage_count: 14, image_url: defaultPhotos[0] },
                    { id: '2', title: 'Desconto 15% - Segunda-feira', code: 'SEGUNDA15', discount_type: 'percentage', discount_value: 15, min_purchase: 5000, usage_count: 42, image_url: defaultPhotos[1] },
                    { id: '3', title: 'Prato Especial p/ Eventos', code: 'EVENTO20', discount_type: 'fixed', discount_value: 3000, min_purchase: 25000, usage_count: 8, image_url: defaultPhotos[2] },
                    { id: '4', title: 'Bebidas Gratuitas p/ Jantar', code: 'HAPPYHOUR', discount_type: 'percentage', discount_value: 50, min_purchase: 8000, usage_count: 29, image_url: defaultPhotos[3] },
                    { id: '5', title: 'Prato Especial p/ Eventos', code: 'GRELHADOS', discount_type: 'fixed', discount_value: 2000, min_purchase: 12000, usage_count: 19, image_url: defaultPhotos[4] },
                    { id: '6', title: 'Prato em p/ Eventos', code: 'FESTA25', discount_type: 'percentage', discount_value: 25, min_purchase: 30000, usage_count: 5, image_url: defaultPhotos[5] }
                ]);
            }
        }
        setLoading(false);
    }, [restaurantId]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!newCoupon.code || !newCoupon.discount_value) {
            toast.error("Preencha o código e o valor do desconto");
            return;
        }

        const { error } = await couponService.saveCoupon({
            code: newCoupon.code.toUpperCase(),
            discount_type: newCoupon.discount_type,
            discount_value: parseFloat(newCoupon.discount_value),
            min_purchase: parseFloat(newCoupon.min_purchase || 0),
            usage_limit: newCoupon.usage_limit ? parseInt(newCoupon.usage_limit) : null,
            valid_until: newCoupon.valid_until || null,
            restaurant_id: restaurantId,
        });

        if (error) {
            toast.error("Erro ao guardar cupão na base de dados");
        } else {
            toast.success("Campanha/Cupão criado com sucesso!");
            setIsAdding(false);
            setNewCoupon({ code: '', discount_type: 'percentage', discount_value: '', min_purchase: 0, valid_until: '', usage_limit: '', title: '', image_url: '' });
            fetchCoupons();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja eliminar esta campanha?")) return;
        // Check if demo item
        if (id.length <= 2) {
            setCoupons(prev => prev.filter(c => c.id !== id));
            toast.success("Campanha removida com sucesso");
            return;
        }
        const { error } = await couponService.deleteCoupon(id);
        if (error) toast.error("Erro ao eliminar");
        else {
            toast.success("Cupão eliminado");
            fetchCoupons();
        }
    };

    // Recharts Data matching screenshot perfectly
    const visibilityData = [
        { day: 'Seg', engajamento: 15, conversao: 5 },
        { day: 'Ter', engajamento: 45, conversao: 25 },
        { day: 'Qua', engajamento: 30, conversao: 12 },
        { day: 'Qui', engajamento: 65, conversao: 30 },
        { day: 'Sex', engajamento: 110, conversao: 85 },
        { day: 'Sáb', engajamento: 120, conversao: 95 },
        { day: 'Dom', engajamento: 90, conversao: 70 },
    ];

    const hourlyData = [
        { hour: '1', clicks: 12 }, { hour: '2', clicks: 15 }, { hour: '3', clicks: 8 }, { hour: '4', clicks: 5 },
        { hour: '5', clicks: 10 }, { hour: '6', clicks: 25 }, { hour: '7', clicks: 45 }, { hour: '8', clicks: 65 },
        { hour: '9', clicks: 80 }, { hour: '10', clicks: 70 }, { hour: '11', clicks: 90 }, { hour: '12', clicks: 120 },
        { hour: '13', clicks: 110 }, { hour: '14', clicks: 135 }, { hour: '15', clicks: 150 }, { hour: '16', clicks: 165 },
        { hour: '17', clicks: 140 }, { hour: '18', clicks: 130 }, { hour: '19', clicks: 145 }, { hour: '20', clicks: 155 },
        { hour: '21', clicks: 130 }, { hour: '22', clicks: 90 }, { hour: '23', clicks: 50 }, { hour: '24', clicks: 25 },
    ];

    // AI Tips matching screenshot
    const aiTips = [
        { title: "Sugerir Promoção p/ Noites de Sexta", desc: "Sugerir Promoção p/ Noites de Sexta e pessoas entrarem com os amigos nas combinações de pratos e petiscos de maior saída na esplanada.", badge: "Estratégia" },
        { title: "Rever Staff p/ Picos de Sábado", desc: "Rever Staff p/ Picos e ritmos de Sábado. Sugerimos ativar notificações no WhatsApp para clientes com cupões guardados antes das 18h.", badge: "Conversão" },
        { title: "Sugerir Promoção de Decisão", desc: "Sugerir promoção de vinhos e bebidas premium em coordenação com as campanhas de Geo-Fencing num raio de 5km de Talatona.", badge: "Público VIP" }
    ];

    useEffect(() => {
        const interval = setInterval(() => { setActiveAiTip((prev) => (prev + 1) % aiTips.length); }, 12000);
        return () => clearInterval(interval);
    }, []);

    const inputClasses = "w-full px-4 py-3 bg-black/60 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white text-xs font-bold shadow-inner";
    const labelClasses = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-white font-sans max-w-[1600px] mx-auto">
            
            {/* Top Banner matching screenshot exactly */}
            <div className="bg-gradient-to-r from-[#181818]/95 via-[#141414]/95 to-[#101010]/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 blur-[90px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                <div className="z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                            WORKSPACE &gt; MARKETING
                        </span>
                        <span className="text-gray-400 text-xs flex items-center gap-1 font-mono">
                            <Activity size={12} className="text-emerald-400 animate-pulse" /> Campanhas Ativas
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight flex items-center gap-3">
                        Módulo de Marketing & Campanhas
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Atraia e retenha clientes com códigos de desconto VIP e campanhas geolocalizadas.
                    </p>
                </div>

                <div className="flex items-center gap-4 z-10 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black px-5 py-3.5 rounded-2xl transition-all flex items-center gap-2 text-xs uppercase tracking-wider shrink-0 cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>{isAdding ? 'Fechar Editor' : 'Criar Campanha'}</span>
                    </button>

                    <button
                        onClick={() => setShowAiModal(true)}
                        className="bg-gradient-to-r from-[#D4AF37] via-[#F9E6A2] to-[#D4AF37] text-gray-950 font-black px-6 py-3.5 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-amber-300/40 text-xs tracking-wider uppercase cursor-pointer shrink-0"
                    >
                        <Sparkles size={16} />
                        <span>AI Business Assistant</span>
                    </button>
                </div>
            </div>

            {/* Coupon / Campaign Creator Form */}
            {isAdding && (
                <div className="bg-[#121213]/95 backdrop-blur-xl border border-[#D4AF37]/40 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                        <h3 className="text-xl font-serif font-bold text-[#D4AF37] flex items-center gap-2">
                            <Ticket size={24} /> Criar Novo Cupão VIP
                        </h3>
                        <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>

                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className={labelClasses}>Título da Campanha</label>
                            <input
                                type="text"
                                placeholder="Ex: Bebidas Gratuitas p/ Jantar"
                                className={inputClasses}
                                value={newCoupon.title}
                                onChange={e => setNewCoupon({ ...newCoupon, title: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Código Promocional</label>
                            <input
                                type="text"
                                placeholder="EX: JANTARVIP"
                                className={`${inputClasses} uppercase font-mono`}
                                value={newCoupon.code}
                                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Tipo de Desconto</label>
                            <select
                                className={inputClasses}
                                value={newCoupon.discount_type}
                                onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                            >
                                <option value="percentage" className="bg-gray-900 text-white font-bold">Percentual (%)</option>
                                <option value="fixed" className="bg-gray-900 text-white font-bold">Valor Fixo (Kz)</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>Valor do Desconto</label>
                            <input
                                type="number"
                                placeholder={newCoupon.discount_type === 'percentage' ? "Ex: 15" : "Ex: 2500"}
                                className={inputClasses}
                                value={newCoupon.discount_value}
                                onChange={e => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Compra Mínima (Kz)</label>
                            <input
                                type="number"
                                placeholder="Ex: 5000 (Opcional)"
                                className={inputClasses}
                                value={newCoupon.min_purchase}
                                onChange={e => setNewCoupon({ ...newCoupon, min_purchase: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>URL da Imagem (Opcional)</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                className={inputClasses}
                                value={newCoupon.image_url}
                                onChange={e => setNewCoupon({ ...newCoupon, image_url: e.target.value })}
                            />
                        </div>

                        <div className="lg:col-span-3 pt-4 border-t border-white/5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] hover:brightness-110 rounded-xl text-xs font-black text-gray-950 uppercase tracking-widest shadow-lg transition-all cursor-pointer"
                            >
                                Guardar Campanha Ativa
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Top Large Section: Dual Chart Card matching screenshot exactly */}
            <div className="bg-gradient-to-br from-[#1A1A1C]/95 via-[#121213]/95 to-[#0A0A0B]/95 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#D4AF37]/40 shadow-[0_0_60px_rgba(212,175,55,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#3B82F6]/10 blur-[100px] rounded-full pointer-events-none -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/10 blur-[100px] rounded-full pointer-events-none -ml-32 -mb-32" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                    
                    {/* Left Chart: Visibilidade por Dia da Semana */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="text-[#D4AF37] font-black">‹</span>
                                <h3 className="font-serif font-black text-white text-base">Visibilidade por Dia da Semana</h3>
                            </div>
                            <span className="bg-black/50 border border-white/10 text-[10px] text-gray-400 font-mono px-3 py-1 rounded-full font-bold">
                                Rolling 7
                            </span>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-1.5 text-blue-400">
                                <span className="w-2.5 h-2.5 rounded bg-blue-500 shadow-[0_0_8px_#3B82F6]" /> Taxa de Engajamento
                            </span>
                            <span className="flex items-center gap-1.5 text-[#D4AF37]">
                                <span className="w-2.5 h-2.5 rounded bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" /> Conversão de Vendas
                            </span>
                        </div>

                        {/* Area Chart Container */}
                        <div className="h-[240px] w-full pt-4 relative">
                            {/* Callout matching screenshot */}
                            <div className="absolute top-6 right-20 z-20 bg-black/90 border border-[#D4AF37] p-2.5 rounded-2xl text-[10px] font-mono font-bold text-[#D4AF37] shadow-2xl pointer-events-none max-w-[150px]">
                                <p className="leading-tight">Visibility Time / Cliques para noite posicionado</p>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visibilityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" stroke="#666" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#121213', borderColor: '#D4AF37', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="engajamento" stroke="#3B82F6" strokeWidth={3} fill="url(#engGrad)" />
                                    <Area type="monotone" dataKey="conversao" stroke="#D4AF37" strokeWidth={3} fill="url(#convGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Chart: Top Horários de Interação */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <h3 className="font-serif font-black text-white text-base">Top Horários de Interação</h3>
                            <span className="text-[10px] text-gray-400 font-mono">Atualização Ao Vivo</span>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-1.5 text-[#D4AF37]">
                                <span className="w-2.5 h-2.5 rounded bg-[#D4AF37]" /> Taxa de Abertura de E-mail vs. Cliques
                            </span>
                        </div>

                        {/* Bar Chart Container */}
                        <div className="h-[240px] w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                    <XAxis dataKey="hour" stroke="#666" fontSize={9} tickLine={false} interval={1} />
                                    <YAxis stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#121213', borderColor: '#D4AF37', borderRadius: '12px' }} />
                                    <Bar dataKey="clicks" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid: Left = Coupon Cards Grid (2 cols), Right = Stacked Columns / AI Drawer (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Area (2 Cols): Campaign / Coupon Cards matching screenshot exactly */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-serif font-bold text-white text-lg flex items-center gap-2">
                            <span>🎟️</span> Campanhas Promocionais Ativas
                        </h3>
                        <span className="text-xs text-[#D4AF37] font-mono font-bold">{coupons.length} Campanhas</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {coupons.map((coupon, idx) => {
                            const photoUrl = coupon.image_url || defaultPhotos[idx % defaultPhotos.length];
                            
                            return (
                                <div 
                                    key={coupon.id || idx}
                                    className="bg-[#121213]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-[#D4AF37]/50 transition-all duration-500 min-h-[220px]"
                                >
                                    {/* Background Image / Tint */}
                                    <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity bg-cover bg-center" style={{ backgroundImage: `url('${photoUrl}')` }} />
                                    <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent" />

                                    <div className="relative z-10 flex justify-between items-start">
                                        <div>
                                            <h4 className="font-serif font-black text-white text-lg tracking-tight group-hover:text-[#D4AF37] transition-colors leading-tight max-w-[200px]">
                                                {coupon.title || 'Campanha Exclusiva VIP'}
                                            </h4>
                                            <span className="inline-block mt-2 px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs rounded-lg font-black uppercase tracking-widest shadow-md">
                                                {coupon.code}
                                            </span>
                                        </div>

                                        {/* Golden Ribbon Icon matching screenshot */}
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] text-gray-950 flex items-center justify-center font-black shadow-[0_0_20px_rgba(212,175,55,0.4)] rotate-3 group-hover:rotate-12 transition-transform shrink-0">
                                            <Award size={24} />
                                        </div>
                                    </div>

                                    <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold mt-6">
                                        <div className="flex items-center gap-1.5 text-emerald-400">
                                            <span>✓</span>
                                            <span>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}% de desconto` : `${coupon.discount_value} Kz off`}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400 text-[10px] font-mono">{coupon.usage_count || 0} resgates</span>
                                            <button 
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-red-400/80 hover:text-red-400 p-1 rounded transition-colors"
                                                title="Eliminar Campanha"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Area: Geo-Fencing & Socials + AI Drawer */}
                <div className="space-y-6">
                    
                    {/* Card 1: Link Google Maps + Geo-Fencing Campaign matching screenshot */}
                    <div className="bg-[#121213]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-xl relative overflow-hidden space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                                <Target size={20} />
                            </div>
                            <h3 className="font-serif font-black text-white text-base">Link Google Maps</h3>
                        </div>

                        {/* Geo-Fencing Radar Map Graphic matching screenshot */}
                        <div className="w-full h-36 rounded-2xl overflow-hidden border border-white/10 relative group">
                            <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80')` }}>
                                {/* Golden Radar Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 rounded-full bg-[#D4AF37]/30 border-2 border-[#D4AF37] animate-ping opacity-75 absolute" />
                                    <div className="w-16 h-16 rounded-full bg-[#D4AF37]/40 border border-[#D4AF37] flex items-center justify-center shadow-[0_0_20px_#D4AF37] z-10">
                                        <MapPin size={24} className="text-gray-950 animate-bounce" />
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                            <div className="absolute top-3 right-3 bg-black/80 border border-[#D4AF37]/50 text-[#D4AF37] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono shadow-lg">
                                Geo-Fencing Campaign
                            </div>
                            <div className="absolute bottom-3 left-3 text-[10px] font-mono text-gray-300">
                                Raio ativo de {geoConfig.radius} KM
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>LINK GOOGLE MAPS</label>
                            <input
                                type="url"
                                className={inputClasses}
                                value={geoConfig.maps_url}
                                onChange={e => setGeoConfig({ ...geoConfig, maps_url: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Card 2: Redes Sociais & Contacto matching screenshot */}
                    <div className="bg-[#121213]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-xl relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
                                <Share2 size={20} />
                            </div>
                            <h3 className="font-serif font-black text-white text-base">Redes Sociais & Contacto</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Instagram</label>
                                <div className="relative">
                                    <Instagram size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400" />
                                    <input type="text" className={`${inputClasses} pl-10`} defaultValue="@jindungo" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Facebook</label>
                                <div className="relative">
                                    <Facebook size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
                                    <input type="text" className={`${inputClasses} pl-10`} defaultValue="jindungo" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={`${labelClasses} text-[#D4AF37]`}>Número de WhatsApp</label>
                            <div className="flex gap-3 items-center">
                                <div className="relative flex-1">
                                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                                    <input type="tel" className={`${inputClasses} pl-10 border-[#D4AF37]/40`} value={geoConfig.whatsapp_trigger} onChange={e => setGeoConfig({ ...geoConfig, whatsapp_trigger: e.target.value })} />
                                </div>
                                <button 
                                    onClick={() => toast.success("Campanha Geo-Fencing de WhatsApp ativada!")}
                                    className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-gray-950 font-black px-4 py-3 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition-all text-[11px] uppercase tracking-wider shrink-0 cursor-pointer"
                                >
                                    Geo-Fenc. Campaign
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Marketing & Texto de Partilha */}
                    <div className="bg-[#121213]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-xl relative space-y-4">
                        <div>
                            <label className={labelClasses}>Marketing & Texto de Partilha</label>
                            <input type="text" className={inputClasses} defaultValue="Veja o nosso menu digital!" />
                        </div>

                        <div className="pt-2 border-t border-white/5">
                            <label className={labelClasses}>Mapa de Mesas Digital</label>
                            <div className="flex gap-2">
                                {['🪑 Mesa 1', '🪑 Mesa 2', '🪑 VIP'].map((t, idx) => (
                                    <span key={idx} className="bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Screenshot AI Drawer: Dicas de Tomada de Decisão */}
                    <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl border border-[#D4AF37]/40 rounded-[2.5rem] p-7 shadow-[0_0_40px_rgba(212,175,55,0.2)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] text-gray-950 flex items-center justify-center font-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-lg tracking-wide">Dicas de Tomada de Decisão</h3>
                                    <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase font-mono">Estratégias IA</span>
                                </div>
                            </div>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
                            </span>
                        </div>

                        {/* Rotating AI Tips matching screenshot */}
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

            {/* AI Assistant Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#121213] border border-[#D4AF37]/50 rounded-[2.5rem] p-8 max-w-lg w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#D4AF37] text-gray-950 font-black rounded-2xl flex items-center justify-center text-xl shadow-lg">
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-xl">AI Business Assistant</h3>
                                    <span className="text-xs text-[#D4AF37] font-mono">Conselheiro de Campanhas</span>
                                </div>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-white p-2">✕</button>
                        </div>

                        <div className="space-y-5 relative z-10 text-sm text-gray-300 leading-relaxed">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-[#D4AF37] mb-1">🎯 Eficácia de Geo-Fencing</h4>
                                <p className="text-xs">As campanhas geolocalizadas na zona de Talatona tiveram 4.2x mais resgates às Sextas-feiras. Recomendamos manter o raio de 5 KM durante o fim de semana.</p>
                            </div>

                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-emerald-400 mb-1">📈 Retenção com Cupão de Jantar</h4>
                                <p className="text-xs">O cupão 'JANTARVIP' trouxe 14 novos clientes que repetiram o pedido na mesma semana. Sugerimos ativar o disparo via WhatsApp para este segmento.</p>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 flex justify-end relative z-10">
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="bg-[#D4AF37] hover:bg-amber-400 text-gray-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all"
                            >
                                Aplicar Recomendações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponManager;

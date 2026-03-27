import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search, MapPin, Clock, Utensils, Star, ArrowRight, Calendar, Share2, Bike } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import BookingModal from '../components/BookingModal';
import { useSettings } from '../context/SettingsContext';

const Explorar = () => {
    const [restaurants, setRestaurants] = useState([]);
    const { logoUrl } = useSettings();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterDelivery, setFilterDelivery] = useState(false);
    const [bookingTarget, setBookingTarget] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { fetchRestaurants(); }, []);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('restaurants').select('*').order('name');
            if (error) throw error;
            setRestaurants(data || []);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkIsOpen = (businessInfo) => {
        if (!businessInfo?.opening_hours) return true;
        const now = new Date();
        const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const currentDay = dayNames[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const todayConfig = businessInfo.opening_hours.find(h => h.day === currentDay);
        if (!todayConfig || todayConfig.closed) return false;
        const [openH, openM] = todayConfig.open.split(':').map(Number);
        const [closeH, closeM] = todayConfig.close.split(':').map(Number);
        return currentTime >= openH * 60 + openM && currentTime <= closeH * 60 + closeM;
    };

    const getTodayHours = (businessInfo) => {
        if (!businessInfo?.opening_hours) return null;
        const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return businessInfo.opening_hours.find(h => h.day === dayNames[new Date().getDay()]);
    };

    const handleShare = async (res, e) => {
        e.stopPropagation();
        const shareData = { title: res.name, text: `Vê o menu digital de ${res.name}!`, url: `${window.location.origin}/${res.slug}` };
        try {
            if (navigator.share) await navigator.share(shareData);
            else await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        } catch { }
    };

    const filteredRestaurants = restaurants
        .map(res => ({ ...res, _isOpen: checkIsOpen(res.business_info), _hasDelivery: !!res.delivery_config?.enabled }))
        .filter(res => {
            const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (res.slug && res.slug.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesSearch && (!filterOpen || res._isOpen) && (!filterDelivery || res._hasDelivery);
        })
        .sort((a, b) => {
            if (a._isOpen && !b._isOpen) return -1;
            if (!a._isOpen && b._isOpen) return 1;
            return a.name.localeCompare(b.name);
        });

    const getDishCount = (res) => {
        if (!Array.isArray(res.categories)) return null;
        return res.categories.reduce((sum, c) => sum + (c.menu_items?.length || 0), 0);
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#D4AF37] selection:text-black">

            {/* Top Navigation */}
            <header className="absolute top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent md:bg-none">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37]/50 shadow-lg transition-all group-hover:scale-105 overflow-hidden shrink-0">
                        <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                    </div>
                    <span className="font-serif font-bold text-xl md:text-2xl tracking-tight text-white group-hover:text-[#D4AF37] transition-colors">
                        Jindungo<span className="text-[#D4AF37] opacity-80 font-medium hidden sm:inline">Menus</span>
                    </span>
                </div>
                <button onClick={() => navigate('/login')} className="text-xs md:text-sm font-bold text-gray-400 hover:text-white bg-white/5 px-3 py-2 md:px-4 md:py-2 rounded-xl border border-white/10 hover:border-white/30 transition-colors shrink-0 whitespace-nowrap">
                    Acesso Admin
                </button>
            </header>

            {/* Hero */}
            <div className="relative min-h-[45vh] pt-32 pb-16 md:pt-0 md:pb-0 md:h-[42vh] flex items-center justify-center overflow-hidden border-b border-white/5 flex-col">
                <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/10 to-transparent opacity-50" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto w-full mt-10 md:mt-0">
                    <h1 className="text-4xl md:text-7xl font-serif font-black mb-4 tracking-tight bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent leading-tight">
                        Explorar Jindungo
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg font-medium max-w-2xl mx-auto mb-6">
                        Descubra os melhores sabores de Angola. Reserve, encomende e delicie-se.
                    </p>
                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#D4AF37] transition-all">
                            <Search size={20} strokeWidth={2.5} />
                        </div>
                        <input
                            type="text"
                            placeholder="Procure restaurantes..."
                            className="w-full bg-black/40 border-2 border-white/5 rounded-[2rem] py-5 pl-14 pr-8 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-black/60 transition-all text-lg backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] placeholder:text-gray-600 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main */}
            <main className="max-w-7xl mx-auto px-4 py-10">

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Filtros:</span>
                    <button
                        onClick={() => setFilterOpen(f => !f)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all ${filterOpen ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
                    >
                        🟢 Aberto Agora
                    </button>
                    <button
                        onClick={() => setFilterDelivery(f => !f)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all ${filterDelivery ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
                    >
                        <Bike size={14} /> Com Entrega
                    </button>
                    <span className="ml-auto text-gray-500 text-sm">{filteredRestaurants.length} estabelecimentos</span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[380px] bg-white/5 rounded-[2rem] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : filteredRestaurants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredRestaurants.map(res => {
                            const todayHours = getTodayHours(res.business_info);
                            const dishCount = getDishCount(res);
                            return (
                                <div
                                    key={res.id}
                                    onClick={() => navigate(`/${res.slug}`)}
                                    className="group bg-[#111111] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-[#D4AF37]/10 flex flex-col h-full"
                                >
                                    {/* Image Area */}
                                    <div className="h-52 bg-[#1A1A1A] relative overflow-hidden flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                        {res.theme_config?.logoUrl ? (
                                            <img src={res.theme_config.logoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" alt={res.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl font-serif text-white/10">{res.name[0]}</div>
                                        )}
                                        {/* Status badges */}
                                        <div className="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${res._isOpen ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                                {res._isOpen ? '● Aberto' : '● Fechado'}
                                            </div>
                                            {res._hasDelivery && (
                                                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1">
                                                    <Bike size={10} /> Entrega
                                                </div>
                                            )}
                                        </div>
                                        {/* Share */}
                                        <button onClick={(e) => handleShare(res, e)} className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/70 rounded-full border border-white/10 transition-all">
                                            <Share2 size={14} className="text-white" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">{res.name}</h3>
                                            <div className="flex items-center gap-1 text-[#D4AF37]">
                                                <Star size={12} fill="currentColor" />
                                                <span className="text-xs font-bold">Novo</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-5 flex-1">
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <MapPin size={14} className="text-[#D4AF37] shrink-0" />
                                                <span className="line-clamp-1">{res.business_info?.location?.address || 'Angola'}</span>
                                            </div>
                                            {todayHours && !todayHours.closed ? (
                                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                    <Clock size={14} className="text-[#D4AF37] shrink-0" />
                                                    <span>{todayHours.open} – {todayHours.close}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                    <Clock size={14} className="shrink-0" />
                                                    <span>Horário não definido</span>
                                                </div>
                                            )}
                                            {dishCount !== null && (
                                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                    <Utensils size={14} className="text-[#D4AF37] shrink-0" />
                                                    <span>{dishCount} pratos disponíveis</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 pt-4 border-t border-white/5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setBookingTarget({ id: res.id, name: res.name }); }}
                                                className="flex-1 bg-white/5 hover:bg-[#D4AF37]/10 text-gray-300 hover:text-[#D4AF37] border border-white/10 hover:border-[#D4AF37]/30 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                            >
                                                <Calendar size={13} /> Reservar
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/${res.slug}`); }}
                                                className="flex-1 bg-[#D4AF37] hover:bg-[#B3932D] text-black py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-lg"
                                            >
                                                Menu <ArrowRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={Search}
                        title="Nenhum restaurante encontrado"
                        description={searchQuery ? `Sem resultados para "${searchQuery}".` : 'Nenhum restaurante corresponde aos filtros selecionados.'}
                        action={
                            <button onClick={() => { setSearchQuery(''); setFilterOpen(false); setFilterDelivery(false); }} className="text-[#D4AF37] hover:underline font-bold text-sm">
                                Limpar filtros
                            </button>
                        }
                    />
                )}
            </main>

            <BookingModal
                isOpen={!!bookingTarget}
                onClose={() => setBookingTarget(null)}
                restaurantId={bookingTarget?.id}
                restaurantName={bookingTarget?.name}
            />

            <footer className="border-t border-white/5 py-10 px-4 text-center">
                <p className="text-gray-500 text-sm">© 2026 Jindungo Menus. Elevando a gastronomia Angolana.</p>
            </footer>
        </div>
    );
};

export default Explorar;

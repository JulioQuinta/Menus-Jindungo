import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search, MapPin, Clock, Utensils, Star, ArrowRight, Filter, ShoppingBag, Calendar } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import BookingModal from '../components/BookingModal';

const Explorar = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [bookingTarget, setBookingTarget] = useState(null); // {id, name}
    const navigate = useNavigate();

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .order('name');

            if (error) throw error;
            setRestaurants(data || []);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkIsOpen = (businessInfo) => {
        if (!businessInfo?.opening_hours) return true; // Default to open if no info

        const now = new Date();
        const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const currentDay = dayNames[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const todayConfig = businessInfo.opening_hours.find(h => h.day === currentDay);

        if (!todayConfig || todayConfig.closed) return false;

        const [openH, openM] = todayConfig.open.split(':').map(Number);
        const [closeH, closeM] = todayConfig.close.split(':').map(Number);
        const openTime = openH * 60 + openM;
        const closeTime = closeH * 60 + closeM;

        return currentTime >= openTime && currentTime <= closeTime;
    };

    const filteredRestaurants = restaurants.filter(res => {
        const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (res.slug && res.slug.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
            {/* Hero Section */}
            <div className="relative h-[40vh] flex items-center justify-center overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/10 to-transparent opacity-50" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-serif font-black mb-6 tracking-tight bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
                        Explorar Jindungo
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8">
                        Descubra os melhores sabores de Angola, reserve a sua mesa e delicie-se com experiências gastronómicas únicas.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#D4AF37] transition-all duration-300">
                            <Search size={24} strokeWidth={2.5} />
                        </div>
                        <input
                            type="text"
                            placeholder="Procure por restaurantes ou sabores..."
                            className="w-full bg-black/40 border-2 border-white/5 rounded-[2rem] py-6 pl-16 pr-8 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-black/60 transition-all text-xl backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] placeholder:text-gray-600 font-medium tracking-tight"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-2 rounded-2xl text-[10px] uppercase font-black tracking-widest border border-[#D4AF37]/20">
                                Marketplace
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-16">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[400px] bg-white/5 rounded-[2rem] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Utensils className="text-[#D4AF37]" size={24} />
                                Restaurantes Disponíveis
                            </h2>
                            <span className="text-gray-500 text-sm font-medium">
                                Mostrando {filteredRestaurants.length} estabelecimentos
                            </span>
                        </div>

                        {filteredRestaurants.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredRestaurants.map(res => {
                                    const isOpen = checkIsOpen(res.business_info);
                                    return (
                                        <div
                                            key={res.id}
                                            onClick={() => navigate(`/${res.slug}`)}
                                            className="group bg-[#111111] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-[#D4AF37]/10 flex flex-col h-full"
                                        >
                                            {/* Cover / Image Area */}
                                            <div className="h-56 bg-[#1A1A1A] relative overflow-hidden flex-shrink-0">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                                {res.theme_config?.logoUrl ? (
                                                    <img
                                                        src={res.theme_config.logoUrl}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                                                        alt={res.name}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-4xl font-serif text-white/10">
                                                        {res.name[0]}
                                                    </div>
                                                )}

                                                {/* Stats Badge */}
                                                <div className="absolute top-6 left-6 z-20">
                                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border animate-pulse-slow ${isOpen ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                                        {isOpen ? 'Aberto Agora' : 'Fechado'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-8 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="text-2xl font-bold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                                                        {res.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1 text-[#D4AF37]">
                                                        <Star size={14} fill="currentColor" />
                                                        <span className="text-sm font-bold">4.9</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-8 flex-1">
                                                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                                                        <MapPin size={16} className="text-[#D4AF37] shrink-0" />
                                                        <span className="line-clamp-1">{res.business_info?.location?.address || 'Angola'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                                                        <Clock size={16} className="text-[#D4AF37] shrink-0" />
                                                        <span>Reserva disponível hoje</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-6 border-t border-white/5">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setBookingTarget({ id: res.id, name: res.name });
                                                        }}
                                                        className="flex-1 bg-white/5 hover:bg-[#D4AF37]/10 text-gray-300 hover:text-[#D4AF37] border border-white/10 hover:border-[#D4AF37]/30 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                                    >
                                                        <Calendar size={14} /> Reservar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/${res.slug}`);
                                                        }}
                                                        className="flex-1 bg-[#D4AF37] hover:bg-[#B3932D] text-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-[#D4AF37]/10"
                                                    >
                                                        Menu <ArrowRight size={14} />
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
                                description={`Não encontramos resultados para "${searchQuery}". Tente usar termos mais genéricos ou verifique a ortografia.`}
                                action={
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-[#D4AF37] hover:underline font-bold text-sm"
                                    >
                                        Limpar pesquisa
                                    </button>
                                }
                            />
                        )}
                    </>
                )}
            </main>

            {/* Global Modals */}
            <BookingModal
                isOpen={!!bookingTarget}
                onClose={() => setBookingTarget(null)}
                restaurantId={bookingTarget?.id}
                restaurantName={bookingTarget?.name}
            />

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 px-4 text-center">
                <p className="text-gray-500 text-sm">© 2026 Jindungo Menus. Elevando a gastronomia Angolana.</p>
            </footer>
        </div>
    );
};

export default Explorar;

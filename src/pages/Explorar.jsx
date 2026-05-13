import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search, MapPin, Clock, Utensils, Star, ArrowRight, Calendar, Share2, Bike, LayoutGrid } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import BookingModal from '../components/BookingModal';
import { useSettings } from '../context/SettingsContext';

const Explorar = () => {
    const [restaurants, setRestaurants] = useState([]);
    const { logoUrl } = useSettings();
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterDelivery, setFilterDelivery] = useState(false);
    const [bookingTarget, setBookingTarget] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
 
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                // Select only PUBLIC columns to avoid RLS blocks on sensitive fields
                const { data, error } = await supabase
                    .from('restaurants')
                    .select('id, name, slug, status, theme_config, business_info, delivery_config')
                    .order('name');
                if (error) throw error;
                setRestaurants(data || []);
            } catch (err) {
                console.error('Marketplace fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const checkIsOpen = (businessInfo) => {
        const hours = businessInfo?.opening_hours;
        if (!hours || !Array.isArray(hours) || hours.length === 0) return true;

        const now = new Date();
        const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const currentDay = dayNames[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const todayConfig = hours.find(h => h.day === currentDay);
        if (!todayConfig || todayConfig.closed || !todayConfig.open || !todayConfig.close) return false;

        try {
            const [openH, openM] = todayConfig.open.split(':').map(Number);
            const [closeH, closeM] = todayConfig.close.split(':').map(Number);
            const openMinutes = openH * 60 + openM;
            const closeMinutes = closeH * 60 + closeM;

            if (openMinutes < closeMinutes) {
                return currentTime >= openMinutes && currentTime <= closeMinutes;
            } else {
                return currentTime >= openMinutes || currentTime <= closeMinutes;
            }
        } catch { return false; }
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

    const filteredRestaurants = (restaurants || [])
        .map(res => ({ 
            ...res, 
            _isOpen: checkIsOpen(res.business_info), 
            _hasDelivery: !!res.delivery_config?.enabled 
        }))
        .filter(res => {
            const name = res.name || '';
            const slug = res.slug || '';
            const search = (searchQuery || '').toLowerCase();
            return name.toLowerCase().includes(search) || slug.toLowerCase().includes(search);
        })
        .sort((a, b) => {
            if (a._isOpen && !b._isOpen) return -1;
            if (!a._isOpen && b._isOpen) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });

    const getDishCount = (res) => {
        if (!Array.isArray(res.categories)) return null;
        return res.categories.reduce((sum, c) => sum + (c.menu_items?.length || 0), 0);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D4AF37] selection:text-black scroll-smooth">

            {/* Top Navigation */}
            <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-4 md:px-8 py-3 md:py-4 ${isScrolled ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div onClick={() => navigate('/')} className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                        <div className="w-10 h-10 md:w-11 md:h-11 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37]/50 shadow-lg transition-all group-hover:rotate-6 overflow-hidden shrink-0">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-6 h-6 md:w-7 md:h-7 object-contain" />
                        </div>
                        <span className="font-serif font-black text-xl md:text-2xl tracking-tighter text-white group-hover:text-[#D4AF37] transition-colors uppercase italic">
                            Menus <span className="text-[#D4AF37] opacity-80 not-italic">Jindungo</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="hidden sm:flex text-xs md:text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 hover:border-white/30 transition-all shrink-0 whitespace-nowrap">
                            Acesso Admin
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative h-[70vh] md:h-[65vh] flex flex-col items-center justify-center pt-24 pb-20 overflow-hidden">
                {/* Mesh Gradient Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[#050505]" />
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-[#D4AF37]/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[70%] bg-[#D4AF37]/5 blur-[100px] rounded-full animate-pulse delay-1000" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
                </div>

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto w-full">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6 animate-fade-in">
                        <LayoutGrid size={12} /> A Maior Rede de Menus de Angola
                    </div>
                    <h1 className="text-5xl md:text-8xl font-serif font-black mb-6 tracking-tighter leading-tight bg-gradient-to-b from-white via-white to-gray-600 bg-clip-text text-transparent italic">
                        Explorar Jindungo
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
                        A gastronomia angolana elevada ao seu potencial máximo. <br className="hidden md:block"/> Descubra, reserve e deguste.
                    </p>

                    <div className="relative max-w-2xl mx-auto z-30">
                        <div className="relative flex items-center">
                            <div className="absolute left-6 text-[#D4AF37]">
                                <Search size={24} />
                            </div>
                            <input
                                type="text"
                                placeholder="Procurar restaurante ou especialidade..."
                                className="w-full bg-[#111111] border-2 border-[#D4AF37]/30 rounded-2xl py-5 pl-16 pr-8 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all text-lg text-white placeholder:text-gray-600 shadow-2xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 relative z-20 pb-20">
                
                {/* Filter & Solicitados Bar */}
                <div className="bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 md:p-6 mb-8 shadow-2xl flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] hidden lg:block">Filtros:</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilterOpen(f => !f)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${filterOpen ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#D4AF37]/50 hover:text-white'}`}
                            >
                                <Clock size={14} /> {filterOpen ? 'Aberto' : 'Todos'}
                            </button>
                            <button
                                onClick={() => setFilterDelivery(f => !f)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${filterDelivery ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/5 border-white/10 text-gray-400 hover:border-blue-500/50 hover:text-white'}`}
                            >
                                <Bike size={14} /> Entrega
                            </button>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-white/10 hidden md:block" />

                    <div className="flex-1 w-full overflow-hidden">
                        {!loading && filteredRestaurants.length > 0 && (
                            <div className="flex items-start pt-1 gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {filteredRestaurants.slice(0, 15).map(res => (
                                    <div 
                                        key={`pop-${res.id}`} 
                                        onClick={() => navigate(`/${res.slug}`)}
                                        className="flex flex-col items-center gap-2 min-w-[75px] cursor-pointer group shrink-0"
                                    >
                                        <div className="w-12 h-12 rounded-full ring-2 ring-transparent group-hover:ring-[#D4AF37] transition-all bg-[#1A1A1A] overflow-hidden border border-white/10 relative">
                                            {res.theme_config?.logoUrl ? (
                                                <img className="h-full w-full object-cover" src={res.theme_config.logoUrl} alt="" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-[10px] font-serif text-white/50 uppercase">{res.name[0]}</div>
                                            )}
                                            {res._isOpen && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400 group-hover:text-white truncate w-full text-center">{res.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {errorMsg && (
                    <div className="mb-10 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl text-red-400 text-center text-sm backdrop-blur-md">
                        <span className="opacity-70">⚠️ {errorMsg}</span>
                        <button onClick={() => window.location.reload()} className="ml-4 underline font-bold hover:text-red-300">Recarregar</button>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="h-[300px] bg-white/5 rounded-[2rem] animate-pulse border border-white/10" />
                        ))}
                    </div>
                ) : filteredRestaurants.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredRestaurants.map(res => {
                            const todayHours = getTodayHours(res.business_info);
                            return (
                                <div
                                    key={res.id}
                                    onClick={() => navigate(`/${res.slug}`)}
                                    className="group bg-[#0F0F0F] rounded-[2rem] overflow-hidden border border-white/5 hover:border-[#D4AF37]/40 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-[#D4AF37]/10 flex flex-col h-full relative"
                                >
                                    {/* Image Area */}
                                    <div className="h-32 md:h-40 bg-[#1A1A1A] relative overflow-hidden flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent z-10" />
                                        {res.theme_config?.logoUrl ? (
                                            <img src={res.theme_config.logoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" alt={res.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl font-serif text-white/5 italic uppercase">{res.name[0]}</div>
                                        )}
                                        
                                        <div className="absolute top-3 left-3 z-20">
                                            <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest backdrop-blur-md border ${res._isOpen ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                                {res._isOpen ? 'Aberto' : 'Fechado'}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={(e) => handleShare(res, e)} 
                                            className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 hover:bg-[#D4AF37] hover:text-black rounded-xl border border-white/10 transition-all flex items-center justify-center"
                                        >
                                            <Share2 size={12} />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 md:p-5 flex flex-col flex-1">
                                        <h3 className="text-sm md:text-base font-serif font-black text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1 italic mb-2">
                                            {res.name}
                                        </h3>

                                        <div className="space-y-1.5 mb-4 flex-1">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <MapPin size={10} className="text-[#D4AF37]" />
                                                <span className="line-clamp-1 text-[10px]">{res.business_info?.location?.address || 'Angola'}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Clock size={10} className="text-[#D4AF37]" />
                                                <span className="text-[10px]">
                                                    {todayHours && !todayHours.closed ? todayHours.open : 'Fechado'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-3 border-t border-white/5 mt-auto">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/${res.slug}`); }}
                                                className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B3932D] text-black h-9 rounded-xl transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px]"
                                            >
                                                Menu <ArrowRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20">
                        <EmptyState
                            icon={Search}
                            title="Nada por aqui..."
                            description={
                                searchQuery 
                                ? `Não encontramos nenhum restaurante que combine com "${searchQuery}".` 
                                : 'A nossa rede está a crescer. Volte em breve para novos sabores.'
                            }
                            action={
                                <button onClick={() => { setSearchQuery(''); setFilterOpen(false); setFilterDelivery(false); }} className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[#D4AF37] font-black uppercase tracking-widest text-xs transition-all">
                                    Limpar Pesquisa
                                </button>
                            }
                        />
                    </div>
                )}
            </main>

            {/* Booking Modal */}
            <BookingModal
                isOpen={!!bookingTarget}
                onClose={() => setBookingTarget(null)}
                restaurantId={bookingTarget?.id}
                restaurantName={bookingTarget?.name}
            />

            {/* Footer */}
            <footer className="border-t border-white/5 py-20 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#D4AF37]/5 blur-[120px] opacity-30" />
                <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center">
                            <img src="/jindungo_logo_v3.png" className="w-5 h-5 brightness-0" alt="" />
                        </div>
                        <span className="font-serif font-black text-xl tracking-tighter uppercase italic">
                            Menus <span className="text-[#D4AF37] not-italic">Jindungo</span>
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">© 2026 Menus Jindungo. Elevando a gastronomia Angolana através da tecnologia.</p>
                </div>
            </footer>
        </div>
    );
};

export default Explorar;

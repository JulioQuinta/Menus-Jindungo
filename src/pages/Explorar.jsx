import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search, MapPin, Clock, Star, Share2, Bike, LayoutGrid, ArrowRight, Filter } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import BookingModal from '../components/BookingModal';
import { useSettings } from '../context/SettingsContext';

const Explorar = () => {
    const [restaurants, setRestaurants] = useState([]);
    const { logoUrl } = useSettings();
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'delivery' | 'open'
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
                const { data, error } = await supabase
                    .from('restaurants')
                    .select('id, name, slug, status, theme_config, business_info, delivery_config')
                    .order('name');
                if (error) throw error;
                setRestaurants(data || []);
            } catch (err) {
                console.error('Marketplace fetch failed:', err);
                setErrorMsg('Não foi possível carregar os restaurantes. Tente recarregar a página.');
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
        .map(res => {
            const cleanName = res.name?.trim() ? res.name.trim() : `Restaurante ${res.id ? res.id.toString().slice(0, 4) : 'VIP'}`;
            return { 
                ...res, 
                name: cleanName,
                _isOpen: checkIsOpen(res.business_info), 
                _hasDelivery: !!res.delivery_config?.enabled,
                _rating: res.business_info?.rating || 4.8,
                _priceTier: res.business_info?.price_tier || '€€',
                _cover: res.theme_config?.bannerUrl || res.theme_config?.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800"
            };
        })
        .filter(res => {
            if (activeFilter === 'delivery' && !res._hasDelivery) return false;
            if (activeFilter === 'open' && !res._isOpen) return false;

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

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white font-sans selection:bg-[#D4AF37] selection:text-black relative overflow-x-hidden">

            {/* Ambient Golden Stardust Glows */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80vw] h-[35vh] bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/15 to-amber-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse-slow z-0"></div>
            <div className="absolute top-10 right-10 w-[40vw] h-[40vw] bg-[#D4AF37]/10 blur-[160px] rounded-full pointer-events-none z-0"></div>

            {/* Header & Navigation */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${
                isScrolled ? 'bg-[#121214]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl' : 'bg-[#121214] border-b border-white/5'
            }`}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group select-none">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center border border-[#D4AF37]/40 group-hover:border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)] shadow-2xl transition-all overflow-hidden shrink-0 transition-all duration-300">
                            <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-[1.23]" />
                        </div>
                        <span className="font-serif font-black text-xl tracking-tight text-white group-hover:text-[#D4AF37] transition-colors uppercase">
                            Menus<span className="text-[#D4AF37]">Jindungo</span>
                        </span>
                    </div>
                    <button 
                        onClick={() => navigate('/login')} 
                        className="border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold text-xs px-5 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] uppercase tracking-wider"
                    >
                        Acesso Admin
                    </button>
                </div>
            </header>

            {/* Hero Search Section */}
            <section className="relative pt-36 sm:pt-44 pb-12 px-6 z-10 text-center max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-6xl font-serif font-bold mb-4 tracking-tight leading-tight text-white">
                    Explorar <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-clip-text text-transparent italic font-black">Jindungo</span>
                </h1>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                    A gastronomia angolana elevada ao seu potencial máximo. Descubra, reserve e deguste.
                </p>

                {/* Search Bar matching screenshot */}
                <div className="relative max-w-2xl mx-auto mb-10 rounded-full shadow-[0_0_35px_rgba(212,175,55,0.15)]">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]">
                        <Search size={22} strokeWidth={2.5} />
                    </div>
                    <input
                        type="text"
                        placeholder="Procurar restaurantes, pratos ou localizações..."
                        className="w-full bg-[#18181B]/80 backdrop-blur-xl border border-[#D4AF37]/50 rounded-full py-4.5 pl-16 pr-8 focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_25px_rgba(212,175,55,0.3)] transition-all text-base text-white placeholder:text-gray-500 shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </section>

            {/* Main Marketplace Area */}
            <main className="max-w-7xl mx-auto px-6 relative z-20 pb-28">
                
                {/* Horizontal Stories & Quick Filters Bar ("FILTROE") matching screenshot */}
                <div className="bg-[#18181B]/80 backdrop-blur-xl border border-white/10 rounded-full p-2.5 mb-12 shadow-2xl flex items-center gap-4 max-w-5xl mx-auto overflow-x-auto scrollbar-hide select-none">
                    <div className="flex items-center gap-2 pl-4 shrink-0">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest hidden sm:inline-block">Filtros:</span>
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                activeFilter === 'all' 
                                    ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                            }`}
                        >
                            <LayoutGrid size={14} /> Todos
                        </button>
                        <button
                            onClick={() => setActiveFilter('delivery')}
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                activeFilter === 'delivery' 
                                    ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                            }`}
                        >
                            <Bike size={14} /> Entregas
                        </button>
                        <button
                            onClick={() => setActiveFilter('open')}
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                activeFilter === 'open' 
                                    ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                            }`}
                        >
                            <Clock size={14} /> Aberto Hoje
                        </button>
                    </div>

                    <div className="w-px h-7 bg-white/10 shrink-0 hidden md:block" />

                    {/* Right: Circular Restaurant Stories matching screenshot */}
                    <div className="flex items-center gap-4 overflow-x-auto pr-4 shrink-0 scrollbar-hide py-1">
                        {!loading && filteredRestaurants.slice(0, 15).map(res => (
                            <div 
                                key={`story-${res.id}`}
                                onClick={() => navigate(`/${res.slug}`)}
                                className="flex flex-col items-center justify-start gap-1.5 cursor-pointer group shrink-0 w-16"
                                title={res.name}
                            >
                                <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] p-0.5 shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform bg-[#121214] overflow-hidden relative flex items-center justify-center shrink-0">
                                    {res.theme_config?.logoUrl ? (
                                        <img src={res.theme_config.logoUrl} alt={res.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <span className="font-serif font-black text-xs text-white uppercase">{res.name[0]}</span>
                                    )}
                                    {res._isOpen && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black" />
                                    )}
                                </div>
                                <span className="text-[9px] text-gray-400 group-hover:text-white truncate max-w-[64px] font-medium text-center h-3 leading-none block w-full">{res.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {errorMsg && (
                    <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-center text-sm backdrop-blur-md max-w-2xl mx-auto">
                        <span className="opacity-80">⚠️ {errorMsg}</span>
                        <button onClick={() => window.location.reload()} className="ml-4 underline font-bold hover:text-white">Recarregar</button>
                    </div>
                )}

                {/* Restaurant Cards Grid matching screenshot */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="h-80 bg-[#18181B] rounded-[2rem] animate-pulse border border-white/10" />
                        ))}
                    </div>
                ) : filteredRestaurants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredRestaurants.map(res => {
                            const todayHours = getTodayHours(res.business_info);
                            return (
                                <div
                                    key={res.id}
                                    onClick={() => navigate(`/${res.slug}`)}
                                    className="bg-[#18181B] border border-white/10 rounded-[2rem] p-4 flex flex-col justify-between hover:border-[#D4AF37] hover:shadow-[0_10px_35px_rgba(212,175,55,0.2)] transition-all duration-500 cursor-pointer relative overflow-hidden group shadow-lg"
                                >
                                    <div>
                                        {/* Cover Image Area */}
                                        <div className="h-44 rounded-2xl overflow-hidden relative mb-4 bg-black/40 border border-white/5">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                            <img 
                                                src={res._cover} 
                                                alt={res.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90"
                                            />
                                            
                                            {/* Top-Left Status Pill */}
                                            <div className="absolute top-3 left-3 z-20">
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md ${
                                                    res._isOpen ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                                                }`}>
                                                    {res._isOpen ? 'Aberto' : 'Fechado'}
                                                </div>
                                            </div>

                                            {/* Top-Right Share Button */}
                                            <button 
                                                onClick={(e) => handleShare(res, e)}
                                                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-all shadow-md"
                                                title="Partilhar"
                                            >
                                                <Share2 size={14} />
                                            </button>
                                        </div>

                                        {/* Restaurant Info */}
                                        <h3 className="text-lg font-serif font-bold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1 mb-2">
                                            {res.name}
                                        </h3>

                                        <div className="space-y-1.5 mb-6 text-xs text-gray-400 font-light">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-[#D4AF37] shrink-0" />
                                                <span className="line-clamp-1">{res.business_info?.location?.address || 'Luanda, Angola'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-[#D4AF37] shrink-0" />
                                                <span>{todayHours && !todayHours.closed ? `Hoje: ${todayHours.open} às ${todayHours.close}` : 'Fechado Hoje'}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                <div className="flex items-center gap-1 text-amber-400 font-bold">
                                                    <Star size={14} fill="currentColor" />
                                                    <span>{res._rating}</span>
                                                </div>
                                                <span className="text-gray-500 font-medium tracking-wider">{res._priceTier}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button matching screenshot */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/${res.slug}`); }}
                                        className="w-full bg-[#D4AF37] group-hover:bg-[#E5C27B] text-black font-black py-3 rounded-full uppercase tracking-wider text-xs transition-all shadow-md group-hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Menu <ArrowRight size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 max-w-md mx-auto">
                        <EmptyState
                            icon={Search}
                            title="Nenhum resultado encontrado"
                            description="Não encontramos restaurantes com os filtros ou termos de pesquisa atuais."
                            action={
                                <button 
                                    onClick={() => { setSearchQuery(''); setActiveFilter('all'); }} 
                                    className="bg-[#D4AF37] text-black font-black px-6 py-3 rounded-full uppercase tracking-wider text-xs shadow-md hover:scale-105 transition-all"
                                >
                                    Limpar Filtros
                                </button>
                            }
                        />
                    </div>
                )}
            </main>

            {/* Footer matching screenshot */}
            <footer className="bg-[#121214] border-t border-white/10 py-16 px-6 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    {/* Left: Logo & Copyright */}
                    <div className="md:col-span-5 space-y-4">
                        <div className="flex items-center gap-3 select-none">
                            <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center border border-[#D4AF37]/40 shadow-2xl overflow-hidden shrink-0">
                                <img src={logoUrl || "/jindungo_logo_v3.png"} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                            </div>
                            <span className="font-serif font-black text-xl uppercase tracking-tight text-white">
                                Menus<span className="text-[#D4AF37]">Jindungo</span>
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs font-light leading-relaxed max-w-sm">
                            © 2026 Menus Jindungo. Elevando a gastronomia Angolana através da tecnologia com excelência e sofisticação.
                        </p>
                    </div>

                    {/* Middle Links Columns matching screenshot */}
                    <div className="md:col-span-4 grid grid-cols-3 gap-6 text-xs text-gray-400 font-light">
                        <div className="space-y-2">
                            <span className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px] block mb-3">Sobre</span>
                            <span onClick={() => navigate('/quem-somos')} className="block hover:text-white transition-colors cursor-pointer text-[#D4AF37] font-bold">Quem Somos</span>
                            <span onClick={() => navigate('/explorar')} className="block hover:text-white transition-colors cursor-pointer">Restaurantes</span>
                            <span onClick={() => navigate('/login')} className="block hover:text-white transition-colors cursor-pointer">Acesso Admin</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px] block mb-3">Partners</span>
                            <a href="#" className="block hover:text-white transition-colors">Motoboy</a>
                            <a href="#" className="block hover:text-white transition-colors">Pratos</a>
                            <a href="#" className="block hover:text-white transition-colors">Descontos</a>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[#D4AF37] font-bold uppercase tracking-widest text-[10px] block mb-3">Legal</span>
                            <a href="#" className="block hover:text-white transition-colors">Termos</a>
                            <a href="#" className="block hover:text-white transition-colors">Privacidade</a>
                            <a href="#" className="block hover:text-white transition-colors">Contacto</a>
                        </div>
                    </div>

                    {/* Right: Map Preview matching screenshot */}
                    <div className="md:col-span-3 rounded-2xl overflow-hidden border border-white/10 shadow-xl h-36 relative group cursor-pointer">
                        <img 
                            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=600" 
                            alt="Mapa de Luanda" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 text-center">
                            <span className="bg-[#18181B]/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/30 shadow-lg">
                                📍 Luanda - Angola
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Explorar;

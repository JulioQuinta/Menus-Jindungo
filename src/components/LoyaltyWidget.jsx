import React, { useState, useEffect } from 'react';
import { Award, Star, CheckCircle2, ChevronRight, X, Phone } from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';

const LoyaltyWidget = ({ restaurantId, primaryColor, darkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState(null);
    const [phone, setPhone] = useState('');
    const [points, setPoints] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (restaurantId) {
            fetchLoyaltyConfig();
        }
        // Try to load saved phone
        const savedPhone = localStorage.getItem('customer_phone');
        if (savedPhone) setPhone(savedPhone);
    }, [restaurantId]);

    const fetchLoyaltyConfig = async () => {
        const { data } = await loyaltyService.getConfig(restaurantId);
        if (data && data.is_active) {
            setConfig(data);
        }
    };

    const checkProgress = async (e) => {
        if (e) e.preventDefault();
        if (!phone || phone.length < 5) return;

        setChecking(true);
        localStorage.setItem('customer_phone', phone);
        const { count } = await loyaltyService.getCustomerPoints(restaurantId, phone);
        setPoints(count);
        setChecking(false);
    };

    if (!config) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[60]">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white scale-110 hover:scale-125 transition-all duration-300 animate-bounce-slow"
                    style={{ backgroundColor: primaryColor }}
                >
                    <Award size={28} />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-white text-[10px] text-black font-bold items-center justify-center">!</span>
                    </span>
                </button>
            ) : (
                <div className={`w-80 rounded-[2rem] shadow-2xl overflow-hidden border animate-in slide-in-from-bottom-10 duration-500 ${darkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-100'}`}>
                    {/* Header */}
                    <div className="p-5 flex justify-between items-center bg-gradient-to-br from-[#D4AF37] to-[#B8962D]">
                        <div className="flex items-center gap-2 text-black">
                            <Star size={20} fill="currentColor" />
                            <h3 className="font-bold tracking-tight">Clube VIP</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-black/50 hover:text-black transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        {points === null ? (
                            <form onSubmit={checkProgress} className="space-y-4">
                                <p className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Introduza o seu <span className="text-[#D4AF37] font-bold">WhatsApp</span> para ver quantos selos já ganhou!
                                </p>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="tel"
                                        placeholder="Seu número..."
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className={`w-full py-3 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${darkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={checking}
                                    className="w-full bg-black text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-all active:scale-95"
                                >
                                    {checking ? 'A verificar...' : 'Ver Meu Progresso'}
                                    <ChevronRight size={18} />
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-6 text-center animate-in fade-in duration-500">
                                <div>
                                    <div className="text-4xl font-black mb-1" style={{ color: primaryColor }}>
                                        {points < config.goal ? points : config.goal}/{config.goal}
                                    </div>
                                    <p className={`text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Selos Acumulados
                                    </p>
                                </div>

                                {/* Progress Dots */}
                                <div className="flex flex-wrap justify-center gap-2 px-2">
                                    {[...Array(config.goal)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500 ${i < points
                                                ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                                                : 'border-dashed border-gray-500 opacity-30 text-gray-500'}`}
                                        >
                                            <Star size={14} fill={i < points ? "currentColor" : "none"} />
                                        </div>
                                    ))}
                                </div>

                                {points >= config.goal ? (
                                    <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-2xl animate-pulse">
                                        <p className="text-green-500 font-bold text-sm">🎉 Recompensa Disponível!</p>
                                        <p className="text-xs text-gray-500 mt-1">{config.reward_text}</p>
                                    </div>
                                ) : (
                                    <p className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Faltam apenas {config.goal - points} para a próxima oferta!
                                    </p>
                                )}

                                <button
                                    onClick={() => setPoints(null)}
                                    className="text-[10px] text-gray-500 underline uppercase tracking-widest font-bold pt-2 cursor-pointer hover:text-[#D4AF37]"
                                >
                                    Mudar de Número
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Branding footer */}
                    <div className={`p-4 text-center border-t transition-colors ${darkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-50'}`}>
                        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Jindungo Loyalty Hub</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoyaltyWidget;

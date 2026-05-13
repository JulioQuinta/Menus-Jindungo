import React from 'react';
import { X, Plus, ChevronRight, Star } from 'lucide-react';

const UpsellModal = ({ isOpen, onClose, mainItem, upsellItems, onAddUpsell, primaryColor, darkMode }) => {
    if (!isOpen || !mainItem || upsellItems.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Content */}
            <div 
                className={`relative w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh] ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                {/* Header Accent */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: primaryColor }}></div>

                <div className="p-6 sm:p-8 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-3 border border-[#D4AF37]/20">
                                <Star size={10} /> Excelente Escolha
                            </span>
                            <h3 className={`text-2xl font-serif font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Gostaria de acompanhar?
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Combinamos isto perfeitamente com o seu <span className="font-bold text-[#D4AF37]">{mainItem.name}</span>.</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Suggestions List */}
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-6">
                        {upsellItems.map(item => (
                            <div 
                                key={item.id} 
                                className={`group flex items-center gap-4 p-4 rounded-[24px] border transition-all duration-300 ${
                                    darkMode 
                                        ? 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10' 
                                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                                }`}
                            >
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-white/5 shadow-lg">
                                    <img src={item.img_url || item.img} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-base sm:text-lg truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</h4>
                                    <p className={`text-xs line-clamp-2 mt-1 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-sm sm:text-base" style={{ color: primaryColor }}>
                                            {typeof item.price === 'string' ? item.price : new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price).replace('AOA', 'Kz')}
                                        </span>
                                        <button 
                                            onClick={() => onAddUpsell(item)}
                                            className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <Plus size={14} strokeWidth={3} /> ADICIONAR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-6 flex flex-col gap-3">
                        <button 
                            onClick={onClose}
                            className={`w-full py-4 rounded-2xl font-black text-sm transition-all border ${
                                darkMode 
                                    ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' 
                                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                        >
                            NÃO, OBRIGADO
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-[#D4AF37] text-black font-black text-sm shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:brightness-110 flex items-center justify-center gap-2"
                        >
                            VER CARRINHO <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpsellModal;

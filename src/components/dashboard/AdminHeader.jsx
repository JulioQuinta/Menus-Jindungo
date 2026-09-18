import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronRight, MessageSquare, Search, Bell, Sparkles, Power } from 'lucide-react';
import toast from 'react-hot-toast';

import { MODULE_NAMES } from '../../utils/planLimits';

const AdminHeader = memo(({ 
    setIsMobileMenuOpen, 
    location, 
    menuItems, 
    user,
    restaurant,
    activeStaff,
    setShowStaffModal,
    onOpenCommandPalette,
    businessInfo,
    onSaveBusinessInfo
}) => {
    const currentMenuItem = menuItems?.find(i => (i.path === '/admin' ? location.pathname === '/admin' : location.pathname.includes(i.path)));
    const isManualClosed = !!businessInfo?.is_manual_closed;
    const isPharmacy = restaurant?.business_sector === 'pharmacy';

    return (
        <header className={`sticky top-0 z-30 px-4 sm:px-10 flex items-center h-20 sm:h-24 backdrop-blur-2xl text-gray-100 transition-colors duration-300 ${isPharmacy ? 'bg-[#06171E]/90 border-b border-[#103544]' : 'bg-[#0A0A0B]/85 border-b border-white/5'}`}>
            <div className="flex justify-between items-center w-full">
                
                {/* Left: Breadcrumbs & Title */}
                <div className="flex items-center gap-4 sm:gap-6">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex flex-col">
                        <div className="hidden sm:flex items-center gap-2 text-[9px] text-gray-400 uppercase tracking-[0.3em] mb-1.5 font-black">
                            <Link to="/admin" className={`transition-colors ${isPharmacy ? 'hover:text-emerald-400' : 'hover:text-[#D4AF37]'}`}>Workspace</Link>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-normal uppercase border ${isPharmacy ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20'}`}>
                                {MODULE_NAMES[restaurant?.module_type] || 'Faturação + Menu QR'}
                            </span>
                            {location.pathname !== '/admin' && (
                                <>
                                    <ChevronRight size={10} className="text-gray-500" />
                                    <span className={isPharmacy ? 'text-emerald-400/80' : 'text-[#D4AF37]/80'}>
                                        {currentMenuItem?.label || 'Detalhes'}
                                    </span>
                                </>
                            )}
                        </div>
                        <h2 className="text-lg sm:text-xl font-serif font-black text-white tracking-tight flex items-center gap-3">
                            <span>{currentMenuItem?.label || 'Visão Geral'}</span>
                        </h2>
                    </div>
                </div>

                {/* Center: Search Bar (User Friendly Navigation) */}
                <div className="hidden md:flex flex-1 max-w-md mx-8 lg:mx-12">
                    <div className="relative w-full group">
                        <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 transition-colors ${isPharmacy ? 'group-focus-within:text-emerald-400' : 'group-focus-within:text-[#D4AF37]'}`}>
                            <Search size={16} />
                        </div>
                        <input 
                            type="text" 
                            readOnly
                            onClick={onOpenCommandPalette}
                            placeholder={isPharmacy ? "Pesquisar medicamentos, receitas, clientes... (Ctrl+K)" : "Pesquisar funções, pedidos ou pratos... (Ctrl+K)"}
                            className={`w-full border rounded-2xl pl-12 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition-all cursor-pointer ${isPharmacy ? 'bg-[#0B2530] border-[#103544] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40' : 'bg-[#161618] border-white/10 focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40'}`}
                        />
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <kbd className={`hidden sm:inline-block px-1.5 py-0.5 border rounded text-[10px] font-mono text-gray-500 ${isPharmacy ? 'bg-[#06171E] border-[#103544]' : 'bg-[#0A0A0B] border-white/10'}`}>⌘K</kbd>
                        </div>
                    </div>
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-2 sm:gap-6">
                    
                    {/* Status Toggle (Open / Closed) */}
                    <button
                        onClick={() => {
                            if (!onSaveBusinessInfo) return toast.error("Serviço indisponível");
                            const nextStatus = !isManualClosed;
                            onSaveBusinessInfo({ ...businessInfo, is_manual_closed: nextStatus });
                            toast(nextStatus ? "Loja fechada manualmente." : "Loja reaberta ao público!", {
                                icon: nextStatus ? '🔴' : '🟢',
                                duration: 4000
                            });
                        }}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 border shadow-2xl active:scale-95 cursor-pointer ${
                            !isManualClosed
                                ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 shadow-green-500/10'
                                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 shadow-red-500/10'
                        }`}
                        title={!isManualClosed ? "Loja aberta. Clique para encerrar manualmente." : "Loja encerrada. Clique para reabrir."}
                    >
                        <span className="flex h-2.5 w-2.5 relative shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${!isManualClosed ? 'bg-green-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${!isManualClosed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className="hidden xl:inline">
                            {!isManualClosed ? 'Loja Aberta' : 'Encerrada'}
                        </span>
                        <Power size={14} className={!isManualClosed ? 'text-green-400' : 'text-red-400'} />
                    </button>

                    {/* IA Assistant Quick Access */}
                    <Link to="/admin/chat" className={`hidden lg:flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl transition-all group shadow-lg ${isPharmacy ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-500/5' : 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/20 shadow-[#D4AF37]/5'}`}>
                        <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline">Menús Jindungo AI</span>
                    </Link>

                    <button className="relative p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-2xl group border border-white/5 hover:border-white/10">
                        <Bell size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-[#0A0A0B]"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-zinc-800 hidden sm:block mx-1 sm:mx-2"></div>

                    <div onClick={() => setShowStaffModal(true)} className="flex items-center gap-3 pl-1 sm:pl-2 cursor-pointer group">
                        <div className="text-right hidden xl:block">
                            <p className={`text-sm font-black transition-colors ${activeStaff ? 'text-green-400' : (isPharmacy ? 'text-gray-200 group-hover:text-emerald-400' : 'text-gray-200 group-hover:text-[#D4AF37]')}`}>
                                {activeStaff ? activeStaff.name : user?.email?.split('@')[0]}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-[0.2em] font-bold">
                                {activeStaff ? 'Equipa Ativa' : 'Administrador'}
                            </p>
                        </div>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center font-black shadow-2xl transition-all transform group-hover:scale-105 group-hover:rotate-3 ${activeStaff ? 'bg-green-500/10 border-green-500/30 text-green-400' : (isPharmacy ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]')}`}>
                            {activeStaff ? activeStaff.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
});

export default AdminHeader;

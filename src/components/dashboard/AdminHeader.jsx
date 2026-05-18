import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronRight, MessageSquare, Search, Bell, Sparkles, Power } from 'lucide-react';
import toast from 'react-hot-toast';

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

    return (
        <header className="sticky top-0 z-30 bg-[#0D0D0D]/80 border-b border-white/5 px-4 sm:px-10 flex items-center h-20 sm:h-24 backdrop-blur-2xl">
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
                        <div className="hidden sm:flex items-center gap-2 text-[9px] text-gray-500 uppercase tracking-[0.3em] mb-1.5 font-black">
                            <Link to="/admin" className="hover:text-[#D4AF37] transition-colors">Workspace</Link>
                            {location.pathname !== '/admin' && (
                                <>
                                    <ChevronRight size={10} className="text-gray-700" />
                                    <span className="text-[#D4AF37]/80">
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
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#D4AF37] transition-colors">
                            <Search size={16} />
                        </div>
                        <input 
                            type="text" 
                            readOnly
                            onClick={onOpenCommandPalette}
                            placeholder="Pesquisar funções, pedidos ou pratos... (Ctrl+K)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/40 transition-all cursor-pointer"
                        />
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 border border-white/10 rounded bg-white/5 text-[10px] font-mono text-gray-500">⌘K</kbd>
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
                    <Link to="/admin/chat" className="hidden lg:flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all group shadow-lg shadow-[#D4AF37]/5">
                        <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline">Menús Jindungo AI</span>
                    </Link>

                    <button className="relative p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-2xl group border border-white/5 hover:border-white/10">
                        <Bell size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-[#0D0D0D]"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block mx-1 sm:mx-2"></div>

                    <div onClick={() => setShowStaffModal(true)} className="flex items-center gap-3 pl-1 sm:pl-2 cursor-pointer group">
                        <div className="text-right hidden xl:block">
                            <p className={`text-sm font-black transition-colors ${activeStaff ? 'text-green-400' : 'text-white group-hover:text-[#D4AF37]'}`}>
                                {activeStaff ? activeStaff.name : user?.email?.split('@')[0]}
                            </p>
                            <p className="text-[9px] text-gray-500 mt-0.5 uppercase tracking-[0.2em] font-bold">
                                {activeStaff ? 'Equipa Ativa' : 'Administrador'}
                            </p>
                        </div>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center font-black shadow-2xl transition-all transform group-hover:scale-105 group-hover:rotate-3 ${activeStaff ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'}`}>
                            {activeStaff ? activeStaff.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
});

export default AdminHeader;

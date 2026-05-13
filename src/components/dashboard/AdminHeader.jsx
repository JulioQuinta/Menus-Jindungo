import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronRight, MessageSquare, Search, Bell, Sparkles } from 'lucide-react';

const AdminHeader = memo(({ 
    setIsMobileMenuOpen, 
    location, 
    menuItems, 
    user,
    activeStaff,
    setShowStaffModal,
    onOpenCommandPalette
}) => {
    const currentMenuItem = menuItems.find(i => (i.path === '/admin' ? location.pathname === '/admin' : location.pathname.includes(i.path)));

    return (
        <header className="sticky top-0 z-30 bg-[#0D0D0D]/80 border-b border-white/5 px-4 sm:px-10 flex items-center h-20 sm:h-24 backdrop-blur-2xl">
            <div className="flex justify-between items-center w-full">
                
                {/* Left: Breadcrumbs & Title */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 text-gray-400 hover:bg-white/10 rounded-xl transition-all"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="hidden sm:flex flex-col">
                        <div className="flex items-center gap-2 text-[9px] text-gray-500 uppercase tracking-[0.3em] mb-1.5 font-black">
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
                        <h2 className="text-xl font-serif font-black text-white tracking-tight">
                            {currentMenuItem?.label || 'Visão Geral'}
                        </h2>
                    </div>
                </div>

                {/* Center: Search Bar (User Friendly Navigation) */}
                <div className="hidden md:flex flex-1 max-w-md mx-12">
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
                <div className="flex items-center gap-3 sm:gap-6">
                    
                    {/* IA Assistant Quick Access */}
                    <Link to="/admin/chat" className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all group">
                        <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Menús Jindungo AI</span>
                    </Link>

                    <button className="relative p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl group">
                        <Bell size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-[#0D0D0D]"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block mx-2"></div>

                    <div onClick={() => setShowStaffModal(true)} className="flex items-center gap-4 pl-2 cursor-pointer group">
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

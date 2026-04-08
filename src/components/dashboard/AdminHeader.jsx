import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronRight, MessageSquare } from 'lucide-react';

const AdminHeader = memo(({ 
    setIsMobileMenuOpen, 
    location, 
    menuItems, 
    user,
    activeStaff,
    setShowStaffModal
}) => {
    const currentMenuItem = menuItems.find(i => (i.path === '/admin' ? location.pathname === '/admin' : location.pathname.includes(i.path)));

    return (
        <header className="sticky top-0 z-30 bg-black/60 border-b border-white/5 px-4 sm:px-8 flex flex-col justify-center h-20 sm:h-24 backdrop-blur-xl">
            <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <Menu size={22} />
                    </button>

                    <div className="flex flex-col">
                        <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">
                            <Link to="/admin" className="hover:text-[#D4AF37] transition-colors">Admin</Link>
                            {location.pathname !== '/admin' && (
                                <>
                                    <ChevronRight size={10} />
                                    <span className="text-gray-300">
                                        {currentMenuItem?.label || 'Detalhes'}
                                    </span>
                                </>
                            )}
                        </div>
                        <h2 className="text-lg sm:text-2xl font-serif font-bold text-white tracking-wide truncate max-w-[140px] sm:max-w-none">
                            {currentMenuItem?.label || 'Visão Geral'}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-6">
                    <button className="relative p-2 text-gray-400 hover:text-[#D4AF37] transition-colors group">
                        <MessageSquare size={18} className="sm:size-[22px] group-hover:scale-110 transition-transform" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-black animate-pulse"></span>
                    </button>

                    <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>

                    <div onClick={() => setShowStaffModal(true)} className="flex items-center gap-2 sm:gap-4 pl-1 sm:pl-2 cursor-pointer group">
                        <div className="text-right hidden sm:block">
                            <p className={`text-sm font-bold transition-colors ${activeStaff ? 'text-green-400 group-hover:text-green-300' : 'text-white group-hover:text-[#D4AF37]'}`}>
                                {activeStaff ? activeStaff.name : user?.email?.split('@')[0]}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">{activeStaff ? 'Em Operação' : 'Gestor(a)'}</p>
                        </div>
                        <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl border flex items-center justify-center font-bold shadow-lg transition-all transform group-hover:scale-105 ${activeStaff ? 'bg-green-500/10 border-green-500/30 text-green-400 group-hover:bg-green-500 group-hover:text-black' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black'}`}>
                            {activeStaff ? activeStaff.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
});

export default AdminHeader;

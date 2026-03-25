import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronRight, MessageSquare } from 'lucide-react';

const AdminHeader = ({ 
    setIsMobileMenuOpen, 
    location, 
    menuItems, 
    user 
}) => {
    const currentMenuItem = menuItems.find(i => (i.path === '/admin' ? location.pathname === '/admin' : location.pathname.includes(i.path)));

    return (
        <header className="sticky top-0 z-30 bg-black/60 border-b border-white/5 px-4 sm:px-8 flex flex-col justify-center h-24 backdrop-blur-xl">
            <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">
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
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide truncate max-w-[150px] sm:max-w-none">
                            {currentMenuItem?.label || 'Visão Geral'}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                    <button className="relative p-2 text-gray-400 hover:text-[#D4AF37] transition-colors group">
                        <MessageSquare size={20} className="sm:size-[22px] group-hover:scale-110 transition-transform" />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-black animate-pulse"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>

                    <div className="flex items-center gap-2 sm:gap-4 pl-0 sm:pl-2 cursor-pointer group">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">{user?.email?.split('@')[0]}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Gestor</p>
                        </div>
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold shadow-lg group-hover:bg-[#D4AF37] group-hover:text-black transition-all transform group-hover:scale-105">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;

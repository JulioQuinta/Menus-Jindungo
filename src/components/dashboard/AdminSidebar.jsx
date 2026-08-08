import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';

import { getAssetPath } from '../../utils/assetResolver';

const AdminSidebar = memo(({ 
    isSidebarOpen, 
    isMobileMenuOpen, 
    setIsSidebarOpen, 
    setIsMobileMenuOpen, 
    menuItems, 
    location, 
    globalLogoUrl, 
    restaurantLogoUrl,
    signOut,
    restaurantName,
    restaurantSlug
}) => {
    const isActive = (path) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.includes(path);
    };

    return (
        <aside className={`fixed lg:relative z-50 bg-[#0D0D0D] border-r border-white/5 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] h-screen flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.4)] will-change-transform
            ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} 
            ${isSidebarOpen ? 'lg:w-72' : 'lg:w-24'}`}>

            {/* Premium Header / Logo Area */}
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/5 relative overflow-hidden group">
                <div className={`flex items-center gap-4 transition-all duration-500 ${isSidebarOpen || isMobileMenuOpen ? 'opacity-100' : 'lg:opacity-0 lg:scale-50 pointer-events-none'}`}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#D4AF37] blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-black/40 flex items-center justify-center border border-[#D4AF37]/30 shadow-2xl transition-all duration-300">
                            <img 
                                src={getAssetPath(restaurantLogoUrl || globalLogoUrl || "/jindungo_logo_v3.png")} 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = getAssetPath("/jindungo_logo_v3.png");
                                }}
                                className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-[1.23]" 
                                alt="Jindungo" 
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-serif text-xl font-black text-white tracking-tighter leading-none">
                            Menús <span className="text-[#D4AF37]">Jindungo</span>
                        </span>
                        <span className="text-[9px] font-black text-[#D4AF37]/60 uppercase tracking-[0.3em] mt-1">SISTEMA PREMIUM</span>
                    </div>
                </div>
                
                <button
                    onClick={() => {
                        if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                        else setIsSidebarOpen(!isSidebarOpen);
                    }}
                    className={`p-2.5 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 ${(!isSidebarOpen && !isMobileMenuOpen) && 'mx-auto'}`}
                >
                    <Menu size={18} className="text-gray-500 group-hover:text-white" />
                </button>
            </div>

            {/* Restaurant Quick Card (Shown when open) */}
            {(isSidebarOpen || isMobileMenuOpen) && (
                <div className="px-6 py-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 group/card hover:bg-white/[0.08] transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={12} className="text-[#D4AF37]" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loja Ativa</span>
                            </div>
                            <Link 
                                to={restaurantSlug ? `/${restaurantSlug}` : '#'} 
                                target="_blank"
                                className="text-gray-500 hover:text-[#D4AF37] transition-colors"
                            >
                                <ExternalLink size={14} />
                            </Link>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate group-hover/card:text-[#D4AF37] transition-colors">
                            {restaurantName || 'O seu Restaurante'}
                        </h4>
                    </div>
                </div>
            )}

            {/* Navigation Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar-sidebar mt-2">
                {menuItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`group relative flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${active
                                ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent text-[#D4AF37] border-l-4 border-[#D4AF37]'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {active && (
                                <div className="absolute inset-0 bg-[#D4AF37]/5 blur-xl pointer-events-none"></div>
                            )}
                            <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`}>
                                <item.icon size={active ? 20 : 18} />
                            </div>
                            <span className={`text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-500 ${(isSidebarOpen || isMobileMenuOpen) ? 'opacity-100 translate-x-0' : 'lg:opacity-0 lg:-translate-x-10 lg:absolute'}`}>
                                {item.label}
                            </span>
                            
                            {/* Hover Indicator for Collapsed State */}
                            {!isSidebarOpen && !isMobileMenuOpen && (
                                <div className="absolute left-full ml-4 px-3 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-xs font-bold opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-2xl">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-6 border-t border-white/5 shrink-0 bg-gradient-to-t from-black/20 to-transparent">
                <button
                    onClick={signOut}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all group ${(!isSidebarOpen && !isMobileMenuOpen) && 'justify-center'}`}
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className={`${(isSidebarOpen || isMobileMenuOpen) ? 'block' : 'hidden'} text-sm font-bold`}>Sair da Conta</span>
                </button>
                <div className={`mt-4 text-center transition-opacity duration-500 ${isSidebarOpen || isMobileMenuOpen ? 'opacity-30' : 'opacity-0'}`}>
                    <p className="text-[9px] font-mono tracking-widest">JINDUNGO v3.1</p>
                </div>
            </div>
        </aside>
    );
});

export default AdminSidebar;

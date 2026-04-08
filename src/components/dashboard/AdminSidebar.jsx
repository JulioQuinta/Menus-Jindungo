import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';

const AdminSidebar = memo(({ 
    isSidebarOpen, 
    isMobileMenuOpen, 
    setIsSidebarOpen, 
    setIsMobileMenuOpen, 
    menuItems, 
    location, 
    globalLogoUrl, 
    signOut 
}) => {
    const isActive = (path) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.includes(path);
    };

    return (
        <aside className={`fixed lg:relative z-50 glass-dark border-r border-white/5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] h-screen flex flex-col shadow-2xl will-change-transform
            ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} 
            ${isSidebarOpen ? 'lg:w-72' : 'lg:w-24'}`}>

            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className={`flex items-center gap-3 transition-all duration-300 ${isSidebarOpen || isMobileMenuOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden pointer-events-none'}`}>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] transform hover:scale-105 transition-transform cursor-pointer border border-[#D4AF37]/30">
                        <img src={globalLogoUrl || "/jindungo_logo_v3.png"} className="w-full h-full object-contain" alt="Global App Logo" />
                    </div>
                    <span className="font-serif text-2xl font-bold text-white tracking-tight cursor-pointer">
                        Jindu<span className="text-[#D4AF37]">ngo</span>
                    </span>
                </div>
                <button
                    onClick={() => {
                        if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                        else setIsSidebarOpen(!isSidebarOpen);
                    }}
                    className={`p-2 hover:bg-white/10 rounded-xl transition-all ${(!isSidebarOpen && !isMobileMenuOpen) && 'mx-auto'}`}
                >
                    <Menu size={20} className="text-gray-400 hover:text-white" />
                </button>
            </div>

            <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar mt-4">
                {menuItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 relative overflow-hidden ${active
                                ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(212,175,55,0.1)]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-6'
                                }`}
                        >
                            <div className={`relative z-10 transition-transform duration-200 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'group-hover:scale-110'}`}>
                                <item.icon size={22} />
                            </div>
                            <span className={`font-medium tracking-wide whitespace-nowrap transition-all duration-300 ${(isSidebarOpen || isMobileMenuOpen) ? 'opacity-100 translate-x-0' : 'lg:opacity-0 lg:-translate-x-10 lg:absolute'}`}>
                                {item.label}
                            </span>
                            {active && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#D4AF37] rounded-l-full shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/5 mt-auto">
                <button
                    onClick={signOut}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 hover:border hover:border-red-500/20 transition-all group ${(!isSidebarOpen && !isMobileMenuOpen) && 'justify-center border border-transparent'}`}
                >
                    <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                    <span className={`${(isSidebarOpen || isMobileMenuOpen) ? 'block' : 'hidden'} font-medium`}>Terminar Sessão</span>
                </button>
            </div>
        </aside>
    );
});

export default AdminSidebar;

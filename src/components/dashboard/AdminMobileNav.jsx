import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Eye, Menu as MenuIcon } from 'lucide-react';

const AdminMobileNav = ({ onOpenSidebar, restaurantSlug }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { label: 'Início', icon: LayoutDashboard, path: '/admin', id: 'dashboard' },
        { label: 'Cardápio', icon: UtensilsCrossed, path: '/admin/menu', id: 'menu' },
        { label: 'Ver Menu', icon: Eye, path: `/${restaurantSlug}`, id: 'view_menu', external: true },
        { label: 'Pedidos', icon: ClipboardList, path: '/admin/orders', id: 'orders' },
        { label: 'Mais', icon: MenuIcon, onClick: onOpenSidebar, id: 'more' },
    ];

    const isActive = (path) => {
        if (!path) return false;
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.includes(path);
    };

    return (
        <nav className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50">
            <div className="bg-black/80 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 flex items-center justify-around shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
                {navItems.map(item => {
                    const active = isActive(item.path);
                    const content = (
                        <>
                            <item.icon 
                                size={20} 
                                className={`transition-all duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} 
                            />
                            <span className="text-[10px] font-bold mt-1 tracking-tight">{item.label}</span>
                            {item.id === 'orders' && (
                                <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                            )}
                        </>
                    );

                    if (item.external) {
                        return (
                            <a
                                key={item.id}
                                href={item.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center py-2 px-1 text-gray-400 hover:text-[#D4AF37] transition-all relative group"
                            >
                                {content}
                            </a>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={item.onClick ? item.onClick : () => navigate(item.path)}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 relative group ${active
                                ? 'text-[#D4AF37]'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {content}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default AdminMobileNav;

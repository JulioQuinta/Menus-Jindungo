import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut, ExternalLink, ShieldCheck, Tv } from 'lucide-react';
import { getAssetPath } from '../../utils/assetResolver';
import { getSectorDetails } from '../../utils/sectorConfig';

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
    restaurantSlug,
    moduleFeatures,
    businessSector
}) => {
    const sectorDetails = getSectorDetails(businessSector);
    const sectorTheme = sectorDetails?.theme || {};

    const isPharmacy = businessSector === 'pharmacy';

    const isActive = (path) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.includes(path);
    };

    const categories = [
        {
            title: "Operações",
            paths: ['/admin', '/admin/menu', '/admin/orders', '/admin/invoices', '/admin/inventory', '/admin/reservations', '/admin/info']
        },
        {
            title: "Crescimento & Clientes",
            paths: ['/admin/chat', '/admin/crm', '/admin/feedbacks', '/admin/loyalty', '/admin/marketing']
        },
        {
            title: "Configurações",
            paths: ['/admin/qrcode', '/admin/staff', '/admin/settings']
        }
    ];

    return (
        <aside className={`fixed lg:relative z-50 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] h-screen flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.4)] will-change-transform
            ${isPharmacy ? 'bg-[#041218] border-r border-[#103544]' : 'bg-[#0D0D0D] border-r border-white/5'}
            ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} 
            ${isSidebarOpen ? 'lg:w-72' : 'lg:w-24'}`}>

            {/* Premium Header / Logo Area */}
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/5 relative overflow-hidden group">
                <div className={`flex items-center gap-4 transition-all duration-500 ${isSidebarOpen || isMobileMenuOpen ? 'opacity-100' : 'lg:opacity-0 lg:scale-50 pointer-events-none'}`}>
                    <div className="relative">
                        <div className={`absolute inset-0 blur-lg opacity-20 group-hover:opacity-40 transition-opacity ${isPharmacy ? 'bg-emerald-500' : 'bg-[#D4AF37]'}`}></div>
                        <div className={`relative w-16 h-16 rounded-full overflow-hidden bg-black/40 flex items-center justify-center border shadow-2xl transition-all duration-300 ${isPharmacy ? 'border-emerald-500/30' : 'border-[#D4AF37]/30'}`}>
                            <img 
                                src={getAssetPath(restaurantLogoUrl || globalLogoUrl || "/jindungo_logo_v3.png")} 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = getAssetPath("/jindungo_logo_v3.png");
                                }}
                                className={`w-full h-full object-contain p-0 scale-[1.18] filter transition-transform duration-300 group-hover:scale-[1.23] ${isPharmacy ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]'}`} 
                                alt="Jindungo" 
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-serif text-xl font-black text-white tracking-tighter leading-none">
                            Menús <span className={isPharmacy ? 'text-emerald-400' : 'text-[#D4AF37]'}>Jindungo</span>
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-[0.3em] mt-1 ${isPharmacy ? 'text-emerald-400/60' : 'text-[#D4AF37]/60'}`}>SISTEMA PREMIUM</span>
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
                <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5 group/card hover:bg-white/[0.08] transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1" style={{ backgroundColor: `${sectorTheme.primary || '#D4AF37'}15`, color: sectorTheme.primary || '#D4AF37', borderColor: `${sectorTheme.primary || '#D4AF37'}30` }}>
                                    <span>{sectorDetails.icon}</span>
                                    <span>{sectorDetails.badge}</span>
                                </span>
                            </div>
                            <Link 
                                to={restaurantSlug ? `/${restaurantSlug}` : '#'} 
                                target="_blank"
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <ExternalLink size={14} />
                            </Link>
                        </div>
                        <h4 className={`text-sm font-bold text-white truncate transition-colors ${isPharmacy ? 'group-hover/card:text-emerald-400' : 'group-hover/card:text-[#D4AF37]'}`}>
                            {restaurantName || sectorDetails.terms?.establishment || 'O seu Estabelecimento'}
                        </h4>
                    </div>
                </div>
            )}

            {/* Navigation Categories */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar-sidebar mt-2">
                {categories.map((cat, catIdx) => {
                    const itemsInCat = menuItems.filter(item => cat.paths.includes(item.path));
                    if (itemsInCat.length === 0) return null;

                    return (
                        <div key={catIdx} className="space-y-1.5">
                            {(isSidebarOpen || isMobileMenuOpen) ? (
                                <h5 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-4 mb-2.5">
                                    {cat.title}
                                </h5>
                            ) : (
                                <div className="h-[1px] bg-white/5 my-4 mx-2"></div>
                            )}

                            {itemsInCat.map((item) => {
                                const active = isActive(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`group relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${active
                                            ? (isPharmacy 
                                                ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 border-l-4 border-emerald-400 shadow-[inset_4px_0_12px_rgba(16,185,129,0.1)]'
                                                : 'bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#D4AF37] border-l-4 border-[#D4AF37] shadow-[inset_4px_0_12px_rgba(212,175,55,0.05)]'
                                              )
                                            : 'text-gray-500 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {active && (
                                            <div className={`absolute inset-0 blur-xl pointer-events-none ${isPharmacy ? 'bg-emerald-500/10' : 'bg-[#D4AF37]/5'}`}></div>
                                        )}
                                        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`}>
                                            <item.icon size={active ? 18 : 16} />
                                        </div>
                                        <span className={`text-xs font-bold tracking-tight whitespace-nowrap transition-all duration-500 ${(isSidebarOpen || isMobileMenuOpen) ? 'opacity-100 translate-x-0' : 'lg:opacity-0 lg:-translate-x-10 lg:absolute'}`}>
                                            {item.label}
                                        </span>
                                        
                                        {!isSidebarOpen && !isMobileMenuOpen && (
                                            <div className="absolute left-full ml-4 px-3 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-xs font-bold opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-2xl">
                                                {item.label}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* Quick Launch Monitor KDS (Special Action - Apenas para Módulos com KDS/Cozinha) */}
            {moduleFeatures?.hasKDS && (
                <div className="px-4 py-2 shrink-0">
                    <Link
                        to="/admin/orders"
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.02] ${isPharmacy ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : 'bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 text-[#D4AF37] shadow-[0_4px_20px_rgba(212,175,55,0.05)]'} ${(!isSidebarOpen && !isMobileMenuOpen) && 'justify-center'}`}
                        title="Monitor de Operações"
                    >
                        <Tv size={18} className="animate-pulse shrink-0" />
                        <span className={`text-xs font-black uppercase tracking-wider ${(isSidebarOpen || isMobileMenuOpen) ? 'block' : 'hidden'}`}>Monitor KDS</span>
                    </Link>
                </div>
            )}

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

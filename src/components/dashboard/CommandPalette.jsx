import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, X, ArrowRight, Zap, Utensils, ClipboardList, Settings, User, Bell, LayoutDashboard, MessageSquare } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose, menuItems = [] }) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const modalRef = useRef(null);

    // Filtered results based on search
    const filteredItems = menuItems.filter(item => 
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    // Common Quick Actions
    const quickActions = [
        { label: 'Novo Prato', icon: Zap, action: () => navigate('/admin/menu') },
        { label: 'Ver Pedidos', icon: ClipboardList, action: () => navigate('/admin/orders') },
        { label: 'Configurar Logo', icon: Settings, action: () => navigate('/admin/settings') },
    ];

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length + quickActions.length - 1));
            } else if (e.key === 'ArrowUp') {
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                const combined = [...filteredItems, ...quickActions];
                const selected = combined[selectedIndex];
                if (selected) {
                    if (selected.path) navigate(selected.path);
                    else if (selected.action) selected.action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, filteredItems, quickActions, selectedIndex, navigate, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop with heavy blur */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-fade-in"
                onClick={onClose}
            />

            {/* Main Command Palette Card */}
            <div 
                ref={modalRef}
                className="relative w-full max-w-2xl bg-[#111111]/90 border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up"
            >
                {/* Search Header */}
                <div className="relative border-b border-white/5 p-6">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={20} />
                    <input
                        autoFocus
                        type="text"
                        placeholder="O que deseja fazer hoje? (ex: 'menu', 'pedidos')"
                        className="w-full bg-transparent pl-12 pr-4 py-2 text-lg text-white placeholder-gray-600 outline-none font-serif"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-500 font-mono">ESC</kbd>
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-4">
                    
                    {/* Navigation Results */}
                    {filteredItems.length > 0 && (
                        <div className="mb-6">
                            <p className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Navegação</p>
                            <div className="space-y-1">
                                {filteredItems.map((item, idx) => (
                                    <button
                                        key={item.path}
                                        onClick={() => {
                                            navigate(item.path);
                                            onClose();
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${selectedIndex === idx ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl ${selectedIndex === idx ? 'bg-primary/20' : 'bg-white/5'}`}>
                                                <item.icon size={18} />
                                            </div>
                                            <span className="font-bold text-sm">{item.label}</span>
                                        </div>
                                        <ArrowRight size={14} className={`transition-transform ${selectedIndex === idx ? 'translate-x-0' : '-translate-x-4 opacity-0'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions (only show if search is empty or matches) */}
                    {(!search || "ações".includes(search.toLowerCase())) && (
                        <div>
                            <p className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Ações Rápidas</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-2">
                                {quickActions.map((action, idx) => {
                                    const realIdx = filteredItems.length + idx;
                                    return (
                                        <button
                                            key={action.label}
                                            onClick={action.action}
                                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${selectedIndex === realIdx ? 'bg-white/10 text-white border border-white/20' : 'bg-white/5 text-gray-500 hover:text-white border border-transparent'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-black/50 flex items-center justify-center border border-white/5">
                                                <action.icon size={20} className={selectedIndex === realIdx ? 'text-primary' : ''} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest">{action.label}</p>
                                                <p className="text-[10px] opacity-60">Executar agora</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredItems.length === 0 && search && (
                        <div className="py-20 text-center">
                            <Command size={48} className="mx-auto text-gray-800 mb-4 animate-pulse" />
                            <p className="text-gray-500 font-medium italic">Nenhum resultado para "{search}"</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-gray-600 tracking-widest uppercase">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/5 rounded">↑↓</kbd> Navegar</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/5 rounded">ENTER</kbd> Selecionar</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary/40">
                        <Zap size={10} /> Powered by Menús Jindungo
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;

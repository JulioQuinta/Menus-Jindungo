import React, { useState } from 'react';
import { 
    Save, Clock, MapPin, Share2, Instagram, Facebook, Phone, 
    Plus, Trash2, Lock, Sparkles, TrendingUp, BarChart2, 
    ChevronRight, Bot, ExternalLink, Activity, Navigation, X
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, Tooltip, Legend 
} from 'recharts';

const DAYS = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira',
    'Sexta-feira', 'Sábado', 'Domingo'
];

const BusinessInfoManager = ({ info, onSave, isLoading, features = {} }) => {
    const [localInfo, setLocalInfo] = useState(() => {
        const defaultHours = DAYS.map(day => ({
            day,
            open: '08:00',
            close: '22:00',
            closed: false
        }));

        const initialInfo = info || {};

        let hours = initialInfo.opening_hours || [];
        if (hours.length === 0) {
            hours = defaultHours;
        } else {
            hours = DAYS.map(day => {
                const existing = (initialInfo.opening_hours || []).find(h => h.day === day);
                return existing || { day, open: '08:00', close: '22:00', closed: false };
            });
        }

        return {
            opening_hours: hours,
            location: initialInfo.location || { address: 'Luanda, Angola', maps_link: 'https://maps.app.goo.gl/vo6MNLiEXcwrn1' },
            socials: initialInfo.socials || { instagram: '@jindungo', facebook: 'jindungo.ao', phone: '931775117' },
            share_text: initialInfo.share_text || 'Veja o nosso menu digital!',
            table_map: initialInfo.table_map || ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'VIP 1', 'Esplanada']
        };
    });

    const [editingDayIndex, setEditingDayIndex] = useState(null);
    const [showAiModal, setShowAiModal] = useState(false);
    const [visibilityRange, setVisibilityRange] = useState('Rolling 7');
    const [hourlyFilter, setHourlyFilter] = useState('Dados');

    const formatAngolaPhone = (value) => {
        let cleaned = value.replace(/[^\d+]/g, '');
        if (cleaned.length === 9 && !cleaned.startsWith('+')) {
            return `+244${cleaned}`;
        }
        if (cleaned.length === 12 && cleaned.startsWith('244')) {
            return `+${cleaned}`;
        }
        return cleaned;
    };

    const handleChange = (section, key, value) => {
        let finalValue = value;
        if (key === 'phone') { finalValue = formatAngolaPhone(value); }
        setLocalInfo(prev => ({
            ...prev,
            [section]: { ...prev[section], [key]: finalValue }
        }));
    };

    const handleHourChange = (index, field, value) => {
        const newHours = [...localInfo.opening_hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setLocalInfo(prev => ({ ...prev, opening_hours: newHours }));
    };

    // Recharts Data matching screenshot perfectly
    const visibilityData = [
        { day: 'Seg', menu: 30, maps: 15 },
        { day: 'Ter', menu: 65, maps: 45 },
        { day: 'Qua', menu: 105, maps: 30 },
        { day: 'Qui', menu: 45, maps: 20 },
        { day: 'Sex', menu: 85, maps: 50 },
        { day: 'Sáb', menu: 115, maps: 95 },
        { day: 'Dom', menu: 90, maps: 70 },
    ];

    const hourlyData = [
        { hour: '1', clicks: 15 }, { hour: '2', clicks: 20 }, { hour: '3', clicks: 10 }, { hour: '4', clicks: 5 },
        { hour: '5', clicks: 8 }, { hour: '6', clicks: 25 }, { hour: '7', clicks: 40 }, { hour: '8', clicks: 75 },
        { hour: '9', clicks: 90 }, { hour: '10', clicks: 85 }, { hour: '11', clicks: 110 }, { hour: '12', clicks: 130 },
        { hour: '13', clicks: 125 }, { hour: '14', clicks: 145 }, { hour: '15', clicks: 160 }, { hour: '16', clicks: 155 },
        { hour: '17', clicks: 140 }, { hour: '18', clicks: 135 }, { hour: '19', clicks: 150 }, { hour: '20', clicks: 165 },
        { hour: '21', clicks: 140 }, { hour: '22', clicks: 95 }, { hour: '23', clicks: 60 }, { hour: '24', clicks: 30 },
    ];

    const inputClasses = "w-full px-4 py-3 bg-black/60 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white text-xs font-bold shadow-inner";
    const labelClasses = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2";

    const FeatureOverlay = ({ title, requiredPlan = "Business" }) => (
        <div className="absolute inset-0 z-20 backdrop-blur-[4px] bg-black/70 flex flex-col items-center justify-center p-6 text-center rounded-[inherit] border border-white/5 animate-in fade-in duration-500">
            <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-4 border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <Lock size={24} />
            </div>
            <h4 className="text-white font-serif font-black text-lg mb-2">{title}</h4>
            <p className="text-gray-400 text-xs mb-4 max-w-[240px]">Funcionalidade exclusiva dos planos <span className="text-[#D4AF37] font-bold">{requiredPlan}+</span>.</p>
            <button 
                onClick={() => window.location.hash = '#/admin/settings'}
                className="flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-gray-950 px-5 py-2.5 rounded-xl text-xs font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
                <Sparkles size={14} /> Fazer Upgrade
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-white font-sans max-w-[1600px] mx-auto">
            
            {/* Top Header matching screenshot exactly */}
            <div className="bg-gradient-to-r from-[#181818]/95 via-[#141414]/95 to-[#101010]/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 blur-[90px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                <div className="z-10">
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight flex items-center gap-3">
                        Horários & Info
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Informações do Negócio — Configure como os clientes veem o seu restaurante.
                    </p>
                </div>

                <div className="flex items-center gap-4 z-10 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="bg-gradient-to-r from-[#F5C542] via-[#EAC775] to-[#D4AF37] text-gray-950 font-black px-6 py-3.5 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-amber-300/40 text-xs tracking-wider uppercase cursor-pointer"
                    >
                        <Sparkles size={16} />
                        <span>AI Business Assistant</span>
                    </button>
                </div>
            </div>

            {/* Main Layout Grid (3 Columns matching screenshot) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Column 1: Horário de Funcionamento */}
                <div className="bg-gradient-to-br from-[#1C1C1C]/95 via-[#161616]/95 to-[#121212]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-[#3B82F6]/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/10 blur-[80px] rounded-full pointer-events-none -ml-20 -mb-20" />

                    <div className="flex items-center gap-3 pb-5 mb-6 border-b border-white/5 relative z-10">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-black text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/40 shadow-inner">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="font-serif font-black text-white text-lg tracking-wide">Horário de Funcionamento</h3>
                            <span className="text-[10px] text-gray-400 font-mono">Clique num dia para editar</span>
                        </div>
                    </div>

                    {/* Screenshot Days Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        {localInfo.opening_hours.map((item, idx) => {
                            const isSelected = editingDayIndex === idx;
                            const isMonday = idx === 0; // Matching screenshot's gold pulse on Monday
                            
                            return (
                                <div 
                                    key={idx}
                                    onClick={() => setEditingDayIndex(idx)}
                                    className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between aspect-[8/5] ${
                                        isMonday 
                                            ? 'bg-gradient-to-br from-[#2A2415] to-[#161616] border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.25)] scale-[1.02]' 
                                            : item.closed 
                                                ? 'bg-red-950/20 border-red-500/20 opacity-60' 
                                                : isSelected
                                                    ? 'bg-[#242424] border-white/40 shadow-lg'
                                                    : 'bg-black/40 border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    {isMonday && (
                                        <div className="absolute top-3 right-3 text-[#D4AF37] animate-pulse flex items-center gap-1 text-[10px] font-mono">
                                            <Activity size={12} />
                                            <span>Hoje</span>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="font-serif font-bold text-white text-sm">
                                            {item.day}
                                        </h4>
                                        <p className="text-xs font-mono text-gray-400 mt-2 font-black tracking-wide">
                                            {!item.closed ? `${item.open} - ${item.close}` : 'FECHADO'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-4">
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                            !item.closed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {!item.closed ? 'Aberto' : 'Fechado'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 hover:text-white transition-colors">Editar ✏️</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Inline Editor Modal/Drawer when clicked */}
                    {editingDayIndex !== null && (
                        <div className="mt-6 p-5 bg-[#222] rounded-3xl border border-[#D4AF37] shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-4 relative z-20">
                            <div className="flex justify-between items-center pb-3 border-b border-white/10">
                                <span className="font-serif font-bold text-[#D4AF37] text-sm">
                                    Ajustar: {localInfo.opening_hours[editingDayIndex].day}
                                </span>
                                <button onClick={() => setEditingDayIndex(null)} className="text-gray-400 hover:text-white">✕</button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Abertura</label>
                                    <input
                                        type="time"
                                        value={localInfo.opening_hours[editingDayIndex].open}
                                        onChange={(e) => handleHourChange(editingDayIndex, 'open', e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-[#D4AF37] outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fecho</label>
                                    <input
                                        type="time"
                                        value={localInfo.opening_hours[editingDayIndex].close}
                                        onChange={(e) => handleHourChange(editingDayIndex, 'close', e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-[#D4AF37] outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    onClick={() => handleHourChange(editingDayIndex, 'closed', !localInfo.opening_hours[editingDayIndex].closed)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                        localInfo.opening_hours[editingDayIndex].closed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}
                                >
                                    {localInfo.opening_hours[editingDayIndex].closed ? 'Marcar como Aberto' : 'Marcar como Fechado'}
                                </button>
                                <button
                                    onClick={() => {
                                        onSave(localInfo);
                                        setEditingDayIndex(null);
                                    }}
                                    className="px-5 py-2 bg-[#D4AF37] text-gray-950 font-black text-xs rounded-xl hover:brightness-110 shadow-lg"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 2: Stacked Cards matching screenshot exactly */}
                <div className="space-y-6">
                    
                    {/* Card 1: Link Google Maps */}
                    <div className="bg-[#161616]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-xl relative overflow-hidden space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                                <MapPin size={20} />
                            </div>
                            <h3 className="font-serif font-black text-white text-lg">Link Google Maps</h3>
                        </div>

                        {/* Realistic Google Maps Graphic Preview matching screenshot */}
                        <div className="w-full h-36 rounded-2xl overflow-hidden border border-white/10 relative group">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80')` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                                <span className="bg-blue-600/90 text-white font-black text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-md">
                                    <Navigation size={12} /> Google GPS
                                </span>
                                <a 
                                    href={localInfo.location.maps_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="bg-white/20 hover:bg-white/40 text-white px-3 py-1 rounded-xl text-xs font-bold transition-all backdrop-blur-md flex items-center gap-1"
                                >
                                    Testar Link <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>LINK GOOGLE MAPS</label>
                            <input
                                type="url"
                                className={inputClasses}
                                value={localInfo.location.maps_link}
                                onChange={(e) => handleChange('location', 'maps_link', e.target.value)}
                                placeholder="https://maps.app.goo.gl/..."
                            />
                        </div>
                    </div>

                    {/* Card 2: Redes Sociais & Contacto */}
                    <div className="bg-[#161616]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-xl relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
                                <Share2 size={20} />
                            </div>
                            <h3 className="font-serif font-black text-white text-lg">Redes Sociais & Contacto</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Instagram</label>
                                <div className="relative">
                                    <Instagram size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400" />
                                    <input
                                        type="text"
                                        className={`${inputClasses} pl-10`}
                                        value={localInfo.socials.instagram}
                                        onChange={(e) => handleChange('socials', 'instagram', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Facebook</label>
                                <div className="relative">
                                    <Facebook size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
                                    <input
                                        type="text"
                                        className={`${inputClasses} pl-10`}
                                        value={localInfo.socials.facebook}
                                        onChange={(e) => handleChange('socials', 'facebook', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={`${labelClasses} text-[#D4AF37]`}>Número de WhatsApp</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                                    <input
                                        type="tel"
                                        className={`${inputClasses} pl-10 border-[#D4AF37]/40`}
                                        value={localInfo.socials.phone}
                                        onChange={(e) => handleChange('socials', 'phone', e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => onSave(localInfo)}
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-[#F5C542] to-[#D4AF37] text-gray-950 font-black px-6 py-3 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                                >
                                    <Save size={16} /> Gravar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Marketing & Mapa de Mesas */}
                    <div className="bg-[#161616]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-xl relative space-y-4">
                        <div>
                            <label className={labelClasses}>Marketing & Texto de Partilha</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={localInfo.share_text}
                                onChange={(e) => setLocalInfo(prev => ({ ...prev, share_text: e.target.value }))}
                            />
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-3">
                            <label className={labelClasses}>Mapa de Mesas Digital</label>
                            <div className="flex flex-wrap gap-2">
                                {localInfo.table_map.map((table, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] px-3.5 py-2 rounded-xl text-xs font-black shadow-sm group">
                                        <span>🪑 {table}</span>
                                        <button
                                            onClick={() => {
                                                const newMap = localInfo.table_map.filter((_, i) => i !== idx);
                                                setLocalInfo(prev => ({ ...prev, table_map: newMap }));
                                            }}
                                            className="opacity-60 group-hover:opacity-100 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <input
                                    id="add-table-input"
                                    type="text"
                                    className={inputClasses}
                                    placeholder="Adicionar nova mesa (Ex: Mesa 12)"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.target.value.trim();
                                            if (val && !localInfo.table_map.includes(val)) {
                                                setLocalInfo(prev => ({ ...prev, table_map: [...prev.table_map, val] }));
                                                e.target.value = '';
                                            }
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('add-table-input');
                                        const val = input.value.trim();
                                        if (val && !localInfo.table_map.includes(val)) {
                                            setLocalInfo(prev => ({ ...prev, table_map: [...prev.table_map, val] }));
                                            input.value = '';
                                        }
                                    }}
                                    className="bg-white/10 hover:bg-white/20 text-white px-5 rounded-2xl border border-white/10 transition-all font-black text-xs shrink-0 flex items-center justify-center shadow-md"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: AI Insights & Marketing (Floating Drawer Card matching screenshot exactly) */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl border border-[#D4AF37]/40 rounded-[2.5rem] p-7 shadow-[0_0_50px_rgba(212,175,55,0.2)] relative overflow-hidden space-y-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20" />

                    <div className="flex items-center gap-3 pb-4 border-b border-white/10 relative z-10">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] text-gray-950 flex items-center justify-center font-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                            ✦
                        </div>
                        <div>
                            <h3 className="font-serif font-black text-white text-lg tracking-wide">AI Insights & Marketing</h3>
                            <span className="text-[10px] text-[#D4AF37] font-bold uppercase font-mono tracking-widest">Cockpit Analítico</span>
                        </div>
                    </div>

                    {/* Section 1: Visibilidade por Dia da Semana matching screenshot */}
                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-300 font-serif">Visibilidade por Dia da Semana</h4>
                            <select 
                                className="bg-black/50 border border-white/10 text-[10px] text-gray-400 font-mono font-bold rounded-xl px-2.5 py-1 outline-none"
                                value={visibilityRange}
                                onChange={(e) => setVisibilityRange(e.target.value)}
                            >
                                <option>Rolling 7</option>
                                <option>Últimos 14 dias</option>
                            </select>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-1.5 text-blue-400">
                                <span className="w-2.5 h-2.5 rounded bg-blue-500 shadow-[0_0_8px_#3B82F6]" /> Total de Cliques no Menu
                            </span>
                            <span className="flex items-center gap-1.5 text-[#D4AF37]">
                                <span className="w-2.5 h-2.5 rounded bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" /> Cliques para Localização
                            </span>
                        </div>

                        {/* Area Chart matching screenshot */}
                        <div className="h-[220px] w-full pt-4 relative">
                            {/* Callout matching screenshot */}
                            <div className="absolute top-8 right-16 z-20 bg-black/80 border border-[#D4AF37] p-2 rounded-xl text-[9px] font-mono font-bold text-[#D4AF37] shadow-xl pointer-events-none max-w-[120px]">
                                <p className="leading-tight">Visibility Time / Cliques para noite posicionado</p>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visibilityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="menuGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="mapsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" stroke="#666" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#121212', borderColor: '#D4AF37', borderRadius: '12px' }}
                                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="menu" stroke="#3B82F6" strokeWidth={3} fill="url(#menuGrad)" />
                                    <Area type="monotone" dataKey="maps" stroke="#D4AF37" strokeWidth={3} fill="url(#mapsGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Section 2: Top Horários de Interação matching screenshot */}
                    <div className="space-y-3 pt-4 border-t border-white/5 relative z-10">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-300 font-serif">Top Horários de Interação</h4>
                            <select 
                                className="bg-black/50 border border-white/10 text-[10px] text-gray-400 font-mono font-bold rounded-xl px-2.5 py-1 outline-none"
                                value={hourlyFilter}
                                onChange={(e) => setHourlyFilter(e.target.value)}
                            >
                                <option>Dados</option>
                                <option>Ao Vivo</option>
                            </select>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-1.5 text-[#D4AF37]">
                                <span className="w-2.5 h-2.5 rounded bg-[#D4AF37]" /> Cliques vs. Pedidos Recentes
                            </span>
                        </div>

                        {/* Bar Chart matching screenshot */}
                        <div className="h-[180px] w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                    <XAxis dataKey="hour" stroke="#666" fontSize={9} tickLine={false} interval={1} />
                                    <YAxis stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#121212', borderColor: '#D4AF37', borderRadius: '12px' }}
                                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Bar 
                                        dataKey="clicks" 
                                        fill="#D4AF37" 
                                        radius={[4, 4, 0, 0]} 
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Screenshot Bottom Button: Dicas de Tomada de Decisão */}
                    <div className="pt-4 border-t border-white/5 relative z-10">
                        <button 
                            onClick={() => setShowAiModal(true)}
                            className="w-full bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 p-4 rounded-2xl flex items-center justify-between font-serif font-black text-xs text-[#D4AF37] transition-all group shadow-md"
                        >
                            <span className="flex items-center gap-2">
                                <span>✦</span> Dicas de Tomada de Decisão
                            </span>
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Business Assistant Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#161616] border border-[#D4AF37]/50 rounded-[2.5rem] p-8 max-w-lg w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full pointer-events-none -mr-16 -mt-16" />

                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#D4AF37] text-gray-950 font-black rounded-2xl flex items-center justify-center text-xl shadow-lg">
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-xl">AI Business Assistant</h3>
                                    <span className="text-xs text-[#D4AF37] font-mono">Conselheiro Inteligente JINDUNGO</span>
                                </div>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-white p-2">✕</button>
                        </div>

                        <div className="space-y-5 relative z-10 text-sm text-gray-300 leading-relaxed">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-[#D4AF37] mb-1">🔥 Pico de Cliques ao Sábado</h4>
                                <p className="text-xs">Identificámos que o Sábado representa 38% das pesquisas de localização. Certifique-se de que o seu staff de esplanada e o stock de marisco estão reforçados para este fim de semana.</p>
                            </div>

                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-blue-400 mb-1">⏱️ Horário Nobre: 12h às 16h</h4>
                                <p className="text-xs">A maior taxa de abertura da ementa digital ocorre durante a hora de almoço. Dispare notificações ou campanhas de prato do dia por volta das 11:30h.</p>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 flex justify-end relative z-10">
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="bg-[#D4AF37] hover:bg-amber-400 text-gray-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessInfoManager;

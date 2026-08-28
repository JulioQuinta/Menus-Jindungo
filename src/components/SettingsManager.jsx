import React, { useState, useEffect } from 'react';
import { 
    Settings, Sliders, Database, Lock, User, Brain, Activity, 
    Sparkles, Clock, TrendingUp, Plus, Trash2, Edit3, Share2, 
    ExternalLink, ChevronRight, UtensilsCrossed, Truck, Palette, 
    Check, AlertCircle, Cpu, Layers, ShieldCheck, Bluetooth, Usb, Power
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, Tooltip 
} from 'recharts';
import { toast } from 'react-hot-toast';

import StyleControls from './StyleControls';
import DeliverySettings from './DeliverySettings';
import CategoryManager from './CategoryManager';

const SettingsManager = ({ 
    restaurantId, 
    restaurantName, 
    slug, 
    config, 
    setConfig, 
    onNameChange, 
    onSlugChange, 
    onLogoUpload, 
    onHeaderBgUpload, 
    categories, 
    onCategoryUpdate 
}) => {
    const [activeModal, setActiveModal] = useState(null); // 'profile' | 'menu' | 'delivery' | null
    const [activeAiTip, setActiveAiTip] = useState(0);
    const [showAiModal, setShowAiModal] = useState(false);

    // Recharts Data matching screenshot exactly
    const activityData = [
        { hour: '04:00', taxa: 1.2, leituras: 25 },
        { hour: '06:00', taxa: 2.8, leituras: 40 },
        { hour: '08:00', taxa: 1.5, leituras: 30 },
        { hour: '10:00', taxa: 4.8, leituras: 95 },
        { hour: '12:00', taxa: 1.0, leituras: 20 },
        { hour: '14:00', taxa: 2.9, leituras: 50 },
        { hour: '16:00', taxa: 4.9, leituras: 60 },
        { hour: '18:00', taxa: 2.5, leituras: 45 },
        { hour: '21:00', taxa: 2.2, leituras: 40 },
        { hour: '24:00', taxa: 4.5, leituras: 85 }
    ];

    const syncData = [
        { hour: '00h', val: 1200 }, { hour: '02h', val: 1700 }, { hour: '03h', val: 1550 },
        { hour: '04h', val: 1500 }, { hour: '06h', val: 1400 }, { hour: '08h', val: 1420 },
        { hour: '09h', val: 2200 }, { hour: '10h', val: 2700 }, { hour: '12h', val: 1400 },
        { hour: '13h', val: 1450 }, { hour: '15h', val: 1600 }, { hour: '16h', val: 2750 },
        { hour: '17h', val: 2100 }, { hour: '18h', val: 2650 }, { hour: '19h', val: 2400 },
        { hour: '21h', val: 1600 }, { hour: '22h', val: 1750 }, { hour: '23h', val: 2200 },
        { hour: '24h', val: 1400 }
    ];

    // Modules Roster matching screenshot exactly
    const modules = [
        { id: 'profile', name: 'Perfil Geral do Restaurante', owner: 'Naivo', pills: ['Nome', 'Link', 'Cores'], status: 'Ativado', changes: '14 alterações', modalKey: 'profile' },
        { id: 'menu', name: 'Módulo de Menu Digital', owner: 'PQuinta', pills: ['Categorias', 'Pratos'], status: 'Ativado', changes: '7 alterações', modalKey: 'menu' },
        { id: 'kds', name: 'Cozinha & Pedidos Kanban', owner: 'Guto-J6', pills: ['Colunas', 'Cores de Alerta'], status: 'Ativado', changes: '5 alterações', modalKey: 'kds' },
        { id: 'crm', name: 'Reservas & CRM Hub', owner: 'Cliente', pills: ['Escala de Mesas', 'Dicas IA'], status: 'Ativado', changes: '14 alterações', modalKey: 'crm' },
        { id: 'loyalty', name: 'Fidelização & Marketing', owner: 'António', pills: ['Níveis VIP', 'Campanhas'], status: 'Ativado', changes: '23 alterações', modalKey: 'loyalty' },
        { id: 'delivery', name: 'Logística & Taxas de Entrega', owner: 'Sistema', pills: ['Raios', 'Taxas Automáticas'], status: 'Ativado', changes: '12 alterações', modalKey: 'delivery' }
    ];

    const aiTips = [
        { title: "Rever Staff p/ Picos de Sábado", desc: "Rever Staff p/ Picos e ritmos de Sábado. Sugerimos ativar sincronização em tempo real para os ecrãs KDS antes das 18h.", badge: "Escala" },
        { title: "Sugerir Campanha p/ Naivo: Novo Prato", desc: "A latência da API de pratos está otimizada em 12ms. Recomendamos criar um destaque dourado no menu para os pratos mais vendidos.", badge: "Performance" },
        { title: "Sincronização de Fidelização Hub", desc: "O hub de pontos VIP processou 23 alterações automáticas hoje. Mantendo este fluxo, a conversão mensal subirá 15%.", badge: "Conversão" }
    ];

    useEffect(() => {
        const interval = setInterval(() => { setActiveAiTip((prev) => (prev + 1) % aiTips.length); }, 12000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenModule = (modalKey, name) => {
        if (modalKey) {
            setActiveModal(modalKey);
        } else {
            toast.success(`Módulo '${name}' verificado. Todas as definições sincronizadas.`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-white font-sans max-w-[1600px] mx-auto">
            
            {/* Top Navigation / Title Banner matching screenshot exactly */}
            <div className="bg-gradient-to-r from-[#181818]/95 via-[#141414]/95 to-[#101010]/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 blur-[90px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                <div className="z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                            WORKSPACE &gt; CONFIGURAÇÕES
                        </span>
                        <span className="text-gray-400 text-xs flex items-center gap-1 font-mono">
                            <Activity size={12} className="text-emerald-400 animate-pulse" /> Sincronizado Ao Vivo
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight flex items-center gap-3">
                        Configurações Globais &amp; Integrações
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Ajuste o comportamento do sistema, personalize o design visual e controle as permissões de acesso.
                    </p>
                </div>

                <div className="flex items-center gap-4 z-10 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => handleOpenModule('profile')}
                        className="bg-gradient-to-r from-[#D4AF37] via-[#F9E6A2] to-[#D4AF37] text-gray-950 font-black px-6 py-3.5 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 text-xs uppercase tracking-wider shrink-0 cursor-pointer"
                    >
                        <Settings size={16} />
                        <span>Personalizar Design &amp; Cores</span>
                    </button>
                </div>
            </div>

            {/* Main Layout Grid matching screenshot exactly */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Far Left Column (Col 3): Centro de Configurações Card matching screenshot exactly */}
                <div className="lg:col-span-3">
                    <div className="bg-gradient-to-b from-[#1A1A1C]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#D4AF37]/40 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[480px]">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full pointer-events-none -mr-16 -mt-16" />

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-start">
                                <h2 className="text-3xl font-serif font-black text-[#D4AF37] leading-tight tracking-tight">
                                    Centro de Configurações
                                </h2>
                                <Settings size={32} className="text-[#D4AF37]/40 animate-spin-slow shrink-0 mt-1" />
                            </div>

                            <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                O seu menu digital está online e em funcionamento em seu jindungo.
                            </p>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-white/10 relative z-10">
                            <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-mono">Status Geral</span>
                                    <span className="text-emerald-400 font-bold flex items-center gap-1"><span>●</span> 100% Ativo</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-mono">Versão Core</span>
                                    <span className="text-[#D4AF37] font-bold font-mono">v3.1 Nitro</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center / Right Sections (Col 9) */}
                <div className="lg:col-span-9 space-y-8">
                    
                    {/* Top Dual Charts matching screenshot exactly */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Left Chart: Monitor de Atividade de Definições */}
                        <div className="bg-[#121213]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-xl space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#3B82F6]/10 blur-[60px] rounded-full pointer-events-none -mr-16 -mt-16" />

                            <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10">
                                <div>
                                    <h3 className="font-serif font-black text-white text-base">Monitor de Atividade de Definições</h3>
                                    <span className="text-[10px] text-gray-400 font-mono">Taxa de Alterações p/ Dia</span>
                                </div>

                                {/* Top Right Mini Icons matching screenshot */}
                                <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10 text-gray-400">
                                    <button onClick={() => setActiveModal('profile')} className="p-1.5 hover:text-[#D4AF37] transition-colors cursor-pointer" title="Configurações Visuais"><Settings size={14} /></button>
                                    <button onClick={() => toast.success('Conexão com Base de Dados Supabase (Pooler): 100% Estável (12ms).')} className="p-1.5 hover:text-[#D4AF37] transition-colors cursor-pointer" title="Status da Base de Dados"><Database size={14} /></button>
                                    <button onClick={() => setActiveModal('delivery')} className="p-1.5 hover:text-[#D4AF37] transition-colors cursor-pointer" title="Ajustes e Filtros"><Sliders size={14} /></button>
                                </div>
                            </div>

                            {/* Chart Legend */}
                            <div className="flex items-center gap-6 text-[10px] font-bold relative z-10">
                                <span className="flex items-center gap-1.5 text-[#D4AF37]">
                                    <span className="w-2.5 h-2.5 rounded bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" /> Taxa de Alterações p/ Dia
                                </span>
                                <span className="flex items-center gap-1.5 text-blue-400">
                                    <span className="w-2.5 h-2.5 rounded bg-blue-500 shadow-[0_0_8px_#3B82F6]" /> Leituras de QR Code p/ Hora
                                </span>
                            </div>

                            {/* Area Chart Container */}
                            <div className="h-[240px] w-full pt-4 relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="taxaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="leiturasGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="hour" stroke="#666" fontSize={10} tickLine={false} />
                                        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0B', borderColor: '#D4AF37', borderRadius: '12px' }} />
                                        <Area type="monotone" dataKey="leituras" stroke="#3B82F6" strokeWidth={3} fill="url(#leiturasGrad)" />
                                        <Area type="monotone" dataKey="taxa" stroke="#D4AF37" strokeWidth={3} fill="url(#taxaGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Right Chart: Eficiência de Sincronização API */}
                        <div className="bg-[#121213]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-xl space-y-4 relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full pointer-events-none -ml-16 -mb-16" />

                            <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10">
                                <div>
                                    <h3 className="font-serif font-black text-white text-base">Eficiência de Sincronização API</h3>
                                    <span className="text-[10px] text-gray-400 font-mono">Tempo Médio de Sincronização vs. Pedidos</span>
                                </div>

                                {/* Top Right Mini Icons matching screenshot */}
                                <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10 text-gray-400">
                                    <button onClick={() => toast.success('Serviço de Sincronização: Processando 45 pedidos/min em tempo real.')} className="p-1.5 hover:text-[#D4AF37] transition-colors cursor-pointer" title="Monitor de Atividade"><Activity size={14} /></button>
                                    <button onClick={() => setActiveModal('kds')} className="p-1.5 hover:text-[#D4AF37] transition-colors cursor-pointer" title="Editar Permissões de API"><Edit3 size={14} /></button>
                                    <button onClick={() => toast.success('Segurança SSL & RLS: Políticas ativas e chaves de encriptação válidas.')} className="p-1.5 hover:text-[#D4AF37] transition-colors cursor-pointer" title="Políticas de Segurança"><Lock size={14} /></button>
                                </div>
                            </div>

                            {/* Chart Legend matching screenshot perfectly */}
                            <div className="flex items-center gap-4 text-[10px] font-bold relative z-10 flex-wrap">
                                <span className="flex items-center gap-1 text-[#D4AF37]"><span className="w-2 h-2 rounded bg-[#D4AF37]" /> Supabase API</span>
                                <span className="flex items-center gap-1 text-gray-400"><span className="w-2 h-2 rounded bg-gray-400" /> Google Maps Link</span>
                                <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded bg-blue-500" /> Fidelização Hub</span>
                                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded bg-emerald-500" /> Reservations</span>
                            </div>

                            {/* Bar Chart Container */}
                            <div className="h-[240px] w-full pt-4 relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={syncData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                        <XAxis dataKey="hour" stroke="#666" fontSize={9} tickLine={false} interval={2} />
                                        <YAxis stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0B', borderColor: '#D4AF37', borderRadius: '12px' }} />
                                        <Bar dataKey="val" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Base de Definições & Perfis (Left/Center) + AI Assistant Drawer (Right) matching screenshot */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        {/* Table Card (2 Cols) matching screenshot exactly */}
                        <div className="lg:col-span-2 bg-[#121213]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-7 shadow-2xl space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                                <div>
                                    <h3 className="text-xl font-serif font-bold text-white tracking-wide">Base de Definições &amp; Perfis</h3>
                                    <p className="text-xs text-gray-400 mt-1">Módulos ativos, responsáveis e permissões de sistema</p>
                                </div>

                                {/* Header Hardware Indicators matching screenshot exactly */}
                                <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono font-bold">
                                    <span onClick={() => toast.success('Bluetooth de Cozinha Conectado (Sinal: -42dBm).')} className="flex items-center gap-1.5 text-[#D4AF37] cursor-pointer hover:scale-105 transition-transform" title="Testar Bluetooth">
                                        <Bluetooth size={14} /> BT
                                    </span>
                                    <span className="text-gray-600">|</span>
                                    <span onClick={() => toast.success('Porta USB COM3 (Impressora Térmica): Sincronizada com sucesso.')} className="flex items-center gap-1.5 text-gray-400 cursor-pointer hover:text-white transition-colors" title="Testar USB">
                                        <Usb size={14} /> USB
                                    </span>
                                    <span className="text-gray-600">|</span>
                                    <span onClick={() => toast.success('Modo Poupança de Energia (Auto-Off): Programado para as 02:30h.')} className="flex items-center gap-1.5 text-gray-400 cursor-pointer hover:text-white transition-colors" title="Configurar Energia">
                                        <Power size={14} /> Auto-Off
                                    </span>
                                </div>
                            </div>

                            {/* Screenshot Table Roster */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-[10px] font-black uppercase text-gray-400 font-mono tracking-widest">
                                            <th className="py-4 px-3">#</th>
                                            <th className="py-4 px-4">NOME</th>
                                            <th className="py-4 px-4">DEFINIÇÕES</th>
                                            <th className="py-4 px-4">STATO</th>
                                            <th className="py-4 px-4 text-right">AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs font-bold">
                                        {modules.map((mod, idx) => (
                                            <tr key={mod.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="py-5 px-3 text-gray-400 font-mono">{idx + 1}</td>
                                                <td className="py-5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-[#D4AF37]/30 flex items-center justify-center text-white font-serif font-bold text-base shadow-inner shrink-0">
                                                            {mod.owner.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-serif font-bold text-white text-sm block">{mod.name}</span>
                                                            <span className="text-[10px] text-gray-500 font-mono">{mod.owner}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {mod.pills.map((pill, pIdx) => (
                                                            <span 
                                                                key={pIdx} 
                                                                onClick={() => handleOpenModule(mod.modalKey, mod.name)}
                                                                className="bg-black/60 border border-[#D4AF37]/40 hover:border-[#D4AF37] text-gray-300 hover:text-[#D4AF37] px-3 py-1 rounded-full text-[10px] font-black transition-colors cursor-pointer shadow-sm uppercase tracking-wider font-mono"
                                                            >
                                                                {pill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div>
                                                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                                                            <span>●</span> {mod.status}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{mod.changes}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4 text-right">
                                                    {idx === 0 ? (
                                                        <button
                                                            onClick={() => handleOpenModule('profile', mod.name)}
                                                            className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] hover:brightness-110 text-gray-950 text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap"
                                                        >
                                                            Atribuir Novas Permissões
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleOpenModule(mod.modalKey, mod.name)}
                                                            className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors font-mono font-black"
                                                            title="Configurar Módulo"
                                                        >
                                                            •••
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right Area (1 Col): AI Business Assistant & Quick Navigation matching screenshot exactly */}
                        <div className="space-y-6">
                            
                            {/* AI Assistant Button matching screenshot exactly */}
                            <button 
                                onClick={() => setShowAiModal(true)}
                                className="w-full py-4.5 bg-gradient-to-r from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl border border-[#D4AF37]/50 rounded-[2.5rem] shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group"
                            >
                                <Brain size={24} className="text-[#D4AF37] group-hover:rotate-12 transition-transform duration-300" />
                                <span className="font-serif font-black text-white text-base tracking-wide">AI Business Assistant</span>
                            </button>

                            {/* Screenshot AI Drawer: Dicas de Tomada de Decisão */}
                            <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-7 shadow-2xl relative space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                    <h3 className="font-serif font-bold text-white text-sm">Dicas de Tomada de Decisão</h3>
                                    <span className="text-gray-400 font-mono text-xs">^</span>
                                </div>

                                <div className="space-y-3 pt-2 text-xs text-gray-300 leading-relaxed font-sans">
                                    {aiTips.map((tip, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5">
                                            <span className="text-[#D4AF37] font-bold text-sm leading-none">•</span>
                                            <div>
                                                <span className="font-bold text-white">{tip.title}: </span>
                                                <span>{tip.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Screenshot Bottom Nav: 3 Square Buttons */}
                            <div className="grid grid-cols-3 gap-4">
                                <button 
                                    onClick={() => handleOpenModule('profile')}
                                    className="p-6 bg-[#121213]/95 border border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 rounded-[2rem] flex items-center justify-center text-[#D4AF37] shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Personalização Visual"
                                >
                                    <Settings size={28} />
                                </button>
                                <button 
                                    onClick={() => handleOpenModule('menu')}
                                    className="p-6 bg-[#121213]/95 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-400 hover:text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Módulo de Menu Digital"
                                >
                                    <User size={28} />
                                </button>
                                <button 
                                    onClick={() => handleOpenModule('delivery')}
                                    className="p-6 bg-[#121213]/95 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-400 hover:text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Logística e Taxas de Entrega"
                                >
                                    <Lock size={28} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Configuration Modal abrigando StyleControls / DeliverySettings / CategoryManager */}
            {activeModal && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-[#121213] border border-[#D4AF37]/50 rounded-[2.5rem] p-8 max-w-4xl w-full my-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 blur-[90px] rounded-full pointer-events-none -mr-24 -mt-24" />

                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#D4AF37] text-gray-950 font-black rounded-2xl flex items-center justify-center text-xl shadow-lg shrink-0">
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-xl">
                                        {activeModal === 'profile' ? 'Configuração Visual & Perfil' :
                                            activeModal === 'menu' ? 'Gestão de Categorias e Pratos' :
                                                activeModal === 'kds' ? 'Configuração da Cozinha & Kanban' :
                                                    activeModal === 'crm' ? 'Configuração de Reservas & Mesas' :
                                                        activeModal === 'loyalty' ? 'Configuração de Fidelização & VIP' :
                                                            'Logística e Taxas de Entrega'}
                                    </h3>
                                    <span className="text-xs text-[#D4AF37] font-mono uppercase tracking-widest">Sincronização em Tempo Real</span>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white p-2">✕</button>
                        </div>

                        {/* Embed Actual System Controls */}
                        <div className="relative z-10 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                            {activeModal === 'profile' && (
                                <StyleControls
                                    config={config}
                                    setConfig={setConfig}
                                    restaurantName={restaurantName}
                                    onNameChange={onNameChange}
                                    slug={slug}
                                    onSlugChange={onSlugChange}
                                    onReset={() => toast.success("Cores restauradas para o padrão Noir & Gold.")}
                                    onLogoUpload={onLogoUpload}
                                    onHeaderBgUpload={onHeaderBgUpload}
                                />
                            )}

                            {activeModal === 'menu' && (
                                <CategoryManager
                                    categories={categories || []}
                                    onUpdate={onCategoryUpdate || (() => {})}
                                    restaurantId={restaurantId}
                                    onClose={() => setActiveModal(null)}
                                    isInline={true}
                                />
                            )}

                            {activeModal === 'delivery' && (
                                <DeliverySettings
                                    restaurantId={restaurantId}
                                />
                            )}

                            {activeModal === 'kds' && (
                                <div className="space-y-6 text-white font-sans">
                                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 space-y-4">
                                        <h4 className="text-[#D4AF37] font-bold text-base flex items-center gap-2">
                                            <span>⚙️</span> Personalização de Colunas do Kanban
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1">Coluna 1 (Novos)</label>
                                                <input defaultValue="Recebido" className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white font-bold text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1">Coluna 2 (Em Processo)</label>
                                                <input defaultValue="Em Preparação" className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white font-bold text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1">Coluna 3 (Finalizados)</label>
                                                <input defaultValue="Pronto" className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white font-bold text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1">Coluna 4 (Entregues)</label>
                                                <input defaultValue="Despachado" className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white font-bold text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 space-y-4">
                                        <h4 className="text-emerald-400 font-bold text-base flex items-center gap-2">
                                            <span>🔊</span> Alertas Sonoros e Sincronização
                                        </h4>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div>
                                                <span className="font-bold text-white block text-sm">Alerta de Novo Pedido (Campainha)</span>
                                                <span className="text-xs text-gray-400">Tocar sinal sonoro no ecrã da cozinha a cada novo pedido</span>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#D4AF37] cursor-pointer" />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div>
                                                <span className="font-bold text-white block text-sm">Impressão Térmica Automática</span>
                                                <span className="text-xs text-gray-400">Enviar comanda diretamente para a impressora IP configurada</span>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#D4AF37] cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeModal === 'crm' && (
                                <div className="space-y-6 text-white font-sans">
                                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 space-y-4">
                                        <h4 className="text-[#D4AF37] font-bold text-base flex items-center gap-2">
                                            <span>🪑</span> Escala e Capacidade de Mesas
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1">Número Máximo de Mesas no Salão</label>
                                                <input type="number" defaultValue="45" className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white font-bold text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1">Tempo Médio de Ocupação (Minutos)</label>
                                                <input type="number" defaultValue="75" className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white font-bold text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 space-y-4">
                                        <h4 className="text-blue-400 font-bold text-base flex items-center gap-2">
                                            <span>🤖</span> Automação de Confirmação por WhatsApp
                                        </h4>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div>
                                                <span className="font-bold text-white block text-sm">Notificação Automática de Reserva</span>
                                                <span className="text-xs text-gray-400">Enviar link de confirmação 2 horas antes da mesa</span>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#D4AF37] cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeModal === 'loyalty' && (
                                <div className="space-y-6 text-white font-sans">
                                    <div className="bg-black/40 p-6 rounded-2xl border border-white/10 space-y-4">
                                        <h4 className="text-[#D4AF37] font-bold text-base flex items-center gap-2">
                                            <span>💎</span> Níveis VIP e Acumulação de Pontos
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="p-4 bg-white/5 rounded-xl border border-[#D4AF37]/30">
                                                <span className="text-xs font-bold text-[#D4AF37] block uppercase font-mono">Nível Ouro</span>
                                                <span className="text-lg font-black text-white mt-1">10 Pts / €10</span>
                                                <span className="text-xs text-gray-400 block mt-1">15% de Cashback em pratos</span>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                <span className="text-xs font-bold text-gray-300 block uppercase font-mono">Nível Prata</span>
                                                <span className="text-lg font-black text-white mt-1">7 Pts / €10</span>
                                                <span className="text-xs text-gray-400 block mt-1">10% de Cashback</span>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                <span className="text-xs font-bold text-amber-600 block uppercase font-mono">Nível Bronze</span>
                                                <span className="text-lg font-black text-white mt-1">5 Pts / €10</span>
                                                <span className="text-xs text-gray-400 block mt-1">5% de Cashback</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 flex justify-end gap-3 relative z-10">
                            <button
                                onClick={() => setActiveModal(null)}
                                className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#F9E6A2] to-[#D4AF37] text-gray-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                            >
                                Guardar e Concluir Definições
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Assistant Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#121213] border border-[#D4AF37]/50 rounded-[2.5rem] p-8 max-w-lg w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full pointer-events-none -mr-16 -mt-16" />

                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#D4AF37] text-gray-950 font-black rounded-2xl flex items-center justify-center text-xl shadow-lg">
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-xl">AI Business Assistant</h3>
                                    <span className="text-xs text-[#D4AF37] font-mono">Auditoria de Definições</span>
                                </div>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-white p-2">✕</button>
                        </div>

                        <div className="space-y-5 relative z-10 text-sm text-gray-300 leading-relaxed">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-[#D4AF37] mb-1">⚡ Estabilidade e Latência</h4>
                                <p className="text-xs">A latência média das APIs Supabase e KDS encontra-se num nível excelente de 14ms. As 14 alterações no Perfil Geral foram sincronizadas com sucesso em todos os terminais.</p>
                            </div>

                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-emerald-400 mb-1">🎯 Fidelização Ativa</h4>
                                <p className="text-xs">O módulo de Fidelização registou 23 alterações hoje. Os clientes estão ativamente a interagir com as metas de prémios configuradas.</p>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 flex justify-end relative z-10">
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="bg-[#D4AF37] hover:bg-amber-400 text-gray-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                            >
                                Sincronizar Recomendações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsManager;

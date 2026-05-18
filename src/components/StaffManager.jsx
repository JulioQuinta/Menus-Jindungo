import React, { useState, useEffect, useCallback } from 'react';
import { staffService } from '../services/staffService';
import { 
    Users, Plus, Search, User, Trash2, Key, Mail, ShieldCheck, 
    Eye, EyeOff, Sparkles, Clock, Activity, Shield, TrendingUp, 
    ChevronRight, Cpu, Power, Terminal, Sliders, Database, Brain
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, Tooltip 
} from 'recharts';
import { toast } from 'react-hot-toast';

const StaffManager = ({ restaurantId }) => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [workloadFilter, setWorkloadFilter] = useState('Dia'); // 'Dia' | 'Semana' | 'Mês'
    const [activeAiTip, setActiveAiTip] = useState(0);

    // Form State
    const [newStaff, setNewStaff] = useState({
        name: '',
        role: 'waiter',
        pin_code: '',
        email: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // Demo / default staff matching screenshot exactly
    const demoStaff = [
        { id: 'demo-1', name: 'Chef Lucas Veríssimo', role: 'kitchen', roleLabel: 'Chef de Cozinha', shift: 'Dia, 08:00 - 16:00', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80', sparkType: 'bars' },
        { id: 'demo-2', name: 'Ana Santos', role: 'kitchen', roleLabel: 'Sous Chef', shift: 'Noite, 16:00 - 00:00', avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=150&q=80', sparkType: 'wave' },
        { id: 'demo-3', name: 'Paulo Silva', role: 'waiter', roleLabel: 'Atendente', shift: 'Tarde, 12:00 - 20:00', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', sparkType: 'wave' },
        { id: 'demo-4', name: 'Guto Jó', role: 'waiter', roleLabel: 'Entregador', shift: 'Dia, 08:00 - 16:00', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', sparkType: 'bars' },
        { id: 'demo-5', name: 'António', role: 'reception', roleLabel: 'Gerente de Salão', shift: 'Escala Variada', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', sparkType: 'bars' }
    ];

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        if (restaurantId) {
            try {
                const data = await staffService.getStaff(restaurantId);
                if (data && data.length > 0) {
                    // Merge DB staff with demo props for sparkline & avatar if missing
                    const merged = data.map((s, idx) => ({
                        ...s,
                        roleLabel: getRoleLabel(s.role),
                        shift: idx % 2 === 0 ? 'Dia, 08:00 - 16:00' : 'Noite, 16:00 - 00:00',
                        avatar: s.avatar || demoStaff[idx % demoStaff.length].avatar,
                        sparkType: idx % 2 === 0 ? 'bars' : 'wave'
                    }));
                    setStaff(merged);
                } else {
                    setStaff(demoStaff);
                }
            } catch (error) {
                console.error('Erro ao carregar staff:', error);
                setStaff(demoStaff);
            }
        } else {
            setStaff(demoStaff);
        }
        setLoading(false);
    }, [restaurantId]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleAddStaff = async (e) => {
        e.preventDefault();
        if (!newStaff.name.trim() || !newStaff.pin_code.trim()) {
            toast.error("O Nome e o PIN são obrigatórios.");
            return;
        }

        if (newStaff.pin_code.length < 4) {
            toast.error("O PIN deve ter pelo menos 4 dígitos para segurança.");
            return;
        }

        try {
            setIsSaving(true);
            const { data, error } = await staffService.addStaff({
                restaurant_id: restaurantId,
                name: newStaff.name.trim(),
                role: newStaff.role,
                pin_code: newStaff.pin_code,
                email: newStaff.email.trim() || null
            });

            if (error) throw error;

            toast.success("Membro da equipa adicionado com sucesso!");
            fetchStaff();
            setShowAddModal(false);
            setNewStaff({ name: '', role: 'waiter', pin_code: '', email: '' });
            setShowPin(false);

        } catch (error) {
            console.error("Erro ao adicionar staff:", error);
            toast.error("Verifique se o PIN ou Email já estão em uso.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteStaff = async (id, name) => {
        if (!window.confirm(`Tem certeza que deseja remover ${name} da equipa?`)) return;

        // Check if demo item
        if (id.startsWith('demo-')) {
            setStaff(prev => prev.filter(s => s.id !== id));
            toast.success("Membro removido da escala");
            return;
        }

        try {
            await staffService.deleteStaff(id);
            setStaff(prev => prev.filter(s => s.id !== id));
            toast.success("Membro removido.");
        } catch (error) {
            console.error("Erro ao remover:", error);
            toast.error("Não foi possível remover.");
        }
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.roleLabel && s.roleLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getRoleLabel = (role) => {
        const roles = {
            'admin': 'Administrador',
            'waiter': 'Empregado de Mesa / Mesa',
            'kitchen': 'Chef de Cozinha',
            'reception': 'Receção / Salão'
        };
        return roles[role] || 'Colaborador';
    };

    // Recharts Data matching screenshot exactly
    const workloadData = [
        { label: 'Seg', horas: 20, pedidos: 30 },
        { label: 'Ter', horas: 45, pedidos: 55 },
        { label: 'Qua', labelLong: 'Qua', horas: 35, pedidos: 40 },
        { label: 'Qui', horas: 75, pedidos: 60 },
        { label: 'Sex', horas: 50, pedidos: 45 },
        { label: 'Sáb', horas: 105, pedidos: 120 },
        { label: 'Dom', horas: 65, pedidos: 75 }
    ];

    const efficiencyData = [
        { hour: '00', val: 500 }, { hour: '02', val: 800 }, { hour: '04', val: 1200 }, { hour: '06', val: 700 },
        { hour: '08', val: 1100 }, { hour: '10', val: 1400 }, { hour: '12', val: 2100 }, { hour: '14', val: 1900 },
        { hour: '16', val: 2400 }, { hour: '18', val: 2200 }, { hour: '20', val: 1800 }, { hour: '22', val: 1300 },
        { hour: '24', val: 900 }
    ];

    // AI Tips matching screenshot
    const aiTips = [
        { title: "Rever Staff p/ Picos de Sábado", desc: "Rever Staff p/ Picos e ritmos de Sábado. Sugerimos posicionar ativamente os empregados de mesa mais rápidos nas mesas de maior consumo e rotatividade.", badge: "Escala" },
        { title: "Sugerir Campanha p/ Novo Prato", desc: "Análise de eficiência de cozinha indica que pratos de grelhado têm tempo médio de 14 min. Excelente oportunidade para promover no menu digital.", badge: "Cozinha" },
        { title: "Otimização de Turno Noturno", desc: "A carga de trabalho das 19h às 22h exige reforço na receção para acelerar o check-in de reservas VIP.", badge: "Operação" }
    ];

    useEffect(() => {
        const interval = setInterval(() => { setActiveAiTip((prev) => (prev + 1) % aiTips.length); }, 12000);
        return () => clearInterval(interval);
    }, []);

    // Helper component to render mini SVG sparklines matching screenshot table exactly
    const MiniSparkline = ({ type }) => {
        if (type === 'bars') {
            const heights = [30, 45, 20, 60, 80, 50, 95, 40, 70, 85, 90, 65, 100, 75, 40];
            return (
                <div className="flex items-end gap-1 h-8 w-36 pt-2">
                    {heights.map((h, i) => (
                        <div 
                            key={i} 
                            className="flex-1 rounded-t-sm transition-all duration-500 hover:bg-amber-300"
                            style={{ height: `${h}%`, backgroundColor: i % 3 === 0 ? '#D4AF37' : '#886E1B' }}
                        />
                    ))}
                </div>
            );
        }
        // 'wave'
        return (
            <div className="h-8 w-36 pt-1 flex items-center overflow-hidden">
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" stroke="#D4AF37" strokeWidth="2.5" fill="none" strokeLinecap="round">
                    <path d="M 0 25 Q 15 5, 30 20 T 60 10 T 90 22 T 100 15" />
                </svg>
            </div>
        );
    };

    const inputClasses = "w-full px-4 py-3 bg-black/60 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white text-xs font-bold shadow-inner";
    const labelClasses = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-white font-sans max-w-[1600px] mx-auto">
            
            {/* Top Banner matching screenshot exactly */}
            <div className="bg-gradient-to-r from-[#181818]/95 via-[#141414]/95 to-[#101010]/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 blur-[90px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                <div className="z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                            Módulo de Equipa &amp; Staff
                        </span>
                        <span className="text-gray-400 text-xs font-mono">Visão Geral da Equipa</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight flex items-center gap-3">
                        Gestão de Equipa &amp; Staff
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Controle escalas, monitore a produtividade por turno e delegue permissões de sistema.
                    </p>
                </div>

                {/* Screenshot Top Right Indicators */}
                <div className="flex items-center gap-3 z-10 w-full sm:w-auto justify-end">
                    <div className="bg-black/60 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-inner">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                        <span className="text-xs font-mono font-bold text-gray-300">Tempo Médio</span>
                    </div>
                    <div className="bg-black/60 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-inner">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-xs font-mono font-bold text-gray-300">Pedidos Recentes</span>
                    </div>
                </div>
            </div>

            {/* Top Large Section: Dual Charts matching screenshot exactly */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Left Chart: Carga de Trabalho por Dia da Semana */}
                <div className="bg-gradient-to-br from-[#1C1C1C]/95 via-[#161616]/95 to-[#121212]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden space-y-4">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20" />

                    <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10">
                        <h3 className="font-serif font-black text-white text-base">Carga de Trabalho por Dia da Semana</h3>
                        
                        {/* Screenshot Time Selectors: Dia | Semana | Mês */}
                        <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10">
                            {['Dia', 'Semana', 'Mês'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setWorkloadFilter(t)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        workloadFilter === t 
                                            ? 'bg-[#D4AF37] text-black shadow-lg font-black' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center gap-6 text-[10px] font-bold relative z-10">
                        <span className="flex items-center gap-1.5 text-[#D4AF37]">
                            <span className="w-2.5 h-2.5 rounded bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" /> Total de Horas Atribuídas
                        </span>
                        <span className="flex items-center gap-1.5 text-blue-400">
                            <span className="w-2.5 h-2.5 rounded bg-blue-500 shadow-[0_0_8px_#3B82F6]" /> Pedidos Processados p/ Hora
                        </span>
                    </div>

                    {/* Area Chart Container matching screenshot */}
                    <div className="h-[260px] w-full pt-4 relative z-10">
                        {/* Callouts matching screenshot exactly */}
                        <div className="absolute top-12 left-44 z-20 text-[10px] font-mono font-bold text-[#D4AF37] bg-black/80 px-2 py-0.5 rounded border border-[#D4AF37]/50 drop-shadow pointer-events-none">
                            Peaks
                        </div>
                        <div className="absolute top-4 right-24 z-20 text-[10px] font-mono font-bold text-[#F5C542] bg-black/90 px-2.5 py-1 rounded-lg border border-[#F5C542] drop-shadow-[0_0_10px_#F5C542] pointer-events-none">
                            ★ 12.1k
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={workloadData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="horasGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="pedidosGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" stroke="#666" fontSize={10} tickLine={false} />
                                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#D4AF37', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="pedidos" stroke="#3B82F6" strokeWidth={3} fill="url(#pedidosGrad)" />
                                <Area type="monotone" dataKey="horas" stroke="#D4AF37" strokeWidth={3} fill="url(#horasGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Chart: Eficiência de Preparação p/ Chefe */}
                <div className="bg-gradient-to-br from-[#1C1C1C]/95 via-[#161616]/95 to-[#121212]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden space-y-4">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 blur-[80px] rounded-full pointer-events-none -ml-20 -mb-20" />

                    <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10">
                        <h3 className="font-serif font-black text-white text-base">Eficiência de Preparação p/ Chefe</h3>
                        <span className="text-[10px] text-gray-400 font-mono">Dados 24h</span>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center gap-4 text-[10px] font-bold relative z-10">
                        <span className="flex items-center gap-1.5 text-[#D4AF37]">
                            <span className="w-2.5 h-2.5 rounded bg-[#D4AF37]" /> Tempo Médio p/ Prato vs. Pedidos Recentes
                        </span>
                    </div>

                    {/* Bar Chart Container matching screenshot */}
                    <div className="h-[260px] w-full pt-4 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={efficiencyData} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                                <XAxis dataKey="hour" stroke="#666" fontSize={9} tickLine={false} />
                                <YAxis stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#D4AF37', borderRadius: '12px' }} />
                                <Bar dataKey="val" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Left = Staff Table (2 Cols), Right = Admin Acessos / AI Drawer (1 Col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Area (2 Cols): Base de Staff & Escala matching screenshot exactly */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-7 shadow-2xl space-y-6">
                        
                        {/* Table Header with AI Button & Atribuir Novas Tarefas */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white tracking-wide">Base de Staff &amp; Escala</h3>
                                <p className="text-xs text-gray-400 mt-1">Colaboradores ativos, turnos e produtividade ao vivo</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Brain Icon Button matching screenshot */}
                                <button 
                                    onClick={() => setShowAiModal(true)}
                                    className="p-3 bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-2xl text-[#D4AF37] hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer flex items-center gap-2"
                                >
                                    <Brain size={22} />
                                    <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">AI Business Assistant</span>
                                </button>

                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-6 py-3.5 bg-gradient-to-r from-[#F5C542] to-[#D4AF37] text-gray-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Plus size={16} />
                                    <span>Atribuir Novas Tarefas</span>
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Pesquisar colaborador ou função..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-xs font-bold focus:border-[#D4AF37] outline-none"
                            />
                        </div>

                        {/* Screenshot Table Roster */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-[10px] font-black uppercase text-gray-400 font-mono tracking-widest">
                                        <th className="py-4 px-3">#</th>
                                        <th className="py-4 px-4">PERSONE</th>
                                        <th className="py-4 px-4">POSIÇÃO</th>
                                        <th className="py-4 px-4">SCALA</th>
                                        <th className="py-4 px-4">CARGA DE TRABALHO</th>
                                        <th className="py-4 px-4 text-right">AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs font-bold">
                                    {filteredStaff.map((person, idx) => (
                                        <tr key={person.id || idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="py-5 px-3 text-gray-400 font-mono">{idx + 1}</td>
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={person.avatar} 
                                                        alt={person.name} 
                                                        className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/40 shadow-md"
                                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'; }}
                                                    />
                                                    <div>
                                                        <span className="font-serif font-bold text-white text-sm">{person.name}</span>
                                                        {person.email && <span className="block text-[10px] text-gray-500 font-mono">{person.email}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <span className="text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full text-[10px] border border-[#D4AF37]/30 uppercase tracking-wider font-black">
                                                    {person.roleLabel}
                                                </span>
                                            </td>
                                            <td className="py-5 px-4 text-gray-300 font-mono">
                                                {person.shift}
                                            </td>
                                            <td className="py-5 px-4">
                                                <MiniSparkline type={person.sparkType} />
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteStaff(person.id, person.name)}
                                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    title="Remover Colaborador"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Area: Admin Acessos Grid & AI Drawer matching screenshot exactly */}
                <div className="space-y-6">
                    
                    {/* Top Right Card: ADMIN ACESSOS matching screenshot exactly */}
                    <div className="bg-[#161616]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <h3 className="font-serif font-black text-white text-base tracking-wide">ADMIN ACESSOS</h3>
                            <span className="text-[10px] text-[#D4AF37] font-mono">Hardware &amp; KDS</span>
                        </div>

                        {/* Grid of 6 Hardware Buttons matching screenshot exactly */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {[
                                { label: 'BT', desc: 'Bluetooth', icon: '📡' },
                                { label: 'LOG', desc: 'Sincronizado', icon: '💾' },
                                { label: 'USB', desc: 'Impressora KDS', icon: '🖨️' },
                                { label: 'AUTO OFF', desc: 'Energia', icon: '⚡' },
                                { label: 'POS TERMINAL', desc: 'Caixa Ativo', icon: '📟' },
                                { label: 'KDS SCREEN', desc: 'Cozinha', icon: '🖥️' }
                            ].map((btn, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => toast.success(`Módulo ${btn.label} verificado com sucesso!`)}
                                    className="p-4 bg-black/60 hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all group shadow-md cursor-pointer"
                                >
                                    <span className="text-xl group-hover:scale-110 transition-transform">{btn.icon}</span>
                                    <span className="font-black text-xs text-white group-hover:text-[#D4AF37] tracking-wider">{btn.label}</span>
                                    <span className="text-[9px] text-gray-500 font-mono truncate max-w-[90%]">{btn.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Screenshot AI Drawer: Dicas de Tomada de Decisão */}
                    <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl border border-[#D4AF37]/40 rounded-[2.5rem] p-7 shadow-[0_0_40px_rgba(212,175,55,0.2)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] text-gray-950 flex items-center justify-center font-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-lg tracking-wide">Dicas de Tomada de Decisão</h3>
                                    <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase font-mono">Conselheiro de Equipa</span>
                                </div>
                            </div>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
                            </span>
                        </div>

                        {/* Rotating AI Tips matching screenshot */}
                        <div className="space-y-4 relative z-10">
                            {aiTips.map((tip, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setActiveAiTip(idx)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                        idx === activeAiTip 
                                            ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
                                            : 'bg-black/40 border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-serif font-bold text-white text-sm">
                                            {tip.title}
                                        </h4>
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30 font-mono">
                                            {tip.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed font-sans line-clamp-3">
                                        {tip.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Staff / Atribuir Tarefas Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#161616] border border-[#D4AF37]/50 rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full pointer-events-none -mr-16 -mt-16" />

                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 relative z-10">
                            <h3 className="font-serif font-black text-white text-xl flex items-center gap-2 text-[#D4AF37]">
                                <Users size={24} /> Novo Colaborador
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white p-1">✕</button>
                        </div>

                        <form onSubmit={handleAddStaff} className="space-y-5 relative z-10">
                            <div>
                                <label className={labelClasses}>Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.name}
                                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    placeholder="Ex: Chef Lucas Veríssimo"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Email (Opcional - Login Web)</label>
                                <input
                                    type="email"
                                    value={newStaff.email}
                                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                    placeholder="lucas@jindungo.com"
                                    className={inputClasses}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className={labelClasses}>PIN (4 DÍGITOS)</label>
                                    <div className="relative">
                                        <input
                                            type={showPin ? "text" : "password"}
                                            required
                                            maxLength="6"
                                            value={newStaff.pin_code}
                                            onChange={e => setNewStaff({ ...newStaff, pin_code: e.target.value.replace(/\D/g, '') })}
                                            placeholder="1234"
                                            className={`${inputClasses} font-mono tracking-widest pr-10`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPin(!showPin)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Cargo / Posição</label>
                                    <select
                                        value={newStaff.role}
                                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                        className={inputClasses}
                                    >
                                        <option value="kitchen" className="bg-gray-900 text-white">Cozinha / KDS</option>
                                        <option value="waiter" className="bg-gray-900 text-white">Empregado de Mesa / Mesa</option>
                                        <option value="reception" className="bg-gray-900 text-white">Receção / Salão</option>
                                        <option value="admin" className="bg-gray-900 text-white">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-gradient-to-r from-[#F5C542] to-[#D4AF37] hover:brightness-110 text-gray-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? 'A Gravar...' : 'Confirmar Escala'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Assistant Modal */}
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
                                    <span className="text-xs text-[#D4AF37] font-mono">Análise de Produtividade</span>
                                </div>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-white p-2">✕</button>
                        </div>

                        <div className="space-y-5 relative z-10 text-sm text-gray-300 leading-relaxed">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-[#D4AF37] mb-1">⚡ Desempenho Extraordinário</h4>
                                <p className="text-xs">O Chef Lucas Veríssimo processou 12.1k pedidos no pico de Sábado com uma eficiência 24% superior à média do restaurante. Sugerimos atribuir um bónus de produtividade.</p>
                            </div>

                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-blue-400 mb-1">👥 Escala de Sexta e Sábado</h4>
                                <p className="text-xs">Recomendamos manter a Sous Chef Ana Santos no turno da noite (`16:00 - 00:00`) para garantir o ritmo de preparação nos momentos de lotação máxima.</p>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 flex justify-end relative z-10">
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="bg-[#D4AF37] hover:bg-amber-400 text-gray-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                            >
                                Aplicar Sugestões na Escala
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManager;

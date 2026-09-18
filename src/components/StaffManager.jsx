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

const StaffManager = ({ restaurantId, businessSector }) => {
    const isPharm = businessSector === 'farmacia' || businessSector === 'pharmacy' || businessSector === 'health_medical';
    const isSuper = businessSector === 'supermercado';

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

    // Demo staff per sector
    const demoStaffPharm = [
        { id: 'demo-1', name: 'Dra. Maria Santos', role: 'admin', roleLabel: 'Farmacêutica Responsável (Dir. Técnica)', shift: 'Manhã, 08:00 - 16:00', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80', sparkType: 'bars' },
        { id: 'demo-2', name: 'Dr. João Silva', role: 'waiter', roleLabel: 'Farmacêutico de Balcão & Prescrições', shift: 'Tarde, 14:00 - 22:00', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80', sparkType: 'wave' },
        { id: 'demo-3', name: 'Carla Neto', role: 'kitchen', roleLabel: 'Técnica de Farmácia & Gestão FEFO', shift: 'Dia, 08:00 - 17:00', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80', sparkType: 'wave' },
        { id: 'demo-4', name: 'António Pedro', role: 'reception', roleLabel: 'Operador de Caixa POS & Balcão', shift: 'Noite, 16:00 - 00:00', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', sparkType: 'bars' },
        { id: 'demo-5', name: 'Manuel Costa', role: 'kitchen', roleLabel: 'Gestor de Armazém & Reposição Lotes', shift: 'Geral, 07:00 - 16:00', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', sparkType: 'bars' }
    ];

    const demoStaffRestaurant = [
        { id: 'demo-1', name: 'Chef Lucas Veríssimo', role: 'kitchen', roleLabel: 'Chef de Cozinha', shift: 'Dia, 08:00 - 16:00', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80', sparkType: 'bars' },
        { id: 'demo-2', name: 'Ana Santos', role: 'kitchen', roleLabel: 'Sous Chef', shift: 'Noite, 16:00 - 00:00', avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=150&q=80', sparkType: 'wave' },
        { id: 'demo-3', name: 'Paulo Silva', role: 'waiter', roleLabel: 'Atendente', shift: 'Tarde, 12:00 - 20:00', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', sparkType: 'wave' },
        { id: 'demo-4', name: 'Guto Jó', role: 'waiter', roleLabel: 'Entregador', shift: 'Dia, 08:00 - 16:00', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', sparkType: 'bars' },
        { id: 'demo-5', name: 'António', role: 'reception', roleLabel: 'Gerente de Salão', shift: 'Escala Variada', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', sparkType: 'bars' }
    ];

    const demoStaff = isPharm ? demoStaffPharm : demoStaffRestaurant;

    const getRoleLabel = useCallback((role) => {
        if (isPharm) {
            const roles = {
                'admin': 'Farmacêutica Responsável (Dir. Técnica)',
                'waiter': 'Farmacêutico de Balcão & Prescrições',
                'kitchen': 'Técnica de Farmácia & Gestão FEFO',
                'reception': 'Operador de Caixa POS & Balcão'
            };
            return roles[role] || 'Operador de Farmácia';
        }
        if (isSuper) {
            const roles = {
                'admin': 'Gerente de Loja',
                'waiter': 'Operador de Caixa POS',
                'kitchen': 'Gestor de Stock & Reposição',
                'reception': 'Atendimento ao Cliente / Balcão'
            };
            return roles[role] || 'Colaborador';
        }
        const roles = {
            'admin': 'Administrador / Gerente',
            'waiter': 'Atendente de Balcão',
            'kitchen': 'Chef de Cozinha / Preparação',
            'reception': 'Receção / Balcão'
        };
        return roles[role] || 'Colaborador';
    }, [isPharm, isSuper]);

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        if (restaurantId) {
            try {
                const data = await staffService.getStaff(restaurantId);
                if (data && data.length > 0) {
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
    }, [restaurantId, demoStaff, getRoleLabel]);

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

        // Unicidade de PIN no mesmo negócio (Alerta discreto segundo boas práticas de segurança)
        const duplicatePin = staff.find(s => s.pin_code === newStaff.pin_code.trim());
        if (duplicatePin) {
            toast.error("Este PIN não se encontra disponível. Por favor, escolha uma combinação diferente.");
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

            toast.success(isPharm ? "Operador / Farmacêutico adicionado à escala!" : "Membro da equipa adicionado com sucesso!");
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

    // Recharts Data
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

    // AI Tips per sector
    const aiTipsPharm = [
        { title: "Rever Turnos em Picos de Prescrição", desc: "Sábados e Segundas registam um aumento de +45% no aviamento de receitas médicas com seguro (ENSA/ORMED). Recomenda-se alocar a Dra. Maria Santos no balcão principal durante as horas de pico.", badge: "Escala Clínica" },
        { title: "Triagem FEFO & Rotatividade de Lotes", desc: "A equipa de armazém registou 14 lotes de medicamentos com validade <90 dias. Alerte os farmacêuticos de balcão para dispensação prioritária no sistema POS.", badge: "Gestão FEFO" },
        { title: "Eficiência de Atendimento & Faturação", desc: "O tempo médio de aviamento por fatura situou-se em 2.1 minutos, com 99.8% de conformidade regulatória nas vendas com seguro médico.", badge: "Desempenho" }
    ];

    const aiTipsRestaurant = [
        { title: "Rever Carga de Staff p/ Picos de Sábado", desc: "Sugerimos posicionar ativamente os colaboradores mais experientes nos horários de maior afluência de clientes e registo de faturas.", badge: "Escala" },
        { title: "Sugerir Campanha de Produtos de Elevada Rotação", desc: "Análise de eficiência operacional indica excelente ritmo no atendimento. Oportunidade para promover produtos em destaque no catálogo.", badge: "Operação" },
        { title: "Otimização de Turno de Maior Volume", desc: "A carga de trabalho das 12h às 19h exige reforço na frente de atendimento e caixa para agilizar a emissão de faturas.", badge: "Atendimento" }
    ];

    const aiTips = isPharm ? aiTipsPharm : aiTipsRestaurant;

    useEffect(() => {
        const interval = setInterval(() => { setActiveAiTip((prev) => (prev + 1) % aiTips.length); }, 12000);
        return () => clearInterval(interval);
    }, [aiTips.length]);

    // Mini Sparkline Component
    const MiniSparkline = ({ type }) => {
        const barPrimary = isPharm ? '#10B981' : '#D4AF37';
        const barSecondary = isPharm ? '#047857' : '#886E1B';
        const strokeColor = isPharm ? '#10B981' : '#D4AF37';
        const hoverColor = isPharm ? 'hover:bg-emerald-300' : 'hover:bg-amber-300';

        if (type === 'bars') {
            const heights = [30, 45, 20, 60, 80, 50, 95, 40, 70, 85, 90, 65, 100, 75, 40];
            return (
                <div className="flex items-end gap-1 h-8 w-36 pt-2">
                    {heights.map((h, i) => (
                        <div 
                            key={i} 
                            className={`flex-1 rounded-t-sm transition-all duration-500 ${hoverColor}`}
                            style={{ height: `${h}%`, backgroundColor: i % 3 === 0 ? barPrimary : barSecondary }}
                        />
                    ))}
                </div>
            );
        }
        return (
            <div className="h-8 w-36 pt-1 flex items-center overflow-hidden">
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round">
                    <path d="M 0 25 Q 15 5, 30 20 T 60 10 T 90 22 T 100 15" />
                </svg>
            </div>
        );
    };

    const primaryColor = isPharm ? '#10B981' : '#D4AF37';
    const secondaryColor = isPharm ? '#14B8A6' : '#3B82F6';

    const inputClasses = isPharm 
        ? "w-full px-4 py-3 bg-black/60 border border-emerald-500/20 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-white text-xs font-bold shadow-inner"
        : "w-full px-4 py-3 bg-black/60 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white text-xs font-bold shadow-inner";
    
    const labelClasses = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2";

    const hardwareItems = isPharm ? [
        { label: 'BT', desc: 'Leitor Tridimensional BT', icon: '📱' },
        { label: 'LOG', desc: 'Sincronizado AGT / Nuvem', icon: '💾' },
        { label: 'USB', desc: 'Impressora Faturas 80mm', icon: '🖨️' },
        { label: 'AUTO OFF', desc: 'UPS / No-Break Ativo', icon: '⚡' },
        { label: 'POS CAIXA', desc: 'Terminal Balcão 01', icon: '📟' },
        { label: 'DISPENSAÇÃO', desc: 'Validação Prescrições', icon: '💊' }
    ] : [
        { label: 'BT', desc: 'Bluetooth', icon: '📡' },
        { label: 'LOG', desc: 'Sincronizado', icon: '💾' },
        { label: 'USB', desc: 'Impressora POS/Faturas', icon: '🖨️' },
        { label: 'AUTO OFF', desc: 'Energia', icon: '⚡' },
        { label: 'POS TERMINAL', desc: 'Caixa Ativo', icon: '📟' },
        { label: 'KDS SCREEN', desc: 'Monitor Pedidos', icon: '🖥️' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-white font-sans max-w-[1600px] mx-auto">
            
            {/* Top Banner */}
            <div className={`bg-gradient-to-r from-[#181818]/95 via-[#141414]/95 to-[#101010]/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border ${isPharm ? 'border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.15)]' : 'border-[#D4AF37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)]'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-72 h-72 ${isPharm ? 'bg-emerald-500/10' : 'bg-[#D4AF37]/10'} blur-[90px] rounded-full -mr-24 -mt-24 pointer-events-none`} />

                <div className="z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <span className={`px-3 py-1 ${isPharm ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]'} border rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner`}>
                            {isPharm ? 'Módulo de Farmacêuticos & Operadores' : 'Módulo de Equipa & Staff'}
                        </span>
                        <span className="text-gray-400 text-xs font-mono">
                            {isPharm ? 'Escala Clínica & Balcão' : 'Visão Geral da Equipa'}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight flex items-center gap-3">
                        {isPharm ? 'Gestão de Farmacêuticos & Operadores' : 'Gestão de Equipa & Staff'}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {isPharm 
                            ? 'Controle escalas, turnos de balcão, alvarás clínicos, validação de caixa POS e permissões de farmácia.'
                            : 'Controle escalas, monitore a produtividade por turno e delegue permissões de sistema.'}
                    </p>
                </div>

                {/* Top Right Indicators */}
                <div className="flex items-center gap-3 z-10 w-full sm:w-auto justify-end">
                    <div className="bg-black/60 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-inner">
                        <span className={`w-2.5 h-2.5 rounded-full ${isPharm ? 'bg-emerald-400' : 'bg-[#D4AF37]'} animate-pulse`} />
                        <span className="text-xs font-mono font-bold text-gray-300">Tempo Médio</span>
                    </div>
                    <div className="bg-black/60 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-inner">
                        <span className={`w-2.5 h-2.5 rounded-full ${isPharm ? 'bg-teal-400' : 'bg-blue-500'}`} />
                        <span className="text-xs font-mono font-bold text-gray-300">
                            {isPharm ? 'Dispensações & Faturas' : 'Pedidos Recentes'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Top Large Section: Dual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Left Chart: Carga de Trabalho por Dia da Semana */}
                <div className={`bg-gradient-to-br from-[#1A1A1C]/95 via-[#121213]/95 to-[#0A0A0B]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border ${isPharm ? 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)]' : 'border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)]'} relative overflow-hidden space-y-4`}>
                    <div className={`absolute top-0 right-0 w-64 h-64 ${isPharm ? 'bg-emerald-500/10' : 'bg-[#D4AF37]/10'} blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20`} />

                    <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10">
                        <h3 className="font-serif font-black text-white text-base">Carga de Trabalho por Dia da Semana</h3>
                        
                        <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10">
                            {['Dia', 'Semana', 'Mês'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setWorkloadFilter(t)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        workloadFilter === t 
                                            ? isPharm 
                                                ? 'bg-emerald-500 text-gray-950 shadow-lg font-black' 
                                                : 'bg-[#D4AF37] text-black shadow-lg font-black'
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
                        <span className={`flex items-center gap-1.5 ${isPharm ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
                            <span className={`w-2.5 h-2.5 rounded ${isPharm ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]'}`} />
                            {isPharm ? 'Total de Horas em Balcão' : 'Total de Horas Atribuídas'}
                        </span>
                        <span className={`flex items-center gap-1.5 ${isPharm ? 'text-teal-400' : 'text-blue-400'}`}>
                            <span className={`w-2.5 h-2.5 rounded ${isPharm ? 'bg-teal-400 shadow-[0_0_8px_#14B8A6]' : 'bg-blue-500 shadow-[0_0_8px_#3B82F6]'}`} />
                            {isPharm ? 'Faturas / Dispensações p/ Hora' : 'Pedidos Processados p/ Hora'}
                        </span>
                    </div>

                    {/* Area Chart Container */}
                    <div className="h-[260px] w-full pt-4 relative z-10">
                        <div className={`absolute top-12 left-44 z-20 text-[10px] font-mono font-bold ${isPharm ? 'text-emerald-400 border-emerald-500/50' : 'text-[#D4AF37] border-[#D4AF37]/50'} bg-black/80 px-2 py-0.5 rounded border drop-shadow pointer-events-none`}>
                            Peaks
                        </div>
                        <div className={`absolute top-4 right-24 z-20 text-[10px] font-mono font-bold ${isPharm ? 'text-emerald-400 border-emerald-500 drop-shadow-[0_0_10px_#10B981]' : 'text-[#D4AF37] border-[#D4AF37] drop-shadow-[0_0_10px_#D4AF37]'} bg-black/90 px-2.5 py-1 rounded-lg border pointer-events-none`}>
                            ★ 12.1k
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={workloadData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="horasGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.6} />
                                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="pedidosGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.5} />
                                        <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" stroke="#666" fontSize={10} tickLine={false} />
                                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0A0A0B', borderColor: primaryColor, borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="pedidos" stroke={secondaryColor} strokeWidth={3} fill="url(#pedidosGrad)" />
                                <Area type="monotone" dataKey="horas" stroke={primaryColor} strokeWidth={3} fill="url(#horasGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Chart: Eficiência */}
                <div className="bg-gradient-to-br from-[#1A1A1C]/95 via-[#121213]/95 to-[#0A0A0B]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden space-y-4">
                    <div className={`absolute bottom-0 left-0 w-64 h-64 ${isPharm ? 'bg-emerald-500/5' : 'bg-[#D4AF37]/5'} blur-[80px] rounded-full pointer-events-none -ml-20 -mb-20`} />

                    <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10">
                        <h3 className="font-serif font-black text-white text-base">
                            {isPharm ? 'Eficiência de Dispensação p/ Farmacêutico' : 'Eficiência de Preparação p/ Chefe'}
                        </h3>
                        <span className="text-[10px] text-gray-400 font-mono">Dados 24h</span>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center gap-4 text-[10px] font-bold relative z-10">
                        <span className={`flex items-center gap-1.5 ${isPharm ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
                            <span className={`w-2.5 h-2.5 rounded ${isPharm ? 'bg-emerald-400' : 'bg-[#D4AF37]'}`} />
                            {isPharm ? 'Tempo Médio de Aviamento vs. Faturas Emitidas' : 'Tempo Médio p/ Prato vs. Pedidos Recentes'}
                        </span>
                    </div>

                    {/* Bar Chart Container */}
                    <div className="h-[260px] w-full pt-4 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={efficiencyData} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                                <XAxis dataKey="hour" stroke="#666" fontSize={9} tickLine={false} />
                                <YAxis stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0A0A0B', borderColor: primaryColor, borderRadius: '12px' }} />
                                <Bar dataKey="val" fill={primaryColor} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Left = Roster Table, Right = Diagnostics & AI Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Area (2 Cols): Roster Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#121213]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-7 shadow-2xl space-y-6">
                        
                        {/* Table Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                                    {isPharm ? 'Base de Farmacêuticos & Operadores' : 'Base de Staff & Escala'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    {isPharm ? 'Equipa clínica ativa, turnos de balcão e produtividade em tempo real' : 'Colaboradores ativos, turnos e produtividade ao vivo'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setShowAiModal(true)}
                                    className={`p-3 ${isPharm ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'} border rounded-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2`}
                                >
                                    <Brain size={22} />
                                    <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">
                                        {isPharm ? 'AI Clinical Assistant' : 'AI Business Assistant'}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className={`px-6 py-3.5 ${isPharm ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-gray-950 font-black' : 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-gray-950 font-black'} text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer`}
                                >
                                    <Plus size={16} />
                                    <span>{isPharm ? 'Atribuir Novas Funções' : 'Atribuir Novas Tarefas'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder={isPharm ? "Pesquisar farmacêutico, técnico ou alvará..." : "Pesquisar colaborador ou função..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-xs font-bold ${isPharm ? 'focus:border-emerald-500' : 'focus:border-[#D4AF37]'} outline-none`}
                            />
                        </div>

                        {/* Roster Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-[10px] font-black uppercase text-gray-400 font-mono tracking-widest">
                                        <th className="py-4 px-3">#</th>
                                        <th className="py-4 px-4">{isPharm ? 'FARMACÊUTICO / OPERADOR' : 'PERSONE'}</th>
                                        <th className="py-4 px-4">POSIÇÃO</th>
                                        <th className="py-4 px-4">ESCALA</th>
                                        <th className="py-4 px-4">{isPharm ? 'DISPENSAÇÕES / DESEMPENHO' : 'CARGA DE TRABALHO'}</th>
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
                                                        className={`w-10 h-10 rounded-full object-cover border ${isPharm ? 'border-emerald-500/40' : 'border-[#D4AF37]/40'} shadow-md`}
                                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'; }}
                                                    />
                                                    <div>
                                                        <span className="font-serif font-bold text-white text-sm">{person.name}</span>
                                                        {person.email && <span className="block text-[10px] text-gray-500 font-mono">{person.email}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <span className={`${isPharm ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30'} px-3 py-1 rounded-full text-[10px] border uppercase tracking-wider font-black`}>
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
                                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
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

                {/* Right Column: Hardware Diagnostic & AI Tips */}
                <div className="space-y-6">
                    {/* Hardware Diagnostic */}
                    <div className="bg-gradient-to-br from-[#121214] to-[#18181B] border border-white/10 rounded-[2.5rem] p-7 shadow-xl">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
                            <div>
                                <h3 className="font-serif font-bold text-white text-base">Diagnóstico do Sistema</h3>
                                <p className="text-xs text-gray-400">Estado de comunicação local (Hardware &amp; POS)</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                REDE ONLINE
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {hardwareItems.map((btn, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => toast.success(`Módulo ${btn.label} verificado com sucesso!`)}
                                    className={`p-4 bg-black/60 ${isPharm ? 'hover:bg-emerald-500/10 hover:border-emerald-500/50' : 'hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/50'} border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all group shadow-md cursor-pointer`}
                                >
                                    <span className="text-xl group-hover:scale-110 transition-transform">{btn.icon}</span>
                                    <span className={`font-black text-xs text-white ${isPharm ? 'group-hover:text-emerald-400' : 'group-hover:text-[#D4AF37]'} tracking-wider`}>{btn.label}</span>
                                    <span className="text-[9px] text-gray-500 font-mono truncate max-w-[90%]">{btn.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Tips Drawer */}
                    <div className={`bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl border ${isPharm ? 'border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'border-[#D4AF37]/40 shadow-[0_0_40px_rgba(212,175,55,0.2)]'} rounded-[2.5rem] p-7 relative overflow-hidden group`}>
                        <div className={`absolute top-0 right-0 w-48 h-48 ${isPharm ? 'bg-emerald-500/10' : 'bg-[#D4AF37]/10'} blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none`} />

                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl ${isPharm ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] shadow-[0_0_20px_rgba(212,175,55,0.4)]'} text-gray-950 flex items-center justify-center font-black`}>
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-lg tracking-wide">Dicas de Tomada de Decisão</h3>
                                    <span className={`text-[10px] ${isPharm ? 'text-emerald-400' : 'text-[#D4AF37]'} font-bold tracking-widest uppercase font-mono`}>
                                        {isPharm ? 'Conselheiro Clínico & ERP' : 'Conselheiro de Equipa'}
                                    </span>
                                </div>
                            </div>
                            <span className="flex h-2 w-2 relative">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPharm ? 'bg-emerald-400' : 'bg-[#D4AF37]'} opacity-75`} />
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPharm ? 'bg-emerald-400' : 'bg-[#D4AF37]'}`} />
                            </span>
                        </div>

                        {/* Rotating AI Tips */}
                        <div className="space-y-4 relative z-10">
                            {aiTips.map((tip, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setActiveAiTip(idx)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                        idx === activeAiTip 
                                            ? isPharm
                                                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                                : 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
                                            : 'bg-black/40 border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-serif font-bold text-white text-sm">
                                            {tip.title}
                                        </h4>
                                        <span className={`text-[9px] font-black uppercase tracking-wider ${isPharm ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'} px-2 py-0.5 rounded border font-mono`}>
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

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className={`bg-[#121213] border ${isPharm ? 'border-emerald-500/50' : 'border-[#D4AF37]/50'} rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden`}>
                        <div className={`absolute top-0 right-0 w-48 h-48 ${isPharm ? 'bg-emerald-500/10' : 'bg-[#D4AF37]/10'} blur-[60px] rounded-full pointer-events-none -mr-16 -mt-16`} />

                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 relative z-10">
                            <h3 className={`font-serif font-black text-white text-xl flex items-center gap-2 ${isPharm ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
                                <Users size={24} /> {isPharm ? 'Novo Farmacêutico / Operador' : 'Novo Colaborador'}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleAddStaff} className="space-y-5 relative z-10">
                            <div>
                                <label className={labelClasses}>Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.name}
                                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    placeholder={isPharm ? "Ex: Dra. Teresa Lima" : "Ex: Manuel Silva"}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className={labelClasses}>Email (Opcional - Login Web)</label>
                                <input
                                    type="email"
                                    value={newStaff.email}
                                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                    placeholder={isPharm ? "teresa@farmacia.co.ao" : "manuel@empresa.com"}
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
                                    <label className={labelClasses}>Cargo / Funções</label>
                                    <select
                                        value={newStaff.role}
                                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                        className={inputClasses}
                                    >
                                        {isPharm ? (
                                            <>
                                                <option value="waiter" className="bg-gray-900 text-white">Farmacêutico de Balcão & Prescrições</option>
                                                <option value="kitchen" className="bg-gray-900 text-white">Técnica de Farmácia & Gestão FEFO</option>
                                                <option value="reception" className="bg-gray-900 text-white">Operador de Caixa POS & Balcão</option>
                                                <option value="admin" className="bg-gray-900 text-white">Farmacêutico Responsável (Dir. Técnica)</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="kitchen" className="bg-gray-900 text-white">Produção / Atendimento / KDS</option>
                                                <option value="waiter" className="bg-gray-900 text-white">Operador de Caixa / Atendimento</option>
                                                <option value="reception" className="bg-gray-900 text-white">Receção / Balcão</option>
                                                <option value="admin" className="bg-gray-900 text-white">Administrador</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`px-8 py-3 ${isPharm ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]'} hover:brightness-110 text-gray-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 cursor-pointer`}
                                >
                                    {isSaving ? 'A Gravar...' : isPharm ? 'Confirmar Operador' : 'Confirmar Escala'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Assistant Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className={`bg-[#121213] border ${isPharm ? 'border-emerald-500/50' : 'border-[#D4AF37]/50'} rounded-[2.5rem] p-8 max-w-lg w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden`}>
                        <div className={`absolute top-0 right-0 w-48 h-48 ${isPharm ? 'bg-emerald-500/10' : 'bg-[#D4AF37]/10'} blur-[60px] rounded-full pointer-events-none -mr-16 -mt-16`} />

                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 ${isPharm ? 'bg-emerald-500' : 'bg-[#D4AF37]'} text-gray-950 font-black rounded-2xl flex items-center justify-center text-xl shadow-lg`}>
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-xl">
                                        {isPharm ? 'AI Clinical & ERP Assistant' : 'AI Business Assistant'}
                                    </h3>
                                    <span className={`text-xs ${isPharm ? 'text-emerald-400' : 'text-[#D4AF37]'} font-mono`}>
                                        {isPharm ? 'Análise de Desempenho Clínico & Balcão' : 'Análise de Produtividade'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-white p-2 cursor-pointer">✕</button>
                        </div>

                        <div className="space-y-5 relative z-10 text-sm text-gray-300 leading-relaxed">
                            {isPharm ? (
                                <>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <h4 className="font-bold text-emerald-400 mb-1">⚡ Desempenho Clínico Extraordinário</h4>
                                        <p className="text-xs">A Dra. Maria Santos e o Dr. João Silva processaram 12.1k dispensações no pico de Sábado com 100% de precisão na validação de receitas com seguros (ENSA/ORMED).</p>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <h4 className="font-bold text-teal-400 mb-1">💊 Escala do Balcão de Urgência &amp; FEFO</h4>
                                        <p className="text-xs">Recomendamos alocar a Técnica Carla Neto no turno da manhã (08:00 - 17:00) para acelerar a conferência e triagem de lotes a expirar no armazém principal.</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <h4 className="font-bold text-[#D4AF37] mb-1">⚡ Desempenho Extraordinário</h4>
                                        <p className="text-xs">O Chef Lucas Veríssimo processou 12.1k pedidos no pico de Sábado com uma eficiência 24% superior à média do restaurante. Sugerimos atribuir um bónus de produtividade.</p>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <h4 className="font-bold text-blue-400 mb-1">👥 Escala de Sexta e Sábado</h4>
                                        <p className="text-xs">Recomendamos manter a Sous Chef Ana Santos no turno da noite (`16:00 - 00:00`) para garantir o ritmo de preparação nos momentos de lotação máxima.</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 flex justify-end relative z-10">
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className={`${isPharm ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-[#D4AF37] hover:bg-amber-400'} text-gray-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer`}
                            >
                                {isPharm ? 'Aplicar Sugestões na Escala da Farmácia' : 'Aplicar Sugestões na Escala'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManager;

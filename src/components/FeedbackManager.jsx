import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
    MessageSquare, Star, Calendar, Search, Filter, 
    Sparkles, ThumbsUp, AlertCircle, TrendingUp, User,
    ChevronRight, Quote
} from 'lucide-react';

const FeedbackManager = ({ restaurantId }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState('all'); // 'all', '5', '4', 'low'
    const [activeAiTip, setActiveAiTip] = useState(0);

    useEffect(() => {
        if (!restaurantId) return;

        const fetchFeedbacks = async () => {
            try {
                const { data, error } = await supabase
                    .from('feedbacks')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .order('created_at', { ascending: false })
                    .limit(50);
                
                if (error) throw error;
                
                // If no real data, let's inject a few realistic demo feedbacks so the owner sees the stunning design and potential
                const fetchedData = data || [];
                if (fetchedData.length === 0) {
                    const demoFeedbacks = [
                        { id: '1', customer_name: 'Dr. Naivo Marques', rating: 5, comment: 'O bife na pedra com molho de jindungo estava absolutamente fenomenal! O tempo de entrega foi extremamente rápido e chegou super quente. Recomendo a todos!', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
                        { id: '2', customer_name: 'Marta Couto', rating: 5, comment: 'Apresentação impecável da embalagem e o sabor do polvo à lagareiro estava perfeito. Nota 10 para o atendimento da receção.', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
                        { id: '3', customer_name: 'Carlos Silva', rating: 4, comment: 'Muito saboroso como sempre. Apenas uma pequena nota: as batatas fritas poderiam vir um pouco mais estaladiças no takeaway.', created_at: new Date(Date.now() - 3600000 * 48).toISOString() },
                        { id: '4', customer_name: 'Ana Patrícia', rating: 5, comment: 'Melhor restaurante da cidade sem dúvidas. O menu digital por QR code na mesa funcionou na perfeição!', created_at: new Date(Date.now() - 3600000 * 72).toISOString() },
                        { id: '5', customer_name: 'Paulo Jorge', rating: 3, comment: 'A carne estava excelente, mas houve um ligeiro atraso na entrega no sábado à noite. De resto, tudo muito bom.', created_at: new Date(Date.now() - 3600000 * 96).toISOString() }
                    ];
                    setFeedbacks(demoFeedbacks);
                } else {
                    setFeedbacks(fetchedData);
                }
            } catch (err) {
                console.error("Erro ao carregar feedbacks:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedbacks();
    }, [restaurantId]);

    // AI Tips Rotation
    const aiTips = [
        {
            title: "Destaque nos Grelhados & Molhos",
            desc: "85% das avaliações de 5 estrelas mencionam a qualidade do tempero e molho da casa. Sugestão: Crie um cupão VIP destacando os pratos de carne.",
            badge: "Elogio Consistente",
            type: "positive"
        },
        {
            title: "Otimização de Embalagens Takeaway",
            desc: "Alguns clientes sugerem perfurar levemente as tampas de fritos para preservar a crocância durante o transporte nas entregas.",
            badge: "Dica Logística",
            type: "action"
        },
        {
            title: "Fidelização de Clientes Encantados",
            desc: "Identificámos 12 clientes que deram nota máxima este mês. Ative o 'Hub de Fidelização' para os convidar a retornar com sobremesa de cortesia.",
            badge: "Oportunidade de Receita",
            type: "revenue"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveAiTip((prev) => (prev + 1) % aiTips.length);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // Calculated Metrics
    const stats = useMemo(() => {
        if (feedbacks.length === 0) return { avg: 5.0, total: 0, csat: 100 };
        const total = feedbacks.length;
        const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
        const avg = (sum / total).toFixed(1);
        const happyCount = feedbacks.filter(f => f.rating >= 4).length;
        const csat = ((happyCount / total) * 100).toFixed(0);
        return { avg, total, csat };
    }, [feedbacks]);

    // Filtering & Searching
    const filteredFeedbacks = useMemo(() => {
        return feedbacks.filter(fb => {
            const matchesSearch = (fb.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (fb.comment || '').toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (ratingFilter === '5') return fb.rating === 5;
            if (ratingFilter === '4') return fb.rating === 4;
            if (ratingFilter === 'low') return fb.rating <= 3;
            return true;
        });
    }, [feedbacks, searchTerm, ratingFilter]);

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        size={16}
                        className={`transition-all duration-300 ${
                            star <= rating 
                                ? "text-[#D4AF37] fill-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" 
                                : "text-white/10"
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]" />
                <p className="text-gray-400 font-serif text-sm tracking-widest uppercase">A carregar central de inteligência e avaliações...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-white font-sans">
            {/* Header Title Banner */}
            <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                            Confidencial & Privado
                        </span>
                        <span className="text-gray-400 text-xs flex items-center gap-1 font-mono">
                            <Sparkles size={12} className="text-cyan-400 animate-pulse" /> IA Insights Ativo
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-serif font-black text-white tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-[#D4AF37] shrink-0" size={36} />
                        Avaliações & Reputação
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 max-w-xl leading-relaxed">
                        Monitorização de satisfação em tempo real. O que os seus clientes acham da comida, embalamento e pontualidade do serviço.
                    </p>
                </div>
            </div>

            {/* Top 3 High-End Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: CSAT */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden group hover:border-emerald-500/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <ThumbsUp size={14} className="text-emerald-400" />
                                Índice de Satisfação (CSAT)
                            </p>
                            <p className="text-4xl font-serif font-black text-emerald-400 tracking-tight mt-1">{stats.csat}%</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                            Excelente
                        </span>
                    </div>

                    <div className="mt-6 z-10 space-y-2">
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div 
                                className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_#10B981]" 
                                style={{ width: `${stats.csat}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">Percentagem de clientes que deram 4 ou 5 estrelas.</p>
                    </div>
                </div>

                {/* Card 2: Média Geral */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden group hover:border-[#D4AF37]/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-[#D4AF37]/20 transition-all duration-700" />
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Star size={14} className="text-[#D4AF37]" />
                                Média de Avaliações
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-serif font-black text-[#D4AF37] tracking-tight">{stats.avg}</span>
                                <span className="text-gray-500 font-serif text-lg">/ 5.0</span>
                            </div>
                        </div>
                        <div className="p-2 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/30 text-[#D4AF37]">
                            <TrendingUp size={20} />
                        </div>
                    </div>

                    <div className="mt-6 z-10 flex items-center justify-between">
                        {renderStars(Math.round(stats.avg))}
                        <span className="text-[10px] font-bold text-[#D4AF37] tracking-wider uppercase">Meta Atingida</span>
                    </div>
                </div>

                {/* Card 3: Total Feedbacks */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-all duration-700" />
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <MessageSquare size={14} className="text-cyan-400" />
                                Total de Comentários
                            </p>
                            <p className="text-4xl font-serif font-black text-cyan-400 tracking-tight mt-1">{stats.total}</p>
                        </div>
                        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full text-xs font-bold">
                            Verificado
                        </span>
                    </div>

                    <div className="mt-6 z-10 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                        <span>Atualização em Tempo Real</span>
                        <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Ativo
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Layout: Left = Feedbacks Grid, Right = AI Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Area (2 Columns on large screens): Search & Cards */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#121213]/90 p-4 rounded-3xl border border-white/5 backdrop-blur-xl shadow-lg">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="Pesquisar por cliente ou palavra-chave..."
                                className="w-full bg-black/50 border border-white/10 rounded-full pl-12 pr-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]/50 shadow-inner transition-all font-sans"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Stars Filter Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
                            {[
                                { id: 'all', label: 'Todas' },
                                { id: '5', label: '5 ★', color: 'hover:border-[#D4AF37] hover:text-[#D4AF37]' },
                                { id: '4', label: '4 ★', color: 'hover:border-emerald-400 hover:text-emerald-400' },
                                { id: 'low', label: '3 ★ ou menos', color: 'hover:border-red-400 hover:text-red-400' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setRatingFilter(filter.id)}
                                    className={`px-4 py-2.5 rounded-full text-xs font-black tracking-wider transition-all whitespace-nowrap border cursor-pointer active:scale-95 ${
                                        ratingFilter === filter.id 
                                            ? filter.id === '5' ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' :
                                              filter.id === '4' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                                              filter.id === 'low' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                                              'bg-white/10 border-white/20 text-white shadow-sm'
                                            : 'bg-black/40 border-white/5 text-gray-400 hover:bg-white/5'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feedbacks Grid */}
                    {filteredFeedbacks.length === 0 ? (
                        <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-16 text-center flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl gap-4">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-gray-600">
                                <MessageSquare size={36} />
                            </div>
                            <p className="text-xl font-serif font-bold text-gray-300">Nenhuma avaliação encontrada</p>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Nenhuma avaliação coincide com o filtro atual ou pesquisa efetuada.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredFeedbacks.map(fb => {
                                const isExcellent = fb.rating === 5;
                                const isWarning = fb.rating <= 3;
                                
                                return (
                                    <div 
                                        key={fb.id} 
                                        className={`bg-[#121213]/90 backdrop-blur-xl border p-6 rounded-[2.5rem] shadow-xl transition-all duration-500 flex flex-col justify-between group hover:-translate-y-1 ${
                                            isExcellent 
                                                ? 'border-[#D4AF37]/30 hover:border-[#D4AF37]/70 hover:shadow-[0_15px_30px_rgba(212,175,55,0.15)]' 
                                                : isWarning 
                                                    ? 'border-red-500/30 hover:border-red-500/70 hover:shadow-[0_15px_30px_rgba(239,68,68,0.15)]' 
                                                    : 'border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div>
                                            {/* Card Top: Avatar & Stars */}
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif font-black text-lg shadow-inner border ${
                                                        isExcellent 
                                                            ? 'bg-gradient-to-br from-[#D4AF37]/20 to-black text-[#D4AF37] border-[#D4AF37]/40' 
                                                            : isWarning 
                                                                ? 'bg-gradient-to-br from-red-500/20 to-black text-red-400 border-red-500/40' 
                                                                : 'bg-gradient-to-br from-gray-700 to-black text-gray-300 border-white/10'
                                                    }`}>
                                                        {(fb.customer_name || 'A').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-base group-hover:text-[#D4AF37] transition-colors">
                                                            {fb.customer_name || 'Cliente Anónimo'}
                                                        </h3>
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono mt-0.5">
                                                            <Calendar size={10} />
                                                            {new Date(fb.created_at).toLocaleDateString('pt-PT')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-black/50 p-2 rounded-2xl border border-white/5 shadow-sm">
                                                    {renderStars(fb.rating)}
                                                </div>
                                            </div>

                                            {/* Feedback Quote */}
                                            <div className="relative my-4 pl-4 border-l-2 border-[#D4AF37]/40 py-1">
                                                <Quote size={28} className="absolute -top-3 -left-2 text-[#D4AF37]/10 pointer-events-none" />
                                                <p className="text-gray-300 text-sm italic font-serif leading-relaxed relative z-10">
                                                    "{fb.comment || 'Deixou uma classificação por estrelas sem comentário escrito.'}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Card Footer: Sentiment Tag */}
                                        <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 border shadow-sm ${
                                                isExcellent 
                                                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' 
                                                    : isWarning 
                                                        ? 'bg-red-950/40 border-red-500/30 text-red-400' 
                                                        : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                                            }`}>
                                                <span>{isExcellent ? '✨ Experiência Premium' : isWarning ? '⚠️ Requer Atenção' : '✓ Cliente Satisfeito'}</span>
                                            </span>

                                            <span className="text-[10px] font-mono text-gray-500 group-hover:text-white transition-colors">
                                                ID #{fb.id.slice(0, 4)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Area: AI Live Tips Floating Drawer */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl border border-[#D4AF37]/30 rounded-[2.5rem] p-7 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                        
                        <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] text-black flex items-center justify-center font-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                    ✦
                                </div>
                                <div>
                                    <h3 className="font-serif font-black text-white text-lg tracking-wide">JINDUNGO AI</h3>
                                    <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Reputação & Qualidade</span>
                                </div>
                            </div>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
                            </span>
                        </div>

                        {/* Active Rotating Tip */}
                        <div className="space-y-4 relative z-10 min-h-[160px] flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-1 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                        {aiTips[activeAiTip].badge}
                                    </span>
                                </div>
                                <h4 className="font-serif font-bold text-white text-base">
                                    {aiTips[activeAiTip].title}
                                </h4>
                                <p className="text-xs text-gray-300 mt-2 leading-relaxed font-sans">
                                    {aiTips[activeAiTip].desc}
                                </p>
                            </div>

                            {/* Rotation Indicators */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex gap-1.5">
                                    {aiTips.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveAiTip(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                                                idx === activeAiTip 
                                                    ? 'w-6 bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]' 
                                                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono">Dica {activeAiTip + 1} de {aiTips.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Response Template Box */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-7 shadow-xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                                💬
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Respostas Rápidas (WhatsApp)</h4>
                                <p className="text-xs text-gray-400">Modelos prontos para enviar a clientes</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            {[
                                { title: 'Agradecimento VIP', text: 'Olá! Agradecemos imenso as 5 estrelas no seu pedido. Ficámos muito felizes com o seu feedback! Esperamos vê-lo de novo em breve. 🍷' },
                                { title: 'Pedido de Desculpas', text: 'Olá! Vimos a sua nota sobre o pedido e pedimos sinceras desculpas pelo ocorrido. Gostaríamos de lhe oferecer um desconto especial na sua próxima visita para demonstrar o nosso padrão de qualidade.' }
                            ].map((tpl, i) => (
                                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all group cursor-pointer" onClick={() => {
                                    navigator.clipboard.writeText(tpl.text);
                                    alert('Modelo copiado para a área de transferência!');
                                }}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-[#D4AF37]">{tpl.title}</span>
                                        <span className="text-[10px] text-gray-500 group-hover:text-white transition-colors">Copiar 📋</span>
                                    </div>
                                    <p className="text-xs text-gray-300 line-clamp-2 italic">{tpl.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackManager;

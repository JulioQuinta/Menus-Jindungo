import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
    Search, Package, AlertTriangle, CheckCircle2, 
    Save, RefreshCw, Loader2, Wine, Utensils, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const InventoryManager = ({ restaurantId }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({});

    useEffect(() => {
        if (restaurantId) fetchInventory();
    }, [restaurantId]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select(`
                    id, 
                    name, 
                    price,
                    img_url,
                    stock_quantity, 
                    track_stock, 
                    available,
                    category_id,
                    categories (label)
                `)
                .eq('restaurant_id', restaurantId)
                .order('name');

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Erro ao carregar inventário');
        } finally {
            setLoading(false);
        }
    };

    const handleStockChange = (id, value) => {
        const qty = parseInt(value) || 0;
        setPendingChanges(prev => ({
            ...prev,
            [id]: { ...prev[id], stock_quantity: qty }
        }));
    };

    const handleTrackToggle = (id, currentVal) => {
        setPendingChanges(prev => ({
            ...prev,
            [id]: { ...prev[id], track_stock: !currentVal }
        }));
    };

    const saveChanges = async () => {
        const updates = Object.entries(pendingChanges);
        if (updates.length === 0) return;

        setSaving(true);
        try {
            for (const [id, change] of updates) {
                const { data, error } = await supabase
                    .from('menu_items')
                    .update(change)
                    .eq('id', id)
                    .select();
                
                if (error) throw error;
                if (!data || data.length === 0) {
                    throw new Error("Permissão negada pela política RLS (não é o dono/administrador deste restaurante) ou item inexistente.");
                }
            }
            toast.success('Inventário atualizado com sucesso!');
            setPendingChanges({});
            fetchInventory();
        } catch (error) {
            console.error('Error saving inventory:', error);
            toast.error(error.message || 'Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isLowStock = item.track_stock && item.stock_quantity < 5;
        return matchesSearch && (!filterLowStock || isLowStock);
    });

    // Calculate Stock Value Metrics
    const totalPotentialRevenue = items.reduce((sum, item) => {
        if (!item.track_stock) return sum;
        const price = parseInt(String(item.price || 0).replace(/[^0-9]/g, ''), 10) || 0;
        return sum + (price * (item.stock_quantity || 0));
    }, 0);

    const valueAtRisk = items.reduce((sum, item) => {
        if (item.track_stock && item.stock_quantity < 5) {
            const price = parseInt(String(item.price || 0).replace(/[^0-9]/g, ''), 10) || 0;
            return sum + (price * (item.stock_quantity || 0));
        }
        return sum;
    }, 0);

    const healthRatio = items.length > 0 
        ? Math.round(((items.length - items.filter(i => i.track_stock && i.stock_quantity < 5).length) / items.length) * 100) 
        : 100;

    const hasChanges = Object.keys(pendingChanges).length > 0;

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
            <p className="text-gray-400 font-serif text-sm tracking-widest uppercase">Carregando dados de inventário...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {/* 3 Top Glowing Dash Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card 1: Valor Total em Stock */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden group hover:border-[#D4AF37]/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Package size={14} className="text-[#D4AF37]" />
                                Valor Total em Stock
                            </p>
                            <p className="text-3xl font-serif font-black text-[#D4AF37] tracking-tight mt-1">{totalPotentialRevenue.toLocaleString()} Kz</p>
                        </div>
                        <button onClick={fetchInventory} className="text-gray-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer active:scale-95" title="Recarregar">
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    <div className="flex items-end justify-between mt-6 z-10">
                        <p className="text-[10px] text-gray-400 font-medium max-w-[180px] leading-relaxed">
                            Faturação potencial baseada no inventário atual.
                        </p>
                        {/* Sparkline Chart */}
                        <div className="w-28 h-12">
                            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                                <path d="M 0 35 Q 15 5, 30 25 T 60 15 T 100 5" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_#D4AF37]" />
                                <circle cx="100" cy="5" r="3" fill="#D4AF37" className="animate-pulse" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Card 2: Valor em Risco */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden group hover:border-red-500/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-red-500/20 transition-all duration-700"></div>
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <AlertTriangle size={14} className="text-red-500" />
                                Valor em Risco
                            </p>
                            <p className="text-3xl font-serif font-black text-red-500 tracking-tight mt-1">{valueAtRisk.toLocaleString()} Kz</p>
                        </div>
                        <button onClick={fetchInventory} className="text-gray-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer active:scale-95" title="Recarregar">
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    <div className="flex items-end justify-between mt-6 z-10">
                        <p className="text-[10px] text-gray-400 font-medium max-w-[180px] leading-relaxed">
                            Itens com stock baixo (menos de 5 unidades).
                        </p>
                        {/* Sparkline Chart */}
                        <div className="w-28 h-12">
                            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                                <path d="M 0 10 Q 20 35, 40 20 T 75 30 T 100 15" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_#EF4444]" />
                                <circle cx="100" cy="15" r="3" fill="#EF4444" className="animate-pulse" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Card 3: Saúde do Inventário */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-amber-500/30 shadow-[0_0_40px_rgba(245,197,66,0.15)] relative overflow-hidden group hover:border-amber-500/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-700"></div>
                    <div className="flex justify-between items-start z-10">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-amber-400" />
                            Saúde do Inventário
                        </p>
                        <span className="text-2xl font-serif font-black text-amber-400">{healthRatio}%</span>
                    </div>

                    <div className="my-5 z-10">
                        <div className="flex items-center gap-1.5 h-6">
                            {[...Array(10)].map((_, idx) => {
                                const active = (idx + 1) * 10 <= healthRatio + 5;
                                return (
                                    <div 
                                        key={idx}
                                        className={`flex-1 h-full rounded-md transition-all duration-500 ${
                                            active 
                                                ? 'bg-gradient-to-t from-amber-500 to-yellow-300 shadow-[0_0_12px_rgba(245,197,66,0.6)]' 
                                                : 'bg-white/5 border border-white/5'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider z-10">
                        Percentagem de itens com stock normal.
                    </p>
                </div>
            </div>

            {/* Header Controls (Search + Action Buttons) */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div className="relative flex-1 max-w-xl group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar prato ou bebida..."
                        className="w-full bg-[#181818] border border-white/10 rounded-full pl-14 pr-6 py-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]/50 shadow-inner transition-all font-sans"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setFilterLowStock(!filterLowStock)}
                        className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full border transition-all text-xs font-black tracking-wider cursor-pointer active:scale-95 ${
                            filterLowStock 
                                ? 'bg-red-950/40 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                                : 'bg-[#181818] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                    >
                        <AlertTriangle size={16} className={filterLowStock ? 'text-red-400' : ''} />
                        <span>STOCK BAIXO</span>
                    </button>
                    
                    <button 
                        disabled={!hasChanges || saving}
                        onClick={saveChanges}
                        className={`flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-black tracking-wider transition-all cursor-pointer ${
                            hasChanges && !saving
                                ? 'bg-gradient-to-r from-[#F5C542] via-[#EAC775] to-[#D4AF37] text-black shadow-[0_0_30px_rgba(245,197,66,0.4)] hover:scale-105 active:scale-95' 
                                : 'bg-[#181818] text-gray-600 border border-white/5 cursor-not-allowed'
                        }`}
                    >
                        {saving ? <Loader2 className="animate-spin text-black" size={16} /> : <Save size={16} />}
                        <span>SALVAR ALTERAÇÕES</span>
                    </button>
                </div>
            </div>

            {/* Inventory Table Container */}
            <div className="bg-[#161616]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-2 sm:p-6 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">ITEM / CATEGORIA</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">RASTREIO</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">QUANTIDADE</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">ESTADO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredItems.map(item => {
                                const change = pendingChanges[item.id] || {};
                                const currentStock = change.stock_quantity !== undefined ? change.stock_quantity : item.stock_quantity;
                                const isTracking = change.track_stock !== undefined ? change.track_stock : item.track_stock;
                                const isLow = isTracking && currentStock < 5;

                                const isBeverage = (item.categories?.label || '').toLowerCase().includes('bebida');

                                return (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5.5">
                                            <div className="flex items-center gap-4">
                                                {/* Thumbnail Image */}
                                                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-0.5 border border-white/10 shrink-0 overflow-hidden shadow-md group-hover:border-[#D4AF37]/50 transition-colors">
                                                    <div className="w-full h-full rounded-2xl bg-[#121212] flex items-center justify-center overflow-hidden">
                                                        {item.img_url ? (
                                                            <img src={item.img_url} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-gray-500 group-hover:text-[#D4AF37] transition-colors">
                                                                {isBeverage ? <Wine size={24} /> : <Utensils size={24} />}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-serif font-bold text-base sm:text-lg group-hover:text-[#D4AF37] transition-colors">{item.name}</span>
                                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mt-0.5">
                                                        {isBeverage ? <Wine size={12} className="text-pink-400" /> : <Utensils size={12} className="text-amber-400" />}
                                                        <span>{item.categories?.label || 'Geral'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* RASTREIO Premium Switch */}
                                        <td className="px-6 py-5.5 text-center">
                                            <button 
                                                type="button"
                                                onClick={() => handleTrackToggle(item.id, isTracking)}
                                                className={`mx-auto w-14 h-7 rounded-full transition-all duration-300 p-1 flex items-center cursor-pointer border ${
                                                    isTracking 
                                                        ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,197,66,0.3)]' 
                                                        : 'bg-black/60 border-white/10'
                                                }`}
                                            >
                                                <div 
                                                    className={`w-5 h-5 rounded-full transition-transform duration-300 shadow-md flex items-center justify-center ${
                                                        isTracking 
                                                            ? 'bg-gradient-to-r from-[#F5C542] to-[#D4AF37] translate-x-7 shadow-[0_0_10px_#D4AF37]' 
                                                            : 'bg-gray-600 translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </td>

                                        {/* QUANTIDADE Input */}
                                        <td className="px-6 py-5.5 text-center">
                                            <div className="inline-flex items-center justify-center">
                                                <input 
                                                    type="number" 
                                                    disabled={!isTracking}
                                                    className={`w-24 bg-black/60 border rounded-2xl px-4 py-2.5 text-center font-bold text-sm sm:text-base transition-all outline-none ${
                                                        !isTracking 
                                                            ? 'opacity-20 border-transparent text-gray-600' 
                                                            : isLow 
                                                                ? 'border-red-500/50 text-red-400 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                                                                : 'border-white/10 text-white focus:border-[#D4AF37] focus:shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                                    }`}
                                                    value={currentStock || 0}
                                                    onChange={(e) => handleStockChange(item.id, e.target.value)}
                                                />
                                            </div>
                                        </td>

                                        {/* ESTADO Badge */}
                                        <td className="px-6 py-5.5 text-right">
                                            <div className="flex justify-end">
                                                {isTracking ? (
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 w-fit border shadow-sm ${
                                                        isLow 
                                                            ? 'bg-red-950/40 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                                                            : 'bg-green-950/40 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full ${isLow ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_#10B981]'}`}></span>
                                                        <span>{isLow ? 'CRÍTICO' : 'NORMAL'}</span>
                                                    </span>
                                                ) : (
                                                    <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                                        ILIMITADO
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredItems.length === 0 && (
                    <div className="py-24 text-center flex flex-col items-center gap-4">
                        <Package size={56} className="text-[#D4AF37]/40" />
                        <p className="text-gray-400 font-serif text-base tracking-widest">Nenhum prato ou bebida encontrado com esse filtro.</p>
                    </div>
                )}
            </div>

            {/* Floating Save Bar if changes exist (Desktop & Mobile) */}
            {hasChanges && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-[#161616]/95 backdrop-blur-2xl border border-[#D4AF37]/40 px-5 py-4 rounded-[2rem] shadow-[0_15px_50px_rgba(0,0,0,0.85)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 animate-in slide-in-from-bottom-10 duration-500 w-[90vw] sm:w-auto">
                    <div className="flex flex-col text-center sm:text-left">
                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-1 justify-center sm:justify-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping"></span>
                            Alterações Pendentes
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium mt-0.5">{Object.keys(pendingChanges).length} item(s) modificado(s) neste ecrã</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                            type="button"
                            onClick={() => setPendingChanges({})}
                            className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-white/5 active:scale-95"
                        >
                            Descartar
                        </button>
                        <button 
                            type="button"
                            onClick={saveChanges}
                            disabled={saving}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-[#F5C542] to-[#D4AF37] text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(245,197,66,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            <span>Salvar</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManager;

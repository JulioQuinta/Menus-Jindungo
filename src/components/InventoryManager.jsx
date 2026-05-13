import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
    Search, Package, AlertTriangle, CheckCircle2, 
    ArrowUpDown, Filter, Save, RefreshCw, Loader2 
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
                const { error } = await supabase
                    .from('menu_items')
                    .update(change)
                    .eq('id', id);
                if (error) throw error;
            }
            toast.success('Inventário atualizado com sucesso!');
            setPendingChanges({});
            fetchInventory();
        } catch (error) {
            console.error('Error saving inventory:', error);
            toast.error('Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isLowStock = item.track_stock && item.stock_quantity < 5;
        return matchesSearch && (!filterLowStock || isLowStock);
    });

    const hasChanges = Object.keys(pendingChanges).length > 0;

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
            <p className="text-gray-500 font-display text-sm tracking-widest">CARREGANDO INVENTÁRIO...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar prato ou bebida..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-sans"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setFilterLowStock(!filterLowStock)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border transition-all font-display text-[10px] tracking-widest ${filterLowStock ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <AlertTriangle size={14} /> STOCK BAIXO
                    </button>
                    
                    <button 
                        disabled={!hasChanges || saving}
                        onClick={saveChanges}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all shadow-xl ${hasChanges ? 'bg-[#D4AF37] text-black hover:scale-105 active:scale-95' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        SALVAR ALTERAÇÕES
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="glass-dark border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-8 py-6 text-[10px] font-display text-gray-500 tracking-[0.2em]">ITEM / CATEGORIA</th>
                                <th className="px-8 py-6 text-[10px] font-display text-gray-500 tracking-[0.2em]">RASTREIO</th>
                                <th className="px-8 py-6 text-[10px] font-display text-gray-500 tracking-[0.2em]">QUANTIDADE</th>
                                <th className="px-8 py-6 text-[10px] font-display text-gray-500 tracking-[0.2em]">ESTADO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredItems.map(item => {
                                const change = pendingChanges[item.id] || {};
                                const currentStock = change.stock_quantity !== undefined ? change.stock_quantity : item.stock_quantity;
                                const isTracking = change.track_stock !== undefined ? change.track_stock : item.track_stock;
                                const isLow = isTracking && currentStock < 5;

                                return (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-serif font-bold text-lg group-hover:text-[#D4AF37] transition-colors">{item.name}</span>
                                                <span className="text-gray-500 text-xs font-sans">{item.categories?.label || 'Sem categoria'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button 
                                                onClick={() => handleTrackToggle(item.id, isTracking)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-display transition-all border ${isTracking ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-800 border-transparent text-gray-500'}`}
                                            >
                                                {isTracking ? 'ATIVADO' : 'DESATIVADO'}
                                            </button>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="number" 
                                                    disabled={!isTracking}
                                                    className={`w-20 bg-black/40 border rounded-xl px-3 py-2 text-center font-bold font-sans transition-all focus:outline-none ${!isTracking ? 'opacity-30 border-transparent' : isLow ? 'border-red-500/50 text-red-400 focus:border-red-500' : 'border-white/10 text-white focus:border-[#D4AF37]'}`}
                                                    value={currentStock || 0}
                                                    onChange={(e) => handleStockChange(item.id, e.target.value)}
                                                />
                                                {isLow && <AlertTriangle size={16} className="text-red-500 animate-pulse" />}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {isTracking ? (
                                                <div className={`flex items-center gap-2 text-[10px] font-display tracking-widest ${isLow ? 'text-red-400' : 'text-green-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
                                                    {isLow ? 'CRÍTICO' : 'NORMAL'}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-display text-gray-600 tracking-widest italic">ILIMITADO</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredItems.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center gap-3">
                        <Package size={48} className="text-gray-800" />
                        <p className="text-gray-500 font-display text-sm tracking-widest uppercase">Nenhum item encontrado</p>
                    </div>
                )}
            </div>

            {/* Floating Action Button for Mobile if changes exist */}
            {hasChanges && (
                <div className="fixed bottom-8 right-8 z-[100] md:hidden">
                    <button 
                        onClick={saveChanges}
                        className="w-16 h-16 bg-[#D4AF37] text-black rounded-full shadow-[0_10px_40px_rgba(212,175,55,0.4)] flex items-center justify-center animate-bounce"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default InventoryManager;

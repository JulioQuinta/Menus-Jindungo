import React, { useState, useEffect } from 'react';
import { db, localDbService } from '../lib/localDb';
import { syncManager } from '../utils/syncManager';
import { supabase } from '../lib/supabaseClient';
import { 
    Search, Package, AlertTriangle, CheckCircle2, 
    Save, RefreshCw, Loader2, Wine, Utensils, AlertCircle,
    TrendingUp, DollarSign, ClipboardList, ShoppingCart, 
    Printer, ArrowUpDown, User, Plus, Info, Trash2, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const InventoryManager = ({ restaurantId }) => {
    // Tab switching: 'visao_geral' | 'gestao_stock' | 'historico' | 'lista_compras'
    const [activeTab, setActiveTab] = useState('visao_geral');
    const [items, setItems] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);
    
    // Inline edits for cost price, safety stock, supplier
    const [pendingChanges, setPendingChanges] = useState({});

    // Modal state for stock adjustments
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
    const [adjustType, setAdjustType] = useState('in'); // 'in' (Entrada), 'out_manual' (Ajuste Saída), 'out_waste' (Perda), 'reconcile' (Inventário)
    const [adjustQty, setAdjustQty] = useState(1);
    const [adjustCostPrice, setAdjustCostPrice] = useState('');
    const [adjustSupplier, setAdjustSupplier] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [adjustOperator, setAdjustOperator] = useState('Administrador');

    useEffect(() => {
        if (restaurantId) {
            loadInventoryData();
        }
    }, [restaurantId]);

    const loadInventoryData = async () => {
        setLoading(true);
        try {
            // Load local items from IndexedDB
            const localItems = await db.menu_items.where('restaurant_id').equals(restaurantId).toArray();
            const localCategories = await db.categories.where('restaurant_id').equals(restaurantId).toArray();
            
            // Map category labels to items
            const matchedItems = localItems.map(item => {
                const category = localCategories.find(c => c.id === item.category_id);
                return {
                    ...item,
                    categories: { label: category ? category.label : 'Geral' }
                };
            }).sort((a, b) => a.name.localeCompare(b.name));

            setItems(matchedItems);

            // Load movements ledger
            const allMovements = await localDbService.getAllStockMovements();
            // Filter movements for items belonging to this restaurant
            const restaurantItemIds = new Set(localItems.map(i => i.id));
            const filteredMovements = allMovements.filter(mov => restaurantItemIds.has(mov.item_id));
            
            // Match product names to movements
            const enrichedMovements = filteredMovements.map(mov => {
                const product = matchedItems.find(p => p.id === mov.item_id);
                return {
                    ...mov,
                    itemName: product ? product.name : 'Item Desconhecido',
                    imgUrl: product ? product.img_url : null,
                    isBeverage: product ? (product.categories?.label || '').toLowerCase().includes('bebida') : false
                };
            });
            setMovements(enrichedMovements);

        } catch (error) {
            console.error('Error loading inventory from database:', error);
            toast.error('Erro ao carregar dados locais de inventário');
        } finally {
            setLoading(false);
        }
    };

    // Force downstream sync from cloud to refresh local IndexedDB, then reload
    const handleSyncAndReload = async () => {
        // Find current restaurant slug
        try {
            toast.loading("A descarregar atualizações da nuvem...", { id: 'sync-inv' });
            const { data, error } = await supabase
                .from('restaurants')
                .select('slug')
                .eq('id', restaurantId)
                .single();

            if (error) throw error;

            if (data && data.slug) {
                const res = await syncManager.syncDownstream(data.slug);
                if (res.success) {
                    toast.success("Sincronizado com sucesso!", { id: 'sync-inv' });
                    await loadInventoryData();
                } else {
                    throw new Error(res.error || "Falha na sincronização");
                }
            }
        } catch (err) {
            console.error("Downstream sync error on inventory:", err);
            toast.error("Servidor indisponível. A usar dados guardados localmente.", { id: 'sync-inv' });
            await loadInventoryData();
        }
    };

    // Handle inline input updates (Cost Price, Safety Stock, Supplier)
    const handleInlineChange = (id, field, value) => {
        setPendingChanges(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleTrackToggle = (id, currentVal) => {
        const nextVal = !currentVal;
        setPendingChanges(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                track_stock: nextVal
            }
        }));
    };

    // Save metadata adjustments to IndexedDB and Supabase if columns are available
    const saveInlineChanges = async () => {
        const updates = Object.entries(pendingChanges);
        if (updates.length === 0) return;

        setSaving(true);
        try {
            for (const [id, changes] of updates) {
                // Update local IndexedDB
                await db.menu_items.update(id, changes);

                // Update Supabase in background (using safe fallback)
                if (navigator.onLine) {
                    try {
                        const cloudUpdate = {};
                        if (changes.track_stock !== undefined) cloudUpdate.track_stock = changes.track_stock;
                        if (changes.stock_quantity !== undefined) cloudUpdate.stock_quantity = changes.stock_quantity;
                        
                        // We also try to send custom fields, Supabase ignores missing columns if they don't exist
                        if (changes.cost_price !== undefined) cloudUpdate.cost_price = parseFloat(changes.cost_price);
                        if (changes.min_safety_stock !== undefined) cloudUpdate.min_safety_stock = parseInt(changes.min_safety_stock);
                        if (changes.supplier_name !== undefined) cloudUpdate.supplier_name = changes.supplier_name;

                        await supabase
                            .from('menu_items')
                            .update(cloudUpdate)
                            .eq('id', id);
                    } catch (e) {
                        console.warn(`Could not sync extended attributes for item ${id} to Supabase:`, e);
                    }
                }
            }
            toast.success('Alterações salvas com sucesso!');
            setPendingChanges({});
            await loadInventoryData();
        } catch (error) {
            console.error('Error saving inline updates:', error);
            toast.error('Erro ao gravar atualizações');
        } finally {
            setSaving(false);
        }
    };

    // Open stock adjustment dialog
    const openAdjustmentDialog = (item) => {
        setSelectedItemForAdjust(item);
        setAdjustType('in');
        setAdjustQty(1);
        setAdjustCostPrice(item.cost_price || '');
        setAdjustSupplier(item.supplier_name || '');
        setAdjustReason('');
        setIsAdjustmentModalOpen(true);
    };

    // Execute Stock Adjustment (Creates ledger record and updates stock quantity)
    const executeStockAdjustment = async () => {
        if (!selectedItemForAdjust) return;
        if (adjustQty <= 0) {
            toast.error("Insira uma quantidade válida!");
            return;
        }

        try {
            // Determine quantity sign based on adjustment type
            let finalQtyChange = parseInt(adjustQty);
            let reasonText = adjustReason.trim();

            if (adjustType === 'out_manual') {
                finalQtyChange = -finalQtyChange;
                if (!reasonText) reasonText = "Ajuste manual de saída";
            } else if (adjustType === 'out_waste') {
                finalQtyChange = -finalQtyChange;
                if (!reasonText) reasonText = "Perda / Desperdício";
            } else if (adjustType === 'reconcile') {
                // For general inventory re-counting, we overwrite directly
                const targetQty = parseInt(adjustQty);
                const currentQty = parseInt(selectedItemForAdjust.stock_quantity) || 0;
                finalQtyChange = targetQty - currentQty;
                if (!reasonText) reasonText = `Inventário Geral (Recontagem de ${currentQty} para ${targetQty})`;
            } else {
                if (!reasonText) reasonText = "Abastecimento de Stock";
            }

            const movementPayload = {
                item_id: selectedItemForAdjust.id,
                restaurant_id: restaurantId,
                type: adjustType,
                quantity: finalQtyChange,
                reason: reasonText,
                cost_price: adjustType === 'in' ? parseFloat(adjustCostPrice) || null : null,
                supplier_name: adjustType === 'in' ? adjustSupplier.trim() || null : null,
                user_name: adjustOperator.trim() || "Operador"
            };

            // Write to IndexedDB
            const savedMovement = await localDbService.addStockMovement(movementPayload);

            // Update Supabase if online
            if (navigator.onLine) {
                try {
                    const freshItem = await db.menu_items.get(selectedItemForAdjust.id);
                    const cloudUpdate = {
                        stock_quantity: freshItem.stock_quantity
                    };
                    if (adjustType === 'in') {
                        if (adjustCostPrice) cloudUpdate.cost_price = parseFloat(adjustCostPrice);
                        if (adjustSupplier) cloudUpdate.supplier_name = adjustSupplier.trim();
                    }
                    await supabase
                        .from('menu_items')
                        .update(cloudUpdate)
                        .eq('id', selectedItemForAdjust.id);
                } catch (e) {
                    console.warn("Failed to sync new stock quantity to Supabase:", e);
                }
            }

            toast.success("Movimentação registada com sucesso!");
            setIsAdjustmentModalOpen(false);
            setSelectedItemForAdjust(null);
            await loadInventoryData();

        } catch (err) {
            console.error("Adjustment save error:", err);
            toast.error("Falha ao registar a movimentação.");
        }
    };

    // Helper to format currency in Kwanzas (Kz)
    const formatCurr = (val) => {
        return new Intl.NumberFormat('pt-AO').format(val || 0) + ' Kz';
    };

    // Helper to clean price strings to integer values
    const cleanPrice = (val) => {
        return parseInt(String(val || 0).replace(/[^0-9]/g, ''), 10) || 0;
    };

    // Filters matching
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const isTracking = pendingChanges[item.id]?.track_stock !== undefined 
            ? pendingChanges[item.id].track_stock 
            : item.track_stock;
        
        const currentQty = pendingChanges[item.id]?.stock_quantity !== undefined
            ? pendingChanges[item.id].stock_quantity
            : item.stock_quantity;

        const safetyStock = pendingChanges[item.id]?.min_safety_stock !== undefined
            ? parseInt(pendingChanges[item.id].min_safety_stock)
            : (item.min_safety_stock || 5);

        const isLowStock = isTracking && currentStockIsLow(currentQty, safetyStock);
        
        return matchesSearch && (!filterLowStock || isLowStock);
    });

    function currentStockIsLow(qty, safetyLimit) {
        return qty < safetyLimit;
    }

    // ERP Metrics calculations
    const metrics = React.useMemo(() => {
        let totalSalesValue = 0;
        let totalCostValue = 0;
        let trackedCount = 0;
        let lowStockCount = 0;

        items.forEach(item => {
            const isTracking = pendingChanges[item.id]?.track_stock !== undefined 
                ? pendingChanges[item.id].track_stock 
                : item.track_stock;

            if (isTracking) {
                trackedCount++;
                const qty = pendingChanges[item.id]?.stock_quantity !== undefined 
                    ? pendingChanges[item.id].stock_quantity 
                    : (item.stock_quantity || 0);

                const safetyStock = pendingChanges[item.id]?.min_safety_stock !== undefined
                    ? parseInt(pendingChanges[item.id].min_safety_stock)
                    : (item.min_safety_stock || 5);

                const cost = pendingChanges[item.id]?.cost_price !== undefined
                    ? parseFloat(pendingChanges[item.id].cost_price)
                    : (item.cost_price || 0);

                const sellPrice = cleanPrice(item.price);

                totalSalesValue += sellPrice * qty;
                totalCostValue += cost * qty;

                if (qty < safetyStock) {
                    lowStockCount++;
                }
            }
        });

        const estimatedProfit = totalSalesValue - totalCostValue;
        const avgMargin = totalSalesValue > 0 ? Math.round((estimatedProfit / totalSalesValue) * 100) : 0;
        const healthRatio = trackedCount > 0 ? Math.round(((trackedCount - lowStockCount) / trackedCount) * 100) : 100;

        return {
            totalSalesValue,
            totalCostValue,
            estimatedProfit,
            avgMargin,
            healthRatio,
            lowStockCount,
            trackedCount
        };
    }, [items, pendingChanges]);

    // Items list below safety stock (Shopping list)
    const shoppingList = React.useMemo(() => {
        return items.filter(item => {
            const isTracking = pendingChanges[item.id]?.track_stock !== undefined 
                ? pendingChanges[item.id].track_stock 
                : item.track_stock;

            if (!isTracking) return false;

            const qty = pendingChanges[item.id]?.stock_quantity !== undefined 
                ? pendingChanges[item.id].stock_quantity 
                : (item.stock_quantity || 0);

            const safetyStock = pendingChanges[item.id]?.min_safety_stock !== undefined
                ? parseInt(pendingChanges[item.id].min_safety_stock)
                : (item.min_safety_stock || 5);

            return qty < safetyStock;
        }).map(item => {
            const qty = pendingChanges[item.id]?.stock_quantity !== undefined 
                ? pendingChanges[item.id].stock_quantity 
                : (item.stock_quantity || 0);

            const safetyStock = pendingChanges[item.id]?.min_safety_stock !== undefined
                ? parseInt(pendingChanges[item.id].min_safety_stock)
                : (item.min_safety_stock || 5);

            const cost = pendingChanges[item.id]?.cost_price !== undefined
                ? parseFloat(pendingChanges[item.id].cost_price)
                : (item.cost_price || 0);

            const deficit = safetyStock - qty;
            const estimatedCost = deficit * cost;

            return {
                ...item,
                qty,
                safetyStock,
                deficit,
                cost,
                estimatedCost
            };
        });
    }, [items, pendingChanges]);

    const printShoppingList = () => {
        const printWindow = window.open('', '_blank');
        const rows = shoppingList.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.safetyStock}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; color: red;">${item.deficit}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurr(item.cost)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurr(item.estimatedCost)}</td>
            </tr>
        `).join('');

        const totalCost = shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0);

        printWindow.document.write(`
            <html>
            <head>
                <title>Lista de Compras Automática - Menús Jindungo</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #f2f2f2; padding: 8px; text-align: left; border-bottom: 2px solid #ddd; }
                    .header { border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px; }
                    .total { text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold; color: #D4AF37; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>MENÚS JINDUNGO - SISTEMA DE LOGÍSTICA ERP</h2>
                    <h3>LISTA DE REABASTECIMENTO AUTOMÁTICO</h3>
                    <p>Gerado em: ${new Date().toLocaleString('pt-AO')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item de Menu</th>
                            <th style="text-align: center;">Stock Atual</th>
                            <th style="text-align: center;">Stock Mínimo</th>
                            <th style="text-align: center;">Défice</th>
                            <th style="text-align: right;">Preço de Custo</th>
                            <th style="text-align: right;">Custo Estimado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <div class="total">
                    Custo de Aquisição Total Estimado: ${formatCurr(totalCost)}
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const hasChanges = Object.keys(pendingChanges).length > 0;

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
            <p className="text-gray-400 font-serif text-sm tracking-widest uppercase">Carregando dados de logística...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-left">
            
            {/* Header controls and title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-white">Logística & Gestão de Stock</h2>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Painel ERP avançado para custos, fornecedores e consumo</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSyncAndReload}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        title="Sincronizar dados"
                    >
                        <RefreshCw size={14} /> Sincronizar Nuvem
                    </button>
                    {hasChanges && (
                        <button 
                            onClick={saveInlineChanges}
                            disabled={saving}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] hover:brightness-110 text-black px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 active:scale-95 cursor-pointer"
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            Salvar Alterações
                        </button>
                    )}
                </div>
            </div>

            {/* TAB SELECTORS */}
            <div className="flex border-b border-white/5 gap-6">
                {[
                    { id: 'visao_geral', label: 'Visão Geral', icon: TrendingUp },
                    { id: 'gestao_stock', label: 'Controlo de Inventário', icon: Package },
                    { id: 'historico', label: 'Movimentações (Livro Razão)', icon: ClipboardList },
                    { id: 'lista_compras', label: 'Lista de Compras', icon: ShoppingCart, badge: shoppingList.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 px-1 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer relative ${
                            activeTab === tab.id 
                                ? 'border-[#D4AF37] text-[#D4AF37]' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <tab.icon size={15} />
                        <span>{tab.label}</span>
                        {tab.badge > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* TAB 1: VISÃO GERAL */}
            {activeTab === 'visao_geral' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Metrics Card 1: Valor de Vendas */}
                        <div className="bg-[#141415] border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 blur-3xl rounded-full -mr-8 -mt-8"></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <DollarSign size={13} className="text-[#D4AF37]" />
                                Venda Estimada em Stock
                            </p>
                            <h3 className="text-2xl font-serif font-black text-[#D4AF37] tracking-tight mt-1">{formatCurr(metrics.totalSalesValue)}</h3>
                            <p className="text-[9px] text-gray-500 mt-2 font-medium">Faturação baseada nos preços de venda públicos</p>
                        </div>

                        {/* Metrics Card 2: Custo de Aquisição */}
                        <div className="bg-[#141415] border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full -mr-8 -mt-8"></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <Package size={13} className="text-blue-400" />
                                Custo de Aquisição (CMP)
                            </p>
                            <h3 className="text-2xl font-serif font-black text-blue-400 tracking-tight mt-1">{formatCurr(metrics.totalCostValue)}</h3>
                            <p className="text-[9px] text-gray-500 mt-2 font-medium">Soma de (preços de custo * unidades)</p>
                        </div>

                        {/* Metrics Card 3: Lucro Estimado */}
                        <div className="bg-[#141415] border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-3xl rounded-full -mr-8 -mt-8"></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <TrendingUp size={13} className="text-green-400" />
                                Lucro Bruto Estimado
                            </p>
                            <h3 className="text-2xl font-serif font-black text-green-400 tracking-tight mt-1">{formatCurr(metrics.estimatedProfit)}</h3>
                            <p className="text-[10px] text-green-500 font-bold mt-2 flex items-center gap-1">
                                Margem: {metrics.avgMargin}%
                            </p>
                        </div>

                        {/* Metrics Card 4: Saúde do Inventário */}
                        <div className="bg-[#141415] border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-3xl rounded-full -mr-8 -mt-8"></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <AlertTriangle size={13} className="text-red-400" />
                                Ruturas / Alertas
                            </p>
                            <h3 className="text-2xl font-serif font-black text-red-500 tracking-tight mt-1">{metrics.lowStockCount} Itens</h3>
                            <p className="text-[10px] text-zinc-400 font-bold mt-2">
                                Saúde de Armazém: {metrics.healthRatio}%
                            </p>
                        </div>
                    </div>

                    {/* Quick overview alert banner if low stock exists */}
                    {metrics.lowStockCount > 0 && (
                        <div className="bg-red-950/20 border border-red-500/30 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle size={24} className="text-red-500 animate-pulse shrink-0" />
                                <div>
                                    <h4 className="text-white font-serif font-bold text-base">Controlo de Logística: Alerta de Abastecimento</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">Há {metrics.lowStockCount} itens abaixo do stock mínimo de segurança e que requerem reposição.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab('lista_compras')}
                                className="bg-red-950/50 hover:bg-red-900/40 text-red-400 border border-red-500/40 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                                Ver Lista de Compras
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: CONTROLO DE INVENTÁRIO (TABELA PRINCIPAL) */}
            {activeTab === 'gestao_stock' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Filters header */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <div className="relative flex-1 max-w-xl group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Filtrar por prato, bebida ou fornecedor..."
                                className="w-full bg-[#181818] border border-white/10 rounded-full pl-14 pr-6 py-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]/50 shadow-inner transition-all font-sans"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <button 
                                onClick={() => setFilterLowStock(!filterLowStock)}
                                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border transition-all text-xs font-bold tracking-wider cursor-pointer active:scale-95 ${
                                    filterLowStock 
                                        ? 'bg-red-950/40 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                                        : 'bg-[#181818] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                }`}
                            >
                                <AlertTriangle size={15} />
                                <span>VER ALERTA STOCK</span>
                            </button>
                        </div>
                    </div>

                    {/* Stock Table */}
                    <div className="bg-[#121213]/90 border border-white/5 rounded-[2.5rem] p-2 sm:p-6 shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Produto / Categoria</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Controlo</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">P. Custo</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">P. Venda</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Margem</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Stock Mín.</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Fornecedor</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Qtd Atual</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredItems.map(item => {
                                        const change = pendingChanges[item.id] || {};
                                        
                                        const isTracking = change.track_stock !== undefined ? change.track_stock : item.track_stock;
                                        const costPrice = change.cost_price !== undefined ? change.cost_price : (item.cost_price || '');
                                        const safetyStock = change.min_safety_stock !== undefined ? change.min_safety_stock : (item.min_safety_stock || 5);
                                        const supplier = change.supplier_name !== undefined ? change.supplier_name : (item.supplier_name || '');
                                        const currentStock = change.stock_quantity !== undefined ? change.stock_quantity : item.stock_quantity;
                                        
                                        const isLow = isTracking && currentStockIsLow(currentStock, safetyStock);
                                        const isBeverage = (item.categories?.label || '').toLowerCase().includes('bebida');

                                        // Margin Calculation
                                        const sellVal = cleanPrice(item.price);
                                        const costVal = parseFloat(costPrice) || 0;
                                        const marginPct = sellVal > 0 ? Math.round(((sellVal - costVal) / sellVal) * 100) : 0;

                                        return (
                                            <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                                {/* 1. Name & category */}
                                                <td className="px-5 py-4 shrink-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent p-0.5 border border-white/10 shrink-0 overflow-hidden shadow-md">
                                                            <div className="w-full h-full rounded-xl bg-[#0A0A0B] flex items-center justify-center overflow-hidden">
                                                                {item.img_url ? (
                                                                    <img src={item.img_url} alt={item.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-gray-500">
                                                                        {isBeverage ? <Wine size={16} /> : <Utensils size={16} />}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-serif font-bold text-sm group-hover:text-[#D4AF37] transition-colors">{item.name}</span>
                                                            <span className="text-gray-500 text-[10px] font-medium">{item.categories?.label || 'Geral'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Track Stock Toggle */}
                                                <td className="px-5 py-4 text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleTrackToggle(item.id, isTracking)}
                                                        className={`mx-auto w-11 h-6 rounded-full transition-all duration-300 p-0.5 flex items-center cursor-pointer border ${
                                                            isTracking 
                                                                ? 'bg-amber-500/20 border-amber-500' 
                                                                : 'bg-black/60 border-white/10'
                                                        }`}
                                                    >
                                                        <div 
                                                            className={`w-4 h-4 rounded-full transition-transform duration-300 shadow-md ${
                                                                isTracking 
                                                                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] translate-x-5' 
                                                                    : 'bg-gray-600 translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </td>

                                                {/* 3. Cost Price Input */}
                                                <td className="px-5 py-4 text-center">
                                                    <input 
                                                        type="number"
                                                        disabled={!isTracking}
                                                        className="w-18 bg-black/40 border border-white/5 rounded-xl px-2 py-1.5 text-center font-medium text-xs text-white outline-none focus:border-[#D4AF37] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                                        value={costPrice}
                                                        onChange={(e) => handleInlineChange(item.id, 'cost_price', e.target.value)}
                                                        placeholder="-"
                                                    />
                                                </td>

                                                {/* 4. Sell Price display */}
                                                <td className="px-5 py-4 text-center text-xs font-semibold text-gray-400">
                                                    {formatCurr(sellVal)}
                                                </td>

                                                {/* 5. Margin display */}
                                                <td className={`px-5 py-4 text-center text-xs font-bold ${marginPct > 40 ? 'text-green-500' : marginPct > 15 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {isTracking && costVal > 0 ? `${marginPct}%` : '-'}
                                                </td>

                                                {/* 6. Safety Stock Limit */}
                                                <td className="px-5 py-4 text-center">
                                                    <input 
                                                        type="number"
                                                        disabled={!isTracking}
                                                        className="w-14 bg-black/40 border border-white/5 rounded-xl px-2 py-1.5 text-center font-medium text-xs text-white outline-none focus:border-[#D4AF37] transition-all disabled:opacity-20"
                                                        value={safetyStock}
                                                        onChange={(e) => handleInlineChange(item.id, 'min_safety_stock', e.target.value)}
                                                    />
                                                </td>

                                                {/* 7. Supplier Name */}
                                                <td className="px-5 py-4">
                                                    <input 
                                                        type="text"
                                                        disabled={!isTracking}
                                                        className="w-28 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] transition-all truncate disabled:opacity-20"
                                                        value={supplier}
                                                        onChange={(e) => handleInlineChange(item.id, 'supplier_name', e.target.value)}
                                                        placeholder="Nenhum"
                                                    />
                                                </td>

                                                {/* 8. Quantity Display + Action to adjust */}
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <span className={`font-mono font-bold text-sm ${isLow ? 'text-red-500 font-extrabold' : 'text-white'}`}>
                                                            {currentStock}
                                                        </span>
                                                        {isTracking && (
                                                            <button 
                                                                onClick={() => openAdjustmentDialog(item)}
                                                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-[#D4AF37] p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 border border-zinc-700"
                                                                title="Movimentar Stock"
                                                            >
                                                                <ArrowUpDown size={11} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 9. Status badge */}
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex justify-end">
                                                        {isTracking ? (
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-wider flex items-center gap-1.5 border ${
                                                                isLow 
                                                                    ? 'bg-red-950/20 border-red-500/20 text-red-500 shadow-sm' 
                                                                    : 'bg-green-950/20 border-green-500/20 text-green-500'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                                                                <span>{isLow ? 'ALERTA' : 'NORMAL'}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="bg-zinc-800/40 border border-zinc-700/20 text-zinc-500 px-3 py-1 rounded-full text-[9px] font-black tracking-wider">
                                                                SEM LIMITES
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
                                <p className="text-gray-400 font-serif text-base tracking-widest">Nenhum produto encontrado.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: HISTÓRICO DE MOVIMENTAÇÕES (LEDGER) */}
            {activeTab === 'historico' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-[#121213]/90 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden">
                        <h4 className="text-white font-serif font-bold text-lg mb-4 flex items-center gap-2">
                            <ClipboardList className="text-[#D4AF37]" size={20} />
                            Livro Razão de Movimentações de Stock
                        </h4>
                        
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Produto</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Tipo</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Qtd</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Justificação / Motivo</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Fornecedor / Custo</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Operador</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {movements.map((mov, idx) => {
                                        const isAddition = parseInt(mov.quantity) > 0;
                                        
                                        // Movement type tags mapping
                                        let typeLabel = "Ajuste";
                                        let typeClass = "bg-zinc-800 text-zinc-400 border-zinc-700/50";
                                        if (mov.type === 'in') {
                                            typeLabel = "Entrada";
                                            typeClass = "bg-green-950/20 text-green-400 border-green-500/20";
                                        } else if (mov.type === 'out_waste') {
                                            typeLabel = "Desperdício";
                                            typeClass = "bg-red-950/20 text-red-400 border-red-500/20";
                                        } else if (mov.type === 'out_manual') {
                                            typeLabel = "Saída Ajuste";
                                            typeClass = "bg-orange-950/20 text-orange-400 border-orange-500/20";
                                        } else if (mov.type === 'reconcile') {
                                            typeLabel = "Recontagem";
                                            typeClass = "bg-blue-950/20 text-blue-400 border-blue-500/20";
                                        } else if (mov.type === 'sale') {
                                            typeLabel = "Venda";
                                            typeClass = "bg-amber-950/10 text-amber-400 border-amber-500/10";
                                        }

                                        return (
                                            <tr key={mov.id || idx} className="hover:bg-white/[0.005] transition-colors">
                                                {/* Product */}
                                                <td className="px-5 py-4">
                                                    <span className="text-white font-serif font-bold text-sm">{mov.itemName}</span>
                                                </td>

                                                {/* Type Tag */}
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-wider border ${typeClass}`}>
                                                        {typeLabel}
                                                    </span>
                                                </td>

                                                {/* Qtd change badge */}
                                                <td className="px-5 py-4 text-center font-mono font-bold text-sm">
                                                    <span className={isAddition ? 'text-green-500' : 'text-red-500'}>
                                                        {isAddition ? `+${mov.quantity}` : mov.quantity}
                                                    </span>
                                                </td>

                                                {/* Reason */}
                                                <td className="px-5 py-4 text-xs text-gray-400 font-medium">
                                                    {mov.reason}
                                                </td>

                                                {/* Cost price & supplier details (only if supplied on Entrance) */}
                                                <td className="px-5 py-4 text-center text-xs">
                                                    {mov.type === 'in' ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-300">{mov.cost_price ? formatCurr(mov.cost_price) : '-'}</span>
                                                            <span className="text-[9px] text-gray-500">{mov.supplier_name || 'Desconhecido'}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-600">-</span>
                                                    )}
                                                </td>

                                                {/* User operator */}
                                                <td className="px-5 py-4 text-center text-xs text-gray-400 font-medium">
                                                    {mov.user_name || 'Operador'}
                                                </td>

                                                {/* Timestamp */}
                                                <td className="px-5 py-4 text-right text-[11px] text-gray-500 font-mono">
                                                    {new Date(mov.created_at).toLocaleDateString('pt-AO')} {new Date(mov.created_at).toLocaleTimeString('pt-AO', {hour: '2-digit', minute:'2-digit'})}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {movements.length === 0 && (
                            <div className="py-24 text-center flex flex-col items-center gap-4">
                                <Calendar size={56} className="text-zinc-700" />
                                <p className="text-gray-400 font-serif text-base tracking-widest">Nenhuma movimentação de stock efetuada.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: AUTOMATIC SHOPPING LIST */}
            {activeTab === 'lista_compras' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-[#121213]/90 border border-white/5 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5 mb-5">
                            <div>
                                <h4 className="text-white font-serif font-bold text-lg flex items-center gap-2">
                                    <ShoppingCart className="text-[#D4AF37]" size={22} />
                                    Reposição Automática de Armazém
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">Produtos cuja quantidade está abaixo do limite de segurança recomendado pelo ERP.</p>
                            </div>
                            {shoppingList.length > 0 && (
                                <button
                                    onClick={printShoppingList}
                                    className="bg-[#D4AF37] hover:bg-[#C5A059] text-black px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 active:scale-95 cursor-pointer uppercase tracking-wider shrink-0"
                                >
                                    <Printer size={15} /> Imprimir Lista de Compras
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Produto</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Fornecedor Habitual</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Stock Atual</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Stock Mín.</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center text-red-500">Défice Necessário</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Preço Unitário Custo</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Custo de Compra Estimado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {shoppingList.map(item => (
                                        <tr key={item.id} className="hover:bg-white/[0.005]">
                                            <td className="px-5 py-4">
                                                <span className="text-white font-serif font-bold text-sm">{item.name}</span>
                                            </td>
                                            <td className="px-5 py-4 text-center text-xs text-gray-400 font-medium">
                                                {item.supplier_name || 'Sem fornecedor'}
                                            </td>
                                            <td className="px-5 py-4 text-center font-mono font-bold text-sm text-red-500">
                                                {item.qty}
                                            </td>
                                            <td className="px-5 py-4 text-center font-mono text-xs text-gray-400">
                                                {item.safetyStock}
                                            </td>
                                            <td className="px-5 py-4 text-center font-mono font-black text-sm text-red-400">
                                                {item.deficit}
                                            </td>
                                            <td className="px-5 py-4 text-right text-xs text-gray-400">
                                                {formatCurr(item.cost)}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-black text-sm text-white">
                                                {formatCurr(item.estimatedCost)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {shoppingList.length === 0 ? (
                            <div className="py-24 text-center flex flex-col items-center gap-4">
                                <CheckCircle2 size={56} className="text-green-500" />
                                <p className="text-gray-400 font-serif text-base tracking-widest">Excelente! Armazém totalmente abastecido e seguro.</p>
                            </div>
                        ) : (
                            <div className="mt-6 flex justify-end font-serif font-black text-lg text-[#D4AF37] tracking-tight">
                                Total para Reposição: {formatCurr(shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STOCK ADJUSTMENT MODAL */}
            {isAdjustmentModalOpen && selectedItemForAdjust && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setIsAdjustmentModalOpen(false)}
                        className="fixed inset-0 bg-black/85 backdrop-blur-md" 
                    />

                    {/* Modal Box */}
                    <div className="bg-[#121213] border border-white/10 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-left">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
                            <ArrowUpDown className="text-[#D4AF37]" size={24} />
                            <div>
                                <h3 className="text-lg font-serif font-black text-white">Lançar Movimentação</h3>
                                <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">{selectedItemForAdjust.name}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Type selector */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Tipo de Movimento</label>
                                <select 
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                                    value={adjustType}
                                    onChange={(e) => setAdjustType(e.target.value)}
                                >
                                    <option value="in">Entrada (Compra / Abastecimento)</option>
                                    <option value="out_manual">Saída (Ajuste Manual)</option>
                                    <option value="out_waste">Saída (Perda / Desperdício)</option>
                                    <option value="reconcile">Inventário (Recontagem Física)</option>
                                </select>
                            </div>

                            {/* Qtd */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                    {adjustType === 'reconcile' ? 'Quantidade Contada em Prateleira' : 'Quantidade (Unidades)'}
                                </label>
                                <input 
                                    type="number"
                                    min="1"
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#D4AF37]"
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(e.target.value)}
                                />
                            </div>

                            {/* Extra details (Supplier / Cost Price) only if Entry */}
                            {adjustType === 'in' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Preço Custo (Kz)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                                            value={adjustCostPrice}
                                            onChange={(e) => setAdjustCostPrice(e.target.value)}
                                            placeholder="Ex: 2500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Fornecedor</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                                            value={adjustSupplier}
                                            onChange={(e) => setAdjustSupplier(e.target.value)}
                                            placeholder="Nome Fornecedor"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Justification text */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Justificação / Detalhes</label>
                                <input 
                                    type="text"
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="Ex: Abastecimento de bebidas semanal"
                                />
                            </div>

                            {/* Staff name */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Nome do Operador</label>
                                <input 
                                    type="text"
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-[#D4AF37]"
                                    value={adjustOperator}
                                    onChange={(e) => setAdjustOperator(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Modal Action buttons */}
                        <div className="flex gap-3 mt-8 border-t border-white/5 pt-4">
                            <button
                                onClick={() => setIsAdjustmentModalOpen(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={executeStockAdjustment}
                                className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-black px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer text-center"
                            >
                                Gravar Registo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManager;

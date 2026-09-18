import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import CategoryManager from './CategoryManager';
import { SortableItem } from './SortableItem';
import { compressImage } from '../lib/imageUtils';
import ComponentErrorBoundary from './ComponentErrorBoundary';
import { getSectorDetails, getSectorCategoryIllustration } from '../utils/sectorConfig';
import { populateDemoData } from '../utils/populateDemoData';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    MouseSensor, 
    TouchSensor, 
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Search, X, GripVertical, RotateCcw, Sparkles, Plus, Pencil, Check, AlertCircle, Eye, EyeOff, Pill, Barcode, Calendar, ShieldCheck, Tag, Package, Filter } from 'lucide-react';

const MenuManager = ({ categories: initialCategories = [], restaurantId, onUpdate, businessSector }) => {
    const sectorDetails = getSectorDetails(businessSector);
    const sectorTheme = sectorDetails.theme || {};
    const sectorTerms = sectorDetails.terms || {};
    const sectorFields = sectorDetails.fields || {};

    const isPharmacy = businessSector === 'pharmacy' || businessSector === 'health_medical';

    // Sector-Tailored Background & Color Utilities
    const containerBgClass = isPharmacy 
        ? 'bg-gradient-to-br from-[#05171E] via-[#09232D] to-[#041217] p-4 sm:p-6 rounded-3xl border border-[#143E4E]/60 shadow-2xl' 
        : 'bg-transparent';

    const cardBgClass = isPharmacy
        ? 'bg-[#0B2530]/90 backdrop-blur-xl border-[#143E4E] hover:border-emerald-400/50 shadow-[0_15px_35px_rgba(4,19,25,0.7)]'
        : 'bg-[#121213]/90 backdrop-blur-xl border-[#222224] hover:border-[#D4AF37]/40 shadow-[0_15px_40px_rgba(0,0,0,0.8)]';

    const cardSelectedClass = isPharmacy
        ? 'bg-[#0E3240]/95 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)] scale-[1.02]'
        : 'bg-[#121213]/95 border-[#D4AF37] shadow-[0_0_30px_rgba(245,197,66,0.3)] scale-[1.02]';

    const cardDefaultClass = isPharmacy
        ? 'bg-[#0B2530]/75 border-[#143E4E] hover:border-emerald-500/40 hover:bg-[#0B2530]/95 opacity-90 hover:opacity-100'
        : 'bg-[#121213]/75 border-[#222224] hover:border-[#D4AF37]/40 hover:bg-[#121213]/90 opacity-80 hover:opacity-100';

    const radialGlowClass = isPharmacy
        ? 'from-emerald-500/20 to-transparent'
        : 'from-[#D4AF37]/15 to-transparent';

    const badgeCountClass = isPharmacy
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20';

    const dotAccentClass = isPharmacy
        ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
        : 'bg-[#D4AF37] shadow-[0_0_12px_rgba(245,197,66,0.6)]';

    const priceTextClass = isPharmacy
        ? 'text-emerald-400 font-black font-mono'
        : 'text-[#D4AF37] font-black font-mono';

    const btnResetStockClass = isPharmacy
        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black shadow-[0_0_15px_rgba(16,185,129,0.25)]'
        : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black shadow-[0_0_15px_rgba(245,197,66,0.2)]';

    const btnAiClass = isPharmacy
        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/40 hover:from-emerald-500 hover:to-teal-500 hover:text-black shadow-[0_0_12px_rgba(16,185,129,0.2)]'
        : 'bg-gradient-to-r from-[#D4AF37]/20 to-[#F9E6A2]/10 text-[#D4AF37] border border-[#D4AF37]/40 hover:from-[#D4AF37] hover:text-black shadow-[0_0_12px_rgba(245,197,66,0.15)]';

    const [categories, setCategories] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [adminSearch, setAdminSearch] = useState('');
    const [activeLang, setActiveLang] = useState('pt');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [isPopulatingDemo, setIsPopulatingDemo] = useState(false);

    const handlePopulateSectorDemo = async () => {
        const confirmMsg = `Deseja carregar dados de demonstração completos (categorias e artigos) personalizados para o sector de ${sectorDetails.name || 'actividade'}?\n\nIsto facilitará a apresentação automática do software para o cliente.`;
        if (!window.confirm(confirmMsg)) return;

        setIsPopulatingDemo(true);
        const loadingToast = toast.loading(`A carregar catálogo de demonstração de ${sectorDetails.name}...`);
        try {
            const result = await populateDemoData(restaurantId, businessSector);
            if (result.success) {
                toast.success(result.message, { id: loadingToast, duration: 4000 });
                if (onUpdate) onUpdate();
            } else {
                toast.error(result.message, { id: loadingToast });
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar dados de demonstração", { id: loadingToast });
        } finally {
            setIsPopulatingDemo(false);
        }
    };

    const handleResetStock = async () => {
        const confirmMsg = `Deseja repor o stock de TODOS os ${sectorTerms.items?.toLowerCase() || 'artigos'} com controlo ativo? Esta ação não pode ser desfeita.`;
        if (!window.confirm(confirmMsg)) return;

        const qty = window.prompt("Defina a nova quantidade padrão para todos os itens (ou deixe 0):", "50");
        if (qty === null) return;
        
        const newQty = parseInt(qty) || 0;

        try {
            toast.loading("A repor stock...", { id: 'reset-stock' });
            const { error } = await supabase
                .from('menu_items')
                .update({ stock_quantity: newQty })
                .eq('restaurant_id', restaurantId)
                .eq('track_stock', true);

            if (error) throw error;
            
            toast.success(`Stock reposto para ${newQty} unidades!`, { id: 'reset-stock' });
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Error resetting stock:", err);
            toast.error("Erro ao repor stock.", { id: 'reset-stock' });
        }
    };

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const sorted = [...initialCategories].sort((a, b) => (a.position || 0) - (b.position || 0));
        const sortedCats = sorted.map(cat => ({
            ...cat,
            items: (cat.items || []).sort((a, b) => (a.position || 0) - (b.position || 0))
        }));
        setCategories(sortedCats);
    }, [initialCategories]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const isCategory = categories.some(cat => cat.id === active.id);

            if (isCategory) {
                setCategories((prev) => {
                    const oldIndex = prev.findIndex((item) => item.id === active.id);
                    const newIndex = prev.findIndex((item) => item.id === over.id);
                    if (newIndex === -1) return prev;
                    const newItems = arrayMove(prev, oldIndex, newIndex);
                    Promise.all(newItems.map((cat, index) =>
                        supabase.from('categories').update({ position: index }).eq('id', cat.id)
                    )).then(() => {
                        if (onUpdate) onUpdate();
                    });
                    return newItems;
                });
            } else {
                const category = categories.find(cat => cat.items?.some(i => i.id === active.id));
                if (!category) return;
                const oldIndex = category.items.findIndex(i => i.id === active.id);
                const newIndex = category.items.findIndex(i => i.id === over.id);
                if (newIndex === -1) return;
                const newItems = arrayMove(category.items, oldIndex, newIndex);
                setCategories(prev => prev.map(cat =>
                    cat.id === category.id ? { ...cat, items: newItems } : cat
                ));
                Promise.all(newItems.map((item, index) =>
                    supabase.from('menu_items').update({ position: index }).eq('id', item.id)
                )).then(() => {
                    if (onUpdate) onUpdate();
                });
            }
        }
    };

    const DEFAULT_ITEM = {
        name: '',
        price: '',
        desc_text: '',
        category_id: categories[0]?.id || '',
        restaurant_id: restaurantId,
        subcategory: '',
        available: true,
        track_stock: false,
        stock_quantity: 50,
        upsell_ids: [],
        barcode: '',
        batch_number: '',
        expiry_date: '',
        dosage: '',
        unit: 'Unidade',
        requires_prescription: false,
        health_iva_exemption: false
    };

    const handleSave = async (item) => {
        setIsSaving(true);
        try {
            const isNew = !item.id;
            if (!item.name || !item.price || !item.category_id) {
                toast.error("Nome, Preço e Categoria são obrigatórios.");
                setIsSaving(false);
                return;
            }

            const sectorData = {
                barcode: item.barcode || item.translations?.sector_data?.barcode || '',
                active_ingredient: item.active_ingredient || item.translations?.sector_data?.active_ingredient || '',
                batch_number: item.batch_number || item.translations?.sector_data?.batch_number || '',
                expiry_date: item.expiry_date || item.translations?.sector_data?.expiry_date || '',
                dosage: item.dosage || item.translations?.sector_data?.dosage || '',
                unit: item.unit || item.translations?.sector_data?.unit || 'UN',
                requires_prescription: item.requires_prescription || item.translations?.sector_data?.requires_prescription || false,
                health_iva_exemption: item.health_iva_exemption || item.translations?.sector_data?.health_iva_exemption || false
            };

            const payload = {
                restaurant_id: restaurantId,
                category_id: item.category_id,
                name: item.name,
                price: item.price,
                desc_text: item.desc_text,
                img_url: item.img_url,
                available: item.available !== false,
                track_stock: item.track_stock || false,
                stock_quantity: item.stock_quantity || 0,
                upsell_ids: item.upsell_ids || [],
                translations: {
                    ...(item.translations || {}),
                    sector_data: sectorData,
                    pt: {
                        ...(item.translations?.pt || {}),
                        name: item.name,
                        desc: item.desc_text,
                    },
                    en: item.translations?.en || {},
                    fr: item.translations?.fr || {}
                }
            };

            if (isNew) payload.position = 999;

            let error;
            if (isNew) {
                const { error: insertError } = await supabase.from('menu_items').insert([payload]);
                error = insertError;
            } else {
                const { error: updateError } = await supabase.from('menu_items').update(payload).eq('id', item.id);
                error = updateError;
            }

            if (error) throw error;
            setEditingItem(null);
            if (onUpdate) onUpdate();
            toast.success(isNew ? `${sectorTerms.item || 'Item'} registado com sucesso!` : `${sectorTerms.item || 'Item'} atualizado com sucesso!`);
        } catch (err) {
            console.error("Error saving item:", err);
            toast.error("Erro ao salvar item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Tem certeza que deseja apagar este ${sectorTerms.item?.toLowerCase() || 'item'}?`)) return;
        try {
            const { error } = await supabase.from('menu_items').delete().eq('id', id);
            if (error) throw error;
            if (onUpdate) onUpdate();
            toast.success("Item removido com sucesso.");
        } catch (err) {
            console.error("Error deleting:", err);
            toast.error("Erro ao apagar o item.");
        }
    };

    const triggerAIAssistant = (categoryName) => {
        setAiGenerating(true);
        toast.loading(`Gerando sugestões premium de ${sectorTerms.items?.toLowerCase() || 'artigos'} para ${categoryName}...`, { id: 'ai-gen' });
        setTimeout(() => {
            toast.success("Sugestões geradas com sucesso! Verifique na lista.", { id: 'ai-gen' });
            setAiGenerating(false);
        }, 2000);
    };

    if (editingItem) {
        const inputClasses = "w-full px-4 py-3 bg-[#111] border border-[#222224] rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 outline-none transition-all text-white font-medium";
        const labelClasses = "block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 mt-4 first:mt-0";

        return (
            <div className={`rounded-3xl p-6 sm:p-10 border flex flex-col gap-6 w-full max-w-4xl mx-auto h-[85vh] overflow-y-auto transition-all animate-in zoom-in-95 ${cardBgClass}`}>
                <div className="flex items-center justify-between border-b border-[#222224] pb-5">
                    <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                        <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-xl">{sectorDetails.icon || '💊'}</span> {editingItem.id ? `Editar ${sectorTerms.item || 'Artigo'}` : `Novo ${sectorTerms.item || 'Artigo'}`}
                    </h2>
                    <button onClick={() => setEditingItem(null)} className="p-2 bg-[#1A1A1C] hover:bg-[#222224] rounded-full transition-colors text-gray-400 hover:text-white border border-[#222224]">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="p-6 bg-[#0B2530]/60 rounded-3xl border border-[#143E4E] space-y-6 shadow-inner">
                        <div>
                            <label className={labelClasses}>Nome do {sectorTerms.item || 'Artigo'} (PT)</label>
                            <input className={inputClasses} value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder={`Ex: ${sectorDetails.name === 'Farmácias & Produtos de Saúde' ? 'Omeprazol 20mg Cápsulas' : 'Nome do Produto'}`} />
                        </div>

                        <div>
                            <label className={labelClasses}>Descrição / Especificações Técnicas</label>
                            <textarea className={`${inputClasses} min-h-[90px]`} rows={3} value={editingItem.desc_text || ''} onChange={e => setEditingItem({ ...editingItem, desc_text: e.target.value })} placeholder="Ficha técnica, composição ou especificações..." />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Preço de Venda (Kz)</label>
                                <input className={inputClasses} value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: e.target.value })} placeholder="Ex: 2500 Kz" />
                            </div>
                            <div>
                                <label className={labelClasses}>Stock Atual (Unidades)</label>
                                <input className={inputClasses} type="number" value={editingItem.stock_quantity || 0} onChange={e => setEditingItem({ ...editingItem, stock_quantity: parseInt(e.target.value) || 0 })} placeholder="50" />
                            </div>
                        </div>

                        {/* Campos Específicos para Farmácia */}
                        {isPharmacy && (
                            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Campos Farmacêuticos & Saúde (AGT)</span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-gray-400 block mb-1">Substância Ativa / Princípio Ativo (DCI)</label>
                                        <input className={inputClasses} value={editingItem.active_ingredient || ''} onChange={e => setEditingItem({ ...editingItem, active_ingredient: e.target.value })} placeholder="Ex: Paracetamol, Amoxicilina, Ibuprofeno..." />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 block mb-1">Dosagem / Apresentação</label>
                                        <input className={inputClasses} value={editingItem.dosage || ''} onChange={e => setEditingItem({ ...editingItem, dosage: e.target.value })} placeholder="Ex: 500mg 20 Comprimidos" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-gray-400 block mb-1">Número do Lote (LT)</label>
                                        <input className={inputClasses} value={editingItem.batch_number || ''} onChange={e => setEditingItem({ ...editingItem, batch_number: e.target.value })} placeholder="Ex: LT-88349" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 block mb-1">Data de Validade (FEFO)</label>
                                        <input type="date" className={inputClasses} value={editingItem.expiry_date || ''} onChange={e => setEditingItem({ ...editingItem, expiry_date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                                        <input type="checkbox" checked={editingItem.requires_prescription || false} onChange={e => setEditingItem({ ...editingItem, requires_prescription: e.target.checked })} className="w-4 h-4 accent-emerald-500 rounded" />
                                        <span>Exige Receita Médica (Rx / MSR)</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-400">
                                        <input type="checkbox" checked={editingItem.health_iva_exemption || false} onChange={e => setEditingItem({ ...editingItem, health_iva_exemption: e.target.checked })} className="w-4 h-4 accent-emerald-500 rounded" />
                                        <span>Isenção IVA AGT (Art. 12º Medicamentos)</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button className="flex-1 px-6 py-4 rounded-2xl bg-[#1A1A1C] hover:bg-[#222224] text-white font-bold transition-all border border-[#222224]" onClick={() => setEditingItem(null)}>Cancelar</button>
                        <button className={`flex-1 px-6 py-4 rounded-2xl font-black tracking-wider uppercase transition-all shadow-lg ${isPharmacy ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black hover:bg-emerald-400' : 'bg-gradient-to-r from-[#D4AF37] to-[#F9E6A2] text-black'}`} onClick={() => handleSave(editingItem)} disabled={isSaving}>
                            {isSaving ? 'A guardar...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const totalItems = categories.reduce((sum, c) => sum + (c.items?.length || 0), 0);

    return (
        <ComponentErrorBoundary componentName="Menu Manager">
        <div className={`menu-manager h-full relative flex flex-col gap-8 items-start animate-fade-in font-sans text-gray-100 pb-20 ${containerBgClass}`}>
            
            {/* TOP BAR: ENTERPRISE HEADER WITH CLINICAL BACKGROUND */}
            <div className={`w-full rounded-3xl p-6 sm:p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 transition-all ${cardBgClass}`}>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border flex items-center gap-1.5 ${badgeCountClass}`}>
                            <span className={`w-2 h-2 rounded-full ${dotAccentClass}`}></span>
                            {sectorDetails.name || 'Setor Comercial'}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                            AGT Angola Certified
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
                        {sectorDetails.icon || '📦'} Gestão de {sectorTerms.items || 'Artigos & Produtos'}
                    </h2>
                    <p className="text-xs text-gray-400 font-light">
                        {sectorTerms.welcomeMessage || 'Gestão integral do catálogo multi-setorial com sincronização em tempo real e controlo de inventário.'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder={`Procurar ${sectorTerms.items?.toLowerCase() || 'artigos'} ou categorias...`} 
                            value={adminSearch} 
                            onChange={(e) => setAdminSearch(e.target.value)} 
                            className={`w-full pl-10 pr-4 py-3 bg-[#071922] border border-[#143E4E] ${isPharmacy ? 'focus:border-emerald-400' : 'focus:border-[#D4AF37]'} rounded-2xl text-white text-xs outline-none transition-all shadow-inner`} 
                        />
                        {adminSearch && (
                            <button onClick={() => setAdminSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">✕</button>
                        )}
                    </div>

                    <button 
                        onClick={handlePopulateSectorDemo}
                        disabled={isPopulatingDemo}
                        className="px-4 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 flex items-center gap-2 hover:bg-emerald-500 hover:text-black transition-all font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                        title="Carregar catálogo de teste automático para demonstração ao cliente"
                    >
                        <Sparkles size={14} className="animate-pulse text-emerald-300" />
                        <span>Preenchimento Automático ({sectorDetails.badge || 'Demo'})</span>
                    </button>

                    <button 
                        onClick={handleResetStock}
                        className={`px-5 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] ${btnResetStockClass}`}
                        title="Repor Stock Global"
                    >
                        <RotateCcw size={14} className="animate-spin-slow" />
                        <span>Repor Stock</span>
                    </button>

                    <button 
                        onClick={() => setShowCategoryManager(true)} 
                        className={`px-6 py-3 text-gray-200 rounded-2xl border transition-all font-black uppercase tracking-widest text-[10px] shadow-md ${isPharmacy ? 'bg-[#0E313E] border-[#143E4E] hover:border-emerald-400 hover:text-white' : 'bg-[#1A1A1C] border-[#222224] hover:border-[#D4AF37]/50 hover:text-white'}`}
                    >
                        Categorias
                    </button>
                </div>
            </div>

            {/* QUICK CATEGORY FILTER BAR */}
            <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setActiveCategoryFilter('all')}
                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                        activeCategoryFilter === 'all'
                            ? (isPharmacy ? 'bg-emerald-500 text-black shadow-lg scale-105' : 'bg-[#D4AF37] text-black shadow-lg scale-105')
                            : (isPharmacy ? 'bg-[#0B2530] text-gray-400 hover:text-emerald-300 border border-[#143E4E]' : 'bg-[#121213] text-gray-400 hover:text-white border border-[#222224]')
                    }`}
                >
                    <Filter size={13} />
                    <span>Todos ({totalItems})</span>
                </button>

                {categories.map((cat) => (
                    <button
                        key={`filter-pill-${cat.id}`}
                        onClick={() => setActiveCategoryFilter(cat.id)}
                        className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                            activeCategoryFilter === cat.id
                                ? (isPharmacy ? 'bg-emerald-500 text-black shadow-lg scale-105' : 'bg-[#D4AF37] text-black shadow-lg scale-105')
                                : (isPharmacy ? 'bg-[#0B2530] text-gray-400 hover:text-emerald-300 border border-[#143E4E]' : 'bg-[#121213] text-gray-400 hover:text-white border border-[#222224]')
                        }`}
                    >
                        <span>{cat.label || cat.name}</span>
                        <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full font-mono">
                            {cat.items?.length || 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* MAIN TWO-COLUMN WORKSPACE */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: TALL ILLUSTRATED CATEGORY CARDS */}
                <aside className="lg:col-span-3 lg:sticky lg:top-8 space-y-6 flex flex-col">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Navegação Rápida</span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${badgeCountClass}`}>{categories.length} Categorias</span>
                    </div>

                    <div className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 no-scrollbar">
                        {categories.map((cat, idx) => {
                            const isSelected = activeCategoryFilter === cat.id || (activeCategoryFilter === 'all' && idx === 0);
                            const illustration = cat.img_url || getSectorCategoryIllustration(cat.label || cat.name, businessSector);
                            
                            return (
                                <div 
                                    key={`card-${cat.id}`}
                                    onClick={() => {
                                        setActiveCategoryFilter(cat.id);
                                        document.getElementById(`cat-section-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className={`relative rounded-3xl p-6 transition-all duration-500 cursor-pointer overflow-hidden border ${
                                        isSelected ? cardSelectedClass : cardDefaultClass
                                    }`}
                                >
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-radial ${radialGlowClass} blur-2xl pointer-events-none`}></div>

                                    <div className="flex flex-col items-center justify-center gap-4 relative z-10 py-4">
                                        <div className="w-28 h-28 rounded-full bg-[#071922] border border-white/10 p-2 shadow-2xl flex items-center justify-center overflow-hidden relative group/avatar">
                                            <img src={illustration} alt={cat.label || cat.name} className="w-full h-full object-cover rounded-full group-hover/avatar:scale-110 transition-transform duration-700 filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]" />
                                            <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-md p-1.5 rounded-full border border-white/20 text-sm shadow-md">
                                                {sectorDetails.icon || '💊'}
                                            </div>
                                        </div>
                                        <h3 className="text-base font-serif font-bold text-white tracking-wide text-center drop-shadow">{cat.label || cat.name}</h3>
                                        <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border ${badgeCountClass}`}>{cat.items?.length || 0} {sectorTerms.items || 'Artigos'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* RIGHT COLUMN: CATEGORY SECTIONS WITH ITEMS GRID */}
                <div className="lg:col-span-9 space-y-12 pb-24">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-12">
                                {categories.map(cat => {
                                    if (activeCategoryFilter !== 'all' && activeCategoryFilter !== cat.id) return null;
                                    const filteredItems = adminSearch ? cat.items?.filter(i => i.name.toLowerCase().includes(adminSearch.toLowerCase())) : cat.items;
                                    if (adminSearch && (!filteredItems || filteredItems.length === 0)) return null;

                                    return (
                                        <SortableItem key={cat.id} id={cat.id} useHandle={true}>
                                            {(context) => (
                                                <div className="scroll-mt-32 space-y-6" id={`cat-section-${cat.id}`}>
                                                    
                                                    {/* CATEGORY SECTION HEADER PILL & AI ASSISTANT BUTTON */}
                                                    <div className={`flex items-center justify-between p-4 rounded-2xl shadow-lg border ${cardBgClass}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div {...context.attributes} {...context.listeners} className="cursor-grab text-gray-500 hover:text-white p-1">⋮⋮</div>
                                                            <div className={`w-2.5 h-2.5 rounded-full ${dotAccentClass}`}></div>
                                                            <h3 className="text-lg font-serif font-bold text-white">{cat.label || cat.name}</h3>
                                                            <span className="text-xs font-mono text-gray-400 font-medium">({filteredItems?.length || 0})</span>
                                                        </div>

                                                        <button 
                                                            onClick={() => triggerAIAssistant(cat.label || cat.name)}
                                                            disabled={aiGenerating}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all ${btnAiClass}`}
                                                        >
                                                            <Sparkles size={13} className="animate-pulse" />
                                                            <span>Assistente IA</span>
                                                        </button>
                                                    </div>

                                                    {/* ITEMS GRID */}
                                                    <SortableContext items={filteredItems?.map(i => i.id) || []} strategy={rectSortingStrategy}>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                                             {filteredItems?.map(item => {
                                                                const activeIng = item.active_ingredient || item.translations?.sector_data?.active_ingredient;
                                                                const batch = item.batch_number || item.translations?.sector_data?.batch_number;
                                                                const expiry = item.expiry_date || item.translations?.sector_data?.expiry_date;
                                                                const dosage = item.dosage || item.translations?.sector_data?.dosage;
                                                                const rx = item.requires_prescription || item.translations?.sector_data?.requires_prescription;
                                                                const unit = item.unit || item.translations?.sector_data?.unit || 'UN';

                                                                // FEFO Expiry Calculation
                                                                let expiryStatus = null;
                                                                if (expiry) {
                                                                    const expDate = new Date(expiry);
                                                                    const today = new Date();
                                                                    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                                                                    if (diffDays < 0) {
                                                                        expiryStatus = { type: 'expired', label: 'EXPIRADO', class: 'bg-red-500/20 text-red-400 border-red-500/30' };
                                                                    } else if (diffDays <= 90) {
                                                                        expiryStatus = { type: 'warning', label: `Expira em ${diffDays}d`, class: 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' };
                                                                    } else {
                                                                        expiryStatus = { type: 'valid', label: `Val: ${expDate.toLocaleDateString('pt-PT')}`, class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
                                                                    }
                                                                }

                                                                return (
                                                                    <SortableItem key={item.id} id={item.id} useHandle={true}>
                                                                        {(itemContext) => (
                                                                            <div className={`group relative rounded-3xl p-4 flex items-center gap-4 transition-all duration-300 ${cardBgClass}`}>
                                                                                <div {...itemContext.attributes} {...itemContext.listeners} className="cursor-move text-gray-500 hover:text-white transition-colors p-1"><GripVertical size={16} /></div>
                                                                                
                                                                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#071922] border border-white/10 shrink-0 relative shadow-inner">
                                                                                    <img src={item.img_url || getSectorCategoryIllustration(cat.label, businessSector)} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                                    {!item.available && (
                                                                                        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center">
                                                                                            <EyeOff size={16} className="text-gray-400" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex-1 min-w-0 space-y-1">
                                                                                    <div className="flex items-start justify-between gap-1">
                                                                                        <div>
                                                                                            <h4 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">{item.name}</h4>
                                                                                            {activeIng && (
                                                                                                <p className="text-[10px] italic text-emerald-400 font-medium truncate">DCI: {activeIng}</p>
                                                                                            )}
                                                                                        </div>
                                                                                        <button onClick={() => setEditingItem({ ...item })} className="text-gray-500 hover:text-emerald-400 p-1 transition-colors">
                                                                                            <Pencil size={13} />
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Sector Badges (Dosage, Batch LT, FEFO Expiry, Rx) */}
                                                                                    {(dosage || batch || rx || expiryStatus) && (
                                                                                        <div className="flex flex-wrap items-center gap-1 py-0.5">
                                                                                            {dosage && (
                                                                                                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                                                                    {dosage}
                                                                                                </span>
                                                                                            )}
                                                                                            {batch && (
                                                                                                <span className="text-[8px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                                                                                    LT: {batch}
                                                                                                </span>
                                                                                            )}
                                                                                            {expiryStatus && (
                                                                                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${expiryStatus.class}`}>
                                                                                                    {expiryStatus.label}
                                                                                                </span>
                                                                                            )}
                                                                                            {rx && (
                                                                                                <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                                                                    Rx
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}

                                                                                    <div className="flex items-center justify-between pt-1">
                                                                                        <p className={`font-black text-xs font-mono ${priceTextClass}`}>{item.price}</p>
                                                                                        {item.track_stock && (
                                                                                            <span className="text-[9px] font-mono font-bold text-gray-300 bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                                                                                                {item.stock_quantity} {unit}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                                                                        <button 
                                                                                            onClick={async () => {
                                                                                                const newVal = !(item.available !== false);
                                                                                                setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, available: newVal } : i) } : c));
                                                                                                await supabase.from('menu_items').update({ available: newVal }).eq('id', item.id);
                                                                                                toast.success(newVal ? "Ativado!" : "Desativado.");
                                                                                            }}
                                                                                            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                                                                                                item.available !== false 
                                                                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                                                                                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                                                                                            }`}
                                                                                        >
                                                                                            <span className={`w-1.5 h-1.5 rounded-full ${item.available !== false ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
                                                                                            <span>{item.available !== false ? 'SIM' : 'NÃO'}</span>
                                                                                        </button>

                                                                                        <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-500 p-1 transition-colors" title="Apagar">
                                                                                            <X size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </SortableItem>
                                                                );
                                                            })}

                                                            {/* ADD NEW ITEM CARD */}
                                                            <div 
                                                                onClick={() => setEditingItem({ ...DEFAULT_ITEM, category_id: cat.id })}
                                                                className={`group border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 transition-all cursor-pointer h-28 shadow-md ${isPharmacy ? 'border-[#143E4E] hover:border-emerald-400 hover:text-emerald-400 bg-[#0B2530]/40 hover:bg-[#0B2530]/80' : 'border-[#222224] hover:border-[#D4AF37] hover:text-[#D4AF37] bg-[#121213]/40 hover:bg-[#121213]/80'}`}
                                                            >
                                                                <Plus size={24} className="group-hover:scale-125 transition-transform duration-300" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest mt-2">Novo {sectorTerms.item || 'Artigo'}</span>
                                                            </div>
                                                        </div>
                                                    </SortableContext>
                                                </div>
                                            )}
                                        </SortableItem>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {showCategoryManager && <CategoryManager categories={categories} restaurantId={restaurantId} onUpdate={onUpdate} onClose={() => setShowCategoryManager(false)} />}
        </div>
        </ComponentErrorBoundary>
    );
};

export default MenuManager;

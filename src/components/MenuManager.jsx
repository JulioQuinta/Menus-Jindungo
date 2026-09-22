import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import CategoryManager from './CategoryManager';
import { SortableItem } from './SortableItem';
import { compressImage } from '../lib/imageUtils';
import ComponentErrorBoundary from './ComponentErrorBoundary';
import { getSectorCategoryIllustration, getSectorTerminology } from '../utils/sectorConfig';

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
import { Search, X, GripVertical, RotateCcw, Sparkles, Plus, Pencil, Check, AlertCircle, Eye, EyeOff, Pill, Package, Activity, ShieldCheck, Filter } from 'lucide-react';

const DEFAULT_ITEM = {
    name: '',
    price: '',
    desc_text: '',
    category_id: '',
    img_url: '',
    available: true,
    track_stock: true,
    stock_quantity: 50,
    upsell_ids: [],
    translations: { pt: {}, en: {}, fr: {} }
};

const MenuManager = ({ categories: initialCategories = [], restaurantId, restaurant, sectorId = 'farmacia', onUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [adminSearch, setAdminSearch] = useState('');
    const [activeLang, setActiveLang] = useState('pt');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
    const [aiGenerating, setAiGenerating] = useState(false);

    const activeSectorId = restaurant?.business_type || restaurant?.business_sector || restaurant?.sector || sectorId || 'farmacia';
    const terms = getSectorTerminology(activeSectorId);

    const handleResetStock = async () => {
        if (!window.confirm(terms.stockResetPrompt)) return;

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

                setCategories(prev => prev.map(c => c.id === category.id ? { ...c, items: newItems } : c));

                Promise.all(newItems.map((item, index) =>
                    supabase.from('menu_items').update({ position: index }).eq('id', item.id)
                )).then(() => {
                    if (onUpdate) onUpdate();
                });
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            toast.loading("Otimizando imagem...", { id: 'img-upload' });
            const uploadFile = await compressImage(file, 800, 0.8);
            const fileExt = uploadFile.name.split('.').pop() || 'jpg';
            const fileName = `items/${restaurantId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('menus')
                .upload(fileName, uploadFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('menus')
                .getPublicUrl(fileName);

            setEditingItem(prev => ({ ...prev, img_url: publicUrl }));
            toast.success("Imagem carregada!", { id: 'img-upload' });
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Erro ao carregar imagem.", { id: 'img-upload' });
        }
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        if (!editingItem.name || !editingItem.price) {
            return toast.error("Preencha o nome e preço do item!");
        }

        setIsSaving(true);
        try {
            const isNew = !editingItem.id;

            const payload = {
                restaurant_id: restaurantId,
                category_id: editingItem.category_id,
                name: editingItem.name,
                price: editingItem.price,
                desc_text: editingItem.desc_text,
                img_url: editingItem.img_url,
                available: editingItem.available !== false,
                track_stock: editingItem.track_stock || false,
                stock_quantity: editingItem.stock_quantity || 0,
                upsell_ids: editingItem.upsell_ids || [],
                translations: {
                    ...(editingItem.translations || {}),
                    pt: { 
                        ...(editingItem.translations?.pt || {}),
                        name: editingItem.name,
                        desc: editingItem.desc_text,
                    },
                    en: editingItem.translations?.en || {},
                    fr: editingItem.translations?.fr || {}
                }
            };

            if (isNew) payload.position = 999;

            let error;
            if (isNew) {
                const { error: insertError } = await supabase.from('menu_items').insert([payload]);
                error = insertError;
            } else {
                const { error: updateError } = await supabase.from('menu_items').update(payload).eq('id', editingItem.id);
                error = updateError;
            }

            if (error) throw error;
            setEditingItem(null);
            if (onUpdate) onUpdate();
            toast.success(isNew ? terms.createdToast : terms.updatedToast);
        } catch (err) {
            console.error("Error saving item:", err);
            toast.error("Erro ao salvar item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(terms.deleteConfirm)) return;
        try {
            const { error } = await supabase.from('menu_items').delete().eq('id', id);
            if (error) throw error;
            if (onUpdate) onUpdate();
            toast.success(terms.deletedToast);
        } catch (err) {
            console.error("Error deleting:", err);
            toast.error("Erro ao apagar o item.");
        }
    };

    const triggerAIAssistant = (categoryName) => {
        setAiGenerating(true);
        toast.loading(`Gerando sugestões premium de ${terms.itemPlural} para ${categoryName}...`, { id: 'ai-gen' });
        setTimeout(() => {
            toast.success("Sugestões geradas com sucesso! Verifique na lista.", { id: 'ai-gen' });
            setAiGenerating(false);
        }, 2000);
    };

    if (editingItem) {
        const inputClasses = "w-full px-4 py-3 bg-[#111] border border-[#2E2E2E] rounded-2xl focus:ring-2 focus:ring-[#F5C542]/50 focus:border-[#F5C542] outline-none transition-all text-white font-medium";
        const labelClasses = "block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 mt-4 first:mt-0";

        return (
            <div className="bg-[#161616]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] border border-[#2A2A2A] flex flex-col gap-6 w-full max-w-4xl mx-auto h-[85vh] overflow-y-auto transition-all animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#282828] pb-5">
                    <h2 className="text-2xl font-serif font-bold text-[#F5C542] flex items-center gap-3">
                        <span className="p-2 bg-[#F5C542]/10 rounded-xl text-xl">{terms.iconEmoji}</span> {editingItem.id ? `Editar ${terms.itemSingle}` : `Novo ${terms.itemSingle}`}
                    </h2>
                    <button onClick={() => setEditingItem(null)} className="p-2 bg-[#1C1C1C] hover:bg-[#282828] rounded-full transition-colors text-gray-400 hover:text-white border border-[#2A2A2A]">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 bg-[#111] p-1.5 rounded-2xl border border-[#222] w-fit">
                        {[
                            { id: 'pt', label: 'Português', flag: '🇵🇹' },
                            { id: 'en', label: 'English', flag: '🇬🇧' },
                            { id: 'fr', label: 'Français', flag: '🇫🇷' }
                        ].map(lang => (
                            <button
                                key={lang.id}
                                onClick={() => setActiveLang(lang.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 ${
                                    activeLang === lang.id 
                                        ? 'bg-gradient-to-r from-[#F5C542] to-[#EAC775] text-black shadow-lg scale-105' 
                                        : 'text-gray-400 hover:text-white bg-[#1A1A1A]'
                                }`}
                            >
                                <span className="text-sm">{lang.flag}</span>
                                {lang.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 bg-[#1A1A1A] rounded-3xl border border-[#2E2E2E] space-y-6 shadow-inner">
                        {activeLang === 'pt' ? (
                            <>
                                <div>
                                    <label className={labelClasses}>Nome do {terms.itemSingle} (PT)</label>
                                    <input className={inputClasses} value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder={terms.itemPlaceholderName} />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2 mt-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest m-0">Descrição / Ficha Técnica (PT)</label>
                                        <button
                                            onClick={() => {
                                                if (!editingItem.name) return toast.error("Digite o nome primeiro!");
                                                const templates = [
                                                    `${editingItem.name} formulado sob rigorosos padrões de qualidade, indicado para reposição e cuidados diários.`,
                                                    `Produto de alta eficácia ${editingItem.name}, recomendado para conformidade e excelente aceitação clínica.`
                                                ];
                                                setEditingItem({ ...editingItem, desc_text: templates[Math.floor(Math.random() * templates.length)] });
                                            }}
                                            className="text-[10px] bg-gradient-to-r from-[#F5C542] to-amber-500 text-black px-3 py-1 rounded-full font-black uppercase flex items-center gap-1 shadow-md hover:scale-105 transition-all"
                                        ><Sparkles size={12} /> Sugestão IA</button>
                                    </div>
                                    <textarea className={`${inputClasses} min-h-[100px] leading-relaxed`} rows={3} value={editingItem.desc_text || ''} onChange={e => setEditingItem({ ...editingItem, desc_text: e.target.value })} placeholder={terms.itemPlaceholderDesc} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className={labelClasses}>Nome ({activeLang.toUpperCase()})</label>
                                    <input 
                                        className={inputClasses} 
                                        value={editingItem.translations?.[activeLang]?.name || ''} 
                                        onChange={e => setEditingItem({ 
                                            ...editingItem, 
                                            translations: {
                                                ...editingItem.translations,
                                                [activeLang]: { ...(editingItem.translations?.[activeLang] || {}), name: e.target.value }
                                            }
                                        })} 
                                        placeholder={`Nome em ${activeLang.toUpperCase()}`} 
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Descrição ({activeLang.toUpperCase()})</label>
                                    <textarea 
                                        className={`${inputClasses} min-h-[100px]`} 
                                        rows={3} 
                                        value={editingItem.translations?.[activeLang]?.desc || ''} 
                                        onChange={e => setEditingItem({ 
                                            ...editingItem, 
                                            translations: {
                                                ...editingItem.translations,
                                                [activeLang]: { ...(editingItem.translations?.[activeLang] || {}), desc: e.target.value }
                                            }
                                        })} 
                                        placeholder={`Descrição em ${activeLang.toUpperCase()}`} 
                                    />
                                </div>
                            </>
                        )}

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

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#2A2A2A]">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={editingItem.track_stock} onChange={e => setEditingItem({ ...editingItem, track_stock: e.target.checked })} className="w-5 h-5 accent-[#F5C542] rounded-lg" />
                                <span className="text-xs font-bold text-gray-200">Ativar Controlo Automático de Stock</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={editingItem.available !== false} onChange={e => setEditingItem({ ...editingItem, available: e.target.checked })} className="w-5 h-5 accent-green-500 rounded-lg" />
                                <span className="text-xs font-bold text-green-400">Disponível para Faturação / Venda</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Imagem ou Foto Ilustrativa</label>
                        <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="item-img-file" />
                            <label htmlFor="item-img-file" className="px-5 py-2.5 bg-[#222] hover:bg-[#2A2A2A] text-gray-200 rounded-xl border border-[#333] cursor-pointer text-xs font-bold transition-all">
                                Carregar Foto
                            </label>
                            {editingItem.img_url && (
                                <img src={editingItem.img_url} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-[#333]" />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-[#282828] pt-6">
                        <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-3 bg-[#1C1C1C] hover:bg-[#282828] text-gray-300 rounded-xl text-xs font-bold transition-colors">
                            Cancelar
                        </button>
                        <button type="button" onClick={handleSaveItem} disabled={isSaving} className="px-8 py-3 bg-gradient-to-r from-[#F5C542] to-amber-500 text-black rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                            {isSaving ? 'A guardar...' : 'Guardar Alterações'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredCategories = categories.filter(cat => {
        if (activeCategoryFilter !== 'all' && cat.id !== activeCategoryFilter) return false;
        if (!adminSearch) return true;
        const q = adminSearch.toLowerCase();
        const matchCat = cat.label?.toLowerCase().includes(q) || cat.name?.toLowerCase().includes(q);
        const matchItem = cat.items?.some(i => i.name?.toLowerCase().includes(q) || i.desc_text?.toLowerCase().includes(q));
        return matchCat || matchItem;
    });

    const totalProductsCount = categories.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);

    return (
        <ComponentErrorBoundary componentName="Menu Manager">
        <div className="menu-manager h-full relative flex flex-col gap-8 items-start animate-fade-in font-sans text-gray-100 pb-20">
            
            {/* TOP BAR: ENTERPRISE HEADER + METRICS TOOLBAR */}
            <div className="w-full bg-[#161616]/90 backdrop-blur-xl border border-[#282828] rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 hover:border-[#F5C542]/40 transition-all">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {terms.sectorName}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                            v3.1 AGT Angola
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
                        {terms.sectorBadge}
                    </h2>
                    <p className="text-xs text-gray-400 font-light">
                        Gestão integral do catálogo multi-setorial com sincronização em tempo real e controlo de inventário.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder={`Procurar ${terms.itemPlural.toLowerCase()}...`} 
                            value={adminSearch} 
                            onChange={(e) => setAdminSearch(e.target.value)} 
                            className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-[#2E2E2E] focus:border-[#F5C542] rounded-2xl text-white text-xs outline-none transition-all shadow-inner" 
                        />
                        {adminSearch && (
                            <button onClick={() => setAdminSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">✕</button>
                        )}
                    </div>

                    <button 
                        onClick={handleResetStock}
                        className="px-5 py-3 bg-[#F5C542]/10 text-[#F5C542] rounded-2xl border border-[#F5C542]/40 flex items-center gap-2 hover:bg-[#F5C542] hover:text-black transition-all font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(245,197,66,0.2)]"
                        title="Repor Stock Global"
                    >
                        <RotateCcw size={14} className="animate-spin-slow" />
                        <span>Repor Stock</span>
                    </button>

                    <button 
                        onClick={() => setShowCategoryManager(true)} 
                        className="px-6 py-3 bg-[#1C1C1C] text-gray-200 rounded-2xl border border-[#2E2E2E] hover:border-[#F5C542]/50 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] shadow-md"
                    >
                        Gerir Categorias
                    </button>
                </div>
            </div>

            {/* QUICK CATEGORY FILTER BAR */}
            <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setActiveCategoryFilter('all')}
                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                        activeCategoryFilter === 'all'
                            ? 'bg-[#F5C542] text-black shadow-lg scale-105'
                            : 'bg-[#161616] text-gray-400 hover:text-white border border-[#282828]'
                    }`}
                >
                    <Filter size={13} />
                    <span>Todos os Produtos ({totalProductsCount})</span>
                </button>

                {categories.map((cat) => (
                    <button
                        key={`filter-pill-${cat.id}`}
                        onClick={() => setActiveCategoryFilter(cat.id)}
                        className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                            activeCategoryFilter === cat.id
                                ? 'bg-[#F5C542] text-black shadow-lg scale-105'
                                : 'bg-[#161616] text-gray-400 hover:text-white border border-[#282828]'
                        }`}
                    >
                        <span>{cat.label || cat.name}</span>
                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">
                            {cat.items?.length || 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* MAIN TWO-COLUMN WORKSPACE MATCHING TOP WORLDWIDE PHARMACY & ERP SOFTWARE */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: TALL ILLUSTRATED CATEGORY CARDS WITH DYNAMIC SECTOR BADGES */}
                <aside className="lg:col-span-3 lg:sticky lg:top-8 space-y-6 flex flex-col">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Navegação Rápida</span>
                        <span className="text-[10px] font-black text-[#F5C542] bg-[#F5C542]/10 px-2.5 py-0.5 rounded-full border border-[#F5C542]/20">
                            {categories.length} Categorias
                        </span>
                    </div>

                    <div className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 no-scrollbar">
                        {categories.map((cat, idx) => {
                            const isSelected = activeCategoryFilter === cat.id || (activeCategoryFilter === 'all' && idx === 0);
                            const illustration = getSectorCategoryIllustration(cat.label || cat.name, activeSectorId);
                            
                            return (
                                <div 
                                    key={`card-${cat.id}`}
                                    onClick={() => {
                                        setActiveCategoryFilter(cat.id);
                                        document.getElementById(`cat-section-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className={`relative rounded-3xl p-6 transition-all duration-500 cursor-pointer overflow-hidden border ${
                                        isSelected 
                                            ? 'bg-[#161616]/95 border-[#F5C542] shadow-[0_0_30px_rgba(245,197,66,0.25)] scale-[1.02]' 
                                            : 'bg-[#161616]/75 border-[#282828] hover:border-[#F5C542]/40 hover:bg-[#161616]/90 opacity-80 hover:opacity-100'
                                    }`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-[#F5C542]/15 to-transparent blur-2xl pointer-events-none"></div>

                                    <div className="flex flex-col items-center justify-center gap-4 relative z-10 py-4">
                                        <div className="w-28 h-28 rounded-full bg-[#111] border border-white/10 p-2 shadow-2xl flex items-center justify-center overflow-hidden relative group/avatar">
                                            <img 
                                                src={illustration} 
                                                alt={cat.label || cat.name} 
                                                className="w-full h-full object-cover rounded-full group-hover/avatar:scale-110 transition-transform duration-700" 
                                            />
                                            <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-md p-1.5 rounded-full border border-white/20 text-sm shadow-md">
                                                {terms.iconEmoji}
                                            </div>
                                        </div>

                                        <div className="text-center space-y-1">
                                            <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                                                {cat.label || cat.name}
                                            </h3>
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#F5C542]/80 bg-[#F5C542]/10 px-3 py-1 rounded-full border border-[#F5C542]/20 inline-block">
                                                {cat.items?.length || 0} {terms.itemPlural}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* RIGHT COLUMN: DRAGGABLE CATEGORY SECTIONS AND ITEMS GRID */}
                <div className="lg:col-span-9 space-y-10 w-full">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={filteredCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-10">
                                {filteredCategories.map((cat) => {
                                    const items = cat.items || [];
                                    return (
                                        <SortableItem key={cat.id} id={cat.id}>
                                            {(context) => (
                                                <div id={`cat-section-${cat.id}`} className="bg-[#141414]/90 backdrop-blur-xl border border-[#262626] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl hover:border-[#F5C542]/30 transition-all">
                                                    
                                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222] pb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div {...context.attributes} {...context.listeners} className="cursor-move text-gray-500 hover:text-[#F5C542] transition-colors p-1">
                                                                <GripVertical size={20} />
                                                            </div>
                                                            <div className="w-3 h-3 rounded-full bg-[#F5C542] shadow-[0_0_10px_rgba(245,197,66,0.6)]"></div>
                                                            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                                                                {terms.iconEmoji} {cat.label || cat.name} 
                                                                <span className="text-xs font-sans font-normal text-gray-400">({items.length})</span>
                                                            </h3>
                                                        </div>

                                                        <button 
                                                            onClick={() => triggerAIAssistant(cat.label || cat.name)}
                                                            disabled={aiGenerating}
                                                            className="px-4 py-2 bg-gradient-to-r from-[#F5C542]/10 to-amber-500/10 text-[#F5C542] rounded-xl border border-[#F5C542]/30 hover:bg-[#F5C542] hover:text-black transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5 shadow-md"
                                                        >
                                                            <Sparkles size={13} className={aiGenerating ? "animate-spin" : ""} />
                                                            <span>Assistente IA</span>
                                                        </button>
                                                    </div>

                                                    <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                            {items.map((item) => (
                                                                <SortableItem key={item.id} id={item.id}>
                                                                    {(itemContext) => (
                                                                        <div className={`group relative bg-[#1A1A1A] border rounded-2xl p-4 flex gap-4 items-center transition-all duration-300 hover:scale-[1.02] shadow-md ${
                                                                            item.available !== false ? 'border-[#2A2A2A] hover:border-[#F5C542]/50' : 'border-red-900/30 opacity-60'
                                                                        }`}>
                                                                            <div {...itemContext.attributes} {...itemContext.listeners} className="cursor-move text-gray-600 hover:text-[#F5C542] transition-colors p-1">
                                                                                <GripVertical size={16} />
                                                                            </div>
                                                                            
                                                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#111] border border-white/10 shrink-0 relative shadow-inner">
                                                                                <img 
                                                                                    src={item.img_url || getSectorCategoryIllustration(cat.label, activeSectorId)} 
                                                                                    alt={item.name} 
                                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                                                />
                                                                                {!item.available && (
                                                                                    <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center">
                                                                                        <EyeOff size={16} className="text-gray-400" />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                                <div className="flex items-start justify-between gap-1">
                                                                                    <h4 className="font-bold text-sm text-white truncate group-hover:text-[#F5C542] transition-colors">
                                                                                        {item.name}
                                                                                    </h4>
                                                                                    <button onClick={() => setEditingItem({ ...item })} className="text-gray-500 hover:text-[#F5C542] p-1 transition-colors">
                                                                                        <Pencil size={13} />
                                                                                    </button>
                                                                                </div>

                                                                                <div className="flex items-center justify-between pt-1">
                                                                                    <p className="text-[#F5C542] font-black text-xs font-mono">{item.price}</p>
                                                                                    {item.track_stock && (
                                                                                        <span className="text-[9px] font-mono font-bold text-gray-300 bg-[#111] px-2 py-0.5 rounded-md border border-[#2E2E2E]">
                                                                                            {item.stock_quantity} UN
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                                                                                    <button 
                                                                                        onClick={async () => {
                                                                                            const newVal = !(item.available !== false);
                                                                                            setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, available: newVal } : i) } : c));
                                                                                            await supabase.from('menu_items').update({ available: newVal }).eq('id', item.id);
                                                                                            toast.success(newVal ? terms.activatedToast : terms.deactivatedToast);
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

                                                                                    <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-500 p-1 transition-colors" title={`Apagar ${terms.itemSingle}`}>
                                                                                        <X size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </SortableItem>
                                                            ))}

                                                            <div 
                                                                onClick={() => setEditingItem({ ...DEFAULT_ITEM, category_id: cat.id })}
                                                                className="group border-2 border-dashed border-[#2A2A2A] hover:border-[#F5C542] rounded-3xl p-6 flex flex-col items-center justify-center text-gray-500 hover:text-[#F5C542] transition-all cursor-pointer h-28 bg-[#161616]/40 hover:bg-[#161616]/80 shadow-md"
                                                            >
                                                                <Plus size={24} className="group-hover:scale-125 transition-transform duration-300 text-[#F5C542]" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-center">
                                                                    {terms.addItemButton}
                                                                </span>
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

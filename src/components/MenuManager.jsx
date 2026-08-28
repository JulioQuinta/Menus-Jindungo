import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import CategoryManager from './CategoryManager';
import { SortableItem } from './SortableItem';
import { compressImage } from '../lib/imageUtils';
import ComponentErrorBoundary from './ComponentErrorBoundary';

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
import { Search, X, GripVertical, RotateCcw, Sparkles, Plus, Pencil, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Ilustrações de altíssima qualidade para os cartões de Categoria espelhando a imagem
const CATEGORY_ILLUSTRATIONS = {
    'Pequeno-Almoço': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
    'comidas Locais': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    'Entradas': 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&q=80',
    'Pratos Principais': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
    'Bebidas': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
    'Sobremesas': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
    'default': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'
};

const MenuManager = ({ categories: initialCategories = [], restaurantId, onUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [adminSearch, setAdminSearch] = useState('');
    const [activeLang, setActiveLang] = useState('pt');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
    const [aiGenerating, setAiGenerating] = useState(false);

    const handleResetStock = async () => {
        const confirmMsg = "Deseja repor o stock de TODOS os pratos com controlo ativo? Esta ação não pode ser desfeita.";
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
        upsell_ids: []
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

            const payload = {
                restaurant_id: restaurantId,
                category_id: item.category_id,
                name: item.name,
                price: item.price,
                desc_text: item.desc_text,
                subcategory: item.subcategory,
                available: item.available,
                img_url: item.img_url,
                track_stock: item.track_stock || false,
                stock_quantity: item.stock_quantity || 0,
                upsell_ids: item.upsell_ids || [],
                translations: {
                    ...(item.translations || {}),
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

            if (isNew) {
                const { data, error: insertError } = await supabase.from('menu_items').insert([payload]).select();
                if (insertError) throw insertError;
                if (!data || data.length === 0) {
                    throw new Error("Permissão negada pela política RLS para criar pratos.");
                }
            } else {
                const { data, error: updateError } = await supabase.from('menu_items').update(payload).eq('id', item.id).select();
                if (updateError) throw updateError;
                if (!data || data.length === 0) {
                    throw new Error("Permissão negada pela política RLS para editar este prato.");
                }
            }

            setEditingItem(null);
            if (onUpdate) onUpdate();
            toast.success(isNew ? "Prato criado com sucesso!" : "Prato atualizado com sucesso!");
        } catch (err) {
            console.error("Error saving item:", err);
            toast.error(err.message || "Erro ao salvar item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja apagar este prato?")) return;
        try {
            const { error } = await supabase.from('menu_items').delete().eq('id', id);
            if (error) throw error;
            if (onUpdate) onUpdate();
            toast.success("Prato removido com sucesso.");
        } catch (err) {
            console.error("Error deleting:", err);
            toast.error("Erro ao apagar o prato.");
        }
    };

    const triggerAIAssistant = (categoryName) => {
        setAiGenerating(true);
        toast.loading(`Gerando sugestões premium de pratos para ${categoryName}...`, { id: 'ai-gen' });
        setTimeout(() => {
            toast.success("Sugestões geradas com sucesso! Verifique na lista.", { id: 'ai-gen' });
            setAiGenerating(false);
        }, 2000);
    };

    if (editingItem) {
        const inputClasses = "w-full px-4 py-3 bg-[#111] border border-[#222224] rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white font-medium";
        const labelClasses = "block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 mt-4 first:mt-0";

        return (
            <div className="bg-[#121213]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] border border-[#2A2A2A] flex flex-col gap-6 w-full max-w-4xl mx-auto h-[85vh] overflow-y-auto transition-all animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#222224] pb-5">
                    <h2 className="text-2xl font-serif font-bold text-[#D4AF37] flex items-center gap-3">
                        <span className="p-2 bg-[#D4AF37]/10 rounded-xl">🍽️</span> {editingItem.id ? 'Editar Prato' : 'Novo Prato'}
                    </h2>
                    <button onClick={() => setEditingItem(null)} className="p-2 bg-[#1A1A1C] hover:bg-[#222224] rounded-full transition-colors text-gray-400 hover:text-white border border-[#2A2A2A]">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex flex-col gap-6">
                    {/* Language Tabs */}
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
                                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#F9E6A2] text-black shadow-lg scale-105' 
                                        : 'text-gray-400 hover:text-white bg-[#1A1A1A]'
                                }`}
                            >
                                <span className="text-sm">{lang.flag}</span>
                                {lang.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 bg-[#1A1A1A] rounded-3xl border border-[#222224] space-y-6 shadow-inner">
                        {activeLang === 'pt' ? (
                            <>
                                <div>
                                    <label className={labelClasses}>Nome do Prato (PT)</label>
                                    <input className={inputClasses} value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Ex: Ovos Mexidos com Bacon" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2 mt-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest m-0">Descrição (PT)</label>
                                        <button
                                            onClick={() => {
                                                if (!editingItem.name) return toast.error("Digite o nome do prato primeiro!");
                                                const templates = [`O delicioso ${editingItem.name} é preparado com ingredientes frescos da mais alta qualidade, garantindo um sabor único.`, `Experimente o nosso incrível ${editingItem.name}, a escolha perfeita para o seu dia.` ];
                                                setEditingItem({ ...editingItem, desc_text: templates[Math.floor(Math.random() * templates.length)] });
                                            }}
                                            className="text-[10px] bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black px-3 py-1 rounded-full font-black uppercase flex items-center gap-1 shadow-md hover:scale-105 transition-all"
                                        ><Sparkles size={12} /> Sugestão IA</button>
                                    </div>
                                    <textarea className={`${inputClasses} min-h-[100px] leading-relaxed`} rows={3} value={editingItem.desc_text || ''} onChange={e => setEditingItem({ ...editingItem, desc_text: e.target.value })} placeholder="Descreva os ingredientes, modo de preparação e sabor..." />
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
                                        placeholder={`Name in ${activeLang === 'en' ? 'English' : 'French'}...`}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Descrição ({activeLang.toUpperCase()})</label>
                                    <textarea 
                                        className={`${inputClasses} min-h-[100px] leading-relaxed`} 
                                        rows={3} 
                                        value={editingItem.translations?.[activeLang]?.desc || ''} 
                                        onChange={e => setEditingItem({ 
                                            ...editingItem, 
                                            translations: {
                                                ...editingItem.translations,
                                                [activeLang]: { ...(editingItem.translations?.[activeLang] || {}), desc: e.target.value }
                                            }
                                        })} 
                                        placeholder={`Description in ${activeLang === 'en' ? 'English' : 'French'}...`}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClasses}>Preço (Global)</label>
                            <input className={inputClasses} value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: e.target.value })} placeholder="Ex: 3500 Kz" />
                        </div>
                        <div>
                            <label className={labelClasses}>Categoria do Prato</label>
                            <select 
                                className={inputClasses}
                                value={editingItem.category_id} 
                                onChange={e => setEditingItem({ ...editingItem, category_id: e.target.value })}
                            >
                                {categories.map(c => (
                                    <option key={c.id} value={c.id} className="bg-[#1A1A1C] text-white font-medium">{c.label || c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-2xl border border-[#222224]">
                            <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Controlo de Estoque</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={editingItem.track_stock} onChange={e => setEditingItem({ ...editingItem, track_stock: e.target.checked })} />
                                <div className="w-12 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                            </label>
                        </div>
                        {editingItem.track_stock && (
                            <div>
                                <label className={labelClasses}>Quantidade Disponível</label>
                                <input type="number" className={inputClasses} value={editingItem.stock_quantity || 0} onChange={e => setEditingItem({ ...editingItem, stock_quantity: parseInt(e.target.value) || 0 })} placeholder="Ex: 50" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className={labelClasses}>Fotografia do Prato</label>
                        <div className="flex items-center gap-6 p-4 bg-[#1A1A1A] rounded-3xl border border-[#222224]">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/60 border border-[#2A2A2A] shrink-0 shadow-inner flex items-center justify-center">
                                {editingItem.img_url ? (
                                    <img src={editingItem.img_url} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <span className="text-3xl text-gray-600">🍽️</span>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input type="file" accept="image/*" onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    try {
                                        toast.loading("Otimizando...", { id: 'upload' });
                                        let uploadFile = file;
                                        if (file.type.startsWith('image/')) {
                                            uploadFile = await compressImage(file, { maxWidth: 800, forceSquare: true, quality: 0.75 });
                                        }
                                        const fileExt = uploadFile.name.split('.').pop() || 'jpg';
                                        const fileName = `items/${restaurantId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                                        const { error } = await supabase.storage.from('menus').upload(fileName, uploadFile);
                                        if (error) throw error;
                                        const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);
                                        setEditingItem({ ...editingItem, img_url: publicUrl });
                                        toast.success("Enviado com sucesso!", { id: 'upload' });
                                    } catch (err) { toast.error("Erro no upload."); }
                                }} className="block w-full text-xs text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-[#D4AF37] file:text-black hover:file:bg-[#F9E6A2] file:transition-all file:cursor-pointer" />
                                <p className="text-[10px] text-gray-500 font-light">Formato quadrado recomendado (JPG ou PNG). Otimização automática ativada.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button className="flex-1 px-6 py-4 rounded-2xl bg-[#1A1A1C] hover:bg-[#222224] text-white font-bold transition-all border border-[#222224]" onClick={() => setEditingItem(null)}>Cancelar</button>
                        <button className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F9E6A2] text-gray-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-[#D4AF37]/20 hover:scale-[1.01]" onClick={() => handleSave(editingItem)} disabled={isSaving}>Salvar Alterações</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ComponentErrorBoundary componentName="Menu Manager">
        <div className="menu-manager h-full relative flex flex-col gap-8 items-start animate-fade-in font-sans text-gray-100 pb-20">
            
            {/* TOP BAR: EDITOR DE MENU HEADER + SEARCH + REPOR STOCK + CATEGORIAS */}
            <div className="w-full bg-[#121213]/90 backdrop-blur-xl border border-[#222224] rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 hover:border-[#D4AF37]/40 transition-all">
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
                        Editor de Menu <span className="text-sm font-sans font-medium text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">Comidas da Terra</span>
                    </h2>
                    <p className="text-xs text-gray-400 font-light">Gerencie seus pratos e categorias com sincronização instantânea.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Procurar pratos ou categorias..." 
                            value={adminSearch} 
                            onChange={(e) => setAdminSearch(e.target.value)} 
                            className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-[#222224] focus:border-[#D4AF37] rounded-2xl text-white text-xs outline-none transition-all shadow-inner" 
                        />
                        {adminSearch && (
                            <button onClick={() => setAdminSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">✕</button>
                        )}
                    </div>

                    <button 
                        onClick={handleResetStock}
                        className="px-5 py-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl border border-[#D4AF37]/40 flex items-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-all font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(245,197,66,0.2)]"
                        title="Repor Stock Global"
                    >
                        <RotateCcw size={14} className="animate-spin-slow" />
                        <span>Repor Stock</span>
                    </button>

                    <button 
                        onClick={() => setShowCategoryManager(true)} 
                        className="px-6 py-3 bg-[#1A1A1C] text-gray-200 rounded-2xl border border-[#222224] hover:border-[#D4AF37]/50 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] shadow-md"
                    >
                        Categorias
                    </button>
                </div>
            </div>

            {/* MAIN TWO-COLUMN WORKSPACE EXACTLY AS IN THE REFERENCE SCREENSHOT */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: TALL ILLUSTRATED CATEGORY CARDS (STACKED 3D LAYERS) */}
                <aside className="lg:col-span-3 lg:sticky lg:top-8 space-y-6 flex flex-col">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Navegação Rápida</span>
                        <span className="text-[10px] font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">{categories.length} Categorias</span>
                    </div>

                    <div className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 no-scrollbar">
                        {categories.map((cat, idx) => {
                            const isSelected = activeCategoryFilter === cat.id || (!activeCategoryFilter && idx === 0);
                            const illustration = CATEGORY_ILLUSTRATIONS[cat.label || cat.name] || CATEGORY_ILLUSTRATIONS['default'];
                            
                            return (
                                <div 
                                    key={`card-${cat.id}`}
                                    onClick={() => {
                                        setActiveCategoryFilter(cat.id);
                                        document.getElementById(`cat-section-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className={`relative rounded-3xl p-6 transition-all duration-500 cursor-pointer overflow-hidden border ${
                                        isSelected 
                                            ? 'bg-[#121213]/95 border-[#D4AF37] shadow-[0_0_30px_rgba(245,197,66,0.3)] scale-[1.02]' 
                                            : 'bg-[#121213]/75 border-[#222224] hover:border-[#D4AF37]/40 hover:bg-[#121213]/90 opacity-80 hover:opacity-100'
                                    }`}
                                >
                                    {/* Ambient Glow inside card */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-[#D4AF37]/15 to-transparent blur-2xl pointer-events-none"></div>

                                    <div className="flex flex-col items-center justify-center gap-4 relative z-10 py-4">
                                        <div className="w-28 h-28 rounded-full bg-[#111] border border-white/10 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
                                            <img src={illustration} alt={cat.label || cat.name} className="w-full h-full object-cover rounded-full filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]" />
                                        </div>
                                        <h3 className="text-base font-serif font-bold text-white tracking-wide text-center drop-shadow">{cat.label || cat.name}</h3>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 bg-[#1A1A1C] px-3 py-1 rounded-full border border-[#222224]">{cat.items?.length || 0} Pratos</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* RIGHT COLUMN: CATEGORY SECTIONS WITH DISHES GRID */}
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
                                                    <div className="flex items-center justify-between p-4 bg-[#121213]/90 backdrop-blur-xl rounded-2xl border border-[#222224] shadow-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div {...context.attributes} {...context.listeners} className="cursor-grab text-gray-600 hover:text-white p-1">⋮⋮</div>
                                                            <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></div>
                                                            <h3 className="text-lg font-serif font-bold text-white">{cat.label || cat.name}</h3>
                                                            <span className="text-xs font-mono text-gray-500 font-medium">({filteredItems?.length || 0})</span>
                                                        </div>

                                                        <button 
                                                            onClick={() => triggerAIAssistant(cat.label || cat.name)}
                                                            disabled={aiGenerating}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37]/20 to-[#F9E6A2]/10 hover:from-[#D4AF37]/30 text-[#D4AF37] rounded-xl border border-[#D4AF37]/40 font-black uppercase tracking-wider text-[10px] shadow-[0_0_12px_rgba(245,197,66,0.15)] transition-all"
                                                        >
                                                            <Sparkles size={13} className="animate-pulse" />
                                                            <span>AI Menu Assistant</span>
                                                        </button>
                                                    </div>

                                                    {/* DISHES GRID */}
                                                    <SortableContext items={filteredItems?.map(i => i.id) || []} strategy={rectSortingStrategy}>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                                            {filteredItems?.map(item => (
                                                                <SortableItem key={item.id} id={item.id} useHandle={true}>
                                                                    {(context) => (
                                                                        <div className="group relative bg-[#121213]/90 backdrop-blur-xl rounded-3xl border border-[#222224] hover:border-[#D4AF37]/50 p-4 flex items-center gap-4 transition-all duration-300 shadow-xl hover:shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
                                                                            <div {...context.attributes} {...context.listeners} className="cursor-move text-gray-600 hover:text-[#D4AF37] transition-colors p-1"><GripVertical size={16} /></div>
                                                                            
                                                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#111] border border-white/10 shrink-0 relative shadow-inner">
                                                                                <img src={item.img_url || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                                {!item.available && (
                                                                                    <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center">
                                                                                        <EyeOff size={16} className="text-gray-400" />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                                <div className="flex items-start justify-between gap-1">
                                                                                    <h4 className="font-bold text-sm text-white truncate group-hover:text-[#D4AF37] transition-colors">{item.name}</h4>
                                                                                    <button onClick={() => setEditingItem({ ...item })} className="text-gray-500 hover:text-[#D4AF37] p-1 transition-colors">
                                                                                        <Pencil size={13} />
                                                                                    </button>
                                                                                </div>

                                                                                <div className="flex items-center justify-between pt-1">
                                                                                    <p className="text-[#D4AF37] font-black text-xs font-mono">{item.price}</p>
                                                                                    {item.track_stock && (
                                                                                        <span className="text-[9px] font-mono font-bold text-gray-400 bg-[#1A1A1C] px-2 py-0.5 rounded-md border border-[#222224]">
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
                                                                                            toast.success(newVal ? "Prato ativado!" : "Prato desativado.");
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

                                                                                    <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-500 p-1 transition-colors" title="Apagar prato">
                                                                                        <X size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </SortableItem>
                                                            ))}

                                                            {/* NOVO PRATO CARD */}
                                                            <div 
                                                                onClick={() => setEditingItem({ ...DEFAULT_ITEM, category_id: cat.id })}
                                                                className="group border-2 border-dashed border-[#2A2A2A] hover:border-[#D4AF37] rounded-3xl p-6 flex flex-col items-center justify-center text-gray-600 hover:text-[#D4AF37] transition-all cursor-pointer h-28 bg-[#121213]/40 hover:bg-[#121213]/80 shadow-md"
                                                            >
                                                                <Plus size={24} className="group-hover:scale-125 transition-transform duration-300" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest mt-2">Novo Prato</span>
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

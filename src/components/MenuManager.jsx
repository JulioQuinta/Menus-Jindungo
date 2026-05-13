import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import CategoryManager from './CategoryManager';
import { SortableItem } from './SortableItem';
import { compressImage } from '../lib/imageUtils';

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
import { Search, X, GripVertical, RotateCcw, Globe, Languages } from 'lucide-react';

const MenuManager = ({ categories: initialCategories = [], restaurantId, onUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [adminSearch, setAdminSearch] = useState('');
    const [activeLang, setActiveLang] = useState('pt'); // [NEW] Track active translation tab

    const handleResetStock = async () => {
        const confirmMsg = "Deseja repor o stock de TODOS os pratos com controlo ativo? Esta ação não pode ser desfeita.";
        if (!window.confirm(confirmMsg)) return;

        const qty = window.prompt("Defina a nova quantidade padrão para todos os itens (ou deixe 0):", "0");
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

    // Sensors for DND
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
        stock_quantity: 0,
        upsell_ids: []
    };

    const handleSave = async (item) => {
        setIsSaving(true);
        try {
            const isNew = !item.id;
            if (!item.name || !item.price || !item.category_id) {
                toast.error("Nome, PreÃ§o e Categoria sÃ£o obrigatÃ³rios.");
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
                composition: item.composition,
                available: item.available,
                img_url: item.img_url,
                track_stock: item.track_stock || false,
                stock_quantity: item.stock_quantity || 0,
                upsell_ids: item.upsell_ids || [],
                translations: {
                    ...(item.translations || {}),
                    variants: item.variants,
                    pt: { 
                        ...(item.translations?.pt || {}),
                        name: item.name,
                        desc: item.desc_text,
                        composition: item.composition
                    },
                    // [NEW] Explicitly ensure EN/FR are preserved or updated if changed in state
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
            toast.success(isNew ? "Prato criado com sucesso!" : "Prato atualizado com sucesso!");
        } catch (err) {
            console.error("Error saving item:", err);
            toast.error("Erro ao salvar item.");
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
        } catch (err) {
            console.error("Error deleting:", err);
            toast.error("Erro ao apagar o prato.");
        }
    };

    if (editingItem) {
        const inputClasses = "w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white font-medium";
        const labelClasses = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 first:mt-0";

        return (
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col gap-6 w-full h-full overflow-y-auto transition-all">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-serif font-bold text-white">
                        {editingItem.id ? 'Editar Prato' : 'Novo Prato'}
                    </h2>
                    <button onClick={() => setEditingItem(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white border border-white/5">âœ•</button>
                </div>
                <div className="flex flex-col gap-6">
                    {/* Language Tabs */}
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl w-fit">
                        {[
                            { id: 'pt', label: 'Português', flag: '🇵🇹' },
                            { id: 'en', label: 'English', flag: '🇬🇧' },
                            { id: 'fr', label: 'Français', flag: '🇫🇷' }
                        ].map(lang => (
                            <button
                                key={lang.id}
                                onClick={() => setActiveLang(lang.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                    activeLang === lang.id 
                                        ? 'bg-[#D4AF37] text-black shadow-lg' 
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <span>{lang.flag}</span>
                                {lang.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-6">
                        {activeLang === 'pt' ? (
                            <>
                                <div>
                                    <label className={labelClasses}>Nome do Prato (PT)</label>
                                    <input className={inputClasses} value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Ex: Bitoque de Frango" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2 mt-4">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider m-0">Descrição (PT)</label>
                                        <button
                                            onClick={() => {
                                                if (!editingItem.name) return toast.error("Digite o nome do prato primeiro!");
                                                const templates = [`O delicioso ${editingItem.name} é preparado com ingredientes frescos...`, `Experimente nosso ${editingItem.name}...` ];
                                                setEditingItem({ ...editingItem, desc_text: templates[Math.floor(Math.random() * templates.length)] });
                                            }}
                                            className="text-[10px] bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black px-3 py-1 rounded-full font-bold"
                                        >✨ IA</button>
                                    </div>
                                    <textarea className={`${inputClasses} min-h-[80px]`} rows={2} value={editingItem.desc_text || ''} onChange={e => setEditingItem({ ...editingItem, desc_text: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Composição (PT)</label>
                                    <input className={inputClasses} value={editingItem.composition || ''} onChange={e => setEditingItem({ ...editingItem, composition: e.target.value })} placeholder="Ex: Arroz, Feijão..." />
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
                                        className={`${inputClasses} min-h-[80px]`} 
                                        rows={2} 
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
                                <div>
                                    <label className={labelClasses}>Composição ({activeLang.toUpperCase()})</label>
                                    <input 
                                        className={inputClasses} 
                                        value={editingItem.translations?.[activeLang]?.composition || ''} 
                                        onChange={e => setEditingItem({ 
                                            ...editingItem, 
                                            translations: {
                                                ...editingItem.translations,
                                                [activeLang]: { ...(editingItem.translations?.[activeLang] || {}), composition: e.target.value }
                                            }
                                        })} 
                                        placeholder={`Composition in ${activeLang === 'en' ? 'English' : 'French'}...`}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div>
                        <label className={labelClasses}>Preço (Global)</label>
                        <input className={inputClasses} value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: e.target.value })} placeholder="Ex: 12.000 Kz" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={editingItem.track_stock} onChange={e => setEditingItem({ ...editingItem, track_stock: e.target.checked })} />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                <span className="ml-3 text-xs font-bold text-gray-300 uppercase tracking-wider">Controlar Stock</span>
                            </label>
                        </div>
                        {editingItem.track_stock && (
                            <div>
                                <label className={labelClasses}>Quantidade em Stock</label>
                                <input type="number" className={inputClasses} value={editingItem.stock_quantity || 0} onChange={e => setEditingItem({ ...editingItem, stock_quantity: parseInt(e.target.value) || 0 })} placeholder="Ex: 50" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className={labelClasses}>Fotografia</label>
                        <input type="file" accept="image/*" onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            try {
                                toast.loading("Otimizando...", { id: 'upload' });
                                let uploadFile = file;
                                if (file.type.startsWith('image/')) {
                                    uploadFile = await compressImage(file, { 
                                        maxWidth: 800, 
                                        forceSquare: true,
                                        quality: 0.75 
                                    });
                                }
                                const fileExt = uploadFile.name.split('.').pop() || 'jpg';
                                const fileName = `items/${restaurantId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                                const { error } = await supabase.storage.from('menus').upload(fileName, uploadFile);
                                if (error) throw error;
                                const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);
                                setEditingItem({ ...editingItem, img_url: publicUrl });
                                toast.success("Enviado!", { id: 'upload' });
                            } catch (err) { toast.error("Erro no upload."); }
                        }} />
                    </div>
                    <div className="mt-6 border-t border-white/10 pt-6">
                        <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4 flex items-center gap-2">
                            ✨ Sugestões de Venda (Upselling)
                        </label>
                        <p className="text-[10px] text-gray-500 mb-4 font-medium uppercase tracking-tight">Escolha itens que serão sugeridos quando o cliente adicionar este prato ao carrinho.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {categories.flatMap(c => c.items || [])
                                .filter(i => i.id !== editingItem.id) // Don't suggest self
                                .map(item => (
                                    <button
                                        key={`upsell-${item.id}`}
                                        onClick={() => {
                                            const current = editingItem.upsell_ids || [];
                                            const newVal = current.includes(item.id) 
                                                ? current.filter(id => id !== item.id)
                                                : [...current, item.id];
                                            setEditingItem({ ...editingItem, upsell_ids: newVal });
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                            (editingItem.upsell_ids || []).includes(item.id)
                                                ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                            <img src={item.img_url || 'https://via.placeholder.com/50'} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold truncate">{item.name}</p>
                                            <p className="text-[9px] opacity-60">{item.price}</p>
                                        </div>
                                        {(editingItem.upsell_ids || []).includes(item.id) && <span className="text-[#D4AF37]">✓</span>}
                                    </button>
                                ))
                            }
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white" onClick={() => setEditingItem(null)}>Cancelar</button>
                        <button className="flex-1 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold" onClick={() => handleSave(editingItem)} disabled={isSaving}>Salvar</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="menu-manager h-full relative flex flex-col lg:flex-row gap-8 items-start animate-fade-in">
            {/* Mobile Bottom Navigation Helper */}
            <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-[100] sm:hidden flex flex-col gap-3 bg-black/40 backdrop-blur-3xl p-3 rounded-[2rem] border border-white/10 shadow-2xl max-h-[70vh] overflow-y-auto scrollbar-hide py-6">
                {categories.map((cat, idx) => (
                    <button key={`nav-${cat.id}`} onClick={() => document.getElementById(`cat-section-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' })} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 text-[10px] font-black text-white hover:bg-primary hover:text-black transition-all">
                        {cat.label?.charAt(0) || cat.name?.charAt(0) || idx + 1}
                    </button>
                ))}
            </aside>

            {/* Desktop Side Index */}
            <aside className="hidden lg:flex flex-col gap-2 sticky top-8 w-64 flex-shrink-0 bg-[#111111]/60 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide shadow-2xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2 mb-4">Estrutura do Menu</p>
                {categories.map((cat) => (
                    <button key={`side-${cat.id}`} onClick={() => document.getElementById(`cat-section-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' })} className="w-full text-left px-4 py-4 rounded-2xl hover:bg-primary/10 text-gray-500 hover:text-primary text-xs font-black transition-all truncate border border-transparent hover:border-primary/20">
                        {cat.label || cat.name}
                    </button>
                ))}
            </aside>

            <div className="flex-1 w-full flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Editor de Menu</h2>
                        <p className="text-gray-400 text-sm">Gerencie seus pratos e categorias.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:min-w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input type="text" placeholder="Procurar..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" />
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleResetStock}
                                className="px-6 py-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all flex-1 sm:flex-none justify-center font-black uppercase tracking-widest text-[10px]"
                                title="Repor Stock em Massa"
                            >
                                <RotateCcw size={16} />
                                <span className="hidden sm:inline">Repor Stock</span>
                            </button>
                            <button onClick={() => setShowCategoryManager(true)} className="px-6 py-3 bg-white/5 text-white rounded-2xl border border-white/10 flex-1 sm:flex-none justify-center font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Categorias</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-12">
                                {categories.map(cat => {
                                    const filteredItems = adminSearch ? cat.items?.filter(i => i.name.toLowerCase().includes(adminSearch.toLowerCase())) : cat.items;
                                    if (adminSearch && (!filteredItems || filteredItems.length === 0)) return null;

                                    return (
                                        <SortableItem key={cat.id} id={cat.id} useHandle={true}>
                                            {(context) => (
                                                <div className="scroll-mt-24" id={`cat-section-${cat.id}`}>
                                                    <div className="flex items-center gap-3 mb-6 pl-2 bg-white/5 py-2 px-4 rounded-xl border border-white/5 w-max">
                                                        <div {...context.attributes} {...context.listeners} className="cursor-grab text-gray-500">⋮⋮</div>
                                                        <h3 className="text-xl font-serif font-bold text-white">{cat.label || cat.name}</h3>
                                                    </div>

                                                    <SortableContext items={filteredItems?.map(i => i.id) || []} strategy={rectSortingStrategy}>
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                                                            {filteredItems?.map(item => (
                                                                <SortableItem key={item.id} id={item.id} useHandle={true}>
                                                                    {(context) => (
                                                                        <div className="group relative bg-[#111111]/80 backdrop-blur-3xl rounded-[2rem] border border-white/5 hover:border-primary/50 p-5 flex items-center gap-5 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                                                                            <div {...context.attributes} {...context.listeners} className="cursor-move text-gray-700 hover:text-primary transition-colors"><GripVertical size={20} /></div>
                                                                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                                                                <img src={item.img_url || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                                                {!item.available && (
                                                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Off-line</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex justify-between items-start">
                                                                                    <h4 className="font-bold text-white truncate">{item.name}</h4>
                                                                                    <button onClick={() => setEditingItem({ ...item })} className="text-gray-400 hover:text-[#D4AF37]">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                                                                    </button>
                                                                                </div>
                                                                                <div className="flex justify-between items-center">
                                                                                    <p className="text-[#D4AF37] font-bold">{item.price}</p>
                                                                                    {item.track_stock && (
                                                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${item.stock_quantity <= 5 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                                                                            {item.stock_quantity} UN
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex justify-between items-center mt-2">
                                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                                        <input type="checkbox" className="sr-only peer" checked={item.available !== false} onChange={async () => {
                                                                                            const newVal = !(item.available !== false);
                                                                                            setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, available: newVal } : i) } : c));
                                                                                            await supabase.from('menu_items').update({ available: newVal }).eq('id', item.id);
                                                                                        }} />
                                                                                        <div className="w-8 h-4 bg-gray-700 rounded-full peer-checked:bg-green-500"></div>
                                                                                        <span className="text-[10px] text-gray-400">{item.available !== false ? 'SIM' : 'NÃO'}</span>
                                                                                    </label>
                                                                                    <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-500"><X size={14} /></button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </SortableItem>
                                                            ))}
                                                            <button 
                                                                onClick={() => setEditingItem({ ...DEFAULT_ITEM, category_id: cat.id })} 
                                                                className="group relative border-2 border-dashed border-white/5 rounded-[2rem] p-8 flex flex-col items-center justify-center text-gray-600 hover:border-primary/40 hover:text-primary transition-all duration-500 overflow-hidden"
                                                            >
                                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                                <span className="text-4xl font-light transition-transform duration-500 group-hover:scale-125">+</span>
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-3">Novo Prato</span>
                                                            </button>
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

            <button onClick={() => setEditingItem({ ...DEFAULT_ITEM })} className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#D4AF37] text-black shadow-lg flex items-center justify-center text-2xl z-[100]">+</button>

            {showCategoryManager && <CategoryManager categories={categories} restaurantId={restaurantId} onUpdate={onUpdate} onClose={() => setShowCategoryManager(false)} />}
        </div>
    );
};

export default MenuManager;

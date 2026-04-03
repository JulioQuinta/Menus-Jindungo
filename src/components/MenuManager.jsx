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
import { Search, X, GripVertical } from 'lucide-react';

const MenuManager = ({ categories: initialCategories = [], restaurantId, onUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [adminSearch, setAdminSearch] = useState('');

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
        available: true
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
                translations: {
                    ...(item.translations || {}),
                    variants: item.variants,
                    pt: { 
                        ...(item.translations?.pt || {}),
                        name: item.name,
                        desc: item.desc_text,
                        composition: item.composition
                    }
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
                    <div>
                        <label className={labelClasses}>Nome do Prato</label>
                        <input className={inputClasses} value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Ex: Bitoque de Frango" />
                    </div>
                    <div>
                        <label className={labelClasses}>PreÃ§o</label>
                        <input className={inputClasses} value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: e.target.value })} placeholder="Ex: 12.000 Kz" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2 mt-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider m-0">DescriÃ§Ã£o</label>
                            <button
                                onClick={() => {
                                    if (!editingItem.name) return toast.error("Digite o nome do prato primeiro!");
                                    const templates = [`O delicioso ${editingItem.name} Ã© preparado com ingredientes frescos...`, `Experimente nosso ${editingItem.name}...` ];
                                    setEditingItem({ ...editingItem, desc_text: templates[Math.floor(Math.random() * templates.length)] });
                                }}
                                className="text-xs bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black px-3 py-1.5 rounded-full font-bold"
                            >âœ¨ DescriÃ§Ã£o MÃ¡gica</button>
                        </div>
                        <textarea className={`${inputClasses} min-h-[100px]`} rows={3} value={editingItem.desc_text || ''} onChange={e => setEditingItem({ ...editingItem, desc_text: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClasses}>Categoria Base</label>
                        <select className={inputClasses} value={editingItem.category_id} onChange={e => setEditingItem({ ...editingItem, category_id: e.target.value })}>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label || cat.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClasses}>ComposiÃ§Ã£o / Acompanhamentos</label>
                        <textarea className={`${inputClasses} min-h-[60px]`} rows={2} value={editingItem.composition || ''} onChange={e => setEditingItem({ ...editingItem, composition: e.target.value })} placeholder="Ex: Inclui Arroz, FeijÃ£o..." />
                    </div>
                    <div>
                        <label className={labelClasses}>Fotografia</label>
                        <input type="file" accept="image/*" onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            try {
                                toast.loading("Otimizando...", { id: 'upload' });
                                let uploadFile = file;
                                if (file.type.startsWith('image/') && file.size > 200 * 1024) uploadFile = await compressImage(file);
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
                    <div className="mt-8 flex gap-4">
                        <button className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white" onClick={() => setEditingItem(null)}>Cancelar</button>
                        <button className="flex-1 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold" onClick={() => handleSave(editingItem)} disabled={isSaving}>Salvar</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="menu-manager h-full relative flex flex-col lg:flex-row gap-8 items-start">
            <aside className="fixed left-2 top-1/2 -translate-y-1/2 z-[100] sm:hidden flex flex-col gap-3 bg-black/60 backdrop-blur-xl p-2.5 rounded-full border border-white/10 shadow-2xl max-h-[70vh] overflow-y-auto scrollbar-hide py-4">
                {categories.map((cat, idx) => (
                    <button key={`nav-${cat.id}`} onClick={() => document.getElementById(`cat-section-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' })} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/5 text-[10px] font-black text-white">
                        {cat.label?.charAt(0) || cat.name?.charAt(0) || idx + 1}
                    </button>
                ))}
            </aside>

            <aside className="hidden lg:flex flex-col gap-2 sticky top-8 w-56 flex-shrink-0 bg-black/20 p-4 rounded-3xl border border-white/5 h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Ãndice</p>
                {categories.map((cat) => (
                    <button key={`side-${cat.id}`} onClick={() => document.getElementById(`cat-section-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' })} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-primary text-xs font-bold transition-all truncate">
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
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input type="text" placeholder="Procurar..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" />
                        </div>
                        <button onClick={() => setShowCategoryManager(true)} className="px-4 py-3 bg-white/5 text-white rounded-xl border border-white/10">Categorias</button>
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
                                                        <div {...context.attributes} {...context.listeners} className="cursor-grab text-gray-500">â‹®â‹®</div>
                                                        <h3 className="text-xl font-serif font-bold text-white">{cat.label || cat.name}</h3>
                                                    </div>

                                                    <SortableContext items={filteredItems?.map(i => i.id) || []} strategy={rectSortingStrategy}>
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                                                            {filteredItems?.map(item => (
                                                                <SortableItem key={item.id} id={item.id} useHandle={true}>
                                                                    {(context) => (
                                                                        <div className="group relative bg-[#1A1A1A]/80 rounded-xl border border-white/5 hover:border-[#D4AF37]/50 p-4 flex items-center gap-4">
                                                                            <div {...context.attributes} {...context.listeners} className="cursor-move text-gray-600"><GripVertical size={20} /></div>
                                                                            <img src={item.img_url || 'https://via.placeholder.com/150'} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex justify-between items-start">
                                                                                    <h4 className="font-bold text-white truncate">{item.name}</h4>
                                                                                    <button onClick={() => setEditingItem({ ...item })} className="text-gray-400 hover:text-[#D4AF37]">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                                                                    </button>
                                                                                </div>
                                                                                <p className="text-[#D4AF37] font-bold">{item.price}</p>
                                                                                <div className="flex justify-between items-center mt-2">
                                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                                        <input type="checkbox" className="sr-only peer" checked={item.available !== false} onChange={async () => {
                                                                                            const newVal = !(item.available !== false);
                                                                                            setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, items: c.items.map(i => i.id === item.id ? { ...i, available: newVal } : i) } : c));
                                                                                            await supabase.from('menu_items').update({ available: newVal }).eq('id', item.id);
                                                                                        }} />
                                                                                        <div className="w-8 h-4 bg-gray-700 rounded-full peer-checked:bg-green-500"></div>
                                                                                        <span className="text-[10px] text-gray-400">{item.available !== false ? 'SIM' : 'NÃƒO'}</span>
                                                                                    </label>
                                                                                    <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-500"><X size={14} /></button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </SortableItem>
                                                            ))}
                                                            <button onClick={() => setEditingItem({ ...DEFAULT_ITEM, category_id: cat.id })} className="border border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all">
                                                                <span className="text-2xl">+</span>
                                                                <span className="text-xs font-bold uppercase mt-2">Novo Prato</span>
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

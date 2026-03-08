import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import CategoryManager from './CategoryManager';
import { SortableItem } from './SortableItem';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const MenuManager = ({ categories: initialCategories = [], restaurantId, onUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    // Sensors for DND
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        // Ensure sorting by sorting categories by position
        const sorted = [...initialCategories].sort((a, b) => (a.position || 0) - (b.position || 0));

        // Also sort items within categories
        const sortedCats = sorted.map(cat => ({
            ...cat,
            items: (cat.items || []).sort((a, b) => (a.position || 0) - (b.position || 0))
        }));

        setCategories(sortedCats);
    }, [initialCategories]);

    // Handle Drag End for Categories
    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Persist new order
                Promise.all(newItems.map((cat, index) =>
                    supabase.from('categories').update({ position: index }).eq('id', cat.id)
                )).then(() => {
                    console.log('Order updated');
                    if (onUpdate) onUpdate(); // Optional: Refresh from server 
                });

                return newItems;
            });
        }
    };

    // Initial State for New Item
    const DEFAULT_ITEM = {
        name: '',
        price: '',
        desc_text: '',
        category_id: categories[0]?.id || '',
        restaurant_id: restaurantId,
        subcategory: '', // [NEW]
        available: true
    };

    const handleSave = async (item) => {
        setIsSaving(true);
        try {
            const isNew = !item.id;

            if (!item.name || !item.price || !item.category_id) {
                alert("Nome, Preço e Categoria são obrigatórios.");
                setIsSaving(false);
                return;
            }

            const payload = {
                restaurant_id: restaurantId,
                category_id: item.category_id,
                name: item.name,
                price: item.price,
                desc_text: item.desc_text,
                subcategory: item.subcategory, // [NEW]
                available: item.available,
                img_url: item.img_url, // [FIX] Include image URL in save payload
                translations: {
                    ...(item.translations || {}),
                    variants: item.variants
                }
            };

            // If new, assign last position
            if (isNew) {
                // Find max position in this category
                // This is a rough check, ideally backend handles auto-increment or we query max
                payload.position = 999;
            }

            let error;
            if (isNew) {
                const { error: insertError } = await supabase
                    .from('menu_items')
                    .insert([payload]);
                error = insertError;
            } else {
                const { error: updateError } = await supabase
                    .from('menu_items')
                    .update(payload)
                    .eq('id', item.id);
                error = updateError;
            }

            if (error) throw error;

            setEditingItem(null);
            if (onUpdate) onUpdate();
            alert(isNew ? "Prato criado!" : "Prato atualizado!");

        } catch (err) {
            console.error("Error saving item:", err);
            alert("Erro ao salvar item.");
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
            alert("Erro ao apagar.");
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
                    <button onClick={() => setEditingItem(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white border border-white/5">
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    <div>
                        <label className={labelClasses}>Nome do Prato</label>
                        <input
                            className={inputClasses}
                            value={editingItem.name}
                            onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                            placeholder="Ex: Bitoque de Frango"
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Preço</label>
                        <input
                            className={inputClasses}
                            value={editingItem.price}
                            onChange={e => setEditingItem({ ...editingItem, price: e.target.value })}
                            placeholder="Ex: 12.000 Kz"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2 mt-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider m-0">Descrição</label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!editingItem.name) return alert("Digite o nome do prato primeiro!");
                                    const templates = [
                                        `O delicioso ${editingItem.name} é preparado com ingredientes frescos e selecionados, trazendo uma explosão de sabor a cada mordida.`,
                                        `Experimente nosso ${editingItem.name}, feito artesanalmente para proporcionar uma experiência gastronômica única.`,
                                        `${editingItem.name} suculento e irresistível. Uma escolha perfeita para quem aprecia qualidade e bom gosto.`,
                                        `Nossa versão especial de ${editingItem.name} vai te surpreender. Sabor autêntico e inesquecível.`
                                    ];
                                    const randomDesc = templates[Math.floor(Math.random() * templates.length)];
                                    setEditingItem({ ...editingItem, desc_text: randomDesc });
                                }}
                                className="text-xs bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:opacity-90 transition-opacity font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                            >
                                ✨ Descrição Mágica
                            </button>
                        </div>
                        <textarea
                            className={`${inputClasses} min-h-[100px] resize-y`}
                            rows={3}
                            value={editingItem.desc_text || ''}
                            onChange={e => setEditingItem({ ...editingItem, desc_text: e.target.value })}
                            placeholder="Descreva seu prato com detalhes apetitosos..."
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Categoria Base</label>
                        <div className="relative">
                            <select
                                className={`${inputClasses} appearance-none cursor-pointer`}
                                value={editingItem.category_id}
                                onChange={e => setEditingItem({ ...editingItem, category_id: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label || cat.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* [NEW] Subcategory Input (Dynamic) */}
                    <div>
                        <label className={labelClasses}>
                            Sub-categoria / Aba Interna
                            <span className="text-gray-400 font-normal ml-2 normal-case tracking-normal">(Opcional)</span>
                        </label>
                        <input
                            className={inputClasses}
                            value={editingItem.subcategory || ''}
                            onChange={e => setEditingItem({ ...editingItem, subcategory: e.target.value })}
                            placeholder="Criar ou escolher sub-categoria..."
                            list="subcategory-suggestions"
                        />
                        <datalist id="subcategory-suggestions">
                            {categories.find(c => c.id === editingItem.category_id)?.subcategories?.map(sub => (
                                <option key={sub} value={sub} />
                            ))}
                            {/* Fallbacks if empty */}
                            {!categories.find(c => c.id === editingItem.category_id)?.subcategories?.length && (
                                <>
                                    <option value="Recomendados" />
                                    <option value="Especialidades" />
                                </>
                            )}
                        </datalist>
                        {/* Chips for quick selection */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {categories.find(c => c.id === editingItem.category_id)?.subcategories?.map(sub => (
                                <button
                                    key={sub}
                                    type="button"
                                    onClick={() => setEditingItem({ ...editingItem, subcategory: sub })}
                                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${editingItem.subcategory === sub ? 'bg-primary text-black border-primary' : 'bg-gray-200 text-gray-600 border-transparent hover:bg-gray-300'}`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* [NEW] Variants / Options Input */}
                    <div>
                        <label className={labelClasses}>
                            Variantes / Opções
                            <span className="text-gray-400 font-normal ml-2 normal-case tracking-normal">(Ex: Manga, Morango, Misto)</span>
                        </label>
                        <input
                            className={inputClasses}
                            value={Array.isArray(editingItem.variants) ? editingItem.variants.join(', ') : (editingItem.variants || '')}
                            onChange={e => {
                                // Save as array
                                const val = e.target.value;
                                const arr = val.split(',').map(s => s.trim()).filter(Boolean);
                                setEditingItem({ ...editingItem, variants: arr.length > 0 ? arr : null });
                            }}
                            placeholder="Separe as opções por vírgulas..."
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                            Se preencher isto, o cliente terá de escolher uma destas opções antes de adicionar ao carrinho.
                        </p>
                    </div>

                    <div>
                        <label className={labelClasses}>Fotografia do Prato</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                try {
                                    // Sanitize filename
                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `items/${restaurantId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                                    // Debug Alert
                                    // alert("Iniciando upload para: " + fileName);

                                    const { data, error } = await supabase.storage.from('menus').upload(fileName, file, {
                                        cacheControl: '3600',
                                        upsert: false
                                    });

                                    if (error) {
                                        console.error("Upload Error:", error);
                                        throw error;
                                    }

                                    // Get Public URL
                                    const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);

                                    // Verify URL (simple check)
                                    if (!publicUrl) throw new Error("Falha ao gerar URL pública");

                                    setEditingItem({ ...editingItem, img_url: publicUrl });
                                    alert("Foto enviada com sucesso! Não esqueça de SALVAR o prato abaixo.");

                                } catch (err) {
                                    alert("Erro no upload: " + (err.message || JSON.stringify(err)));
                                    console.error(err);
                                }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer"
                        />
                        {editingItem.img_url && (
                            <div className="mt-4 relative group w-32 h-32 rounded-2xl overflow-hidden shadow-sm">
                                <img src={editingItem.img_url} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row gap-4">
                        <button
                            className="px-6 py-3 rounded-xl font-bold transition-all w-full sm:w-auto bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                            onClick={() => setEditingItem(null)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="px-6 py-3 rounded-xl font-bold transition-all w-full sm:w-auto bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:-translate-y-0.5"
                            onClick={() => handleSave(editingItem)}
                            disabled={isSaving}
                        >
                            {isSaving ? 'A Salvar...' : (editingItem.id ? 'Atualizar Prato' : 'Adicionar Prato')}
                        </button>
                    </div>
                </div>
            </div >
        );
    }

    return (
        <div className="menu-manager h-full relative flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">Editor de Menu</h2>
                    <p className="text-gray-400">Gerencie seus pratos e categorias com facilidade.</p>
                </div>
                <button
                    onClick={() => setShowCategoryManager(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all backdrop-blur-sm"
                >
                    <SortableContext items={[]} strategy={verticalListSortingStrategy}>
                        {/* Icon placeholder if needed */}
                    </SortableContext>
                    <span>Gerenciar Categorias</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={categories.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-8">
                            {categories.map(cat => (
                                <SortableItem key={cat.id} id={cat.id}>
                                    <div className="mb-6">
                                        {/* Category Header */}
                                        <div className="flex items-center gap-3 mb-4 pl-2 group cursor-grab active:cursor-grabbing bg-white/5 py-2 px-4 rounded-xl border border-white/5 backdrop-blur-sm w-max">
                                            <div className="p-1 rounded bg-white/5 text-gray-500 group-hover:text-[#D4AF37] transition-colors">
                                                <span className="text-xl leading-none">⋮⋮</span>
                                            </div>
                                            <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                                                {cat.label || cat.name}
                                                <span className="ml-3 text-xs font-bold text-[#D4AF37] bg-yellow-900/20 px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
                                                    {cat.items?.length || 0} itens
                                                </span>
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                                            {cat.items && cat.items.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="group relative bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 hover:border-[#D4AF37]/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)] overflow-hidden"
                                                >
                                                    <div className="flex h-full">
                                                        {/* Image Section */}
                                                        <div className="w-1/3 min-h-[120px] relative overflow-hidden">
                                                            <img
                                                                src={item.img_url || 'https://via.placeholder.com/150'}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                        </div>

                                                        {/* Content Section */}
                                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                                            <div>
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <h4 className="font-bold text-white text-lg leading-tight pr-2 line-clamp-2">{item.name}</h4>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingItem({
                                                                                ...item,
                                                                                variants: item.translations?.variants || item.variants || null
                                                                            });
                                                                        }}
                                                                        className="text-gray-400 hover:text-[#D4AF37] bg-white/5 hover:bg-white/10 rounded-lg p-1.5 transition-all outline outline-1 outline-white/10 border-none shadow-sm"
                                                                        title="Editar Produto"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                                                    </button>
                                                                </div>
                                                                <p className="text-[#D4AF37] font-bold text-base mb-2">{item.price}</p>
                                                                <p className="text-gray-500 text-xs line-clamp-2">{item.desc_text || "Sem descrição..."}</p>
                                                            </div>

                                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                                                <label className="flex items-center gap-2 cursor-pointer relative">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only peer"
                                                                        checked={item.available !== false} // Default true
                                                                        onChange={async () => {
                                                                            // Optimistic toggle
                                                                            const newVal = !(item.available !== false);
                                                                            const newItems = categories.map(c => {
                                                                                if (c.id !== cat.id) return c;
                                                                                return {
                                                                                    ...c,
                                                                                    items: c.items.map(i => i.id === item.id ? { ...i, available: newVal } : i)
                                                                                };
                                                                            });
                                                                            setCategories(newItems);

                                                                            await supabase.from('menu_items').update({ available: newVal }).eq('id', item.id);
                                                                        }}
                                                                    />
                                                                    <div className="w-10 h-6 bg-gray-700/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:shadow-[0_0_5px_rgba(0,0,0,0.5)] after:transition-all peer-checked:bg-green-500"></div>
                                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${item.available !== false ? 'text-green-400' : 'text-gray-500'}`}>{item.available !== false ? 'Disponível' : 'Esgotado'}</span>
                                                                </label>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                                                                    className="text-gray-500 hover:text-red-500 bg-white/5 hover:bg-white/10 rounded-lg p-1.5 transition-all outline outline-1 outline-white/10 border-none shadow-sm"
                                                                    title="Apagar Prato"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add Item Card Placeholder */}
                                            <button
                                                onClick={() => setEditingItem({ ...DEFAULT_ITEM, category_id: cat.id })}
                                                className="flex flex-col items-center justify-center min-h-[140px] rounded-2xl border-2 border-dashed border-white/20 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all group shadow-sm bg-black/20"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-gray-400 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors mb-2 shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                                    <span className="text-2xl font-light leading-none">+</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-500 group-hover:text-[#D4AF37] uppercase tracking-wider">Novo Prato</span>
                                            </button>
                                        </div>
                                    </div>
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {categories.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-80 text-center bg-black/20 rounded-3xl border border-white/5 mx-auto max-w-2xl mt-10 shadow-2xl backdrop-blur-md">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/10">
                            <span className="text-5xl drop-shadow-lg">🍽️</span>
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-white mb-2">O seu Menu está Vazio</h3>
                        <p className="text-gray-400 mb-8 max-w-md">Para começar a vender, crie primeiro as suas categorias estruturando assim a sua ementa de forma premium.</p>
                        <button
                            onClick={() => setShowCategoryManager(true)}
                            className="bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black font-bold py-3.5 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] hover:-translate-y-1 hover:scale-105 active:scale-95"
                        >
                            + Criar a 1ª Categoria
                        </button>
                    </div>
                )}
            </div>

            {/* MAGIC FLOATING BUTTON */}
            <button
                onClick={() => setEditingItem({ ...DEFAULT_ITEM })}
                className="absolute bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-yellow-600 text-black shadow-[0_4px_30px_rgba(212,175,55,0.5)] hover:scale-110 hover:shadow-[0_10px_40px_rgba(212,175,55,0.7)] hover:-rotate-90 transition-all duration-300 flex items-center justify-center z-50 group border border-yellow-200/50"
            >
                <span className="text-4xl leading-none font-light group-hover:font-bold">+</span>
            </button>

            {showCategoryManager && (
                <CategoryManager
                    categories={categories}
                    restaurantId={restaurantId}
                    onUpdate={onUpdate}
                    onClose={() => setShowCategoryManager(false)}
                />
            )}
        </div>
    );
};

export default MenuManager;

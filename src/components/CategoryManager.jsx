import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const inputClasses = "w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white outline-none transition-all text-gray-900 font-medium";
const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4 first:mt-0";

const CategoryManager = ({ categories, restaurantId, onUpdate, onClose, isInline = false }) => {
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    // [NEW] Subcategories State
    const [editSubcats, setEditSubcats] = useState([]);
    const [newSubcat, setNewSubcat] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async () => {
        console.log("Adding Category - Restaurant ID:", restaurantId, "Label:", newCategory);
        if (!newCategory.trim()) return;

        if (!restaurantId) {
            toast.error("Erro: Restaurante não identificado. Recarregue a página.");
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([{
                    restaurant_id: restaurantId,
                    label: newCategory,
                    sort_order: categories.length,
                    subcategories: [] // Default empty
                }])
                .select(); // Select to return data and confirm insertion

            if (error) throw error;
            console.log("Category added:", data);
            setNewCategory('');
            onUpdate();
            toast.success("Categoria adicionada!");
        } catch (err) {
            console.error("Error adding category:", err);
            toast.error("Erro ao adicionar categoria.");
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.label || cat.name);
        setEditSubcats(cat.subcategories || []);
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('categories')
                .update({
                    label: editName,
                    subcategories: editSubcats
                })
                .eq('id', id);

            if (error) throw error;
            setEditingId(null);
            onUpdate();
            toast.success("Categoria atualizada!");
        } catch (err) {
            console.error("Error updating category:", err);
            toast.error("Erro ao atualizar categoria.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id, itemCount) => {
        if (itemCount > 0) {
            if (!window.confirm(`⚠️ ATENÇÃO: Ação irreversível!\n\nEsta categoria contém ${itemCount} pratos.\nApagar a categoria também excluirá TODOS os pratos nela contidos.\n\nDeseja realmente continuar?`)) return;
        } else {
            if (!window.confirm("⚠️ Tem certeza que deseja apagar esta categoria de forma permanente?")) return;
        }

        setIsLoading(true);
        try {
            // 1. Delete items first (Cascade)
            if (itemCount > 0) {
                const { error: itemsError } = await supabase
                    .from('menu_items')
                    .delete()
                    .eq('category_id', id);
                if (itemsError) throw itemsError;
            }

            // 2. Delete Category
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            onUpdate();
            toast.success("Categoria removida.");
        } catch (err) {
            console.error("Error deleting category:", err);
            toast.error("Erro ao apagar categoria.");
        } finally {
            setIsLoading(false);
        }
    };

    // Subcategory Helpers
    const addSubcat = () => {
        if (!newSubcat.trim()) return;
        if (editSubcats.includes(newSubcat.trim())) return;
        setEditSubcats([...editSubcats, newSubcat.trim()]);
        setNewSubcat('');
    };

    const removeSubcat = (sub) => {
        setEditSubcats(editSubcats.filter(s => s !== sub));
    };

    if (isInline) {
        return (
            <div className="space-y-6 text-white font-sans w-full">
                {/* List Categories */}
                <div className="custom-scrollbar space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {categories.map(cat => (
                        <div key={cat.id} className={`p-5 rounded-2xl border transition-all ${editingId === cat.id ? 'bg-[#D4AF37]/10 border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'bg-black/40 border-white/10 hover:border-white/20'}`}>
                            {editingId === cat.id ? (
                                <div className="space-y-4">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="w-full flex-1 px-4 py-3 bg-black/60 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white font-bold"
                                            placeholder="Nome da Categoria"
                                            autoFocus
                                        />
                                        <button onClick={() => handleUpdate(cat.id)} disabled={isLoading} className="bg-emerald-500 text-black px-4 py-3 rounded-xl font-bold hover:bg-emerald-400 transition shadow-sm flex items-center justify-center cursor-pointer">✓ Guardar</button>
                                        <button onClick={() => setEditingId(null)} className="bg-white/10 text-gray-300 px-4 py-3 rounded-xl font-bold hover:bg-white/20 transition shadow-sm flex items-center justify-center cursor-pointer">✕</button>
                                    </div>

                                    {/* Subcategories Editor */}
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3">
                                        <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Sub-categorias (Abas Internas)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {editSubcats.map(sub => (
                                                <span key={sub} className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                                                    {sub}
                                                    <button onClick={() => removeSubcat(sub)} className="hover:text-red-400 hover:scale-110 transition-transform cursor-pointer">✕</button>
                                                </span>
                                            ))}
                                            {editSubcats.length === 0 && <span className="text-xs text-gray-400 italic font-medium py-1">Nenhuma aba interna criada.</span>}
                                        </div>
                                        <div className="flex gap-2 items-stretch pt-2">
                                            <input
                                                value={newSubcat}
                                                onChange={e => setNewSubcat(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addSubcat()}
                                                placeholder="Adicionar sub. Ex: Sobremesas Frias"
                                                className="flex-1 text-sm px-4 py-2.5 bg-black/50 border border-white/10 focus:border-[#D4AF37] rounded-xl outline-none text-white transition-colors font-medium"
                                            />
                                            <button onClick={addSubcat} className="text-black font-bold text-xs uppercase tracking-wider bg-[#D4AF37] hover:bg-amber-400 px-5 py-2.5 rounded-xl transition-colors cursor-pointer">Adicionar</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-serif font-bold text-white text-base">{cat.label || cat.name}</span>
                                            <span className="text-xs bg-white/10 text-[#D4AF37] px-2.5 py-0.5 rounded-full font-mono font-bold">{cat.items?.length || 0} itens</span>
                                        </div>
                                        {cat.subcategories && cat.subcategories.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {cat.subcategories.map(s => (
                                                    <span key={s} className="text-[11px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md text-gray-300 font-medium">{s}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => startEditing(cat)} className="px-3 py-2 bg-white/10 hover:bg-[#D4AF37] hover:text-black rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer">
                                            <span>Editar</span>
                                        </button>
                                        <button onClick={() => handleDelete(cat.id, cat.items?.length || 0)} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                                            <span>Apagar</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add New Category Input */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                    <input
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        placeholder="Nome da Nova Categoria Principal..."
                        className="w-full flex-1 px-4 py-3.5 bg-black/60 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-white font-bold text-sm shadow-inner"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={isLoading || !newCategory.trim()}
                        className="bg-gradient-to-r from-[#F5C542] via-[#EAC775] to-[#D4AF37] text-gray-950 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:shadow-none whitespace-nowrap cursor-pointer"
                    >
                        Criar Categoria
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="category-manager-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 100,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'white', padding: '2rem', borderRadius: '16px',
                width: '500px', maxWidth: '90%', maxHeight: '85vh',
                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="text-xl font-bold text-gray-800">Gerir Categorias & Abas</h3>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors font-bold text-xl">✕</button>
                </div>

                {/* List Categories */}
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '300px', paddingRight: '5px' }}>
                    {categories.map(cat => (
                        <div key={cat.id} className={`p-4 rounded-xl border transition-all ${editingId === cat.id ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}>
                            {editingId === cat.id ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className={inputClasses}
                                            placeholder="Nome da Categoria"
                                            autoFocus
                                        />
                                        <button onClick={() => handleUpdate(cat.id)} disabled={isLoading} className="bg-success text-white p-3 rounded-xl hover:bg-success/90 transition shadow-sm w-12 h-12 flex items-center justify-center font-bold">✓</button>
                                        <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-600 p-3 rounded-xl hover:bg-gray-300 transition shadow-sm w-12 h-12 flex items-center justify-center font-bold">✕</button>
                                    </div>

                                    {/* Subcategories Editor */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mt-2">
                                        <label className={labelClasses}>Sub-categorias (Abas Internas)</label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {editSubcats.map(sub => (
                                                <span key={sub} className="bg-primary/10 text-primary font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                                                    {sub}
                                                    <button onClick={() => removeSubcat(sub)} className="hover:text-red-500 hover:scale-110 transition-transform">✕</button>
                                                </span>
                                            ))}
                                            {editSubcats.length === 0 && <span className="text-xs text-gray-400 italic font-medium py-1">Nenhuma aba interna criada.</span>}
                                        </div>
                                        <div className="flex gap-2 items-stretch">
                                            <input
                                                value={newSubcat}
                                                onChange={e => setNewSubcat(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addSubcat()}
                                                placeholder="Adicionar sub. Ex: Sobremesas Frias"
                                                className="flex-1 text-sm p-2 border-b-2 border-dashed border-gray-200 focus:border-primary outline-none text-gray-900 bg-transparent transition-colors font-medium pb-2"
                                            />
                                            <button onClick={addSubcat} className="text-primary text-sm font-bold bg-primary/5 hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors">Adicionar</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800">{cat.label || cat.name}</span>
                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{cat.items?.length || 0} itens</span>
                                        </div>
                                        {/* Show chips of subcategories */}
                                        {cat.subcategories && cat.subcategories.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {cat.subcategories.slice(0, 3).map(s => (
                                                    <span key={s} className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-600">{s}</span>
                                                ))}
                                                {cat.subcategories.length > 3 && <span className="text-[10px] text-gray-400">+{cat.subcategories.length - 3}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEditing(cat)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded transition"
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id, cat.items?.length || 0)}
                                            className="p-2 text-red-400 hover:bg-red-50 rounded transition disabled:opacity-30"
                                            title="Apagar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add New Category Input */}
                <div className="flex gap-3 border-t border-gray-100 pt-6 mt-2">
                    <input
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        placeholder="Nome da Categoria Principal..."
                        className={inputClasses}
                    />
                    <button
                        onClick={handleAdd}
                        disabled={isLoading || !newCategory.trim()}
                        className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-md disabled:opacity-50 disabled:shadow-none whitespace-nowrap"
                    >
                        Criar Categoria
                    </button>
                </div>

                {/* [NEW] Explicit Close Button */}
                <div className="flex justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="text-gray-500 text-sm hover:text-gray-800 underline"
                    >
                        Fechar e Voltar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;

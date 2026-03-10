import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, User, Trash2, Key, Users } from 'lucide-react';

const ClientManager = ({ restaurantId }) => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newStaff, setNewStaff] = useState({ name: '', role: 'Garçom', pin_code: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (restaurantId) {
            fetchStaff();
        }
    }, [restaurantId]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('staff_members')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error('Erro ao carregar staff:', error);
            alert("Erro ao carregar a equipa. Tente recarregar a página.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        if (!newStaff.name.trim() || !newStaff.pin_code.trim()) {
            alert("O Nome e o PIN são obrigatórios.");
            return;
        }

        if (newStaff.pin_code.length < 4) {
            alert("O PIN deve ter pelo menos 4 dígitos para segurança.");
            return;
        }

        try {
            setIsSaving(true);

            // Check if PIN already exists for this restaurant to prevent conflicts
            const { data: existingPin } = await supabase
                .from('staff_members')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('pin_code', newStaff.pin_code)
                .maybeSingle();

            if (existingPin) {
                alert("Este PIN já está a ser usado por outro Garçom no seu restaurante. Escolha outro.");
                setIsSaving(false);
                return;
            }

            const { data, error } = await supabase
                .from('staff_members')
                .insert([{
                    restaurant_id: restaurantId,
                    name: newStaff.name.trim(),
                    role: newStaff.role,
                    pin_code: newStaff.pin_code,
                    active: true
                }])
                .select()
                .single();

            if (error) throw error;

            setStaff([data, ...staff]);
            setShowAddModal(false);
            setNewStaff({ name: '', role: 'Garçom', pin_code: '' });
            alert("Membro da equipa adicionado com sucesso!");

        } catch (error) {
            console.error("Erro ao adicionar staff:", error);
            alert("Erro ao gravar. Verifique as permissões ou tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteStaff = async (id, name) => {
        if (!window.confirm(`Tem certeza que deseja remover ${name} da equipa? Eles perderão o acesso.`)) return;

        try {
            const { error } = await supabase
                .from('staff_members')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setStaff(staff.filter(s => s.id !== id));

        } catch (error) {
            console.error("Erro ao remover:", error);
            alert("Não foi possível remover. Tente novamente.");
        }
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in text-white">
            {/* Header Area */}
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                        <Users className="text-[#D4AF37]" size={28} />
                        A Sua Equipa (Staff)
                    </h2>
                    <p className="text-gray-400 mt-1">Gerencie os Garçons e o seu acesso ao sistema de pedidos.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Adicionar Membro
                </button>
            </div>

            {/* Search and List */}
            <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-200">Garçons & Gestores</h3>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mb-4"></div>
                        A carregar equipa...
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                            <User size={30} className="text-gray-500" />
                        </div>
                        <p className="text-lg font-medium text-white mb-1">Nenhum membro encontrado</p>
                        <p className="text-sm">Comece por adicionar o seu primeiro garçom.</p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="mt-4 text-[#D4AF37] hover:underline text-sm font-bold">
                                Limpar Busca
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold border-b border-white/5">Nome</th>
                                    <th className="px-6 py-4 font-bold border-b border-white/5">Função</th>
                                    <th className="px-6 py-4 font-bold border-b border-white/5">PIN de Acesso</th>
                                    <th className="px-6 py-4 font-bold border-b border-white/5 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredStaff.map((person) => (
                                    <tr key={person.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                                    {person.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-200">{person.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold px-3 py-1.5 rounded-full border border-[#D4AF37]/20">
                                                {person.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400 font-mono tracking-widest bg-black/40 px-3 py-1 rounded-lg border border-white/5 w-fit">
                                                <Key size={14} className="text-[#D4AF37]" />
                                                ****
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteStaff(person.id, person.name)}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Remover"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 w-full max-w-md border border-white/10 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold font-serif text-white">Novo Membro</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleAddStaff} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.name}
                                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    placeholder="Ex: Ana Silva"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">PIN Secreto (4 DÍGITOS)</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="password"
                                        required
                                        maxLength="6"
                                        value={newStaff.pin_code}
                                        onChange={e => setNewStaff({ ...newStaff, pin_code: e.target.value.replace(/\D/g, '') })}
                                        placeholder="1234"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white font-mono tracking-widest focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Este código será usado pelo garçom para entrar no telemóvel dele e ver as mesas.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 text-gray-400 font-bold hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:brightness-110 shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isSaving ? 'A Gravar...' : 'Gravar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManager;

import React, { useState, useEffect } from 'react';
import { staffService } from '../services/staffService';
import { Plus, Search, User, Trash2, Key, Users, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StaffManager = ({ restaurantId }) => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newStaff, setNewStaff] = useState({
        name: '',
        role: 'waiter',
        pin_code: '',
        email: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (restaurantId) {
            fetchStaff();
        }
    }, [restaurantId]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const data = await staffService.getStaff(restaurantId);
            setStaff(data || []);
        } catch (error) {
            console.error('Erro ao carregar staff:', error);
            toast.error("Erro ao carregar a equipa.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        if (!newStaff.name.trim() || !newStaff.pin_code.trim()) {
            toast.error("O Nome e o PIN são obrigatórios.");
            return;
        }

        if (newStaff.pin_code.length < 4) {
            toast.error("O PIN deve ter pelo menos 4 dígitos para segurança.");
            return;
        }

        try {
            setIsSaving(true);

            await staffService.addStaff({
                restaurant_id: restaurantId,
                name: newStaff.name.trim(),
                role: newStaff.role,
                pin_code: newStaff.pin_code,
                email: newStaff.email.trim() || null
            });

            toast.success("Membro da equipa adicionado com sucesso!");
            fetchStaff();
            setShowAddModal(false);
            setNewStaff({ name: '', role: 'waiter', pin_code: '', email: '' });

        } catch (error) {
            console.error("Erro ao adicionar staff:", error);
            toast.error("Erro ao gravar. Verifique se o PIN ou Email já estão em uso.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteStaff = async (id, name) => {
        if (!window.confirm(`Tem certeza que deseja remover ${name} da equipa? Eles perderão o acesso.`)) return;

        try {
            await staffService.deleteStaff(id);
            setStaff(staff.filter(s => s.id !== id));
            toast.success("Membro removido.");
        } catch (error) {
            console.error("Erro ao remover:", error);
            toast.error("Não foi possível remover.");
        }
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getRoleLabel = (role) => {
        const roles = {
            'admin': 'Administrador',
            'waiter': 'Garçom / Mesa',
            'kitchen': 'Cozinha / KDS',
            'reception': 'Receção / Reservas'
        };
        return roles[role] || role;
    };

    return (
        <div className="space-y-6 animate-fade-in text-white">
            {/* Header Area */}
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                        <Users className="text-[#D4AF37]" size={28} />
                        Gestão de Equipa (Staff)
                    </h2>
                    <p className="text-gray-400 mt-1">Delegue acessos e gerencie as permissões dos seus funcionários.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Adicionar Colaborador
                </button>
            </div>

            {/* Search and List */}
            <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-200">Colaboradores & Permissões</h3>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou role..."
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
                        <p className="text-lg font-medium text-white mb-1">Nenhum colaborador encontrado</p>
                        <p className="text-sm">Comece por adicionar o seu primeiro colaborador.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold border-b border-white/5">Nome / Email</th>
                                    <th className="px-6 py-4 font-bold border-b border-white/5">Função (Role)</th>
                                    <th className="px-6 py-4 font-bold border-b border-white/5">Acesso Rápido</th>
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
                                                <div>
                                                    <div className="font-bold text-gray-200">{person.name}</div>
                                                    {person.email && <div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} /> {person.email}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${person.role === 'admin' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                                                    person.role === 'kitchen' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                                                        person.role === 'reception' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                                                            'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                                                }`}>
                                                {getRoleLabel(person.role)}
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

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 w-full max-w-md border border-white/10 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6 text-white ">
                            <h3 className="text-xl font-bold font-serif ">Novo Colaborador</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleAddStaff} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome do Colaborador</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.name}
                                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    placeholder="Ex: João Silva"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email (Opcional - para Login Web)</label>
                                <input
                                    type="email"
                                    value={newStaff.email}
                                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                    placeholder="joao@exemplo.com"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-white">PIN (4 DÍGITOS)</label>
                                    <input
                                        type="password"
                                        required
                                        maxLength="6"
                                        value={newStaff.pin_code}
                                        onChange={e => setNewStaff({ ...newStaff, pin_code: e.target.value.replace(/\D/g, '') })}
                                        placeholder="1234"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono tracking-widest focus:border-[#D4AF37] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-white">Função</label>
                                    <select
                                        value={newStaff.role}
                                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                    >
                                        <option value="waiter">Garçom</option>
                                        <option value="kitchen">Cozinha</option>
                                        <option value="reception">Receção</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 text-white">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:brightness-110 shadow-lg disabled:opacity-50 transition-all font-serif"
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

export default StaffManager;

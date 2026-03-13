import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, User, Phone, ShoppingBag, TrendingUp, History, Download, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CustomerManager = ({ restaurantId }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (restaurantId) {
            fetchCustomers();
        }
    }, [restaurantId]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data: orders, error } = await supabase
                .from('orders')
                .select('customer_name, customer_phone, total, created_at')
                .eq('restaurant_id', restaurantId)
                .not('customer_phone', 'is', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by phone number (or name if no phone, but we focus on phone for CRM)
            const customerMap = {};

            orders.forEach(order => {
                const key = order.customer_phone || order.customer_name;
                if (!customerMap[key]) {
                    customerMap[key] = {
                        name: order.customer_name || 'Desconhecido',
                        phone: order.customer_phone || 'Sem Telefone',
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrder: order.created_at
                    };
                }

                customerMap[key].totalOrders += 1;
                customerMap[key].totalSpent += (order.total || 0);
            });

            const sortedCustomers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
            setCustomers(sortedCustomers);
        } catch (error) {
            console.error('Erro ao carregar CRM:', error);
            toast.error("Erro ao carregar base de clientes.");
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportCRM = () => {
        if (customers.length === 0) return toast.error("Sem clientes para exportar.");

        const headers = "Nome,Telefone,Total Pedidos,Total Gasto (Kz),Ultimo Pedido\n";
        const rows = customers.map(c =>
            `"${c.name}","${c.phone}",${c.totalOrders},${c.totalSpent},${new Date(c.lastOrder).toLocaleDateString()}`
        ).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `crm_clientes_jindungo.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openWhatsApp = (phone) => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 9) return toast.error("Número de telefone inválido.");
        // Add 244 prefix if not present (Angola)
        const finalPhone = cleanPhone.startsWith('244') ? cleanPhone : '244' + cleanPhone;
        window.open(`https://wa.me/${finalPhone}`, '_blank');
    };

    return (
        <div className="space-y-6 animate-fade-in text-white">
            {/* Header Area */}
            <div className="bg-gradient-to-br from-[#121212] to-black rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                        <TrendingUp className="text-[#D4AF37]" size={28} />
                        CRM & Base de Clientes
                        <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-[#D4AF37]/30">Corporate</span>
                    </h2>
                    <p className="text-gray-400 mt-1">Conheça quem mais compra e fidelize os seus melhores clientes.</p>
                </div>
                <button
                    onClick={handleExportCRM}
                    className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                >
                    <Download size={20} className="text-[#D4AF37]" />
                    Exportar Base (CSV)
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Clientes</p>
                        <p className="text-xl font-bold">{customers.length}</p>
                    </div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Ticket Médio</p>
                        <p className="text-xl font-bold">
                            {customers.length > 0
                                ? Math.round(customers.reduce((acc, c) => acc + c.totalSpent, 0) / customers.reduce((acc, c) => acc + c.totalOrders, 0)).toLocaleString()
                                : 0} Kz
                        </p>
                    </div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <History size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Taxa de Retorno</p>
                        <p className="text-xl font-bold">
                            {customers.length > 0
                                ? Math.round((customers.filter(c => c.totalOrders > 1).length / customers.length) * 100)
                                : 0}%
                        </p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-200">Base de Contactos</h3>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou telemóvel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">A carregar banco de dados...</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <p>Nenhum cliente com telemóvel identificado ainda.</p>
                        <p className="text-sm mt-2">A base será construída à medida que novos pedidos forem feitos.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold border-b border-white/5">Cliente</th>
                                    <th className="px-6 py-4 font-bold border-b border-white/5 text-center">Pedidos</th>
                                    <th className="px-6 py-4 font-bold border-b border-white/5 text-center">Total Gasto</th>
                                    <th className="px-6 py-4 font-bold border-b border-white/5">Última Visita</th>
                                    <th className="px-6 py-4 font-bold border-b border-white/5 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCustomers.map((c, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-[#D4AF37] font-bold">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-200">{c.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Phone size={10} /> {c.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-white/5 px-3 py-1 rounded-full text-sm font-bold border border-white/5">
                                                {c.totalOrders}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="font-bold text-[#D4AF37]">{c.totalSpent.toLocaleString()} Kz</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-400">{new Date(c.lastOrder).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openWhatsApp(c.phone)}
                                                className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all flex items-center gap-2 ml-auto"
                                                title="Re-conectar via WhatsApp"
                                            >
                                                <ExternalLink size={16} />
                                                <span className="text-xs font-bold">WhatsApp</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerManager;

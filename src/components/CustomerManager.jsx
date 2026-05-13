import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, User, Phone, ShoppingBag, TrendingUp, History, Download, ExternalLink, Ticket, Target, Send, X, Award, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CustomerManager = ({ restaurantId }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // [NEW] Campaign State
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [campaignData, setCampaignData] = useState({ couponCode: '', daysInactive: 30, discountText: '20%' });

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
                .select('customer_name, customer_phone, total, created_at, is_loyalty_redemption')
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
                        totalRedemptions: 0,
                        lastOrder: order.created_at
                    };
                }

                customerMap[key].totalOrders += 1;
                customerMap[key].totalSpent += (order.total || 0);
                if (order.is_loyalty_redemption) {
                    customerMap[key].totalRedemptions += 1;
                }
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

        const headers = "Nome,Telefone,Total Pedidos,Total Gasto (Kz),Premios Resgatados,Ultimo Pedido\n";
        const rows = customers.map(c =>
            `"${c.name}","${c.phone}",${c.totalOrders},${c.totalSpent},${c.totalRedemptions},"${new Date(c.lastOrder).toLocaleDateString()}"`
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

    const handleRunCampaign = () => {
        if (!campaignData.couponCode) return toast.error("Insira o código do Cupão Jindungo.");
        
        // Find inactive users
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(campaignData.daysInactive));
        
        const targets = customers.filter(c => new Date(c.lastOrder) < cutoffDate && c.phone && c.phone !== 'Sem Telefone');
        
        if (targets.length === 0) {
            return toast.error(`Nenhum cliente inativo há mais de ${campaignData.daysInactive} dias com telefone registado.`);
        }

        // Just copy the list of numbers/generate text so the owner can push via WhatsApp Broadcast (Listas de Transmissão)
        const textToCopy = `Temos Saudades Suas! 🌶️\nUtilize o nosso cupão ${campaignData.couponCode} para um desconto de ${campaignData.discountText} no seu próximo pedido connosco!\n\nAceda ao menu: https://jindungo.app/r/lojadefault`;
        const numbers = targets.map(t => {
            const clean = t.phone.replace(/\D/g, '');
            return clean.startsWith('244') ? clean : '244' + clean;
        }).join(', ');

        navigator.clipboard.writeText(`Lista de Números:\n${numbers}\n\nMensagem Base:\n${textToCopy}`);
        
        toast.success(`${targets.length} contactos e mensagem copiados para a sua área de transferência (Clipboard)! Pode colar na sua Lista de Transmissão do WhatsApp.`, { duration: 8000 });
        setShowCampaignModal(false);
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
                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button
                        onClick={() => setShowCampaignModal(true)}
                        className="bg-gradient-to-r from-red-600 to-orange-600 border border-red-500/50 text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all flex items-center gap-2 flex-1 md:flex-none justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                    >
                        <Target size={20} />
                        Nova Campanha
                    </button>
                    <button
                        onClick={handleExportCRM}
                        className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center flex-1 md:flex-none"
                        title="Exportar Base (CSV)"
                    >
                        <Download size={20} className="text-[#D4AF37]" />
                    </button>
                </div>
            </div>

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#121212] border border-[#D4AF37]/30 p-6 md:p-8 rounded-3xl max-w-md w-full relative shadow-2xl">
                        <button onClick={() => setShowCampaignModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-black mb-1 text-white flex items-center gap-2 mt-2">
                            <Target className="text-[#D4AF37]" /> Recuperação Ativa
                        </h3>
                        <p className="text-sm text-gray-400 mb-6 border-b border-white/10 pb-4">Crie uma lista de transmissão WhatsApp para clientes que já não nos visitam há algum tempo.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Dias Inativos (Filtro)</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                                    value={campaignData.daysInactive}
                                    onChange={(e) => setCampaignData({...campaignData, daysInactive: e.target.value})}
                                >
                                    <option value="15" className="bg-gray-800">Mais de 15 Dias</option>
                                    <option value="30" className="bg-gray-800">Mais de 30 Dias</option>
                                    <option value="60" className="bg-gray-800">Mais de 60 Dias</option>
                                    <option value="90" className="bg-gray-800">Mais de 90 Dias (Risco de Perda)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                                        <Ticket size={12}/> Cupão (Existente)
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: VOLTA10"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] uppercase font-mono"
                                        value={campaignData.couponCode}
                                        onChange={(e) => setCampaignData({...campaignData, couponCode: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Texto do Desconto</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: 10% / 1500 Kz"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                                        value={campaignData.discountText}
                                        onChange={(e) => setCampaignData({...campaignData, discountText: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6">
                            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest flex items-center gap-1 mb-1">
                                <Send size={12} /> Como Funciona
                            </p>
                            <p className="text-xs text-orange-200/80 leading-relaxed">
                                Ao clicar em Disparar, o sistema vai compilar na sua "área de transferência" (Copy/Paste) a lista de números alvo e o texto de marketing para que possa colar diretamente no WhatsApp.
                            </p>
                        </div>

                        <button
                            onClick={handleRunCampaign}
                            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA8B2C] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg"
                        >
                            <Send size={18} /> Disparar Campanha
                        </button>
                    </div>
                </div>
            )}

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

            {/* List Section */}
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
                    <div className="p-12 text-center text-gray-500 italic">A carregar base de dados Jindungo...</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <p>Nenhum cliente identificado ainda.</p>
                        <p className="text-sm mt-2">A base é construída automaticamente através dos pedidos.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="sm:hidden p-4 space-y-4">
                            {filteredCustomers.map((c, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-[#D4AF37] font-bold">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-100">{c.name}</div>
                                                <div className="text-[10px] text-gray-500 flex items-center gap-1 uppercase tracking-tighter">
                                                    <Calendar size={10} /> Último: {new Date(c.lastOrder).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openWhatsApp(c.phone)}
                                            className="p-2.5 bg-green-500/10 text-green-400 rounded-xl"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-black/20 rounded-xl p-2 text-center border border-white/5">
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">Pedidos</p>
                                            <p className="text-sm font-bold text-white">{c.totalOrders}</p>
                                        </div>
                                        <div className="bg-black/20 rounded-xl p-2 text-center border border-white/5">
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">Gasto</p>
                                            <p className="text-sm font-bold text-[#D4AF37]">{Math.round(c.totalSpent / 1000)}k</p>
                                        </div>
                                        <div className="bg-black/20 rounded-xl p-2 text-center border border-white/5">
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">Prémios</p>
                                            <p className="text-sm font-bold text-purple-400">{c.totalRedemptions}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4 font-bold border-b border-white/5">Cliente</th>
                                        <th className="px-6 py-4 font-bold border-b border-white/5 text-center">Pedidos</th>
                                        <th className="px-6 py-4 font-bold border-b border-white/5 text-center">Total Gasto</th>
                                        <th className="px-6 py-4 font-bold border-b border-white/5 text-center">Prêmios</th>
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
                                            <td className="px-6 py-4 text-center">
                                                {c.totalRedemptions > 0 ? (
                                                    <span className="flex items-center justify-center gap-1 bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded-lg text-xs font-bold border border-[#D4AF37]/30">
                                                        <Award size={12} /> {c.totalRedemptions}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-600 text-xs">-</span>
                                                )}
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
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomerManager;

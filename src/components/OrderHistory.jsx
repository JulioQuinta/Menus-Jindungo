import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock, ShoppingBag, User, MapPin, Phone } from 'lucide-react';

const OrderHistory = ({ restaurantId }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!restaurantId) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                setOrders(data || []);
            } catch (err) {
                console.error("Error fetching order history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();

        // Real-time subscription
        const channel = supabase
            .channel('order-history-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `restaurant_id=eq.${restaurantId}`
            }, fetchOrders)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [restaurantId]);

    if (loading) {
        return (
            <div className="space-y-4 p-8 bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-white/5 rounded-2xl w-full"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-white p-2">
                <div>
                    <h2 className="text-2xl font-serif font-bold">Histórico de Pedidos</h2>
                    <p className="text-gray-400 text-sm">Visualização de todos os pedidos recebidos via WhatsApp e Menu.</p>
                </div>
                <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20 uppercase tracking-widest">
                    Plano Start
                </div>
            </div>

            <div className="bg-black/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                {orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-gray-500 font-bold text-xs uppercase tracking-wider">
                                    <th className="py-5 px-6 font-medium">Data / ID</th>
                                    <th className="py-5 px-6 font-medium">Cliente</th>
                                    <th className="py-5 px-6 font-medium">Itens</th>
                                    <th className="py-5 px-6 font-medium">Total</th>
                                    <th className="py-5 px-6 font-medium text-center">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-all group">
                                        <td className="py-5 px-6">
                                            <div className="font-bold text-white font-mono flex items-center gap-1.5 leading-none mb-1 text-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                #{order.id.slice(0, 6)}
                                            </div>
                                            <div className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                                                <Clock size={10} />
                                                {new Date(order.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="font-bold text-gray-200 group-hover:text-white transition-colors flex items-center gap-2">
                                                <User size={14} className="text-gray-500" />
                                                {order.customer_name || 'Anónimo'}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                                <Phone size={12} />
                                                {order.customer_phone || (order.order_data?.customerPhone || 'N/A')}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col gap-0.5">
                                                {order.items?.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className="text-xs text-gray-400 font-medium">
                                                        <span className="text-blue-400 font-bold mr-1">{item.quantity}x</span> {item.name}
                                                    </div>
                                                ))}
                                                {order.items?.length > 2 && (
                                                    <div className="text-[10px] text-gray-600 font-bold italic">
                                                        + {order.items.length - 2} outros itens
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="text-base font-bold text-[#D4AF37] leading-none mb-1">
                                                {order.total?.toLocaleString('pt-AO')} <span className="text-[10px] text-[#D4AF37]/60">Kz</span>
                                            </div>
                                            {order.coupon_code && (
                                                <div className="text-[10px] text-green-500 font-bold mb-1">
                                                    Cupão: {order.coupon_code} (-{order.coupon_discount?.toLocaleString('pt-AO')} Kz)
                                                </div>
                                            )}
                                            <div className="text-[10px] text-gray-600 uppercase font-bold tracking-tight">
                                                {order.payment_method || 'Pagamento na entrega'}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col items-center">
                                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-widest flex items-center gap-1.5 ${order.order_type === 'delivery'
                                                    ? 'bg-purple-900/20 text-purple-400 border-purple-500/20'
                                                    : 'bg-green-900/20 text-green-400 border-green-500/20'
                                                    }`}>
                                                    {order.order_type === 'delivery' ? <><MapPin size={10} /> Entrega</> : 'No Local'}
                                                </span>
                                                {order.mesa_id && (
                                                    <span className="text-[10px] text-gray-500 mt-1 font-bold">Mesa {order.mesa_id}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                            <ShoppingBag size={40} className="text-gray-700" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-300">Ainda sem histórico</h3>
                        <p className="text-gray-500 max-w-sm mt-2">Os pedidos que os seus clientes fizerem via WhatsApp aparecerão aqui para sua consulta.</p>
                    </div>
                )}
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/10 p-6 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0">
                    <span className="text-2xl">💡</span>
                </div>
                <div>
                    <h4 className="font-bold text-yellow-200">Dica: Painel Interativo</h4>
                    <p className="text-xs text-yellow-500/70 leading-relaxed">O Plano Start funciona em modo read-only. Para poder gerir pedidos (mudar para "Em Preparo", "Pronto") e receber avisos sonoros na cozinha, faça o upgrade para o plano **Business**.</p>
                </div>
            </div>
        </div>
    );
};

export default OrderHistory;

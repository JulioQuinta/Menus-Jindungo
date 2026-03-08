import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { supabase } from '../lib/supabaseClient';
import { orderService } from '../services/orderService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Calendar, Users, TrendingUp, Eye, Banknote, ShoppingBag, Download, Clock, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass, trend }) => (
    <div className="bg-gradient-to-br from-black/80 to-[#141414] backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-wihite/20 transition-all duration-500">
        <div className={`absolute right-0 top-0 w-32 h-32 rounded-full blur-[50px] -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 opacity-20 ${colorClass.split(' ')[0]}`}></div>

        <div className="flex justify-between items-start z-10 relative">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{title}</p>
                <h3 className="text-4xl font-serif font-bold text-white leading-none drop-shadow-md">{value}</h3>
            </div>
            <div className={`p-3 rounded-2xl border ${colorClass} bg-opacity-10 border-opacity-20 shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                <Icon size={28} />
            </div>
        </div>

        {trend && (
            <div className="z-10 flex items-center gap-1 text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded w-max border border-green-500/20 mt-2">
                <span className="flex h-1.5 w-1.5 relative mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span></span>
                {trend}
            </div>
        )}
    </div>
);

const DashboardStats = ({ restaurantId }) => {
    const [stats, setStats] = useState({ weeklyData: [], viewsToday: 0 });
    const [totalItems, setTotalItems] = useState(0);
    const [totalCategories, setTotalCategories] = useState(0);
    const [loading, setLoading] = useState(true);

    const [salesFilter, setSalesFilter] = useState('today'); // 'today', 'month', 'trimester', 'semester', 'year', 'custom'
    const [customDate, setCustomDate] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
    const [salesStats, setSalesStats] = useState({ revenue: 0, ordersCount: 0, data: [], chartData: [] });
    const [salesLoading, setSalesLoading] = useState(false);

    // Recent Orders State
    const [recentOrders, setRecentOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Initial load for general stats
    useEffect(() => {
        const loadGeneralStats = async () => {
            if (!restaurantId) return;
            setLoading(true);
            try {
                const [analyticsData, { count: itemsCount }, { count: catsCount }] = await Promise.all([
                    analyticsService.getStats(restaurantId),
                    supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
                    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId)
                ]);

                setStats(analyticsData);
                setTotalItems(itemsCount || 0);
                setTotalCategories(catsCount || 0);
            } catch (err) {
                console.error("Error loading general stats", err);
            } finally {
                setLoading(false);
            }
        };
        loadGeneralStats();
    }, [restaurantId]);

    // Load recent active orders
    useEffect(() => {
        const loadRecentOrders = async () => {
            if (!restaurantId) return;
            setOrdersLoading(true);
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .in('status', ['pending', 'preparing'])
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (!error && data) {
                    setRecentOrders(data);
                }
            } catch (error) {
                console.error("Error loading recent orders", error);
            } finally {
                setOrdersLoading(false);
            }
        };

        loadRecentOrders();

        const channel = supabase
            .channel('dashboard-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
                () => {
                    loadRecentOrders(); // Refetch on any order change
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [restaurantId]);

    // Load sales based on filter
    useEffect(() => {
        const loadSales = async () => {
            if (!restaurantId) return;
            setSalesLoading(true);
            try {
                let start = new Date();
                let end = new Date();

                if (salesFilter === 'today') {
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                } else if (salesFilter === 'month') {
                    start = new Date(start.getFullYear(), start.getMonth(), 1);
                } else if (salesFilter === 'trimester') {
                    const month = start.getMonth();
                    const qStartMonth = Math.floor(month / 3) * 3;
                    start = new Date(start.getFullYear(), qStartMonth, 1);
                } else if (salesFilter === 'semester') {
                    const month = start.getMonth();
                    const sStartMonth = Math.floor(month / 6) * 6;
                    start = new Date(start.getFullYear(), sStartMonth, 1);
                } else if (salesFilter === 'year') {
                    start = new Date(start.getFullYear(), 0, 1);
                } else if (salesFilter === 'custom') {
                    if (customDate.start) {
                        start = new Date(customDate.start);
                        start.setHours(0, 0, 0, 0);
                    }
                    if (customDate.end) {
                        end = new Date(customDate.end);
                        end.setHours(23, 59, 59, 999);
                    }
                }

                const salesData = await orderService.getSalesByDateRange(restaurantId, start, end);

                if (salesData && salesData.data) {
                    const revenue = salesData.data.reduce((sum, order) => sum + (order.total || 0), 0);

                    // Build chart data
                    const grouped = {};
                    salesData.data.forEach(order => {
                        const dateStr = new Date(order.created_at).toLocaleDateString('pt-PT');
                        if (!grouped[dateStr]) grouped[dateStr] = 0;
                        grouped[dateStr] += (order.total || 0);
                    });

                    const chartData = Object.keys(grouped).map(date => ({
                        date,
                        valor: grouped[date]
                    })).sort((a, b) => {
                        const [d1, m1, y1] = a.date.split('/');
                        const [d2, m2, y2] = b.date.split('/');
                        return new Date(`${y1}-${m1}-${d1}`).getTime() - new Date(`${y2}-${m2}-${d2}`).getTime();
                    });

                    setSalesStats({
                        revenue,
                        ordersCount: salesData.data.length,
                        data: salesData.data,
                        chartData
                    });
                }
            } catch (error) {
                console.error("Error loading sales", error);
            } finally {
                setSalesLoading(false);
            }
        };
        loadSales();
    }, [restaurantId, salesFilter, customDate]);

    const handleExportCSV = () => {
        if (!salesStats.data || salesStats.data.length === 0) return alert("Sem dados para exportar neste período.");

        const headers = "ID Pedido,Data,Hora,Cliente,Total (Kz),Estado\n";
        const rows = salesStats.data.map(order => {
            const date = new Date(order.created_at);
            return `${order.id},${date.toLocaleDateString('pt-PT')},${date.toLocaleTimeString('pt-PT')},"${order.customer_name || 'Desconhecido'}",${order.total},${order.status}`;
        }).join("\n");

        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
        const link = document.createElement("a");
        link.setAttribute("href", csvContent);
        link.setAttribute("download", `relatorio_vendas_${salesFilter}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="space-y-8 p-4">
            <div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-36 bg-white/5 rounded-3xl animate-pulse border border-white/5"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="h-[450px] bg-white/5 rounded-3xl animate-pulse border border-white/5"></div>
                <div className="h-[450px] bg-white/5 rounded-3xl animate-pulse border border-white/5"></div>
            </div>
        </div>
    );

    // Fallback data for chart if empty (so it doesn't look broken)
    const chartData = stats.weeklyData.length > 0 ? stats.weeklyData : [
        { date: 'Seg', views: 0 }, { date: 'Ter', views: 0 }, { date: 'Qua', views: 0 },
        { date: 'Qui', views: 0 }, { date: 'Sex', views: 0 }, { date: 'Sab', views: 0 }, { date: 'Dom', views: 0 }
    ];

    return (
        <div className="space-y-8 animate-fade-in p-2 sm:p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">Visão Geral</h2>
                    <p className="text-gray-400">Acompanhe o desempenho do seu menu</p>
                </div>

                {/* Sales Filter */}
                <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="flex flex-wrap justify-center bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/5">
                        {[
                            { id: 'today', label: 'Dia' },
                            { id: 'month', label: 'Mês' },
                            { id: 'trimester', label: 'Trimestre' },
                            { id: 'semester', label: 'Semestre' },
                            { id: 'year', label: 'Ano' },
                            { id: 'custom', label: 'Personalizado' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSalesFilter(f.id)}
                                className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${salesFilter === f.id ? 'bg-primary text-gray-900 shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom Date Filters */}
            {salesFilter === 'custom' && (
                <div className="flex gap-4 flex-wrap items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-400 mb-1 ml-1 font-bold tracking-widest uppercase">Data Inicial</label>
                        <input type="date" value={customDate.start} onChange={e => setCustomDate(prev => ({ ...prev, start: e.target.value }))} className="bg-white/10 border border-white/10 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-400 mb-1 ml-1 font-bold tracking-widest uppercase">Data Final</label>
                        <input type="date" value={customDate.end} onChange={e => setCustomDate(prev => ({ ...prev, end: e.target.value }))} className="bg-white/10 border border-white/10 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition-colors" />
                    </div>
                </div>
            )}

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={`Faturação (${salesFilter === 'today' ? 'Hoje' : salesFilter === 'month' ? 'Mês' : 'Ano'})`}
                    value={salesLoading ? '...' : `${salesStats.revenue.toLocaleString('pt-AO')} Kz`}
                    icon={Banknote}
                    colorClass="bg-green-500 text-green-400 border-green-500 hover:border-green-400"
                />
                <StatCard
                    title={`Pedidos (${salesFilter === 'today' ? 'Hoje' : salesFilter === 'month' ? 'Mês' : 'Ano'})`}
                    value={salesLoading ? '...' : salesStats.ordersCount}
                    icon={ShoppingBag}
                    colorClass="bg-orange-500 text-orange-400 border-orange-500 hover:border-orange-400"
                />
                <StatCard
                    title="Acessos ao Menu"
                    value={stats.viewsToday}
                    icon={Eye}
                    colorClass="bg-blue-500 text-blue-400 border-blue-500 hover:border-blue-400"
                    trend="Ao vivo"
                />
                <StatCard
                    title="Pratos Ativos"
                    value={totalItems}
                    icon={Calendar}
                    colorClass="bg-[#D4AF37] text-[#D4AF37] border-[#D4AF37] hover:border-yellow-400"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <div className="bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/5 flex flex-col h-[450px]">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-serif font-bold text-white">Relatório de Vendas</h3>
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-sm transition-colors border border-white/10 shadow-sm">
                            <Download size={16} /> <span className="hidden sm:inline">Exportar</span> CSV
                        </button>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {salesStats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesStats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#f3f4f6" strokeDasharray="3 3" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                    <YAxis tickFormatter={(val) => `${val / 1000}k`} axisLine={false} tickLine={false} width={40} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => [`${value.toLocaleString('pt-AO')} Kz`, 'Total']}
                                    />
                                    <Bar dataKey="valor" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 font-medium">
                                Nenhum dado de vendas neste período.
                            </div>
                        )}
                    </div>
                </div>

                {/* Views Chart */}
                <div className="bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/5 flex flex-col h-[450px]">
                    <h3 className="text-xl font-serif font-bold text-white mb-8">Acessos nos últimos 7 dias</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} width={40} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#ff6b6b"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorViews)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Orders Widget */}
            <div className="bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/5 p-6 sm:p-8 mt-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                            <Clock size={20} className="text-[#D4AF37]" />
                            Pedidos Ativos Recentes
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Acompanhe as encomendas do seu restaurante em tempo real.</p>
                    </div>
                </div>

                {ordersLoading ? (
                    <div className="space-y-4 py-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl"></div>
                        ))}
                    </div>
                ) : recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-gray-500 font-bold text-xs uppercase tracking-wider">
                                    <th className="py-4 px-4 font-medium">Pedido</th>
                                    <th className="py-4 px-4 font-medium">Cliente</th>
                                    <th className="py-4 px-4 font-medium">Valor Total</th>
                                    <th className="py-4 px-4 font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-white font-mono">#{order.id.slice(0, 4)}</div>
                                            <div className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-gray-300 truncate max-w-[150px]">{order.customer_name || 'Desconhecido'}</div>
                                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">{order.items?.length || 0} Itens</div>
                                        </td>
                                        <td className="py-4 px-4 font-bold text-[#D4AF37] whitespace-nowrap">
                                            {order.total?.toLocaleString('pt-AO')} <span className="text-xs text-gray-500">Kz</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-4 py-1.5 text-xs font-bold rounded-xl border ${order.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50' : 'bg-blue-900/20 text-blue-400 border-blue-900/50'}`}>
                                                {order.status === 'pending' ? 'Pendente' : 'Em Preparo'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-black/40 rounded-3xl p-12 border border-dashed border-white/10 text-center">
                        <ShoppingBag className="mx-auto text-gray-600 mb-4 opacity-50" size={48} />
                        <p className="text-gray-400 font-bold text-lg">Nenhum pedido ativo no momento.</p>
                        <p className="text-gray-500 text-sm mt-2">Os novos pedidos recentes aparecerão aqui automaticamente na cozinha.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardStats;

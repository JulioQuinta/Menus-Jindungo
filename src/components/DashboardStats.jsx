import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { supabase } from '../lib/supabaseClient';
import { orderService } from '../services/orderService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom'; // [NEW] Added for navigation
import { Calendar, Users, TrendingUp, Eye, Banknote, ShoppingBag, Download, Clock, ChevronRight, FileText, BarChart3, Ticket } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const StatCard = ({ title, value, icon: Icon, colorClass, trend, trendValue, isPositive = true, onClick }) => {
    const colorBase = colorClass.split(' ')[0].replace('bg-', '').replace('-500', '');

    return (
        <div 
            onClick={onClick}
            className={`bg-[#111111]/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/5 flex flex-col justify-between h-36 sm:h-44 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-700 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
        >
            {/* Dynamic Ambient Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[50px] opacity-10 group-hover:opacity-30 transition-opacity duration-1000 bg-${colorBase}-500`}></div>

            <div className="flex justify-between items-start z-10 relative">
                <div className="min-w-0 flex-1">
                    <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] mb-2 truncate opacity-60">{title}</p>
                    <h3 className="text-xl sm:text-3xl font-serif font-black text-white leading-none group-hover:text-[#D4AF37] transition-colors truncate tracking-tighter">
                        {value}
                    </h3>
                </div>
                <div className={`p-3 rounded-2xl border border-white/5 bg-white/5 text-gray-400 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/20 transition-all duration-500`}>
                    <Icon size={20} />
                </div>
            </div>

            <div className="z-10 flex items-center justify-between mt-auto pt-4">
                {trend ? (
                    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-wider ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                        {trend}
                    </div>
                ) : trendValue ? (
                    <div className={`flex items-center gap-1.5 text-[9px] font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                        {trendValue}% <span className="text-gray-500 opacity-50 ml-0.5 uppercase tracking-tighter">vs anterior</span>
                    </div>
                ) : (
                    <div className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Dashboard</div>
                )}

                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                    <ChevronRight size={12} className="text-gray-600 group-hover:text-[#D4AF37] transition-all" />
                </div>
            </div>
        </div>
    );
};

const DashboardStats = ({ restaurantId, features = {} }) => {
    const [stats, setStats] = useState({ weeklyData: [], viewsToday: 0 });
    const [totalItems, setTotalItems] = useState(0);
    const [totalCategories, setTotalCategories] = useState(0);
    const [loading, setLoading] = useState(true);

    const [salesFilter, setSalesFilter] = useState('today'); // 'today', 'month', 'trimester', 'semester', 'year', 'custom'
    const [customDate, setCustomDate] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
    const [salesStats, setSalesStats] = useState({ revenue: 0, discounts: 0, ordersCount: 0, avgTicket: 0, data: [], chartData: [], topProducts: [], hourlyData: [] });
    const [salesLoading, setSalesLoading] = useState(false);
    const componentRef = React.useRef(null);
    const navigate = useNavigate(); // [NEW] Navigation tool

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Relatorio_Jindungo_${restaurantId}`,
    });

    // Recent Orders State
    const [recentOrders, setRecentOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Load all initial data (General Stats + Recent Orders)
    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            if (!restaurantId) return;
            setLoading(true);
            setOrdersLoading(true);

            try {
                // 1. Parallel but controlled general counts
                const [analyticsData, itemsRes, catsRes, ordersRes] = await Promise.all([
                    analyticsService.getStats(restaurantId),
                    supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
                    supabase.from('categories').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
                    supabase.from('orders').select('*').eq('restaurant_id', restaurantId).in('status', ['pending', 'preparing']).order('created_at', { ascending: false }).limit(5)
                ]);

                if (!isMounted) return;

                setStats(analyticsData);
                setTotalItems(itemsRes.count || 0);
                setTotalCategories(catsRes.count || 0);

                if (!ordersRes.error && ordersRes.data) {
                    setRecentOrders(ordersRes.data);
                }
            } catch (err) {
                console.error("Error loading dashboard data", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setOrdersLoading(false);
                }
            }
        };

        loadInitialData();

        const channel = supabase
            .channel('dashboard-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
                () => {
                    if (isMounted) loadInitialData();
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    // Load sales based on filter
    useEffect(() => {
        let isMounted = true;
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

                const statsStatus = features?.canUseKDS ? 'paid' : 'all';
                const salesData = await orderService.getSalesByDateRange(restaurantId, start, end, statsStatus);

                if (!isMounted) return;

                if (salesData && salesData.data) {
                    const revenue = salesData.data.reduce((sum, order) => sum + (order.total || 0), 0);
                    const totalDiscounts = salesData.data.reduce((sum, order) => sum + (order.coupon_discount || 0), 0);

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

                    // Hourly Data Analysis (for the last 24h or current view)
                    const hourlyGrouped = {};
                    // Initialize 24 hours
                    for (let i = 0; i < 24; i++) hourlyGrouped[`${String(i).padStart(2, '0')}:00`] = 0;

                    salesData.data.forEach(order => {
                        const hour = new Date(order.created_at).getHours();
                        const hourStr = `${String(hour).padStart(2, '0')}:00`;
                        hourlyGrouped[hourStr] += (order.total || 0);
                    });

                    const hourlyData = Object.keys(hourlyGrouped).map(hour => ({
                        hour,
                        valor: hourlyGrouped[hour]
                    }));

                    // Top Products Analysis
                    const productFreq = {};
                    salesData.data.forEach(order => {
                        const items = order.items || [];
                        items.forEach(item => {
                            const name = item.name;
                            if (!productFreq[name]) productFreq[name] = 0;
                            productFreq[name] += (item.quantity || 1);
                        });
                    });

                    const topProducts = Object.keys(productFreq)
                        .map(name => ({ name, quantity: productFreq[name] }))
                        .sort((a, b) => b.quantity - a.quantity)
                        .slice(0, 5);

                    if (isMounted) {
                        setSalesStats({
                            revenue,
                            discounts: totalDiscounts,
                            ordersCount: salesData.data.length,
                            avgTicket: salesData.data.length > 0 ? revenue / salesData.data.length : 0,
                            data: salesData.data,
                            chartData,
                            topProducts,
                            hourlyData
                        });
                    }
                }
            } catch (error) {
                if (isMounted) console.error("Error loading sales", error);
            } finally {
                if (isMounted) setSalesLoading(false);
            }
        };
        loadSales();
        return () => { isMounted = false; };
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
        <div ref={componentRef} className="space-y-8 animate-fade-in p-2 sm:p-4 print:bg-white print:text-black">
            {/* Welcome & Quick Actions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Welcome Card */}
                <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_50px_rgba(212,175,55,0.3)] group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Utensils size={120} className="text-black rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 bg-black/10 w-fit px-3 py-1 rounded-full border border-black/5">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Sistema Operacional</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-serif font-black text-black tracking-tight mb-4">
                            Boas-vindas,<br/> ao seu Jindungo.
                        </h1>
                        <p className="text-black/70 text-sm sm:text-base max-w-md font-medium leading-relaxed">
                            O seu menu digital está ativo e a processar pedidos. <br className="hidden sm:block" />
                            O que deseja fazer hoje para elevar o seu negócio?
                        </p>

                        {/* Daily Goal Progress [NEW] */}
                        {salesFilter === 'today' && (
                            <div className="mt-8 bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-black/5 max-w-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-black/60">Meta Diária (50k Kz)</span>
                                    <span className="text-xs font-black text-black">{Math.min(100, Math.round((salesStats.revenue / 50000) * 100))}%</span>
                                </div>
                                <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-black h-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${Math.min(100, (salesStats.revenue / 50000) * 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] font-bold text-black/40">
                                    <span>{salesStats.revenue.toLocaleString()} Kz</span>
                                    <span>Objetivo</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-center gap-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 px-2">Ações Rápidas</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => navigate('/admin/menu')}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all group/btn"
                        >
                            <Utensils size={20} className="text-[#D4AF37] group-hover/btn:text-black transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Novo Prato</span>
                        </button>
                        <button 
                            onClick={() => navigate('/admin/orders')}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all group/btn"
                        >
                            <ClipboardList size={20} className="text-[#D4AF37] group-hover/btn:text-black transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Cozinha</span>
                        </button>
                        <button 
                            onClick={() => navigate('/admin/qrcode')}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all group/btn"
                        >
                            <QrCode size={20} className="text-[#D4AF37] group-hover/btn:text-black transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-wider">QR Code</span>
                        </button>
                        <button 
                            onClick={() => window.open('https://wa.me/244900000000', '_blank')}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-green-500 hover:text-white transition-all group/btn"
                        >
                            <Mail size={20} className="text-green-500 group-hover/btn:text-white transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Suporte</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Original Header & Filter (Cleaned Up) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-serif font-black text-white flex items-center gap-3">
                        <TrendingUp size={24} className="text-[#D4AF37]" />
                        Análise de Performance
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Métricas em tempo real sobre o seu estabelecimento.</p>
                </div>

                <div className="flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                    {[
                        { id: 'today', label: 'Hoje' },
                        { id: 'month', label: 'Mês' },
                        { id: 'trimester', label: 'T3' },
                        { id: 'year', label: 'Ano' },
                        { id: 'custom', label: 'Custom' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSalesFilter(f.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${salesFilter === f.id ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {f.label}
                        </button>
                    ))}
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
                <StatCard
                    title={`${features?.canUseKDS ? 'Faturação' : 'Vendas WhatsApp'}`}
                    value={salesLoading ? '...' : `${salesStats.revenue.toLocaleString('pt-AO')} Kz`}
                    icon={Banknote}
                    colorClass="bg-green-500"
                    trendValue={salesStats.ordersCount > 0 ? 12 : 0}
                    isPositive={true}
                    onClick={() => document.getElementById('sales-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                />
                <StatCard
                    title="Descontos"
                    value={salesLoading ? '...' : `${salesStats.discounts ? salesStats.discounts.toLocaleString('pt-AO') : '0'} Kz`}
                    icon={Ticket}
                    colorClass="bg-pink-500"
                    trendValue={0}
                    isPositive={false}
                    onClick={() => document.getElementById('sales-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                />
                <StatCard
                    title="Encomendas"
                    value={salesLoading ? '...' : salesStats.ordersCount}
                    icon={ShoppingBag}
                    colorClass="bg-orange-500"
                    trendValue={salesStats.ordersCount > 2 ? 8 : 0}
                    isPositive={true}
                    onClick={() => navigate('/admin/orders')}
                />
                <StatCard
                    title="Acessos Menu"
                    value={stats.viewsToday}
                    icon={Eye}
                    colorClass="bg-blue-500"
                    trend="Ao vivo"
                    onClick={() => document.getElementById('views-chart')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                />
                <StatCard
                    title="Ticket Médio"
                    value={salesLoading ? '...' : `${Math.round(salesStats.avgTicket).toLocaleString('pt-AO')} Kz`}
                    icon={TrendingUp}
                    colorClass="bg-purple-500"
                    trendValue={salesStats.avgTicket > 0 ? 5 : 0}
                    isPositive={true}
                    onClick={() => document.getElementById('sales-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <div id="sales-report" className="scroll-mt-24 bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/5 flex flex-col h-[450px]">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-serif font-bold text-white">Relatório de Vendas</h3>
                        <div className="flex gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-[#D4AF37] rounded-xl font-bold text-sm transition-colors border border-[#D4AF37]/20 shadow-sm">
                                <FileText size={16} /> <span className="hidden sm:inline">PDF</span>
                            </button>
                            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-sm transition-colors border border-white/10 shadow-sm">
                                <Download size={16} /> <span className="hidden sm:inline">Excel</span>
                            </button>
                        </div>
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
                <div id="views-chart" className="scroll-mt-24 bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/5 flex flex-col h-[450px]">
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

                {/* Corporate: Top Products Chart */}
                <div className="bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/5 flex flex-col h-[450px] lg:col-span-2">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-white">Top 5 Pratos Mais Vendidos</h3>
                            <p className="text-gray-500 text-sm">Baseado no volume de pedidos do período selecionado.</p>
                        </div>
                        <div className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold border border-[#D4AF37]/20 uppercase tracking-widest">
                            Corporate
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {salesStats.topProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesStats.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                                        contentStyle={{ borderRadius: '12px', background: '#121212', border: '1px solid rgba(255,255,255,0.1)' }}
                                        itemStyle={{ color: '#D4AF37' }}
                                    />
                                    <Bar dataKey="quantity" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 font-medium">
                                Nenhuma venda identificada para análise de produtos.
                            </div>
                        )}
                    </div>
                </div>

                {/* [NEW] Hourly Performance Chart */}
                <div className="bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/5 flex flex-col h-[450px] lg:col-span-2">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                                <BarChart3 size={20} className="text-[#D4AF37]" />
                                Movimento por Hora (Picos)
                            </h3>
                            <p className="text-gray-500 text-sm">Entenda em que horários o seu restaurante mais fatura.</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {salesStats.hourlyData?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesStats.hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} interval={2} />
                                    <YAxis tickFormatter={(val) => `${val / 1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', background: '#121212', border: '1px solid rgba(255,255,255,0.1)' }}
                                        formatter={(value) => [`${value.toLocaleString('pt-AO')} Kz`, 'Faturação']}
                                    />
                                    <Area type="monotone" dataKey="valor" stroke="#D4AF37" strokeWidth={3} fill="url(#colorHourly)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 font-medium">
                                Dados insuficientes para análise horária.
                            </div>
                        )}
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
                                            <div>{order.total?.toLocaleString('pt-AO')} <span className="text-xs text-gray-500">Kz</span></div>
                                            {order.coupon_code && (
                                                <div className="text-[10px] text-green-500 mt-1 whitespace-nowrap">
                                                    Cupão: {order.coupon_code} <br/>(-{order.coupon_discount} Kz)
                                                </div>
                                            )}
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

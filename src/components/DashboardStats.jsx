import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { supabase } from '../lib/supabaseClient';
import { orderService } from '../services/orderService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Eye, Banknote, ShoppingBag, Download, Clock, ChevronRight, FileText, BarChart3, Ticket, PieChart as PieIcon, UserCheck, ArrowUpRight, ArrowDownRight, Printer, Utensils, ClipboardList, QrCode, Mail, Pencil } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const COLORS = ['#D4AF37', '#B8860B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

const StatCard = ({ title, value, icon: Icon, colorClass, trend, trendValue, isPositive = true, onClick }) => {
    const colorBase = colorClass.split(' ')[0].replace('bg-', '').replace('-500', '');

    return (
        <div 
            onClick={onClick}
            className={`bg-[#111111]/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/5 flex flex-col justify-between h-36 sm:h-44 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-700 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
        >
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
                ) : trendValue !== undefined ? (
                    <div className={`flex items-center gap-1.5 text-[9px] font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(trendValue)}% <span className="text-gray-500 opacity-50 ml-0.5 uppercase tracking-tighter">vs período ant.</span>
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
    const [dailyGoal, setDailyGoal] = useState(50000);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState(50000);

    const [salesFilter, setSalesFilter] = useState('today');
    const [customDate, setCustomDate] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
    const [salesStats, setSalesStats] = useState({ revenue: 0, discounts: 0, ordersCount: 0, avgTicket: 0, data: [], chartData: [], topProducts: [], hourlyData: [], bi: null });
    const [prevPeriodStats, setPrevPeriodStats] = useState({ revenue: 0, ordersCount: 0 });
    const [salesLoading, setSalesLoading] = useState(false);
    const componentRef = React.useRef(null);
    const reportTemplateRef = React.useRef(null);
    const navigate = useNavigate();

    const handlePrint = useReactToPrint({
        contentRef: reportTemplateRef,
        documentTitle: `Relatorio_BI_Jindungo_${new Date().toISOString().split('T')[0]}`,
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const loadSales = async () => {
        if (!restaurantId) return;
        setSalesLoading(true);
        try {
            let start = new Date();
            let end = new Date();
            let prevStart = new Date();
            let prevEnd = new Date();

            if (salesFilter === 'today') {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                prevStart.setDate(prevStart.getDate() - 1);
                prevStart.setHours(0, 0, 0, 0);
                prevEnd.setDate(prevEnd.getDate() - 1);
                prevEnd.setHours(23, 59, 59, 999);
            } else if (salesFilter === 'yesterday') {
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                prevStart.setDate(prevStart.getDate() - 2);
                prevStart.setHours(0, 0, 0, 0);
                prevEnd.setDate(prevEnd.getDate() - 2);
                prevEnd.setHours(23, 59, 59, 999);
            } else if (salesFilter === 'week') {
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                prevStart.setDate(start.getDate() - 7);
                prevEnd.setDate(start.getDate() - 1);
                prevEnd.setHours(23, 59, 59, 999);
            } else if (salesFilter === 'lastWeek') {
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1) - 7; 
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                prevStart.setDate(start.getDate() - 7);
                prevEnd.setDate(start.getDate() - 1);
                prevEnd.setHours(23, 59, 59, 999);
            } else if (salesFilter === 'month') {
                start = new Date(start.getFullYear(), start.getMonth(), 1);
                prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
                prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
            } else if (salesFilter === 'trimester') {
                const month = start.getMonth();
                const qStartMonth = Math.floor(month / 3) * 3;
                start = new Date(start.getFullYear(), qStartMonth, 1);
                prevStart = new Date(start.getFullYear(), qStartMonth - 3, 1);
                prevEnd = new Date(start.getFullYear(), qStartMonth, 0);
            } else if (salesFilter === 'year') {
                start = new Date(start.getFullYear(), 0, 1);
                prevStart = new Date(start.getFullYear() - 1, 0, 1);
                prevEnd = new Date(start.getFullYear(), 0, 0);
            } else if (salesFilter === 'custom') {
                if (customDate.start) start = new Date(customDate.start);
                if (customDate.end) end = new Date(customDate.end);
                const duration = end.getTime() - start.getTime();
                prevStart = new Date(start.getTime() - duration);
                prevEnd = new Date(start.getTime() - 1);
            }

            // Change: Include all non-cancelled orders for a more reactive dashboard
            const statsStatus = 'all'; 
            const [salesData, prevData, biData] = await Promise.all([
                orderService.getSalesByDateRange(restaurantId, start, end, statsStatus),
                orderService.getSalesByDateRange(restaurantId, prevStart, prevEnd, statsStatus),
                orderService.getAdvancedAnalytics(restaurantId, start, end)
            ]);

            if (prevData && prevData.data) {
                setPrevPeriodStats({
                    revenue: prevData.data.reduce((sum, o) => sum + (o.total || 0), 0),
                    ordersCount: prevData.data.length
                });
            }

            if (salesData && salesData.data) {
                const revenue = salesData.data.reduce((sum, order) => sum + (order.total || 0), 0);
                const totalDiscounts = salesData.data.reduce((sum, order) => sum + (order.coupon_discount || 0), 0);

                // Always fetch 15 days for the Trend Chart to show a real trend
                const trendStart = new Date();
                trendStart.setDate(trendStart.getDate() - 15);
                const { data: trendOrders } = await orderService.getSalesByDateRange(restaurantId, trendStart, new Date(), 'all');

                const trendGrouped = {};
                // Initialize last 15 days with 0
                for (let i = 15; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    trendGrouped[d.toLocaleDateString('pt-PT')] = 0;
                }

                if (trendOrders) {
                    trendOrders.forEach(order => {
                        const dateStr = new Date(order.created_at).toLocaleDateString('pt-PT');
                        if (trendGrouped[dateStr] !== undefined) {
                            trendGrouped[dateStr] += (order.total || 0);
                        }
                    });
                }

                const fullTrendData = Object.keys(trendGrouped).map(date => ({
                    date,
                    valor: trendGrouped[date]
                }));

                setSalesStats({
                    revenue,
                    discounts: totalDiscounts,
                    ordersCount: salesData.data.length,
                    avgTicket: salesData.data.length > 0 ? revenue / salesData.data.length : 0,
                    data: salesData.data,
                    chartData: fullTrendData, // Trend chart now always shows the last 15 days
                    topProducts: biData?.data?.topProducts || [],
                    hourlyData: biData?.data?.hourlyDistribution.map((v, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, valor: v })) || [],
                    bi: biData?.data
                });
            }
        } catch (error) {
            console.error("Error loading sales", error);
        } finally {
            setSalesLoading(false);
        }
    };

    const loadInitialData = async () => {
        if (!restaurantId) return;
        setLoading(true);
        setOrdersLoading(true);

        try {
            const [analyticsData, itemsRes, catsRes, ordersRes, restRes] = await Promise.all([
                analyticsService.getStats(restaurantId),
                supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
                supabase.from('categories').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
                supabase.from('orders').select('*').eq('restaurant_id', restaurantId).in('status', ['pending', 'preparing']).order('created_at', { ascending: false }).limit(5),
                supabase.from('restaurants').select('theme_config').eq('id', restaurantId).single()
            ]);

            setStats(analyticsData);
            setTotalItems(itemsRes.count || 0);
            setTotalCategories(catsRes.count || 0);

            if (restRes.data?.theme_config) {
                const goal = restRes.data.theme_config.dailyGoal || 50000;
                setDailyGoal(goal);
                setTempGoal(goal);
            }

            if (!ordersRes.error && ordersRes.data) {
                setRecentOrders(ordersRes.data);
            }
        } catch (err) {
            console.error("Error loading dashboard data", err);
        } finally {
            setLoading(false);
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
        loadSales();

        const channel = supabase
            .channel('dashboard-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, () => {
                loadInitialData();
                loadSales();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId, salesFilter, customDate.start, customDate.end]);

    const handleExportCSV = () => {
        if (!salesStats.data || salesStats.data.length === 0) return alert("Sem dados para exportar neste período.");

        const summaryHeaders = "RESUMO DO PERIODO\n";
        const summaryData = `Faturacao Total,${salesStats.revenue},Encomendas,${salesStats.ordersCount},Ticket Medio,${Math.round(salesStats.avgTicket)},Descontos,${salesStats.discounts}\n\n`;

        const headers = "ID Pedido,Data,Hora,Cliente,Contacto,Total (Kz),Estado,Itens\n";
        const rows = salesStats.data.map(order => {
            const date = new Date(order.created_at);
            const itemsStr = (order.items || []).map(i => `${i.quantity}x ${i.name}`).join(" | ");
            return `${order.id},${date.toLocaleDateString('pt-PT')},${date.toLocaleTimeString('pt-PT')},"${order.customer_name || 'Desconhecido'}",${order.customer_phone || ''},${order.total},${order.status},"${itemsStr}"`;
        }).join("\n");

        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(summaryHeaders + summaryData + headers + rows);
        const link = document.createElement("a");
        link.setAttribute("href", csvContent);
        link.setAttribute("download", `relatorio_jindungo_${salesFilter}_${new Date().toISOString().split('T')[0]}.csv`);
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
        </div>
    );

    return (
        <div ref={componentRef} className="space-y-8 animate-fade-in p-2 sm:p-4 print:bg-white print:text-black">
            {/* 1. WELCOME SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_50px_rgba(212,175,55,0.3)] group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Utensils size={120} className="text-black rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-3xl sm:text-5xl font-serif font-black text-black tracking-tight mb-4">Boas-vindas,<br/> ao seu Jindungo.</h1>
                        <p className="text-black/70 text-sm sm:text-base max-w-md font-medium leading-relaxed">O seu menu digital está ativo e a processar pedidos.</p>
                        <div className="mt-8 bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-black/5 max-w-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-black/60">A Sua Meta Diária</span>
                                        <p className="text-[8px] text-black/40 font-medium">Clique para personalizar</p>
                                    </div>
                                    {isEditingGoal ? (
                                        <div className="flex items-center gap-1">
                                            <input 
                                                type="number" 
                                                value={tempGoal} 
                                                onChange={(e) => setTempGoal(Number(e.target.value))}
                                                className="bg-white/20 border-none text-[10px] font-black text-black w-24 px-2 py-1 rounded-lg outline-none"
                                                autoFocus
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = Number(tempGoal);
                                                        setIsEditingGoal(false);
                                                        setDailyGoal(val);
                                                        const { data: current } = await supabase.from('restaurants').select('theme_config').eq('id', restaurantId).single();
                                                        const newConfig = { ...(current?.theme_config || {}), dailyGoal: val };
                                                        await supabase.from('restaurants').update({ theme_config: newConfig }).eq('id', restaurantId);
                                                        toast.success("Meta personalizada com sucesso!");
                                                    }
                                                }}
                                                onBlur={async () => {
                                                    if (isEditingGoal) {
                                                        const val = Number(tempGoal);
                                                        setIsEditingGoal(false);
                                                        setDailyGoal(val);
                                                        const { data: current } = await supabase.from('restaurants').select('theme_config').eq('id', restaurantId).single();
                                                        const newConfig = { ...(current?.theme_config || {}), dailyGoal: val };
                                                        await supabase.from('restaurants').update({ theme_config: newConfig }).eq('id', restaurantId);
                                                        toast.success("Meta personalizada com sucesso!");
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => setIsEditingGoal(true)}
                                            className="flex items-center gap-2 bg-black/5 hover:bg-black/10 px-3 py-1.5 rounded-xl border border-black/5 cursor-pointer transition-all group/meta"
                                        >
                                            <span className="text-sm font-black text-black">
                                                {dailyGoal.toLocaleString()} Kz
                                            </span>
                                            <Pencil size={12} className="text-black/30 group-hover/meta:text-black transition-colors" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-black text-black">
                                    {dailyGoal > 0 ? Math.min(100, Math.round((salesStats.revenue / dailyGoal) * 100)) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-black h-full transition-all duration-1000 ease-out" style={{ width: `${dailyGoal > 0 ? Math.min(100, (salesStats.revenue / dailyGoal) * 100) : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-center gap-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 px-2">Ações Rápidas</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => navigate('/admin/menu')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all group/btn">
                            <Utensils size={20} className="text-[#D4AF37] group-hover/btn:text-black transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Novo Prato</span>
                        </button>
                        <button onClick={() => navigate('/admin/orders')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all group/btn">
                            <ClipboardList size={20} className="text-[#D4AF37] group-hover/btn:text-black transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Cozinha</span>
                        </button>
                        <button onClick={() => navigate('/admin/qrcode')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all group/btn">
                            <QrCode size={20} className="text-[#D4AF37] group-hover/btn:text-black transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-wider">QR Code</span>
                        </button>
                        <button onClick={() => window.open('https://wa.me/244900000000', '_blank')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-green-500 hover:text-white transition-all group/btn">
                            <Mail size={20} className="text-green-500 group-hover/btn:text-white transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Suporte</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. FILTER SECTION */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-serif font-black text-white flex items-center gap-3">
                        <TrendingUp size={24} className="text-[#D4AF37]" />
                        Análise de Performance
                    </h2>
                </div>
                <div className="flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl overflow-x-auto no-scrollbar max-w-full">
                    {[
                        { id: 'today', label: 'Hoje' },
                        { id: 'yesterday', label: 'Ontem' },
                        { id: 'week', label: 'Semana' },
                        { id: 'lastWeek', label: 'Sem. Passada' },
                        { id: 'month', label: 'Mês' },
                        { id: 'trimester', label: 'T3' },
                        { id: 'year', label: 'Ano' },
                        { id: 'custom', label: 'Personalizado' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSalesFilter(f.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${salesFilter === f.id ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {salesFilter === 'custom' && (
                <div className="flex gap-4 flex-wrap items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <input type="date" value={customDate.start} onChange={e => setCustomDate(prev => ({ ...prev, start: e.target.value }))} className="bg-white/10 border border-white/10 text-white rounded-lg px-4 py-2 text-sm" />
                    <input type="date" value={customDate.end} onChange={e => setCustomDate(prev => ({ ...prev, end: e.target.value }))} className="bg-white/10 border border-white/10 text-white rounded-lg px-4 py-2 text-sm" />
                </div>
            )}

            {/* 3. STAT CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard title="Faturação" value={`${salesStats.revenue.toLocaleString()} Kz`} icon={Banknote} colorClass="bg-green-500" trendValue={prevPeriodStats.revenue > 0 ? Math.round(((salesStats.revenue - prevPeriodStats.revenue)/prevPeriodStats.revenue)*100) : 0} isPositive={salesStats.revenue >= prevPeriodStats.revenue} />
                <StatCard title="Descontos" value={`${salesStats.discounts.toLocaleString()} Kz`} icon={Ticket} colorClass="bg-pink-500" />
                <StatCard title="Encomendas" value={salesStats.ordersCount} icon={ShoppingBag} colorClass="bg-orange-500" trendValue={prevPeriodStats.ordersCount > 0 ? Math.round(((salesStats.ordersCount - prevPeriodStats.ordersCount)/prevPeriodStats.ordersCount)*100) : 0} isPositive={salesStats.ordersCount >= prevPeriodStats.ordersCount} />
                <StatCard title="Retenção" value={`${salesStats.bi?.uniqueCustomers.size > 0 ? Math.round((salesStats.bi?.returningPhones.size / salesStats.bi?.uniqueCustomers.size) * 100) : 0}%`} icon={UserCheck} colorClass="bg-blue-500" />
                <StatCard title="Ticket Médio" value={`${Math.round(salesStats.avgTicket).toLocaleString()} Kz`} icon={TrendingUp} colorClass="bg-purple-500" />
            </div>

            {/* 4. BI HUB */}
            <div className="space-y-6">
                <div id="trend-analysis" className="bg-[#111111]/90 backdrop-blur-3xl p-8 rounded-[3rem] border border-[#D4AF37]/20 shadow-2xl h-[500px] flex flex-col">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-2xl font-serif font-black text-white">Tendência do Negócio</h3>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Análise dos últimos 15 dias</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-2xl font-black ${salesStats.revenue >= prevPeriodStats.revenue ? 'text-green-500' : 'text-red-500'}`}>
                                {salesStats.revenue >= prevPeriodStats.revenue ? '+' : ''}{prevPeriodStats.revenue > 0 ? Math.round(((salesStats.revenue - prevPeriodStats.revenue) / prevPeriodStats.revenue) * 100) : 0}%
                            </span>
                            <p className="text-[10px] font-black uppercase opacity-50">O negócio está a {salesStats.revenue >= prevPeriodStats.revenue ? 'SUBIR' : 'BAIXAR'}</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesStats.chartData}>
                                <defs>
                                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="date" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip contentStyle={{background: '#000', border: '1px solid #D4AF37', borderRadius: '12px'}} />
                                <Area type="monotone" dataKey="valor" stroke="#D4AF37" strokeWidth={4} fill="url(#colorTrend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#111111]/90 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 h-[450px] flex flex-col">
                        <h3 className="text-xl font-serif font-black text-white mb-8">Mix de Categorias (Pizza)</h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={Object.entries(salesStats.bi?.revenueByCategory || {}).map(([name, value]) => ({ name, value }))} innerRadius={60} outerRadius={90} dataKey="value">
                                        {Object.entries(salesStats.bi?.revenueByCategory || {}).map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-[#111111]/90 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 h-[450px] flex flex-col">
                        <h3 className="text-xl font-serif font-black text-white mb-8">Top Produtos (Barras)</h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesStats.topProducts} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fill: '#fff', fontSize: 10}} axisLine={false} />
                                    <Bar dataKey="quantity" fill="#D4AF37" radius={[0, 10, 10, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. RECENT ORDERS */}
            <div className="bg-black/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/5">
                <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-[#D4AF37]" /> Pedidos Recentes
                </h3>
                {ordersLoading ? <div className="h-32 bg-white/5 animate-pulse rounded-2xl"></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-gray-500 text-xs uppercase font-black tracking-widest border-b border-white/5">
                                <tr>
                                    <th className="py-4">ID</th>
                                    <th className="py-4">Cliente</th>
                                    <th className="py-4">Total</th>
                                    <th className="py-4">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(o => (
                                    <tr key={o.id} className="border-b border-white/5 text-sm">
                                        <td className="py-4 font-mono text-white">#{o.id.slice(0,4)}</td>
                                        <td className="py-4 text-gray-300">{o.customer_name}</td>
                                        <td className="py-4 text-[#D4AF37] font-bold">{o.total.toLocaleString()} Kz</td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                {o.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 6. HIDDEN REPORT TEMPLATE */}
            <div className="hidden">
                <div ref={reportTemplateRef} className="p-12 bg-white text-black min-h-screen">
                    <h1 className="text-4xl font-serif font-black mb-8 border-b-2 border-black pb-4">RELATÓRIO BI JINDUNGO</h1>
                    <div className="grid grid-cols-4 gap-8 mb-12">
                        <div className="border p-4">
                            <p className="text-[10px] uppercase font-black text-gray-400">Total Faturado</p>
                            <p className="text-2xl font-bold">{salesStats.revenue.toLocaleString()} Kz</p>
                        </div>
                        <div className="border p-4">
                            <p className="text-[10px] uppercase font-black text-gray-400">Encomendas</p>
                            <p className="text-2xl font-bold">{salesStats.ordersCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 print:hidden">
                <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all">
                    <Download size={20} /> Exportar CSV
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-2xl font-bold hover:scale-105 transition-all">
                    <Printer size={20} /> Baixar PDF
                </button>
            </div>
        </div>
    );
};

export default DashboardStats;

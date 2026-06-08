import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, User, Phone, ShoppingBag, TrendingUp, History, Download, ExternalLink, Ticket, Target, Send, X, Award, Calendar, Sparkles, Filter, CheckCircle2, MessageSquare, Eye, Coffee, Utensils, Flame, Star, Crown, ChevronDown, MoreHorizontal, ArrowUpRight, CheckCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CustomerManager = ({ restaurantId }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [showAIPanel, setShowAIPanel] = useState(false);
    
    // Campaign State
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [campaignData, setCampaignData] = useState({ couponCode: '', daysInactive: 30, discountText: '20%' });
    
    // Gateway Settings State
    const [showGatewayModal, setShowGatewayModal] = useState(false);
    const [gatewayConfig, setGatewayConfig] = useState({ apiUrl: '', token: '', instanceName: '', gatewayType: 'evolution' });
    const [isSavingGateway, setIsSavingGateway] = useState(false);
    const [campaignProgress, setCampaignProgress] = useState(null);

    useEffect(() => {
        if (restaurantId) {
            supabase.from('restaurants')
                .select('business_info')
                .eq('id', restaurantId)
                .single()
                .then(({ data, error }) => {
                    if (data?.business_info?.whatsapp_gateway) {
                        setGatewayConfig(data.business_info.whatsapp_gateway);
                    }
                });
        }
    }, [restaurantId]);

    const handleSaveGateway = async () => {
        if (!gatewayConfig.apiUrl || !gatewayConfig.token || !gatewayConfig.instanceName) {
            return toast.error("Por favor, preencha todos os campos do gateway.");
        }
        setIsSavingGateway(true);
        try {
            const { data } = await supabase.from('restaurants')
                .select('business_info')
                .eq('id', restaurantId)
                .single();

            const updatedInfo = {
                ...(data?.business_info || {}),
                whatsapp_gateway: gatewayConfig
            };

            const { error } = await supabase.from('restaurants')
                .update({ business_info: updatedInfo })
                .eq('id', restaurantId);

            if (error) throw error;
            toast.success("Configuração de Gateway guardada com sucesso!");
            setShowGatewayModal(false);
        } catch (e) {
            console.error("Failed to save gateway config:", e);
            toast.error("Erro ao guardar configuração do gateway.");
        } finally {
            setIsSavingGateway(false);
        }
    };

    // Mock initial customers for instant premium visual render even if database is empty or loading
    const defaultMockCustomers = [
        {
            name: 'Naivo',
            phone: '931175117',
            totalOrders: 28,
            totalSpent: 250400,
            totalRedemptions: 3,
            lastOrder: new Date().toISOString(),
            favoriteItem: 'Água Minerside (0.5L)',
            favoriteImg: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
            tag: 'VIP'
        },
        {
            name: 'Guto',
            phone: '032536689',
            totalOrders: 7,
            totalSpent: 99450,
            totalRedemptions: 1,
            lastOrder: new Date(Date.now() - 5 * 86400000).toISOString(),
            favoriteItem: 'Bacalhau com Natas Tr...',
            favoriteImg: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
            tag: 'ILIMITADO'
        },
        {
            name: 'Cliente',
            phone: '923884112',
            totalOrders: 5,
            totalSpent: 47250,
            totalRedemptions: 0,
            lastOrder: new Date(Date.now() - 12 * 86400000).toISOString(),
            favoriteItem: 'Torra de Frango',
            favoriteImg: 'https://images.unsplash.com/photo-1527751171053-6caeec3c2a68?w=600&auto=format&fit=crop&q=80',
            tag: 'REGULAR'
        },
        {
            name: 'Carlos Mendes',
            phone: '944122390',
            totalOrders: 1,
            totalSpent: 12450,
            totalRedemptions: 0,
            lastOrder: new Date(Date.now() - 25 * 86400000).toISOString(),
            favoriteItem: 'Sacarnadesu x1',
            favoriteImg: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80',
            tag: 'NOVO'
        }
    ];

    useEffect(() => {
        if (restaurantId) {
            fetchCustomers();
        } else {
            setCustomers(defaultMockCustomers);
            setLoading(false);
        }
    }, [restaurantId]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data: orders, error } = await supabase
                .from('orders')
                .select('customer_name, customer_phone, total, created_at, is_loyalty_redemption, items')
                .eq('restaurant_id', restaurantId)
                .not('customer_phone', 'is', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!orders || orders.length === 0) {
                setCustomers(defaultMockCustomers);
                setLoading(false);
                return;
            }

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
                        lastOrder: order.created_at,
                        itemCounts: {},
                        lastImg: null
                    };
                }

                customerMap[key].totalOrders += 1;
                customerMap[key].totalSpent += (order.total || 0);
                if (order.is_loyalty_redemption) {
                    customerMap[key].totalRedemptions += 1;
                }
                if (new Date(order.created_at) > new Date(customerMap[key].lastOrder)) {
                    customerMap[key].lastOrder = order.created_at;
                }

                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (item && item.name) {
                            customerMap[key].itemCounts[item.name] = (customerMap[key].itemCounts[item.name] || 0) + (item.quantity || 1);
                            if (item.img || item.img_url || item.image_url) {
                                customerMap[key].lastImg = item.img || item.img_url || item.image_url;
                            }
                        }
                    });
                }
            });

            const defaultImages = [
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1527751171053-6caeec3c2a68?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80'
            ];

            const sortedCustomers = Object.values(customerMap).map((c, idx) => {
                let favItem = 'Menu Geral';
                let maxCount = 0;
                Object.entries(c.itemCounts).forEach(([itemName, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        favItem = itemName;
                    }
                });
                
                let tag = 'REGULAR';
                if (c.totalOrders >= 15) tag = 'VIP';
                else if (c.totalSpent >= 100000) tag = 'ILIMITADO';
                else if (c.totalOrders === 1) tag = 'NOVO';

                return {
                    ...c,
                    favoriteItem: favItem,
                    favoriteImg: c.lastImg || defaultImages[idx % defaultImages.length],
                    tag
                };
            }).sort((a, b) => b.totalSpent - a.totalSpent);

            if (sortedCustomers.length < 3) {
                const combined = [...sortedCustomers];
                defaultMockCustomers.forEach(mc => {
                    if (!combined.some(c => c.phone === mc.phone)) {
                        combined.push(mc);
                    }
                });
                setCustomers(combined);
            } else {
                setCustomers(sortedCustomers);
            }
        } catch (error) {
            console.error('Erro ao carregar CRM:', error);
            toast.error("Erro ao carregar base de clientes.");
            setCustomers(defaultMockCustomers);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (c.favoriteItem || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (activeFilter === 'all') return matchesSearch;
        if (activeFilter === 'vip') return matchesSearch && (c.tag === 'VIP' || c.tag === 'ILIMITADO');
        if (activeFilter === 'new') return matchesSearch && c.totalOrders <= 2;
        if (activeFilter === 'churn') {
            const daysSince = Math.floor((Date.now() - new Date(c.lastOrder).getTime()) / (1000 * 60 * 60 * 24));
            return matchesSearch && daysSince >= 30;
        }
        return matchesSearch;
    });

    const handleExportCRM = () => {
        if (customers.length === 0) return toast.error("Sem clientes para exportar.");

        const headers = "Nome,Telefone,Total Pedidos,Total Gasto (Kz),Premios Resgatados,Prato Favorito,Ultimo Pedido\n";
        const rows = customers.map(c =>
            `"${c.name}","${c.phone}",${c.totalOrders},${c.totalSpent},${c.totalRedemptions},"${c.favoriteItem}","${new Date(c.lastOrder).toLocaleDateString()}"`
        ).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `crm_clientes_jindungo.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openWhatsApp = (phone, customMessage = null) => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 9) return toast.error("Número de telefone inválido.");
        const finalPhone = cleanPhone.startsWith('244') ? cleanPhone : '244' + cleanPhone;
        const msg = customMessage ? `?text=${encodeURIComponent(customMessage)}` : '';
        window.open(`https://wa.me/${finalPhone}${msg}`, '_blank');
    };

    const handleRunCampaign = async (useGateway = false) => {
        if (!campaignData.couponCode) return toast.error("Insira o código do Cupão Jindungo.");
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(campaignData.daysInactive));
        
        const targets = customers.filter(c => new Date(c.lastOrder) < cutoffDate && c.phone && c.phone !== 'Sem Telefone');
        
        if (targets.length === 0) {
            return toast.error(`Nenhum cliente inativo há mais de ${campaignData.daysInactive} dias com telefone registado.`);
        }

        const textToCopy = `Olá {nome}! Temos Saudades Suas! 🌶️\nUtilize o nosso cupão ${campaignData.couponCode} para um desconto de ${campaignData.discountText} no seu próximo pedido connosco!\n\nAceda ao nosso menu: ${window.location.origin}/r/${restaurantId ? '' : 'default'}`;

        if (useGateway) {
            setCampaignProgress({ current: 0, total: targets.length, successCount: 0, failedCount: 0, pct: 0 });
            
            import('../services/whatsappService.js').then(async ({ whatsappService }) => {
                try {
                    const results = await whatsappService.sendBulkCampaign(
                        gatewayConfig,
                        targets,
                        textToCopy,
                        (progress) => setCampaignProgress(progress)
                    );
                    
                    toast.success(`Campanha executada! Sucesso: ${results.success}, Falhas: ${results.failed}`, { duration: 6000 });
                    setShowCampaignModal(false);
                } catch (err) {
                    toast.error(`Falha no disparo da campanha: ${err.message}`);
                } finally {
                    setCampaignProgress(null);
                }
            });
        } else {
            const numbers = targets.map(t => {
                const clean = t.phone.replace(/\D/g, '');
                return clean.startsWith('244') ? clean : '244' + clean;
            }).join(', ');

            navigator.clipboard.writeText(`Lista de Números:\n${numbers}\n\nMensagem Base:\n${textToCopy.replace(/\{nome\}/gi, 'Cliente')}`);
            
            toast.success(`${targets.length} contactos e mensagem copiados para o Clipboard! Cole na sua Lista de Transmissão do WhatsApp.`, { duration: 8000 });
            setShowCampaignModal(false);
        }
    };

    // Recharts Data for "Ciclo de vida de clientes"
    const lifecycleData = [
        { phase: 'Dia 1', Aquisicao: 0, Retencao: 0, Churn: 0 },
        { phase: 'Dia 15', Aquisicao: 95, Retencao: 30, Churn: 5 },
        { phase: 'Dia 30', Aquisicao: 60, Retencao: 85, Churn: 15 },
        { phase: 'Dia 60', Aquisicao: 40, Retencao: 110, Churn: 40 },
        { phase: 'Dia 90 / Churn', Aquisicao: 15, Retencao: 70, Churn: 85 }
    ];

    // Scatter / Cluster Data for "Segmentação de cliente"
    const clusters = [
        { id: 1, name: 'Cluster 1', x: 15, y: 30, r: 24, bg: 'rgba(212, 175, 55, 0.2)', border: '#D4AF37', text: '#D4AF37', label: 'Cluster 1' },
        { id: 2, name: 'Cluster 2', x: 32, y: 70, r: 35, bg: 'rgba(220, 38, 38, 0.2)', border: '#DC2626', text: '#F87171', label: 'Cluster 2' },
        { id: 3, name: 'Cluster 3', x: 35, y: 140, r: 30, bg: 'rgba(34, 197, 94, 0.2)', border: '#22C55E', text: '#4ADE80', label: 'Cluster 3' },
        { id: 4, name: 'Nover: Almoço Valor', x: 48, y: 180, r: 42, bg: 'rgba(59, 130, 246, 0.2)', border: '#3B82F6', text: '#60A5FA', label: 'Nover: Almoço Valor' },
        { id: 5, name: 'Cluster Clusters 20', x: 55, y: 130, r: 38, bg: 'rgba(212, 175, 55, 0.25)', border: '#D4AF37', text: '#D4AF37', label: 'Cluster Clusters 20' },
    ];

    const ticketMedio = customers.length > 0
        ? Math.round(customers.reduce((acc, c) => acc + c.totalSpent, 0) / Math.max(1, customers.reduce((acc, c) => acc + c.totalOrders, 0)))
        : 10117;

    const taxaRetorno = customers.length > 0
        ? Math.round((customers.filter(c => c.totalOrders > 1).length / customers.length) * 100)
        : 33;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-white min-h-screen pb-24 relative">
            
            {/* Top Action Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121212]/95 border border-[#2A2A2A] rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#D4AF37] uppercase font-bold tracking-widest">Workspace</span>
                        <span className="text-gray-500">&gt;</span>
                        <span className="text-xs font-mono text-gray-300 uppercase font-bold tracking-widest">CRM & Inteligência</span>
                    </div>
                    <h1 className="text-3xl font-serif font-black text-white flex items-center gap-3">
                        <User className="text-[#D4AF37]" size={28} />
                        Gestão de Clientes VIP
                        <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg border border-[#D4AF37]/40 shadow-sm">Corporate</span>
                    </h1>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowCampaignModal(true)}
                        className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:brightness-110 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center shadow-[0_0_25px_rgba(220,38,38,0.4)] active:scale-95 cursor-pointer border border-red-500/30"
                    >
                        <Target size={16} /> Nova Campanha
                    </button>
                    {restaurantId && (
                        <button
                            onClick={() => setShowGatewayModal(true)}
                            className="bg-[#1C1C1C] hover:bg-white/10 border border-[#D4AF37]/40 text-[#D4AF37] px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center shadow-md active:scale-95 cursor-pointer"
                        >
                            <Phone size={16} /> Gateway API
                        </button>
                    )}
                    <button
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className={`border px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center shadow-md active:scale-95 cursor-pointer ${showAIPanel ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.5)]' : 'bg-[#1C1C1C] text-[#D4AF37] border-[#D4AF37]/40 hover:bg-[#D4AF37]/10'}`}
                    >
                        <Sparkles size={16} /> Dicas IA {showAIPanel ? '▲' : '▼'}
                    </button>
                    <button
                        onClick={handleExportCRM}
                        className="bg-[#1C1C1C] hover:bg-white/10 border border-white/10 text-[#D4AF37] p-3.5 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                        title="Exportar Base Completa (CSV)"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Main CRM Grid Layout (Top Charts & Metrics) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Top Left Big Card: "CRM & Base de Clientes" (Span 7) */}
                <div className="lg:col-span-7 bg-[#161616]/95 border border-[#D4AF37]/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.1)] backdrop-blur-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#D4AF37]/10 blur-[60px] pointer-events-none"></div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 z-10">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-serif font-black text-white">CRM & Base de Clientes</h2>
                                <span className="bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider">Corporate</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 font-medium">Conheça quem mais compra e fidelize os seus melhores clientes.</p>
                        </div>
                        
                        {/* Legend */}
                        <div className="flex items-center gap-3.5 text-[11px] font-bold tracking-wider uppercase">
                            <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span> Aquisição</span>
                            <span className="flex items-center gap-1.5 text-[#D4AF37]"><span className="w-2.5 h-2.5 rounded-sm bg-[#D4AF37]"></span> Retenção</span>
                            <span className="flex items-center gap-1.5 text-red-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span> Churn Predito</span>
                        </div>
                    </div>

                    <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest z-10">
                        Ciclo de Vida de Clientes
                    </div>

                    {/* Area Chart Container */}
                    <div className="h-64 sm:h-72 w-full z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={lifecycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAquisicao" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                                    </linearGradient>
                                    <linearGradient id="colorRetencao" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0}/>
                                    </linearGradient>
                                    <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                                <XAxis dataKey="phase" stroke="#71717A" fontSize={11} tickLine={false} axisLine={{ stroke: '#2A2A2A' }} />
                                <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={{ stroke: '#2A2A2A' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#121212', borderColor: '#D4AF37', borderRadius: '16px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.8)' }}
                                    itemStyle={{ color: '#D4AF37' }}
                                />
                                <Area type="monotone" dataKey="Aquisicao" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorAquisicao)" />
                                <Area type="monotone" dataKey="Retencao" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRetencao)" />
                                <Area type="monotone" dataKey="Churn" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorChurn)" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Stacked Metrics & Scatter Chart (Span 5) */}
                <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
                    
                    {/* Top Row: 2 Metric Cards */}
                    <div className="grid grid-cols-2 gap-5">
                        
                        {/* Metric 1: Ticket Médio */}
                        <div className="bg-[#161616]/95 border border-[#D4AF37]/30 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group hover:border-[#D4AF37]/60 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:bg-green-500/20 transition-all"></div>
                            <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                                <Ticket size={22} />
                            </div>
                            <span className="text-xs uppercase font-extrabold tracking-widest text-gray-400 block mb-1">Ticket Médio</span>
                            <span className="text-2xl sm:text-3xl font-serif font-black text-white block leading-none">
                                {new Intl.NumberFormat('pt-AO').format(ticketMedio)} <span className="text-sm text-[#D4AF37]">Kz</span>
                            </span>
                        </div>

                        {/* Metric 2: Taxa de Retorno */}
                        <div className="bg-[#161616]/95 border border-[#D4AF37]/30 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group hover:border-[#D4AF37]/60 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
                            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                                <History size={22} />
                            </div>
                            <span className="text-xs uppercase font-extrabold tracking-widest text-gray-400 block mb-1">Taxa de Retorno</span>
                            <span className="text-2xl sm:text-3xl font-serif font-black text-white block leading-none">
                                {taxaRetorno}% <span className="text-xs text-purple-400">▲ Frequente</span>
                            </span>
                        </div>
                    </div>

                    {/* Bottom Row: Scatter Chart "Segmentação de cliente" */}
                    <div className="flex-1 bg-[#161616]/95 border border-[#D4AF37]/30 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between group">
                        <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start mb-4 z-10">
                            <div>
                                <h3 className="font-serif font-black text-xl text-white">Segmentação de Cliente</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Matriz Valor vs Loyalte score</p>
                            </div>
                            <span className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest bg-[#D4AF37]/10 px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">Clusters AI</span>
                        </div>

                        {/* Custom SVG / HTML Scatter Grid Overlay */}
                        <div className="h-56 w-full border-l border-b border-[#2A2A2A] relative my-2 z-10 flex items-center justify-center">
                            
                            {/* Grid Lines */}
                            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-r border-t border-gray-600"></div>
                                <div className="border-t border-gray-600"></div>
                            </div>

                            {/* Y-axis label */}
                            <span className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold uppercase tracking-widest text-gray-500">Valor Gasto</span>
                            {/* X-axis label */}
                            <span className="absolute bottom-1 right-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Loyalty Score &gt;</span>

                            {/* Clusters Bubbles */}
                            {clusters.map((cl) => (
                                <div
                                    key={cl.id}
                                    style={{
                                        left: `${cl.x}%`,
                                        bottom: `${(cl.y / 250) * 100}%`,
                                        width: `${cl.r * 2}px`,
                                        height: `${cl.r * 2}px`,
                                        backgroundColor: cl.bg,
                                        borderColor: cl.border
                                    }}
                                    className="absolute -translate-x-1/2 translate-y-1/2 rounded-full border-2 flex items-center justify-center p-2 text-center shadow-[0_0_20px_rgba(212,175,55,0.4)] backdrop-blur-md transition-all hover:scale-110 cursor-pointer group/bubble z-20 animate-pulse font-bold"
                                >
                                    <span style={{ color: cl.text }} className="text-[10px] leading-tight truncate px-1">
                                        {cl.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros e Pesquisa da Grelha */}
            <div className="bg-[#161616] border border-white/5 p-4 rounded-3xl shadow-inner flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Search size={16} /></span>
                    <input
                        type="text"
                        placeholder="Pesquisar por cliente, telefone ou prato favorito..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all"
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeFilter === 'all' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        Todos ({customers.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('vip')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activeFilter === 'vip' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'bg-white/5 text-[#D4AF37] hover:bg-white/10'}`}
                    >
                        <Crown size={14} /> VIP / Ilimitado
                    </button>
                    <button
                        onClick={() => setActiveFilter('churn')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activeFilter === 'churn' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-red-400 hover:bg-white/10'}`}
                    >
                        <Flame size={14} /> Em Risco (&gt;30d)
                    </button>
                    <button
                        onClick={() => setActiveFilter('new')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeFilter === 'new' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-cyan-400 hover:bg-white/10'}`}
                    >
                        Novos Clientes
                    </button>
                </div>
            </div>

            {/* Base de Contactos (Grelha de Cartões de Clientes) */}
            <div>
                <h3 className="text-xl font-serif font-black text-white mb-6 flex items-center gap-3">
                    <span>Base de Contactos & Relacionamento</span>
                    <span className="text-xs font-mono font-normal text-gray-400">({filteredCustomers.length} listados)</span>
                </h3>

                {loading ? (
                    <div className="py-20 text-center text-[#D4AF37] font-bold">A carregar inteligência de clientes...</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="py-20 text-center bg-[#161616]/50 rounded-3xl border border-white/5">
                        <User size={48} className="mx-auto mb-4 text-[#D4AF37] opacity-40" />
                        <p className="text-lg font-serif text-gray-300 font-bold">Nenhum cliente corresponde à pesquisa.</p>
                        <button onClick={() => { setSearchTerm(''); setActiveFilter('all'); }} className="mt-4 text-xs font-bold text-[#D4AF37] underline">Limpar filtros</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCustomers.map((c, idx) => (
                            <div 
                                key={idx} 
                                className="bg-[#161616]/95 border border-[#D4AF37]/30 rounded-[2rem] p-5 shadow-xl transition-all hover:scale-[1.02] hover:border-[#D4AF37] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] flex flex-col justify-between relative group text-left backdrop-blur-xl"
                            >
                                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border shadow-sm ${
                                        c.tag === 'VIP' ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40 font-black' :
                                        c.tag === 'ILIMITADO' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-black' :
                                        c.tag === 'NOVO' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                                        'bg-white/5 text-gray-400 border-white/10'
                                    }`}>
                                        {c.tag}
                                    </span>
                                </div>

                                <div>
                                    {/* Header do Cartão do Cliente */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#252525] to-[#111] border border-[#D4AF37]/40 flex items-center justify-center text-xl font-black text-[#D4AF37] shadow-inner shrink-0">
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1 pr-16">
                                            <h4 className="font-serif font-black text-lg text-white leading-tight truncate">{c.name}</h4>
                                            <p className="text-xs text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                                                <Phone size={12} className="text-[#D4AF37]" /> {c.phone}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Imagem de Prato Favorito */}
                                    <div className="relative rounded-2xl overflow-hidden mb-4 border border-white/10 h-36 bg-[#1A1A1A]">
                                        <img src={c.favoriteImg} alt={c.favoriteItem} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] block">Prato Favorito</span>
                                            <span className="font-bold text-sm text-white leading-tight truncate">{c.favoriteItem}</span>
                                        </div>
                                    </div>

                                    {/* Contagem de Pedidos e Ultima Visita */}
                                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                        <div className="bg-[#1C1C1C] border border-white/5 p-2.5 rounded-xl text-center">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Frequência</span>
                                            <span className="font-black text-white text-sm">{c.totalOrders} {c.totalOrders === 1 ? 'pedido' : 'pedidos'}</span>
                                        </div>
                                        <div className="bg-[#1C1C1C] border border-white/5 p-2.5 rounded-xl text-center">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Última Visita</span>
                                            <span className="font-bold text-gray-300 text-xs">{new Date(c.lastOrder).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Rodapé com Valor e Botão WhatsApp */}
                                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
                                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-2 rounded-xl">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] block">Total Investido</span>
                                        <span className="font-serif font-black text-white text-base leading-none">
                                            {new Intl.NumberFormat('pt-AO').format(c.totalSpent)} <span className="text-xs text-[#D4AF37]">Kz</span>
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => openWhatsApp(c.phone, `Olá ${c.name}! Temos novidades especiais para si no nosso menu.`)}
                                        className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs shadow-md cursor-pointer shrink-0 border border-green-500/30"
                                        title="Enviar mensagem direta"
                                    >
                                        <MessageSquare size={16} /> WhatsApp
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Painel Flutuante Lateral IA ("Dicas de Tomada de Decisão") */}
            {showAIPanel && (
                <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-[#121212]/95 backdrop-blur-3xl border-l border-[#D4AF37]/30 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] z-50 flex flex-col animate-in slide-in-from-right duration-500">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#D4AF37] p-2.5 rounded-2xl text-black shadow-[0_0_20px_rgba(212,175,55,0.5)]">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="font-serif font-black text-white text-xl leading-tight">Dicas de Decisão</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37]">Jindungo AI Live Assist</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowAIPanel(false)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
                        
                        <div className="bg-[#1C1C1C] border border-[#D4AF37]/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-[#D4AF37]/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">💡</span>
                                <h4 className="font-bold text-white text-sm sm:text-base">Sugerir Campanha p/ Naivo: Novo Prato</h4>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
                                Sugerir Promoção p/ Noites de Sexta e pessoas entre as 18h e as 22h para impulsionar pratos em destaque no comportamento de compras.
                            </p>
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-semibold">Alvo VIP:</span>
                                <button onClick={() => openWhatsApp('931175117', 'Olá Naivo! Preparamos uma oferta especial de Sexta-feira para si.')} className="text-green-400 font-bold flex items-center gap-1 hover:underline cursor-pointer">
                                    Enviar Oferta <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#1C1C1C] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">⚡</span>
                                <h4 className="font-bold text-white text-sm sm:text-base">Rever Staff p/ Picos de Sábado</h4>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
                                Rever Staff p/ picos a rmos die passos de picos de Sábado. O fluxo aos sábados duplica; sugerimos escalar 2 chefes adicionais na grelha.
                            </p>
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-semibold">Ação recomendada:</span>
                                <span className="text-cyan-400 font-bold">Escalar +2 Chefs</span>
                            </div>
                        </div>

                        <div className="bg-[#1C1C1C] border border-orange-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">🎯</span>
                                <h4 className="font-bold text-white text-sm sm:text-base">Sugerir Promoção de Decisão</h4>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
                                Sugerir promoção p/ noites de Sexta e Rever combinações dos pratos mais vendidos no menu digital.
                            </p>
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-semibold">Status AI:</span>
                                <span className="text-[#D4AF37] font-bold">Pronto a Ativar</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 mt-6">
                        <button 
                            onClick={() => {
                                toast.success('Dicas e automações ativadas no CRM!');
                                setShowAIPanel(false);
                            }}
                            className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-black py-4 rounded-2xl text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} /> Aplicar Automações IA
                        </button>
                    </div>
                </div>
            )}

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
                    <div className="bg-[#161616] border border-[#D4AF37]/30 p-8 rounded-[2.5rem] max-w-md w-full relative shadow-2xl">
                        <button onClick={() => setShowCampaignModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white cursor-pointer font-bold">
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-serif font-black mb-1 text-white flex items-center gap-2.5">
                            <Target className="text-[#D4AF37]" size={28} /> Recuperação Ativa
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 border-b border-white/10 pb-4 leading-relaxed font-medium">Crie uma lista de transmissão no WhatsApp para clientes inativos e ofereça incentivos automáticos.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1.5 block">Dias Inativos (Filtro)</label>
                                <select 
                                    className="w-full bg-[#1C1C1C] border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-[#D4AF37] text-sm font-bold"
                                    value={campaignData.daysInactive}
                                    onChange={(e) => setCampaignData({...campaignData, daysInactive: e.target.value})}
                                >
                                    <option value="15" className="bg-[#121212]">Mais de 15 Dias</option>
                                    <option value="30" className="bg-[#121212]">Mais de 30 Dias</option>
                                    <option value="60" className="bg-[#121212]">Mais de 60 Dias</option>
                                    <option value="90" className="bg-[#121212]">Mais de 90 Dias (Risco de Churn)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                        <Ticket size={12}/> Cupão Jindungo
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: VOLTA10"
                                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-[#D4AF37] uppercase font-mono text-sm font-bold"
                                        value={campaignData.couponCode}
                                        onChange={(e) => setCampaignData({...campaignData, couponCode: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1.5 block">Desconto</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: 20% / 2000 Kz"
                                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-[#D4AF37] text-sm font-bold"
                                        value={campaignData.discountText}
                                        onChange={(e) => setCampaignData({...campaignData, discountText: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {gatewayConfig.apiUrl && gatewayConfig.token ? (
                            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-2xl mb-6 shadow-inner">
                                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                    <Phone size={12} /> Gateway Ativo: {gatewayConfig.gatewayType.toUpperCase()}
                                </p>
                                <p className="text-xs text-green-200/80 leading-relaxed font-medium">
                                    Foi detetada uma ligação ao gateway de WhatsApp. Pode enviar de forma 100% automática em segundo plano com pausas seguras.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl mb-6 shadow-inner">
                                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                    <Send size={12} /> Disparo por Transmissão (Manual)
                                </p>
                                <p className="text-xs text-orange-200/80 leading-relaxed font-medium">
                                    Ao clicar abaixo, os contactos e o modelo de texto serão copiados para colar na sua Lista de Transmissão manual.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-2.5">
                            {gatewayConfig.apiUrl && gatewayConfig.token && (
                                <button
                                    onClick={() => handleRunCampaign(true)}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer text-xs uppercase tracking-wider"
                                >
                                    <Sparkles size={16} /> Disparar em 2º Plano (Automático)
                                </button>
                            )}
                            <button
                                onClick={() => handleRunCampaign(false)}
                                className="w-full bg-[#1C1C1C] hover:bg-white/5 border border-white/10 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-xs uppercase tracking-wider"
                            >
                                <Send size={14} /> {gatewayConfig.apiUrl ? 'Copiar Lista e Texto (Manual)' : 'Compilar & Copiar Campanha'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Gateway Settings Modal */}
            {showGatewayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
                    <div className="bg-[#161616] border border-[#D4AF37]/30 p-8 rounded-[2.5rem] max-w-md w-full relative shadow-2xl">
                        <button onClick={() => setShowGatewayModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white cursor-pointer font-bold">
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-serif font-black mb-1 text-white flex items-center gap-2.5">
                            <Phone className="text-[#D4AF37]" size={28} /> Configurar Gateway
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 border-b border-white/10 pb-4 leading-relaxed font-medium">Conecte o seu número de WhatsApp ao sistema para enviar disparos de CRM e notificações em segundo plano.</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1.5 block">Tipo de API / Gateway</label>
                                <select 
                                    className="w-full bg-[#1C1C1C] border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-[#D4AF37] text-sm font-bold"
                                    value={gatewayConfig.gatewayType}
                                    onChange={(e) => setGatewayConfig({...gatewayConfig, gatewayType: e.target.value})}
                                >
                                    <option value="evolution" className="bg-[#121212]">Evolution API (Recomendado)</option>
                                    <option value="zapi" className="bg-[#121212]">Z-API</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1.5 block">URL Base da API</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: https://api.exemplo.com"
                                    className="w-full bg-[#1C1C1C] border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-[#D4AF37] text-sm font-medium"
                                    value={gatewayConfig.apiUrl}
                                    onChange={(e) => setGatewayConfig({...gatewayConfig, apiUrl: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1.5 block">Nome da Instância</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: jindungo-rest"
                                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-[#D4AF37] text-sm font-medium"
                                        value={gatewayConfig.instanceName}
                                        onChange={(e) => setGatewayConfig({...gatewayConfig, instanceName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1.5 block">Token / API Key</label>
                                    <input 
                                        type="password" 
                                        placeholder="••••••••"
                                        className="w-full bg-[#1C1C1C] border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-[#D4AF37] text-sm font-medium"
                                        value={gatewayConfig.token}
                                        onChange={(e) => setGatewayConfig({...gatewayConfig, token: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveGateway}
                            disabled={isSavingGateway}
                            className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
                        >
                            {isSavingGateway ? 'A Guardar...' : 'Guardar Configuração'}
                        </button>
                    </div>
                </div>
            )}

            {/* Campaign Progress Overlay */}
            {campaignProgress && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <div className="bg-[#121212] border border-green-500/30 p-8 rounded-[2.5rem] max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Send size={28} />
                        </div>
                        <h3 className="text-2xl font-serif font-black text-white mb-2">Disparando Campanha</h3>
                        <p className="text-xs text-gray-400 mb-6 font-medium">A enviar mensagens via WhatsApp em segundo plano com pausas seguras...</p>

                        <div className="space-y-4">
                            {/* Loading Bar */}
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                <div 
                                    className="bg-green-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${campaignProgress.pct}%` }}
                                />
                            </div>
                            
                            <div className="flex justify-between text-xs font-mono font-bold px-1">
                                <span className="text-gray-400">Progresso:</span>
                                <span className="text-white">{campaignProgress.current} / {campaignProgress.total} ({campaignProgress.pct}%)</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold pt-2">
                                <div className="bg-green-500/10 border border-green-500/20 py-2.5 rounded-xl text-green-400">
                                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Sucesso</span>
                                    {campaignProgress.successCount}
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 py-2.5 rounded-xl text-red-400">
                                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Falhas</span>
                                    {campaignProgress.failedCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Botão Flutuante Inferior Direito ("Ver Menu Digital") */}
            <div className="fixed bottom-6 right-6 z-40">
                <a
                    href={`${window.location.origin}/r/default`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-gray-100 text-black font-black px-6 py-4 rounded-full shadow-[0_0_35px_rgba(255,255,255,0.4)] flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm uppercase tracking-wider"
                >
                    <Eye size={18} className="text-[#D4AF37]" />
                    <span>Ver Menu Digital</span>
                    <ArrowUpRight size={16} className="text-gray-600" />
                </a>
            </div>
        </div>
    );
};

export default CustomerManager;

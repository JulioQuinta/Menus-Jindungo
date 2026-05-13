import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, ClipboardList, Star, Award, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, trend, color = 'primary', delay = 0, suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    // Hypnotic counting effect
    useEffect(() => {
        let start = 0;
        const end = parseFloat(value) || 0;
        if (end === 0) {
            setDisplayValue(0);
            return;
        }
        
        const duration = 1500;
        const increment = end / (duration / 16);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(start);
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    const colorClasses = {
        primary: 'text-[#D4AF37] border-[#D4AF37]/20 bg-[#D4AF37]/5',
        success: 'text-green-500 border-green-500/20 bg-green-500/5',
        error: 'text-red-500 border-red-500/20 bg-red-500/5',
        info: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
    };

    return (
        <div 
            className={`relative group overflow-hidden bg-[#111111]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 transition-all duration-700 hover:scale-[1.02] hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)] animate-fade-in-up`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-10 transition-opacity duration-700 group-hover:opacity-30 ${color === 'primary' ? 'bg-[#D4AF37]' : 'bg-green-500'}`}></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-700 group-hover:rotate-6 ${colorClasses[color]}`}>
                        <Icon size={24} className="drop-shadow-[0_0_8px_rgba(currentColor,0.5)]" />
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${trend > 0 ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'}`}>
                            {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>

                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-serif font-black text-white tracking-tighter">
                        {displayValue.toLocaleString('pt-AO', { maximumFractionDigits: (suffix === '' ? 0 : 1) })}
                        {suffix && <span className="text-xs text-gray-500 ml-1 uppercase tracking-widest font-sans">{suffix}</span>}
                    </h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse opacity-50"></div>
                </div>
            </div>

            {/* Decorative Shimmer Line */}
            <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[2000ms]"></div>
        </div>
    );
};

const HypnoticStats = ({ stats = {} }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard 
                label="Faturação Hoje" 
                value={stats.totalRevenue} 
                icon={TrendingUp} 
                trend={stats.revenueTrend} 
                suffix="Kz"
                delay={100}
            />
            <StatCard 
                label="Total Clientes" 
                value={stats.newCustomers} 
                icon={Users} 
                trend={+8.2} 
                color="info"
                delay={200}
            />
            <StatCard 
                label="Pedidos Hoje" 
                value={stats.totalOrders} 
                icon={ClipboardList} 
                trend={stats.ordersTrend} 
                color="success"
                delay={300}
            />
            <StatCard 
                label="Rating Médio" 
                value={stats.averageRating} 
                icon={Star} 
                trend={+0.5} 
                color="primary"
                delay={400}
            />
        </div>
    );
};

export default HypnoticStats;

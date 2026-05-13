import React from 'react';
import HypnoticStats from './HypnoticStats';

const DashboardStatsGrid = ({ stats }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-black text-white tracking-tight">Desempenho Geral</h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Tempo Real
                </div>
            </div>
            <HypnoticStats stats={stats} />
        </div>
    );
};

export default DashboardStatsGrid;

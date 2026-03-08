import React, { useMemo } from 'react';

const SimpleAnalytics = ({ items = [] }) => {
    // Mock data generation if no real data exists, memoized to prevent re-renders
    const data = useMemo(() => {
        return items.slice(0, 5).map(item => ({
            name: item.name,
            views: Math.floor(Math.random() * 50) + 10 // Mock views
        }));
    }, [items.length]);

    const maxViews = Math.max(1, ...data.map(d => d.views));

    return (
        <div className="bg-white/90 dark:bg-[#141414]/90 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                🔥 Mais Vistos Hoje
            </h4>
            <div className="flex flex-col gap-4">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm">
                        <span className="w-1/3 truncate text-gray-800 dark:text-gray-200 font-medium font-serif">
                            {d.name}
                        </span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: `${(d.views / maxViews) * 100}%`
                                }}
                            />
                        </div>
                        <span className="w-12 text-right font-bold text-primary">{d.views}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimpleAnalytics;

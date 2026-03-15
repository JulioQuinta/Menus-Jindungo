import React from 'react';
import { Ghost, Search, ShoppingBag } from 'lucide-react';

const EmptyState = ({
    icon: Icon = Ghost,
    title = "Nada por aqui",
    description = "Não conseguimos encontrar o que procura.",
    action,
    className = ""
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-500 ${className}`}>
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-gray-600 mb-6 border border-white/5 shadow-inner">
                <Icon size={40} strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-serif">
                {title}
            </h3>

            <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                {description}
            </p>

            {action && (
                <div className="mt-8">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;

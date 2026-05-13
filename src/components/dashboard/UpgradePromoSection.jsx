import React from 'react';
import { ChevronRight } from 'lucide-react';

const UpgradePromoSection = ({ restaurant, navigate }) => {
    return (
        <div className="p-1 w-full bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-[2.5rem]">
            <div className="bg-[#111111] rounded-[2.4rem] p-8 sm:p-12 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl text-center lg:text-left">
                        <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">Plano {restaurant?.plan} Ativo</span>
                        <h3 className="text-3xl font-serif font-black text-white mb-4 leading-tight">Maximize a sua faturação com o <span className="text-primary">Plano Corporate</span>.</h3>
                        <p className="text-gray-400 text-lg leading-relaxed">Tenha acesso a ferramentas de fidelização avançadas, gestão de motoristas própria e relatórios detalhados de cada cliente.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/settings')}
                        className="px-10 py-5 bg-primary text-black font-black rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:scale-[1.05] transition-all flex items-center gap-3 uppercase tracking-widest text-sm"
                    >
                        Ver Planos <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradePromoSection;

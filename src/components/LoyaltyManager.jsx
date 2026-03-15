import React, { useState, useEffect } from 'react';
import { Award, Save, RefreshCw, CheckCircle2, Info, Star } from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import toast from 'react-hot-toast';

const LoyaltyManager = ({ restaurantId }) => {
    const [config, setConfig] = useState({
        goal: 10,
        reward_text: 'Ganha uma sobremesa grátis!',
        is_active: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (restaurantId) {
            fetchConfig();
        }
    }, [restaurantId]);

    const fetchConfig = async () => {
        setLoading(true);
        const { data, error } = await loyaltyService.getConfig(restaurantId);
        if (data) {
            setConfig({
                goal: data.goal,
                reward_text: data.reward_text,
                is_active: data.is_active
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = await loyaltyService.saveConfig(restaurantId, config);
        if (error) {
            toast.error('Erro ao salvar configuração');
        } else {
            toast.success('Configuração de Fidelidade salva!');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="animate-spin text-[#D4AF37]" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center border border-[#D4AF37]/50">
                        <Award className="text-[#D4AF37]" size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Hub de Fidelização</h2>
                        <p className="text-gray-400 text-sm">Transforme clientes em fãs recorrentes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${config.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                        {config.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                        onClick={() => setConfig(prev => ({ ...prev, is_active: !prev.is_active }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.is_active ? 'bg-[#D4AF37]' : 'bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Panel */}
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Star className="text-[#D4AF37]" size={20} />
                        Configurar Recompensa
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Meta de Pedidos</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="3"
                                    max="20"
                                    value={config.goal}
                                    onChange={(e) => setConfig(prev => ({ ...prev, goal: parseInt(e.target.value) }))}
                                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                                />
                                <span className="bg-[#D4AF37] text-black font-bold px-3 py-1 rounded-lg min-w-[3rem] text-center">
                                    {config.goal}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">O cliente ganha o prémio após completar {config.goal} pedidos.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Texto da Recompensa</label>
                            <input
                                type="text"
                                value={config.reward_text}
                                onChange={(e) => setConfig(prev => ({ ...prev, reward_text: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                                placeholder="Ex: Bebida Grátis"
                            />
                        </div>
                    </div>

                    <div className="bg-[#D4AF37]/5 p-4 rounded-xl border border-[#D4AF37]/10 flex gap-3">
                        <Info className="text-[#D4AF37] flex-shrink-0" size={18} />
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Os pontos são atribuídos automaticamente quando marcar um pedido como <strong className="text-white">Pago</strong> ou <strong className="text-white">Entregue</strong>.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-[#D4AF37] hover:bg-[#B8962D] text-black font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                        Salvar Alterações
                    </button>
                </div>

                {/* Live Preview Panel */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white px-2">Visualização no Telemóvel</h3>

                    <div className="relative mx-auto w-full max-w-[300px] border-[8px] border-gray-800 rounded-[3rem] aspect-[9/16] overflow-hidden bg-[#121212] flex flex-col items-center justify-center p-6 shadow-2xl">
                        {/* Mock Mobile Status Bar */}
                        <div className="absolute top-0 w-full h-6 flex justify-between px-6 pt-2 opacity-50">
                            <span className="text-[10px] text-white">9:41</span>
                            <div className="flex gap-1">
                                <span className="w-3 h-3 bg-white/20 rounded-full" />
                            </div>
                        </div>

                        {/* Loyalty Card Mockup */}
                        <div className="w-full bg-[#1E1E1E] rounded-3xl p-5 border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-[#D4AF37] font-bold text-sm tracking-widest uppercase">Cartão VIP</h4>
                                    <p className="text-white text-xs font-bold mt-1">Status: Próximo Nível</p>
                                </div>
                                <div className="w-8 h-8 bg-[#D4AF37]/20 rounded-full flex items-center justify-center border border-[#D4AF37]/50">
                                    <Star className="text-[#D4AF37]" size={14} />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 mb-4 opacity-70">
                                {[...Array(Math.min(config.goal, 8))].map((_, i) => (
                                    <div key={i} className={`aspect-square rounded-full border border-dashed flex items-center justify-center text-[10px] ${i < 2 ? 'bg-[#D4AF37] border-transparent text-black' : 'border-gray-600'}`}>
                                        {i < 2 ? <CheckCircle2 size={12} /> : i + 1}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-white/5">
                                <p className="text-[10px] text-gray-400">Recompensa: <span className="text-white font-bold">{config.reward_text}</span></p>
                            </div>
                        </div>

                        <p className="mt-8 text-center text-gray-500 text-xs px-4">Esta janela aparecerá automaticamente aos seus clientes fiéis no Checkout.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyManager;

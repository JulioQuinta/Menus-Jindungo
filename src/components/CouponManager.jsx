import React, { useState, useEffect } from 'react';
import { couponService } from '../services/couponService';
import { Ticket, Plus, Trash2, Calendar, Tag, Percent, Banknote, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CouponManager = ({ restaurantId }) => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase: 0,
        valid_until: '',
        usage_limit: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, [restaurantId]);

    const fetchCoupons = async () => {
        setLoading(true);
        const { data, error } = await couponService.getRestaurantCoupons(restaurantId);
        if (error) {
            toast.error("Erro ao carregar cupões");
        } else {
            setCoupons(data || []);
        }
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!newCoupon.code || !newCoupon.discount_value) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        const { error } = await couponService.saveCoupon({
            ...newCoupon,
            restaurant_id: restaurantId,
            discount_value: parseFloat(newCoupon.discount_value),
            min_purchase: parseFloat(newCoupon.min_purchase || 0),
            usage_limit: newCoupon.usage_limit ? parseInt(newCoupon.usage_limit) : null,
            valid_until: newCoupon.valid_until || null
        });

        if (error) {
            toast.error("Erro ao guardar cupão");
        } else {
            toast.success("Cupão criado com sucesso!");
            setIsAdding(false);
            setNewCoupon({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                min_purchase: 0,
                valid_until: '',
                usage_limit: ''
            });
            fetchCoupons();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja eliminar este cupão?")) return;
        const { error } = await couponService.deleteCoupon(id);
        if (error) {
            toast.error("Erro ao eliminar");
        } else {
            toast.success("Cupão eliminado");
            fetchCoupons();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <Ticket className="text-[#D4AF37]" size={32} />
                        Cupões & Promoções
                    </h2>
                    <p className="text-gray-400">Atraia mais clientes com códigos de desconto</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all w-full sm:w-auto justify-center"
                >
                    <Plus size={20} />
                    {isAdding ? 'Cancelar' : 'Criar Novo Cupão'}
                </button>
            </div>

            {isAdding && (
                <div className="bg-black/40 backdrop-blur-md border border-[#D4AF37]/30 rounded-3xl p-6 shadow-2xl animate-slide-down">
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Tag size={14} /> Código do Cupão
                            </label>
                            <input
                                type="text"
                                placeholder="EX: BEMVINDO10"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none uppercase font-mono"
                                value={newCoupon.code}
                                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={14} /> Tipo de Desconto
                            </label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                value={newCoupon.discount_type}
                                onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                            >
                                <option value="percentage">Percentual (%)</option>
                                <option value="fixed">Valor Fixo (Kz)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                {newCoupon.discount_type === 'percentage' ? <Percent size={14} /> : <Banknote size={14} />}
                                Valor do Desconto
                            </label>
                            <input
                                type="number"
                                placeholder={newCoupon.discount_type === 'percentage' ? "Ex: 10" : "Ex: 1000"}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                value={newCoupon.discount_value}
                                onChange={e => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Banknote size={14} /> Compra Mínima (Kz)
                            </label>
                            <input
                                type="number"
                                placeholder="Opcional"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                value={newCoupon.min_purchase}
                                onChange={e => setNewCoupon({ ...newCoupon, min_purchase: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Válido Até (Opcional)
                            </label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                value={newCoupon.valid_until}
                                onChange={e => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Ticket size={14} /> Limite de Utilizações
                            </label>
                            <input
                                type="number"
                                placeholder="Ilimitado se vazio"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] outline-none"
                                value={newCoupon.usage_limit}
                                onChange={e => setNewCoupon({ ...newCoupon, usage_limit: e.target.value })}
                            />
                        </div>

                        <div className="lg:col-span-3 pt-4">
                            <button
                                type="submit"
                                className="w-full bg-white/10 hover:bg-[#D4AF37] hover:text-black py-4 rounded-xl font-bold transition-all border border-white/10"
                            >
                                Criar Cupão Ativo
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-white/5 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : coupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map(coupon => (
                        <div
                            key={coupon.id}
                            className="bg-black/40 border border-white/5 rounded-3xl p-6 relative group hover:border-[#D4AF37]/50 transition-all hover:-translate-y-1 shadow-xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-[#D4AF37]/10 transition-colors">
                                    <Ticket size={24} className="text-[#D4AF37]" />
                                </div>
                                <button
                                    onClick={() => handleDelete(coupon.id)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Eliminar Cupão"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <h3 className="text-2xl font-mono font-bold text-white mb-2 tracking-wider">
                                {coupon.code}
                            </h3>

                            <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-lg mb-4">
                                {coupon.discount_type === 'percentage' ? (
                                    <><Percent size={18} /> {coupon.discount_value}% de desconto</>
                                ) : (
                                    <><Banknote size={18} /> {coupon.discount_value.toLocaleString()} Kz de desconto</>
                                )}
                            </div>

                            <div className="space-y-2 pt-4 border-t border-white/5">
                                {coupon.min_purchase > 0 && (
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Compra Mínima</span>
                                        <span className="text-gray-300 font-bold">{coupon.min_purchase.toLocaleString()} Kz</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Utilizações</span>
                                    <span className="text-gray-300 font-bold">
                                        {coupon.usage_count} / {coupon.usage_limit || '∞'}
                                    </span>
                                </div>
                                {coupon.valid_until && (
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Válido até</span>
                                        <span className={`font-bold ${new Date(coupon.valid_until) < new Date() ? 'text-red-500' : 'text-gray-300'}`}>
                                            {new Date(coupon.valid_until).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-black/20 rounded-3xl p-12 border border-dashed border-white/10 text-center">
                    <Ticket className="mx-auto text-gray-600 mb-4 opacity-30" size={64} />
                    <p className="text-gray-400 font-bold text-lg">Nenhum cupão criado.</p>
                    <p className="text-gray-500 text-sm mt-2">Os cupões são uma excelente forma de aumentar pedidos em dias calmos.</p>
                </div>
            )}
        </div>
    );
};

export default CouponManager;

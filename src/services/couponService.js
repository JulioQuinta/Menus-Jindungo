import { supabase } from '../lib/supabaseClient';

export const couponService = {
    /**
     * Valida um cupão para um restaurante específico
     */
    async validateCoupon(restaurantId, code) {
        if (!restaurantId || !code) return { valid: false, message: 'Dados inválidos' };

        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('code', code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (error || !data) {
                return { valid: false, message: 'Cupão inválido ou não encontrado' };
            }

            // Verificar validade temporal
            const now = new Date();
            if (data.valid_until && new Date(data.valid_until) < now) {
                return { valid: false, message: 'Este cupão expirou' };
            }

            if (data.valid_from && new Date(data.valid_from) > now) {
                return { valid: false, message: 'Este cupão ainda não está ativo' };
            }

            // Verificar limites de uso
            if (data.usage_limit && data.usage_count >= data.usage_limit) {
                return { valid: false, message: 'Este cupão atingiu o limite de utilizações' };
            }

            return { valid: true, coupon: data };
        } catch (err) {
            console.error('Coupon validation error:', err);
            return { valid: false, message: 'Erro ao validar cupão' };
        }
    },

    /**
     * Obtém todos os cupões de um restaurante (Admin)
     */
    async getRestaurantCoupons(restaurantId) {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

        return { data, error };
    },

    /**
     * Cria ou atualiza um cupão
     */
    async saveCoupon(couponData) {
        const { data, error } = await supabase
            .from('coupons')
            .upsert({
                ...couponData,
                code: couponData.code.toUpperCase()
            })
            .select()
            .single();

        return { data, error };
    },

    /**
     * Elimina um cupão
     */
    async deleteCoupon(couponId) {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', couponId);

        return { error };
    }
};

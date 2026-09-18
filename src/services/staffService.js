import { supabase } from '../lib/supabaseClient';

export const staffService = {
    async getStaff(restaurantId) {
        const { data, error } = await supabase
            .from('staff_members')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('name');

        if (error) throw error;
        return data;
    },

    async addStaff(staffData) {
        const { data, error } = await supabase
            .from('staff_members')
            .insert([staffData])
            .select();

        if (error) throw error;
        return data[0];
    },

    async updateStaff(id, updates) {
        const { data, error } = await supabase
            .from('staff_members')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async deleteStaff(id) {
        const { error } = await supabase
            .from('staff_members')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async getStaffRecordForUser(restaurantId, userId) {
        const { data, error } = await supabase
            .from('staff_members')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async validatePin(restaurantId, pinCode) {
        if (!restaurantId || !pinCode) return { valid: false, message: 'Faltam dados' };

        try {
            const { data, error } = await supabase
                .from('staff_members')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('pin_code', pinCode.toString())
                .eq('active', true)
                .single();

            if (error || !data) {
                return { valid: false, message: 'PIN incorreto ou utilizador inativo' };
            }

            return { valid: true, staff: data };
        } catch (error) {
            console.error('Staff validation error:', error);
            return { valid: false, message: 'Erro ao validar o PIN' };
        }
    },

    async validatePinGlobal(pinCode) {
        if (!pinCode) return { valid: false, message: 'Insira o PIN de operador' };

        try {
            const { data, error } = await supabase
                .from('staff_members')
                .select('*, restaurants:restaurant_id(id, name, slug, business_sector)')
                .eq('pin_code', pinCode.toString())
                .eq('active', true);

            if (error || !data || data.length === 0) {
                return { valid: false, message: 'PIN de operador incorreto ou não encontrado.' };
            }

            if (data.length === 1) {
                return { valid: true, staff: data[0], restaurant: data[0].restaurants };
            }

            return { valid: true, matches: data, multiple: true };
        } catch (error) {
            console.error('Global staff PIN validation error:', error);
            return { valid: false, message: 'Erro ao validar o PIN' };
        }
    }
};

import { supabase } from '../lib/supabaseClient';

export const staffService = {
    async getStaff(restaurantId) {
        const { data, error } = await supabase
            .from('restaurant_staff')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('name');

        if (error) throw error;
        return data;
    },

    async addStaff(staffData) {
        const { data, error } = await supabase
            .from('restaurant_staff')
            .insert([staffData])
            .select();

        if (error) throw error;
        return data[0];
    },

    async updateStaff(id, updates) {
        const { data, error } = await supabase
            .from('restaurant_staff')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async deleteStaff(id) {
        const { error } = await supabase
            .from('restaurant_staff')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async getStaffRecordForUser(restaurantId, userId) {
        const { data, error } = await supabase
            .from('restaurant_staff')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }
};

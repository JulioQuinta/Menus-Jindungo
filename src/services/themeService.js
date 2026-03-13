import { supabase } from '../lib/supabaseClient';

const DEFAULT_THEME = {
    primaryColor: '#ff6b6b',
    secondaryColor: '#4ecdc4',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    layoutMode: 'list',
    logoUrl: '',
    darkMode: false,
    backgroundColor: ''
};

export const themeService = {
    /**
     * Loads the theme for a specific restaurant.
     */
    getTheme: async (restaurantId) => {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('theme_config, status, subscription_end')
                .eq('id', restaurantId)
                .single();

            if (error) throw error;
            if (!data) return DEFAULT_THEME;

            // Merge with default to ensure all keys exist
            return {
                ...DEFAULT_THEME,
                ...data.theme_config,
                // Meta fields for SaaS logic
                _status: data.status,
                _subscription_end: data.subscription_end
            };
        } catch (err) {
            console.error('Error fetching theme:', err);
            return DEFAULT_THEME;
        }
    },

    /**
     * Saves the theme settings.
     */
    updateTheme: async (restaurantId, settings) => {
        try {
            // Remove meta fields before saving
            const { _status, _subscription_end, ...cleanSettings } = settings;

            const { error } = await supabase
                .from('restaurants')
                .update({ theme_config: cleanSettings })
                .eq('id', restaurantId);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Error updating theme:', err);
            return { success: false, error: err.message };
        }
    }
};
